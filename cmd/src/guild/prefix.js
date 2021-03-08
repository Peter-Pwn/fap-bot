const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

const guildCfg = require(`${require.main.path}/src/guildCfg.js`);

module.exports = {
	description: 'Sets the prefix for the guild.',
	descriptionLong: 'The prefix must be one character long.\nYou only need to provide the guild, if you use this command via DM.',
	args: 1,
	usage: '<prefix> [guild]',
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 10,
	deleteMsg: true,
	async execute(message, args) {
		//more checks to do?!
		if (!args[0] || args[0].length !== 1) throw fnc.Warn(`\`${args[0]}\` is not a valid Prefix.`);
		if (message.channel.type === 'dm' && !args[1]) throw fnc.Warn('you need to provide a guild.');
		let guildID = null;
		if (message.channel.type === 'dm') guildID = await fnc.snowflakes.getGuild(args[1]);
		else guildID = message.guild.id;
		if (!guildID) throw fnc.Warn(`${args[1]} is not a valid guild.`);
		const [guild] = await db.guilds.findOrBuild({
			where: {
				guildID: guildID,
			},
		});
		guild.prefix = args[0];
		await guild.save();
		guildCfg.set(guildID, guild.get({ plain: true }));

		//update welcome messages
		//TODO: populate welcomemsgs in a function
		const msgs = await db.welcomemsgs.findAll({ include: ['reacts'] });
		for (const msg of msgs) {
			try {
				const disMsg = await fnc.discord.fetchMsg(msg.channelID, msg.messageID);
				if (disMsg.guild.id === guildID && msg.cmdList) {
					fnc.getCmdList('text', CON.PERMLVL.EVERYONE).forEach(cmd => {
						msg.text += `\n● \`${fnc.guilds.getPrefix(disMsg.guild)}${cmd[0]}\` ${cmd[1]}`;
					});
				}
				await	disMsg.edit(msg.text);
			}
			catch (e) {
				continue;
			}
		}

		fnc.discord.replyExt(message, `guild prefix set to \`${args[0]}\``).catch(() => null);
		return true;
	},
};

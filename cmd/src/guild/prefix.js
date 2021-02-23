const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

const guildCfg = require(`${require.main.path}/src/guildCfg.js`);

//TODO: make it availible for DMs
module.exports = {
	description: 'Sets the prefix for a guild.',
	descriptionLong: 'The prefix must be one character long.',
	args: 1,
	usage: '<prefix> [guild]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 10,
	deleteMsg: true,
	async execute(message, args) {
		//more checks to do?!
		if (!args[0] || args[0].length !== 1) throw fnc.Warn(message, `\`${args[0]}\` is not a valid Prefix.`);
		const [guild] = await db.guilds.findOrBuild({
			include: ['perms'],
			where: {
				guildID: message.guild.id,
			},
		});
		guild.prefix = args[0];
		await guild.save();
		guildCfg.set(message.guild.id, guild.get({ plain: true }));

		//update welcome messages
		//TODO: populate welcomemsgs in a function
		const msgs = await db.welcomemsgs.findAll({ include: ['reacts'] });
		for (const msg of msgs) {
			try {
				const disMsg = await fnc.discord.fetchMsg(msg.channelID, msg.messageID);
				if (disMsg.guild.id === message.guild.id && msg.cmdList) {
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

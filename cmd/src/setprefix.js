const CON = require('../../src/const.json');
const fnc = require('../../fnc');

module.exports = {
	description: 'Sets the prefix for a guild.',
	descriptionLong: 'The prefix must be one character long.',
	args: 1,
	usage: '<prefix>',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 10,
	deleteMsg: true,
	async execute(message, args) {
		//more checks to do?!
		if (!args[0] || args[0].length !== 1) return fnc.replyExt(message, `${args[0]} is not a valid Prefix.`);
		const guild = {
			guildID: message.guild.id,
			prefix: args[0],
		};
		message.client.db.guilds.upsert(guild, { where: { guildID: message.guild.id } });
		message.client.guildCfg.set(message.guild.id, guild);

		//update welcome messages
		await message.client.db.welcomeMsgs.findAll({ include: ['reacts'] }).then(msgs => msgs.forEach(async msg => {
			try {
				const welcomeMsg = await message.client.channels.fetch(msg.channelID || '0').then(async channel => await channel.messages.fetch(msg.messageID || '0'));
				if (welcomeMsg.guild.id === message.guild.id && msg.cmdList) {
					await welcomeMsg.edit(msg.text + fnc.getCmdList(message.client, 'text', CON.PERMLVL.EVERYONE).reduce((txt, cmd) => txt + `\n● \`${args[0]}${cmd[0]}\` ${cmd[1]}`, ''));
				}
			}
			catch (e) {
				//message not found
				if (e.name === 'DiscordAPIError' && e.message === 'Unknown Message') {
					await msg.destroy();
				}
				else {
					message.client.logger.error(e);
				}
			}
		}));

		return fnc.replyExt(message, `Guild prefix set to \`${args[0]}\``);
	},
};

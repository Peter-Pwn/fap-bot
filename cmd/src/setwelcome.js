const CON = require('../../src/const.json');
const cfg = require('../../src/config.js');
const fnc = require('../../fnc');

module.exports = {
	description: 'Sets a welcome message in this channel.',
	descriptionLong: 'You can let the bot append a list of all the commands available for everyone.',
	args: 2,
	usage: '<message> <append command list (true|false)>',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args) {
		let text = args[0];
		args[1] = fnc.parseBool(args[1]);
		if (args[1]) text += fnc.getCmdList(message.client, 'text', CON.PERMLVL.EVERYONE).reduce((txt, cmd) => txt + `\n● \`${cfg.prefix}${cmd[0]}\` ${cmd[1]}`, '');

		try {
			let welcomeMsg = null;
			const welcomeMsgID = await message.client.db.welcomeMsgs.findOne({ attributes: ['id', 'messageID'], where: { channelID: message.channel.id } });
			if (welcomeMsgID) {
				welcomeMsg = await message.channel.messages.fetch(welcomeMsgID.messageID).catch(async () => await welcomeMsgID.destroy() && null);
			}
			if (welcomeMsg) {
				await welcomeMsg.edit(text);
				await message.client.db.welcomeMsgs.update({
					text: args[0],
					cmdList: args[1],
				},
				{
					where: { messageID: welcomeMsg.id },
				});
			}
			else {
				welcomeMsg = await message.channel.send(text);
				await message.client.db.welcomeMsgs.create({
					channelID: message.channel.id,
					messageID: welcomeMsg.id,
					text: args[0],
					cmdList: args[1],
				});
			}
		}
		catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') return message.client.logger.warn('Welcome message already exists');
			return message.client.logger.error(e);
		}
	},
};

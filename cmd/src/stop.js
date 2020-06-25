const CON = require('../../src/const.json');

module.exports = {
	description: 'Shuts the bot down.',
	args: 0,
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.OWNER,
	cooldown: 3,
	deleteMsg: true,
	execute(message) {
		message.client.logger.info(`${message.author.username} is shutting down the bot.`);
		message.client.destroy();
	},
};

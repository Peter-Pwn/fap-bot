const CON = require('../../src/const.json');
const cfg = require('../../src/config.json');

module.exports = {
	description: 'Shuts the bot down.',
	args: 0,
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.OWNER,
	cooldown: 3,
	deleteMsg: true,
	execute(message) {
		message.client.logger.info(`${cfg.appName} is shutting down`);
		message.client.destroy();
	},
};

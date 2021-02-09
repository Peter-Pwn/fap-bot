const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);

const CON = require(`${require.main.path}/src/const.json`);

module.exports = {
	description: 'Shuts the bot down.',
	args: 0,
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.OWNER,
	cooldown: 3,
	deleteMsg: false,
	async execute(message) {
		await message.delete();
		logger.info(`'${message.author.tag}' is shutting down the bot.`);
		client.destroy();
	},
};

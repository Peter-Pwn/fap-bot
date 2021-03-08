const logger = require(`${require.main.path}/src/logger.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	aliases: ['hey', 'hi'],
	description: 'Just say hello.',
	descriptionLong: 'You also can test args. Just add them.',
	args: 0,
	usage: '<arg1> [opt1]',
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.OWNER,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args) {
		if (args.length > 0) logger.info('hello args output:\n' + args);
		fnc.discord.replyExt(message, 'Piss off!\n' + args, { delMsg: false }).catch(() => null);
		return true;
	},
};

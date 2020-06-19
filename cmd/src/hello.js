const CON = require('../../src/const.json');
const fnc = require('../../fnc');

module.exports = {
	aliases: ['hey', 'hi', 'h'],
	description: 'Just say hello.',
	descriptionLong: 'You also can test args. Just add them.',
	args: 0,
	usage: '<arg1> [opt1]',
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.EVERYONE,
	cooldown: 3,
	deleteMsg: true,
	execute(message, args) {
		return fnc.replyExt(message, 'Piss off!\n' + args, { del: false });
	},
};

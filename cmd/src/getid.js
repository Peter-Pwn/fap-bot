const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	description: 'Get the ID of a mention (user, role, text channel) or emoji',
	args: 1,
	usage: '<mention>',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 3,
	deleteMsg: true,
	execute(message, args) {
		let text = '';
		const id = args[0].match(/<(?:@!?(\d+)|@&(\d+)|#(\d+)|:.+:(\d+))>/);
		if (!id) return fnc.replyWarn(message, `${args[0]} is not a mention.`, { rtn: true });
		if (id[1]) text = `user: ${id[1]}`;
		else if (id[2]) text = `role: ${id[2]}`;
		else if (id[3]) text = `channel: ${id[3]}`;
		else if (id[4]) text = `emoji: ${id[4]}`;
		return fnc.replyExt(message, text);
	},
};

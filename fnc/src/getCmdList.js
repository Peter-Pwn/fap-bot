const commands = require(`${require.main.path}/cmd`);

const CON = require(`${require.main.path}/src/const.json`);

module.exports = function(type, perms) {
	const list = [];
	//for (const [, command] of commands.sorted((a, b) => a.permLvl - b.permLvl)) {
	for (const [, command] of commands) {
		if (type === 'text' && !(command.msgType & CON.MSGTYPE.TEXT) || type === 'dm' && !(command.msgType & CON.MSGTYPE.DM)) continue;
		if (!(perms & command.permLvl)) continue;
		list.push([command.name, command.description]);
	}
	return list;
};

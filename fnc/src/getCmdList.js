const CON = require(`${require.main.path}/src/const.json`);

module.exports = function(client, type, perms) {
	const list = [];
	for (const [, command] of client.commands.sorted((a, b) => a.permLvl - b.permLvl)) {
		if (type === 'text' && !(command.msgType & CON.MSGTYPE.TEXT) || type === 'dm' && !(command.msgType & CON.MSGTYPE.DM)) continue;
		if (!(perms & command.permLvl)) continue;
		list.push([command.name, command.description]);
	}
	return list;
};

const CON = require(`${require.main.path}/src/const.json`);

const aliases = require(`${require.main.path}/src/aliases.js`);

const path = `${require.main.path}/cmd/src/`;
module.exports = function(file) {
	const command = require(`${path}/${file[1]}`);
	command.name = file[0].toLowerCase();
	command.file = file[1];
	if (command.skip) throw new Error('skipped');
	if (command.aliases && !Array.isArray(command.aliases)) throw new Error('aliases is not a array');
	if (command.aliases) {
		for (const aliase of command.aliases) {
			aliases.set(aliase, [command.name, null]);
		}
	}
	if (typeof command.description !== 'string') throw new Error('description is not a string');
	if (typeof command.descriptionLong !== 'string') command.descriptionLong = null;
	for (const mode in command.modes) {
		if (command.modes[mode].aliases) {
			for (const aliase of command.modes[mode].aliases) {
				aliases.set(aliase, [command.name, mode]);
			}
		}
		if (command.modes[mode] && typeof command.modes[mode].description !== 'string') throw new Error(`${mode} description is not a string`);
		if (command.modes[mode] && typeof command.modes[mode].descriptionLong !== 'string') command.descriptionLong = null;
		if (command.modes[mode] && typeof parseInt(command.modes[mode].args) !== 'number') command.modes[mode].args = 0;
		if (command.modes[mode] && command.modes[mode].args > 0 && typeof command.modes[mode].usage !== 'string') throw new Error(`${mode} usage is not a string`);
		command.modes[mode].usage = `${mode} ${command.modes[mode].usage || ''}`;
	}
	if (typeof parseInt(command.args) !== 'number') command.args = 0;
	if (command.args > 0 && typeof command.usage !== 'string') throw new Error('usage is not a string');
	if (typeof command.msgType !== 'number') command.msgType = CON.MSGTYPE.TEXT;
	if (typeof command.permLvl !== 'number') command.permLvl = CON.MSGTYPE.EVERYONE;
	if (typeof command.cooldown !== 'number') command.cooldown = 3;
	if (typeof command.deleteMsg !== 'boolean') command.deleteMsg = true;
	if (typeof command.execute !== 'function') throw new Error('execute is not a function');
	return command;
};

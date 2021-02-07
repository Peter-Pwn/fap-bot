//load commands from disc
const fs = require('fs');
const Discord = require('discord.js');
const CON = require(`${require.main.path}/src/const.json`);

const path = `${module.path}/src/`;
const commands = new Discord.Collection();
fs.readdirSync(path, { withFileTypes: true }).filter(dirent => dirent.isDirectory() || dirent.name.endsWith('.js')).forEach(dirent => {
	const files = [];
	if (dirent.isDirectory()) {
		fs.readdirSync(`${path}/${dirent.name}`).filter(file => file.endsWith('.js')).forEach(file => {
			files.push([`${dirent.name}${file.slice(0, -3)}`, `${dirent.name}/${file}`]);
		});
	}
	else {
		files.push([dirent.name.slice(0, -3), dirent.name]);
	}
	for (const file of files) {
		try {
			const command = require(`${path}/${file[1]}`);
			if (command.skip) throw new Error('skipped');
			if (command.aliases && !Array.isArray(command.aliases)) throw new Error('aliases is not a array');
			if (typeof command.description !== 'string') throw new Error('description is not a string');
			if (typeof command.descriptionLong !== 'string') command.descriptionLong = null;
			if (typeof parseInt(command.args) !== 'number') command.args = 0;
			if (command.args > 0 && typeof command.usage !== 'string') throw new Error('usage is not a string');
			if (typeof command.msgType !== 'number') command.msgType = CON.MSGTYPE.TEXT;
			if (typeof command.permLvl !== 'number') command.permLvl = CON.MSGTYPE.EVERYONE;
			if (typeof command.cooldown !== 'number') command.cooldown = 3;
			if (typeof command.deleteMsg !== 'boolean') command.deleteMsg = true;
			if (typeof command.execute !== 'function') throw new Error('execute is not a function');
			command.name = file[0].toLowerCase();
			command.file = file[1];
			commands.set(command.name, command);
		}
		catch (e) {
			console.log(`[WARN] Couldn't load command ${file[0].toLowerCase()}:\n${e.name}: ${e.message}`);
		}
	}
});
module.exports = commands;

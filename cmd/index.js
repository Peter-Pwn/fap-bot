//load commands from disc
const fs = require('fs');
const Discord = require('discord.js');

const loadCmd = require(`${require.main.path}/cmd/load.js`);

const logger = require(`${require.main.path}/src/logger.js`);

const path = `${require.main.path}/cmd/src/`;
module.exports = new Discord.Collection();
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
			const command = loadCmd(file);
			module.exports.set(command.name, command);
		}
		catch (e) {
			logger.warn(`Couldn't load command ${file[0].toLowerCase()}:\n${e.name}: ${e.message}`);
		}
	}
});

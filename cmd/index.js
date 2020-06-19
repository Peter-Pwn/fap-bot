const Discord = require('discord.js');

try {
	const fs = require('fs');
	const commands = new Discord.Collection();
	fs.readdirSync(`${module.path}/src`).filter(file => file.endsWith('.js')).forEach(file => {
		const command = require(`./src/${file}`);
		command.name = file.slice(0, -3);
		commands.set(command.name, command);
	});
	module.exports = commands;
}
catch (e) {
	console.error(`Couldn't load commands:\n${e.stack}`);
}

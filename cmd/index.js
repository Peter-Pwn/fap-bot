//load commands from disc
try {
	const fs = require('fs');
	const Discord = require('discord.js');
	const CON = require('../src/const.json');
	const commands = new Discord.Collection();
	fs.readdirSync(`${module.path}/src`).filter(file => file.endsWith('.js')).forEach(file => {
		try {
			const command = require(`./src/${file}`);
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
			command.name = file.slice(0, -3);
			commands.set(command.name, command);
		}
		catch (e) {
			return console.log(`[WARN] Couldn't load command ${file.slice(0, -3)}:\n${e.name}: ${e.message}`);
		}
	});
	module.exports = commands;
}
catch (e) {
	console.error(`[ERROR] Couldn't load commands:\n${e.stack}`);
}

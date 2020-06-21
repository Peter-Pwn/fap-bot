const CON = require('../../src/const.json');
const cfg = require('../../src/config.js');
const fnc = require('../../fnc');

module.exports = {
	aliases: ['commands'],
	description: 'List all of the commands or info about a specific command.',
	args: 0,
	usage: '[command name]',
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.EVERYONE,
	cooldown: 3,
	deleteMsg: true,
	execute(message, args) {
		const data = [];
		if (args.length) {
			args[0] = args[0].replace(/^\[?!?|\]$/g, '').toLowerCase();
			const command = message.client.commands.get(args[0]) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));
			if (!command) return fnc.replyExt(message, `${args[0]} is not a command`);
			if (!(fnc.getPerms(message.member || message.author) & command.permLvl)) return;
			data.push(`**${cfg.prefix}${args[0]}**\n`);
			if (command.aliases) data.push(`\`Aliases:\` ${command.name}, ${command.aliases.join(', ')}`);
			data.push(`\`Description:\` ${command.description}`);
			if (command.descriptionLong) data.push(`${command.descriptionLong}`);
			data.push(`\`Usage:\` ${cfg.prefix}${command.name} ${command.usage}`);
			data.push('Required Arguments are marked with < >, optional with [ ].');
			data.push(`Use quotes to commit arguments containg spaces. E.g. \`${cfg.prefix}lock "channel name"\``);
			fnc.replyExt(message, data.join('\n'), { mention: false, delay: 10 });
		}
		else {
			data.push(`**A list of the commands you can use ${message.author}**\n`);
			fnc.getCmdList(message.client, message.channel.type, fnc.getPerms(message.member || message.author)).forEach(cmd => data.push(`● \`${cfg.prefix}${cmd[0]}\` ${cmd[1]}`));
			data.push(`\nYou can use \`${cfg.prefix}help [command name]\` to get info on a specific command.`);
			fnc.replyExt(message, data.join('\n'), { mention: false, delay: 10 });
		}
	},
};

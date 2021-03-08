const commands = require(`${require.main.path}/cmd`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	aliases: ['commands', 'h'],
	description: 'List all of the commands or info about a specific command.',
	args: 0,
	usage: '[command name]',
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.EVERYONE,
	cooldown: 10,
	deleteMsg: true,
	async execute(message, args) {
		const data = [];
		const prefix = fnc.guilds.getPrefix(message.guild);
		if (args.length > 0) {
			let cmdName = args[0].replace(/^[[<]|[\]>]$/g, '').toLowerCase();
			const mode = (args[1] || '').replace(/^[[<]|[\]>]$/g, '').toLowerCase();
			if (cmdName.startsWith(prefix)) cmdName = cmdName.slice(prefix.length);
			const command = commands.get(cmdName) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));
			if (!command) throw fnc.Warn(`\`${cmdName}\` is not a command`);
			if (mode && !Object.keys(command.modes).includes(mode)) throw fnc.Warn(`\`${mode}\` is not a valid mode.\nValid modes are: \`${Object.keys(command.modes).join('`, `')}\``);
			if (!(fnc.guilds.getPerms(message.member || message.author) & command.permLvl)) return true;
			data.push(`**${prefix}${cmdName}** ${mode}\n`);
			if (command.aliases) data.push(`**Aliases**\n${command.name}, ${command.aliases.join(', ')}`);
			data.push(`**Description**\n${mode && command.modes[mode].description || command.description}`);
			if (mode && command.modes[mode].descriptionLong || command.descriptionLong) data.push(`${mode && command.modes[mode].descriptionLong || command.descriptionLong}`);
			if (mode && command.modes[mode].usage || command.usage) {
				data.push(`**Usage**\n${prefix}${cmdName} ${mode && command.modes[mode].usage || command.usage}`);
			}
			else if (!mode && command.modes) {
				data.push(`**Usage**\n${prefix}${cmdName} [mode]`);
				data.push(`**Modes**\n${Object.keys(command.modes).join(', ')}`);
			}
			data.push('\nRequired arguments are marked with < >, optional with [ ].');
			data.push(`Use quotes to commit arguments containg spaces. E.g. \`${prefix}lock "channel name"\``);
		}
		else {
			data.push(`**Commands you can use ${message.author}**\n`);
			const cmdList = fnc.getCmdList(message.channel.type, fnc.guilds.getPerms(message.member || message.author));
			for (const command of cmdList) {
				if (fnc.guilds.getPerms(message.member || message.author) & CON.PERMLVL.ADMIN) data.push(`**${prefix}${command[0]}** *(${Object.keys(CON.PERMLVL).find(v => CON.PERMLVL[v] & command[2]).toLowerCase()})*\n${command[1]}`);
				else data.push(`**${prefix}${command[0]}**\n${command[1]}`);

			}
			data.push(`\nYou can use \`${prefix}help command [mode]\` to get info on a specific command.`);
		}
		fnc.discord.replyExt(message, data.join('\n'), { mention: false, delay: 10 }).catch(() => null);
		return true;
	},
};

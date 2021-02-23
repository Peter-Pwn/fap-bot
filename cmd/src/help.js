const commands = require(`${require.main.path}/cmd`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	aliases: ['commands'],
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
			if (command.aliases) data.push(`\`Aliases:\` ${command.name}${command.aliases.length ? ', ' + command.aliases.join(', ') : ''}`);
			data.push(`\`Description:\` ${mode && command.modes[mode].description || command.description}`);
			if (mode && command.modes[mode].descriptionLong || command.descriptionLong) data.push(`${mode && command.modes[mode].descriptionLong || command.descriptionLong}`);
			if (!mode && command.modes) {
				data.push(`\`Modes:\` ${Object.keys(command.modes).join(', ')}`);
				data.push(`\`Usage:\` ${prefix}${cmdName} [mode]`);
			}
			if (mode && command.modes[mode].usage || command.usage) data.push(`\`Usage:\` ${prefix}${cmdName} ${mode && command.modes[mode].usage || command.usage}`);
			data.push('Required Arguments are marked with < >, optional with [ ].');
			data.push(`Use quotes to commit arguments containg spaces. E.g. \`${prefix}lock "channel name"\``);
		}
		else {
			data.push(`**A list of commands you can use ${message.author}**\n`);
			//TODO: if admin, show req perm
			fnc.getCmdList(message.channel.type, fnc.guilds.getPerms(message.member || message.author)).forEach(cmd => data.push(`● \`${prefix}${cmd[0]}\` ${cmd[1]}`));
			data.push(`\nYou can use \`${prefix}help command [mode]\` to get info on a specific command.`);
		}
		fnc.discord.replyExt(message, data.join('\n'), { mention: false, delay: 10 }).catch(() => null);
		return true;
	},
};

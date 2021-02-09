const commands = require(`${require.main.path}/cmd`);

const CON = require(`${require.main.path}/src/const.json`);

module.exports = {
	aliases: ['addraid'],
	description: 'Creates a raid.',
	descriptionLong: 'The date format is "YYYY-MM-DD h:mm Z". Z is the timezone.',
	args: 4,
	usage: '<title> <description> <player count> <date & time> [repeat interval (days)] [role to remind]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.MOD,
	cooldown: 3,
	deleteMsg: true,
	execute(message, args) {
		return commands.get('raidedit').execute(message, ['new'].concat(args));
	},
};

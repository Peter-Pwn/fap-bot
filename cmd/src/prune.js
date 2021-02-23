const client = require(`${require.main.path}/src/client.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	description: 'Deletes a number of messages.',
	descriptionLong: 'In DMs only the bot messages are deleted.',
	args: 1,
	usage: '<number of messages>',
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.MOD,
	cooldown: 5,
	deleteMsg: false,
	async execute(message, args) {
		args[0] = parseInt(args[0]) + 1;
		if (isNaN(args[0]) || args[0] < 2 || args[0] > 100) throw fnc.Warn('you need to input a number between 1 and 99');

		if (message.channel.type === 'text') {
			await message.channel.bulkDelete(args[0], true);
		}
		else if (message.channel.type === 'dm') {
			const messages = await message.author.dmChannel.messages.fetch();
			let i = args[0];
			for (const [, msg] of messages.filter(filter => filter.author.id === client.user.id)) {
				if (--i === 0) break;
				await msg.delete();
			}
		}
		return true;
	},
};

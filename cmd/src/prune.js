const logger = require(`${require.main.path}/src/logger.js`);
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
		if (isNaN(args[0]) || args[0] < 2 || args[0] > 100) {
			//if (message.channel.type === 'text') message.delete();
			return fnc.replyWarn(message, 'you need to input a number between 1 and 99');
		}

		if (message.channel.type === 'text') {
			try {
				await message.channel.bulkDelete(args[0], true);
			}
			catch (e) {
				if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') {
					message.channel.send(`${message.guild.owner}, i don't have permission to delete messages here!`);
				}
				else {
					logger.warn(`Couldn't prune ${message.channel.name}:\n${e.stack}`);
					fnc.replyWarn(message, 'there was an error trying to prune messages in this channel');
					message.delete();
				}
			}
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

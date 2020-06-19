const Discord = require('discord.js');

const CON = require('../../src/const.json');
const fnc = require('../../fnc');

const emojiRegex = require('emoji-regex');

module.exports = {
	description: 'Sets the welcome message of a server in this channel.',
	descriptionLong: 'You can let the bot append a list of all the commands available for everyone. Approve emojis can be used to set a role to everyone who clicks on it.',
	args: 2,
	usage: '<message> <append command list> [:approve emoji:] [@approve role] ... [:approve emoji:] [@approve role]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args) {
		if ((args.length - this.args) % 2) return fnc.replyExt(message, 'you didn\'t provide enoght arguments.');
		const reactEmojiRegex = new RegExp('<:.+:(\\d+)>|(' + emojiRegex().source + ')');
		for (let i = this.args; i < args.length; i += 2) {
			args[i] = args[i].match(reactEmojiRegex);
			if (!args[i]) return fnc.replyExt(message, 'you have an error in your emojis.');
			args[i] = args[i][1] || args[i][2];
			args[i + 1] = args[i + 1].match(/<@&(\d+)>/);
			if (!args[i + 1]) return fnc.replyExt(message, 'you have an error in your roles.');
			args[i + 1] = args[i + 1][1];
		}
		args[1] = fnc.parseBool(args[1]);
		let text = args[0];
		if (args[1]) text += `\n${fnc.getCmdList(message.client, 'text', CON.PERMLVL.EVERYONE).join('\n')}`;

		try {
			let welcomeMsg = null;
			const welcomeMsgID = await message.client.db.welcomeMsgs.findOne({ attributes: ['id', 'messageID'], where: { channelID: message.channel.id } });
			if (welcomeMsgID) {
				welcomeMsg = await message.channel.messages.fetch(welcomeMsgID.messageID).catch(async () => {
					message.client.welcomeReacts.delete(welcomeMsgID.messagelID);
					await message.client.db.welcomeReacts.destroy({ where: { messagelID: welcomeMsgID.messageID } });
					await welcomeMsgID.destroy();
					return null;
				});
			}
			if (welcomeMsg) {
				await welcomeMsg.edit(text);
				await message.client.db.welcomeMsgs.update({
					text: args[0],
					cmdList: args[1],
				},
				{
					where: { messageID: welcomeMsg.id },
				});
				await welcomeMsg.reactions.removeAll();
				message.client.welcomeReacts.delete(welcomeMsg.id);
				await message.client.db.welcomeReacts.destroy({ where: { messagelID: welcomeMsg.id } });
			}
			else {
				welcomeMsg = await message.channel.send(text);
				await message.client.db.welcomeMsgs.create({
					channelID: message.channel.id,
					messageID: welcomeMsg.id,
					text: args[0],
					cmdList: args[1],
				});
			}

			message.client.welcomeReacts.set(welcomeMsg.id, new Discord.Collection());
			for (let i = this.args; i < args.length; i += 2) {
				try {
					await welcomeMsg.react(args[i]);
					const react = {
						messagelID: welcomeMsg.id,
						emojiID: args[i],
						roleID: args[i + 1],
					};
					await message.client.db.welcomeReacts.create(react);
					message.client.welcomeReacts.get(welcomeMsg.id).set(react.emojiID, react);
				}
				catch (e) {
					if (e.name === 'DiscordAPIError' && e.message === 'Unknown Emoji') return fnc.replyExt(message, `${args[i]} is not a valid emoji`);
					return message.client.logger.error(e);
				}
			}
		}
		catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') return message.client.logger.warn('Welcome message already exists');
			return message.client.logger.error(e);
		}
	},
};

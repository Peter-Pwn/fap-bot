const Discord = require('discord.js');

const CON = require('../../src/const.json');
const cfg = require('../../src/config.js');
const fnc = require('../../fnc');

const eRegex = require('emoji-regex');

module.exports = {
	aliases: ['setapprove'],
	description: 'Adds or removes Approve emojis to a welcome message in this channel.',
	descriptionLong: 'You need to set a welcome message using editwelcome first.\nRemoving a reaction doesn\'t remove the role from members.',
	args: 2,
	usage: 'add <:emoji:> <@role> ... [:emoji:] [@role]\nremove <:emoji:> ... [:emoji:]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args) {
		//get the welcome message
		let welcomeMsg = null;
		try {
			await message.client.db.welcomeMsgs.findOne({ attributes: ['id', 'messageID'], where: { channelID: message.channel.id } })
				.then(async msg => welcomeMsg = await message.channel.messages.fetch(msg.messageID));
		}
		catch {
			return fnc.replyExt(message, `You need to set a welcome message using ${fnc.getPrefix(message.guild)}editwelcome first.`, { color: CON.TEXTCLR.WARN });
		}

		if (!message.client.welcomeReacts.has(welcomeMsg.id))	message.client.welcomeReacts.set(welcomeMsg.id, new Discord.Collection());
		const welcomeReacts = message.client.welcomeReacts.get(welcomeMsg.id);

		const emojiRegex = RegExp('<:.+:(\\d+)>|(' + eRegex().source + ')');

		if (args[0] === 'add') {
			//check for pairs
			if ((args.length - 1) % 2) return fnc.replyExt(message, 'you didn\'t provide enoght arguments.', { color: CON.TEXTCLR.WARN });

			for (let i = 1; i < args.length; i += 2) {
				//check for emojis and roles
				args[i] = args[i].match(emojiRegex);
				if (!args[i]) return fnc.replyExt(message, 'you have an error in your emojis.', { color: CON.TEXTCLR.WARN });
				args[i] = args[i][1] || args[i][2];
				args[i + 1] = args[i + 1].match(/<@&(\d+)>/);
				if (!args[i + 1]) return fnc.replyExt(message, 'you have an error in your roles.', { color: CON.TEXTCLR.WARN });
				args[i + 1] = args[i + 1][1];

				//adds the reaction to the collection and db
				try {
					await welcomeMsg.react(args[i]);
					const react = {
						messageID: welcomeMsg.id,
						emojiID: args[i],
						roleID: args[i + 1],
					};
					await message.client.db.welcomeReacts.create(react);
					welcomeReacts.set(react.emojiID, react);
				}
				catch (e) {
					if (e.name === 'SequelizeUniqueConstraintError') return;
					if (e.name === 'DiscordAPIError' && e.message === 'Unknown Emoji') return fnc.replyExt(message, `${args[i]} is not a valid emoji`, { color: CON.TEXTCLR.WARN });
					if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return message.channel.send(`${message.guild.owner}, i don't have permission to add reactions here!`);
					message.client.logger.error(e);
				}
			}
		}
		else if (args[0] === 'remove') {
			for (let i = 1; i < args.length; i++) {
				//check for emojis
				args[i] = args[i].match(emojiRegex);
				if (!args[i]) return fnc.replyExt(message, 'you have an error in your emojis.', { color: CON.TEXTCLR.WARN });
				args[i] = args[i][1] || args[i][2];

				//remove the reaction from the collection and db
				try {
					if (!welcomeMsg.reactions.cache.has(args[i])) continue;
					welcomeMsg.reactions.cache.get(args[i]).remove();
					await message.client.db.welcomeReacts.destroy({ where: { messageID: welcomeMsg.id, emojiID: args[i] } });
					welcomeReacts.delete(args[i]);
				}
				catch (e) {
					if (e.name === 'SequelizeUniqueConstraintError') return;
					if (e.name === 'DiscordAPIError' && e.message === 'Unknown Emoji') return fnc.replyExt(message, `${args[i]} is not a valid emoji`, { color: CON.TEXTCLR.WARN });
					if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return message.channel.send(`${message.guild.owner}, i don't have permission to add reactions here!`);
					message.client.logger.error(e);
				}
			}
		}
		else {
			return fnc.replyExt(message, 'please define a mode (add or remove)', { color: CON.TEXTCLR.WARN });
		}
	},
};

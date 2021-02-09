const Discord = require('discord.js');

const client = require(`${require.main.path}/src/client.js`);
const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

const eRegex = require('emoji-regex');

module.exports = {
	aliases: ['editapprove', 'approveadd', 'addapprove'],
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
		const msg = await db.welcomeMsgs.findOne({ attributes: ['id', 'messageID'], where: { channelID: message.channel.id } });
		if (msg) {
			welcomeMsg = await message.channel.messages.fetch(msg.messageID);
		}
		else {
			return fnc.replyWarn(message, `You need to set a welcome message using ${fnc.guilds.getPrefix(message.guild)}editwelcome first.`);
		}
		if (!client.welcomeReacts.has(welcomeMsg.id))	client.welcomeReacts.set(welcomeMsg.id, new Discord.Collection());
		const welcomeReacts = client.welcomeReacts.get(welcomeMsg.id);

		const emojiRegex = RegExp('<:.+:(\\d+)>|(' + eRegex().source + ')');

		if (args[0] === 'add') {
			//check for pairs
			if ((args.length - 1) % 2) return fnc.replyWarn(message, 'you didn\'t provide enoght arguments.');

			for (let i = 1; i < args.length; i += 2) {
				//check for emojis and roles
				args[i] = args[i].match(emojiRegex);
				if (!args[i]) return fnc.replyWarn(message, 'you have an error in your emojis.');
				args[i] = args[i][1] || args[i][2];
				args[i + 1] = args[i + 1].match(/<@&(\d+)>/);
				if (!args[i + 1]) return fnc.replyWarn(message, 'you have an error in your roles.');
				args[i + 1] = args[i + 1][1];

				//adds the reaction to the collection and db
				try {
					await welcomeMsg.react(args[i]);
					const react = {
						messageID: welcomeMsg.id,
						emojiID: args[i],
						roleID: args[i + 1],
					};
					await db.welcomeReacts.create(react);
					welcomeReacts.set(react.emojiID, react);
				}
				catch (e) {
					if (e.name === 'SequelizeUniqueConstraintError') return;
					if (e.name === 'DiscordAPIError' && e.message === 'Unknown Emoji') return fnc.replyWarn(message, `${args[i]} is not a valid emoji`);
					if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') {
						return message.channel.send(`${message.guild.owner}, i don't have permission to add reactions here!`);
					}
					throw e;
				}
			}
		}
		else if (args[0] === 'remove') {
			for (let i = 1; i < args.length; i++) {
				//check for emojis
				args[i] = args[i].match(emojiRegex);
				if (!args[i]) return fnc.replyWarn(message, 'you have an error in your emojis.');
				args[i] = args[i][1] || args[i][2];

				//remove the reaction from the collection and db
				try {
					if (!welcomeMsg.reactions.cache.has(args[i])) continue;
					welcomeMsg.reactions.cache.get(args[i]).remove();
					await db.welcomeReacts.destroy({ where: { messageID: welcomeMsg.id, emojiID: args[i] } });
					welcomeReacts.delete(args[i]);
				}
				catch (e) {
					if (e.name === 'SequelizeUniqueConstraintError') return false;
					if (e.name === 'DiscordAPIError' && e.message === 'Unknown Emoji') return fnc.replyWarn(message, `${args[i]} is not a valid emoji`);
					if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') {
						return message.channel.send(`${message.guild.owner}, i don't have permission to add reactions here!`);
					}
					throw e;
				}
			}
		}
		else {
			return fnc.replyWarn(message, 'please define a mode (add or remove)');
		}
		return true;
	},
};

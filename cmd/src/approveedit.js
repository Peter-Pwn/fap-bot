const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);
const rnx = require(`${require.main.path}/rnx`);

const reacts = require(`${require.main.path}/src/reacts.js`);

const eRegex = require('emoji-regex');

module.exports = {
	description: 'Adds or removes Approve emojis to a welcome message.',
	descriptionLong: 'You need to set a welcome message using editwelcome first.\nRemoving a reaction doesn\'t remove the role from members.',
	args: 2,
	usage: 'add <:emoji:> <@role> ... [:emoji:] [@role]\nremove <:emoji:> ... [:emoji:]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args) {
		//get the welcome message
		const msg = await db.welcomemsgs.findOne({
			attributes: ['id', 'messageID'],
			where: { channelID: message.channel.id },
		});
		if (!msg) throw fnc.Warn(`You need to set a welcome message using ${fnc.guilds.getPrefix(message.guild)}editwelcome first.`);
		const welcomeMsg = await message.channel.messages.fetch(msg.messageID);
		const emojiRegex = RegExp('<:.+:(\\d+)>|(' + eRegex().source + ')');

		if (args[0] === 'add') {
			//check for pairs
			if ((args.length - 1) % 2) throw fnc.Warn('you didn\'t provide enoght arguments.');

			for (let i = 1; i < args.length; i += 2) {
				//check for emojis and roles
				args[i] = args[i].match(emojiRegex);
				if (!args[i]) throw fnc.Warn('you have an error in your emojis.');
				args[i] = args[i][1] || args[i][2];
				args[i + 1] = args[i + 1].match(/<@&(\d+)>/);
				if (!args[i + 1]) throw fnc.Warn('you have an error in your roles.');
				args[i + 1] = args[i + 1][1];

				//adds the reaction to the collection and db
				try {
					await welcomeMsg.react(args[i]);
					const react = db.welcomereacts.build({
						messageID: welcomeMsg.id,
						emojiID: args[i],
						roleID: args[i + 1],
						welcomeMsgsID: msg.id,
					});
					await react.save();
					reacts.set(welcomeMsg.id, rnx.welcome);
				}
				catch (e) {
					if (e.name === 'DiscordAPIError' && e.message === 'Unknown Emoji') throw fnc.Warn(`${args[i]} is not a valid emoji`);
					throw e;
				}
			}
		}
		else if (args[0] === 'remove') {
			for (let i = 1; i < args.length; i++) {
				//check for emojis
				args[i] = args[i].match(emojiRegex);
				if (!args[i]) throw fnc.Warn('you have an error in your emojis.');
				args[i] = args[i][1] || args[i][2];

				//remove the reaction from the collection and db
				try {
					if (!welcomeMsg.reactions.cache.has(args[i])) continue;
					welcomeMsg.reactions.cache.get(args[i]).remove();
					await db.welcomereacts.destroy({
						where: {
							messageID: welcomeMsg.id,
							emojiID: args[i],
						},
					});
					reacts.delete(welcomeMsg.id);
				}
				catch (e) {
					if (e.name === 'DiscordAPIError' && e.message === 'Unknown Emoji') throw fnc.Warn(`${args[i]} is not a valid emoji`);
					throw e;
				}
			}
		}
		else {
			throw fnc.Warn('please define a mode (add or remove)');
		}
		return true;
	},
};

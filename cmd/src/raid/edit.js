const moment = require('moment');

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);
const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);
const rnx = require(`${require.main.path}/rnx`);


module.exports = {
	aliases: ['editraid'],
	description: 'Edits a raid.',
	descriptionLong: 'Supply the discord message id of the raid.\nThe date format is "YYYY-MM-DD h:mm Z". Z is the timezone.\nEmpty arguments ("") are loaded from the database and won\'t be changed.',
	args: 5,
	usage: '<message ID> <title> <description> <player count> <date & time> [repeat interval (days)] [role to remind]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.MOD,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args) {
		/*
!editraid new "test raid" "here will be some text
bla bla
text" 4 "2020.08.27 20:30 +2" 1
		*/
		try {
			args[0] = args[0].toLowerCase();
			let raid = {};
			let raidMsg = null;

			//if not new, load missing values from db
			if (args[0] !== 'new') {
				raid = await db.raids.findOne({ where: { messageID: args[0] }, include: ['members'], order: [['members', 'id']] });
				if (!raid) throw new Error('Unknown Message');

				if (!args[1]) args[1] = raid.title;
				if (!args[2]) args[2] = raid.description;
				if (!args[3]) args[3] = raid.count;
				if (!args[4])	args[4] = raid.time;
				if (!args[5] && args[5] !== 0) args[5] = raid.repeat;
				if (!args[6]) args[6] = raid.roleID;
			}
			else {
				raid = db.raids.build({}, { include: ['members'] });
			}

			//check for valid values
			if (!args[1]) return fnc.replyWarn(message, 'the title can\'t be empty');
			if (args[1].lenght > 255) return fnc.replyWarn(message, 'the title must be 255 or fewer in length');
			args[3] = parseInt(args[3]);
			if (isNaN(args[3]) || args[3] < 1) return fnc.replyWarn(message, 'player count must be a positive number');
			if (!(args[4] instanceof moment)) args[4] = moment.parseZone(args[4].replace(/[-+]([1-9])(?:\b|:)/, '+0$1'), CON.DATETIMEPAT);
			if (!args[4].isValid() || args[4].isBefore(moment())) return fnc.replyWarn(message, 'date & time is not valid date');
			if (!args[5] && args[5] !== 0) args[5] = 0;
			args[5] = parseInt(args[5]);
			if (isNaN(args[5]) || args[5] < 0) return fnc.replyWarn(message, 'repeat interval must be a full number');
			if (args[6] && !message.guild.roles.cache.has(args[6])) {
				args[6] = args[6].match(/<@&(\d+)>/);
				if (!args[6]) return fnc.replyWarn(message, 'you have an error in your role');
				args[6] = args[6][1];
			}

			//write checked values back into raid object
			raid.title = args[1];
			raid.description = args[2];
			raid.count = args[3];
			raid.time = args[4];
			raid.repeat = args[5];
			raid.roleID = args[6];

			//send raid message with embed and write to db
			if (args[0] === 'new') {
				raid.set('members', []);
				raidMsg = await message.channel.send(null, { embed: fnc.getRaidEmbed(message.channel, raid.get({ plain: true })) });
				await raidMsg.react('✅');
				await raidMsg.react('🆔');
				raid.channelID = raidMsg.channel.id;
				raid.messageID = raidMsg.id;
			}
			else {
				raidMsg = await client.channels.fetch(raid.channelID || '0').then(async channel => await channel.messages.fetch(raid.messageID || '0'));
				await raidMsg.edit(raidMsg.content, { embed: fnc.getRaidEmbed(message.channel, raid.get({ plain: true })) });
			}
			await raid.save();
			client.raids.set(raid.messageID, raid.get({ plain: true }));
			client.reacts.set(raid.messageID, rnx.raid);
			client.emit('mainInterval', true);
		}
		catch (e) {
			if (e.name === 'DiscordAPIError' || e.name === 'Error' && e.message === 'Unknown Message') return fnc.replyWarn(message, 'raid message not found');
			if (e.name === 'RangeError [EMBED_FIELD_VALUE]') return logger.error(`Error sending raid embed:\n${e.stack}`);
			throw e;
		}
		return true;
	},
};

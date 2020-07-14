const CON = require('../../src/const.json');
const fnc = require('../../fnc');
const rnx = require('../../rnx');

const moment = require('moment');

module.exports = {
	description: 'Creates or edits a raid.',
	descriptionLong: 'For a new raid set the first argument to new, if you want to edit a raid supply the discord message id of the raid.\nThe date format is YYYY-MM-DD h:mm Z. Z is the timezone.\nIf you edit a raid, empty arguments ("") are loaded from the database and won\'t be changed.',
	args: 5,
	usage: '<new|message ID> <title> <description> <player count> <date & time> [repeat interval (days)] [role to remind]',
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
				raid = await message.client.db.raids.findOne({ where: { messageID: args[0] }, include: ['members'], order: [['members', 'id']] });
				if (!raid) throw new Error('Unknown Message');

				if (!args[1]) args[1] = raid.title;
				if (!args[2]) args[2] = raid.description;
				if (!args[3]) args[3] = raid.count;
				if (!args[4])	args[4] = raid.time;
				if (!args[5] && args[5] !== 0) args[5] = raid.repeat;
				if (!args[6]) args[6] = raid.roleID;
			}
			else {
				raid = message.client.db.raids.build({}, { include: ['members'] });
			}

			//check for valid values
			if (!args[1]) return fnc.replyExt(message, 'the title can\'t be empty', { color: CON.TEXTCLR.WARN });
			args[3] = parseInt(args[3]);
			if (isNaN(args[3]) || args[3] < 1) return fnc.replyExt(message, 'player count must be a positive number', { color: CON.TEXTCLR.WARN });
			if (!(args[4] instanceof moment)) args[4] = moment.parseZone(args[4].replace(/[-+]([1-9])(?:\b|:)/, '+0$1'), CON.DATETIMEPAT);
			if (!args[4].isValid() || args[4].isBefore(moment())) return fnc.replyExt(message, 'date & time is not valid date', { color: CON.TEXTCLR.WARN });
			//TODO: check if date is in the future?
			if (!args[5] && args[5] !== 0) args[5] = 0;
			args[5] = parseInt(args[5]);
			if (isNaN(args[5]) || args[5] < 0) return fnc.replyExt(message, 'repeat interval must be a full number', { color: CON.TEXTCLR.WARN });
			if (args[6] && !message.guild.roles.cache.has(args[6])) {
				args[6] = args[6].match(/<@&(\d+)>/);
				if (!args[6]) return fnc.replyExt(message, 'you have an error in your role', { color: CON.TEXTCLR.WARN });
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
				//TODO: permission chatch
				raidMsg = await message.channel.send(null, { embed: fnc.getRaidEmbed(message.channel, raid.get({ plain: true })) });
				await raidMsg.react('✅');
				await raidMsg.react('🆔');
				raid.channelID = raidMsg.channel.id;
				raid.messageID = raidMsg.id;
			}
			else {
				raidMsg = await message.client.channels.fetch(raid.channelID || '0').then(async channel => await channel.messages.fetch(raid.messageID || '0'));
				await raidMsg.edit(raidMsg.content, { embed: fnc.getRaidEmbed(message.channel, raid.get({ plain: true })) });
			}
			await raid.save();
			message.client.raids.set(raid.messageID, raid.get({ plain: true }));
			message.client.reacts.set(raid.messageID, rnx.raid);
			message.client.emit('mainInterval', true);
		}
		catch (e) {
			if (e.name === 'DiscordAPIError' || e.name === 'Error' && e.message === 'Unknown Message') return fnc.replyExt(message, 'raid message not found', { color: CON.TEXTCLR.WARN });
			if (e.name === 'RangeError [EMBED_FIELD_VALUE]') return message.client.logger.error(`Error sending raid embed:\n${e.stack}`);
			return message.client.logger.error(e);
		}
	},
};

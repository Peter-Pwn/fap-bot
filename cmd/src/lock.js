const CON = require('../../src/const.json');
const cfg = require('../../src/config.js');
const fnc = require('../../fnc');

module.exports = {
	description: 'Locks or unlocks the voice channel you are in.',
	descriptionLong: 'As a mod you also can provide a channel name.',
	args: 0,
	usage: '[channel to lock]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.EVERYONE,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args) {
		let channel = null;
		try {
			//get the voice channel, as arg or the connected channel
			if (args.length) {
				channel = message.client.channels.cache.find(c => c.name === args[0] && c.type === 'voice');
				if (!channel) return fnc.replyExt(message, `${args[0]} is not a valid voice channel`);
				if (channel !== message.member.voice.channel && !message.member.hasPermission(cfg.modPerm)) {
					return fnc.replyExt(message, 'you don\'t have the permission to use this command', { color: CON.TEXTCLR.WARN });
				}
			}
			else {
				if (!message.member.voice.channelID) return fnc.replyWarn(message, 'you need to be in a voice channel') && false;
				channel = message.member.voice.channel;
			}
			if (!channel.editable) return await message.channel.send(`${message.guild.owner}, i don't have permission to set the user limit here!\nI need permission to manage the channel and to be able to connect to it.`);

			//check for existing lock and unlock or lock the channel
			let lock = message.client.locks.get(channel.id);
			if (lock) {
				if (lock.memberID !== message.member.id && !message.member.hasPermission(cfg.modPerm)) {
					if (channel.members.has(lock.memberID)) return fnc.replyExt(message, 'you can\'t unlock the channel, because somebody else locked it', { color: CON.TEXTCLR.WARN });
					if (lock.permanent) return fnc.replyExt(message, 'you can\'t unlock the channel, because a mod locked it', { color: CON.TEXTCLR.WARN });
					return fnc.replyExt(message, 'you don\'t have the permission to use this command', { color: CON.TEXTCLR.WARN });
				}
				await channel.setUserLimit(lock.limit);
				await message.client.db.locks.destroy({ where: { channelID: channel.id } });
				message.client.locks.delete(channel.id);
			}
			else {
				lock = {
					channelID: channel.id,
					memberID: message.member.id,
					limit: channel.userLimit,
					permanent: (args.length > 0 && message.member.hasPermission(cfg.modPerm)),
				};
				await message.client.db.locks.create(lock);
				message.client.locks.set(channel.id, lock);
				await channel.setUserLimit(1);
			}
		}
		catch (e) {
			if (e.name === 'SequelizeUniqueConstraintError') return true;
			if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') {
				return message.guild && message.guild.owner.send(`${message.guild.owner}, i don't have permission to send messages in \`${message.guild.name} #${message.channel.name}\`!`);
			}
			return message.client.logger.error(e);
		}
		return true;
	},
};

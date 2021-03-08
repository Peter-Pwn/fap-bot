const client = require(`${require.main.path}/src/client.js`);
const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

const locks = require(`${require.main.path}/src/locks.js`);

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
		//get the voice channel, as arg or the connected channel
		if (args.length) {
			channel = client.channels.cache.find(c => c.type === 'voice' && c.name === args[0]);
			if (!channel) throw fnc.Warn(`\`${args[0]}\` is not a valid voice channel.`);
			if (channel !== message.member.voice.channel && !(fnc.guilds.getPerms(message.member) & CON.PERMLVL.MOD)) {
				throw fnc.Warn('you don\'t have the permission to use this command.');
			}
		}
		else {
			if (!message.member.voice.channelID) throw fnc.Warn('you need to be in a voice channel.');
			channel = message.member.voice.channel;
		}
		//if (!channel.editable) return await message.channel.send(`${message.guild.owner}, i don't have permission to set the user limit here!\nI need permission to manage the channel and to be able to connect to it.`);
		if (!channel.editable) throw fnc.Warn(`The channel \`${channel.name}\` can't be locked.`);

		//check for existing lock and unlock or lock the channel
		let lock = locks.get(channel.id);
		if (lock) {
			if (lock.memberID !== message.member.id && !(fnc.guilds.getPerms(message.member) & CON.PERMLVL.MOD)) {
				if (channel.members.has(lock.memberID)) throw fnc.Warn('you can\'t unlock the channel, because somebody else locked it.');
				if (lock.permanent) throw fnc.Warn('you can\'t unlock the channel, because a mod locked it.');
				throw fnc.Warn('you don\'t have the permission to use this command.');
			}
			await channel.setUserLimit(lock.limit);
			await db.locks.destroy({ where: { channelID: channel.id } });
			locks.delete(channel.id);
		}
		else {
			lock = db.locks.build({
				channelID: channel.id,
				memberID: message.member.id,
				limit: channel.userLimit,
				permanent: (args.length > 0 && (fnc.guilds.getPerms(message.member) & CON.PERMLVL.MOD)),
			});
			await lock.save();
			locks.set(channel.id, lock.get({ plain: true }));
			await channel.setUserLimit(1);
		}
		return true;
	},
};

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const client = require(`${require.main.path}/src/client.js`);

module.exports = {
	aliases: [],
	description: 'Modifys a channel for the Division 2 clan xp list.',
	modes: {
		list: {
			isDefault: true,
			description: 'Lists the Division 2 clan xp channels.',
		},
		add: {
			aliases: ['td2xpchanneladd'],
			description: 'Adds a channel for the Division 2 clan xp list.',
			descriptionLong: 'Set [player count] or [weeks to keep] to -1 for unlimited.',
			args: 1,
			usage: '<#channel> [player count (default: -1)] [weeks to keep (default: -1)]',
		},
		remove: {
			aliases: ['td2xpchannelremove'],
			description: 'Removes a channel for the Division 2 clan xp list.',
			args: 1,
			usage: '<#channel>',
		},
	},
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args, mode) {
		if (mode === 'add') {
			let channel = '';
			try {
				channel = await fnc.snowflakes.getChannel(args[0], message.guild.id);
			}
			catch (e) {
				throw fnc.Warn(`\`${args[0]}\` is not a discord channel.`);
			}
			//param1 = top X
			let pCount = parseInt(args[1]);
			if (!pCount || pCount < -1) pCount = -1;
			if (pCount > 50) pCount = 50;
			//param2 = time to keep
			let kWeeks = parseInt(args[2]);
			if (!kWeeks && kWeeks !== 0 || kWeeks < -1) kWeeks = -1;
			const chan = await fnc.channels.add(message.guild.id, channel, CON.CHTYPE.DIV2XP, { param1: pCount, param2: kWeeks });
			fnc.discord.replyExt(message, `${message.guild.channels.cache.get(channel)} was successfully added.`).catch(() => null);
			fnc.div2xp.populate(chan);
		}
		else if (mode === 'remove') {
			let channel = '';
			try {
				channel = await fnc.snowflakes.getChannel(args[0], message.guild.id);
			}
			catch (e) {
				throw fnc.Warn(`\`${args[0]}\` is not a discord channel.`);
			}
			await fnc.channels.rem(channel, CON.CHTYPE.DIV2XP);
			fnc.discord.replyExt(message, `${message.guild.channels.cache.get(channel)} was successfully removed.`).catch(() => null);
		}
		else {
			const channels = await fnc.channels.list(message.guild.id, CON.CHTYPE.DIV2XP);
			let text = '**List of Division 2 clan xp channels**\n';
			for (const channel of channels) {
				try {
					const disChannel = await client.channels.fetch(channel.channelID);
					text += `${disChannel}\n`;
					text += `\`\`\`number of players: ${channel.param1 > 0 ? channel.param1 : 'all'}\n`;
					text += `weeks kept: ${channel.param2 > -1 ? channel.param2 : 'for ever'}\`\`\`\n`;
				}
				catch (e) {
					//TODO: remove or hint failed channels
					continue;
				}
			}
			fnc.discord.replyExt(message, text, { mention: false });
		}
		return true;
	},
};

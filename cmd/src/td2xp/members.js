const Discord = require('discord.js');

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	description: 'Handles members of the Division 2 clan xp list.',
	modes: {
		list: {
			isDefault: true,
			description: 'Lists all Division 2 clan members.',
		},
		failed: {
			description: 'Lists probably wrong members from the Division 2 clan list.',
		},
		add: {
			aliases: ['td2xpregister'],
			description: 'Register a uplay name to the Division 2 clan xp list.',
			descriptionLong: 'You can provide multible pairs of users.',
			args: 2,
			usage: '<uplay name> <@discord user> ... [uplay name] [@discord user]',
		},
		remove: {
			aliases: ['td2xpremove'],
			description: 'Removes a uplay name from the Division 2 clan xp list.',
			descriptionLong: 'You can provide multible users.',
			args: 1,
			usage: '<uplay name> ... [uplay name]',
		},
	},
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.DIV2XP,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args, mode) {
		if (mode === 'add') {
			if (args.length % 2) throw fnc.Warn('you didn\'t provide enoght arguments.');
			const results = [];
			let failed = false;
			for (let i = 0; i < args.length; i += 2) {
				try {
					let user = '';
					try {
						user = await fnc.snowflakes.getUser(args[i + 1], message.guild.id);
					}
					catch (e) {
						throw fnc.Warn(`\`${args[i + 1]}\` not found.`);
					}
					if (args[i].match(/^<(?:@!?(\d+))>$/)) throw fnc.Warn('got discord user instead of uplay name.');
					await fnc.div2xp.addMember(message.guild.id, user, args[i]);
					results.push(`\`${args[i]}\` was successfully registered.`);
				}
				catch (e) {
					failed = true;
					results.push(e.message);
					continue;
				}
			}
			if (failed) throw fnc.Warn(results.join('\n'));
			else fnc.discord.replyExt(message, results.join('\n')).catch(() => null);
		}
		else if (mode === 'remove') {
			const results = [];
			let failed = false;
			for (let i = 0; i < args.length; i++) {
				try {
					if (args[i].match(/^<(?:@!?(\d+))>$/)) throw fnc.Warn('got discord user instead of uplay name.');
					await fnc.div2xp.remMember(message.guild.id, args[i]);
					results.push(`\`${args[i]}\` was successfully removed.`);
				}
				catch (e) {
					failed = true;
					results.push(e.message);
					continue;
				}
			}
			if (failed) throw fnc.Warn(results.join('\n'));
			else fnc.discord.replyExt(message, results.join('\n')).catch(() => null);
		}
		else {
			let text = '';
			if (mode === 'failed') text = '**List of probably wrong clan members**\n';
			else text = '**List of all Division 2 clan members**\n';
			//disMsg = await fnc.discord.replyExt(message, `${text}\n*building list*`, { mention: false }).catch(() => null);
			const members = await fnc.div2xp.listMembers(message.guild.id, mode === 'failed');
			members.sort((a, b) => a.uplayName.toLowerCase() < b.uplayName.toLowerCase() && -1 || a.uplayName.toLowerCase() > b.uplayName.toLowerCase() && 1 || 0);
			if (members.length) {
				text += `count: ${members.length}\n`;
				for (const member of members) {
					try {
						let disMember = '';
						if (member.failed !== 'discord') disMember = await message.guild.members.fetch(member.memberID);
						else disMember = '';
						text += `${Discord.Util.escapeMarkdown(member.uplayName)} ${disMember}`;
						if (member.failed) text += ` (wrong ${member.failed})`;
						text += '\n';
					}
					catch (e) {
						continue;
					}
				}
			}
			else {
				text += 'no entries found.';
			}
			fnc.discord.replyExt(message, text, { mention: false }).catch(() => null);
		}
		return true;
	},
};

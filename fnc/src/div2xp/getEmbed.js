const Discord = require('discord.js');
const moment = require('moment');

const fnc = require(`${require.main.path}/fnc`);

module.exports = async function(channel, div2xp, { top = -1, showUplay = true } = {}) {
	if (!channel) throw new TypeError('no channel');
	if (!div2xp) throw new TypeError('no div2xp');
	top = parseInt(top);
	//if (top > 50) top = 50;
	const plyCount = (top === -1 || div2xp.length < top) ? div2xp.length : top;
	const players = [];
	let p = 0;
	for (let i = 0; i < div2xp.length; i++) {
		try {
			const member = await channel.guild.members.fetch(div2xp[i].memberID);
			//const member = `<@${div2xp[i].memberID}>`;
			p++;
			if (p > plyCount) break;
			let name = `**${p}.** ${member}`;
			if (showUplay) name = `${name} (${Discord.Util.escapeMarkdown(div2xp[i].uplayName)})`;
			//node.js 12 only supports en
			players.push(`${name}\n${new Intl.NumberFormat('en').format(div2xp[i].difference)}`);
		}
		catch (e) {
			continue;
		}
	}
	const rstDay = fnc.div2xp.getResetDay();
	const lastUpd = div2xp.reduce((a, b) => moment(b.lastUpdate).isAfter(a) && moment(b.lastUpdate) || moment(a), 0);
	const embed = {
		color: channel.guild.me.displayColor,
		title: 'Weekly clan XP',
		description: `${rstDay.format('MMM D YYYY')} - ${rstDay.clone().add(1, 'w').format('MMM D YYYY')}`,
		thumbnail: {
			url: channel.guild.iconURL(),
		},
		fields: [],
		footer: {
			text: div2xp.length > 0 ? `last update ${lastUpd.format('ddd, MMM D YYYY H:mm')}` : '\u200b',
		},
	};
	for (let i = 0; i < players.length && Math.floor(i / 10) < 25; i += 10) {
		embed.fields.push({
			name: (i === 0 && top > 0) ? `top ${top}` : '\u200b',
			value: players.slice(i, i + 10).join('\n') || '\u200b',
		});
	}
	return embed;
};

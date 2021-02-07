const moment = require('moment');

const Warn = require(`${require.main.path}/fnc/src/Warn.js`);

module.exports = function(channel, div2xp, { top = -1, showUplay = true } = {}) {
	return new Promise((resolve, reject) => {
		if (!channel || !div2xp) return reject(Warn('invalid arguments'));
		top = parseInt(top);
		const plyCount = top === -1 || div2xp.length < top ? div2xp.length : top;
		const players = [];
		const xp = [];
		const fetches = [];
		for (let i = 0; i < plyCount; i++) {
			fetches.push(channel.guild.members.fetch(div2xp[i].memberID)
				.then(member => {
					let name = member;
					if (i === 0) name = `🥇${name}`;
					else if (i === 1) name = `🥈${name}`;
					else if (i === 2) name = `🥉${name}`;
					else name = `▪️${name}`;
					if (showUplay) name = `${name} (${div2xp[i].uplayName})`;
					players.push(name);
					//node.js 12 only supports en
					xp.push(new Intl.NumberFormat('en').format(div2xp[i].difference));
				})
				.catch(() => null));
		}
		Promise.allSettled(fetches)
			.then(() => {
				resolve({
					color: channel.guild.me.displayColor,
					title: 'weekly clan XP',
					description: div2xp.length > 0 ? `(last update ${div2xp.reduce((a, b) => moment(b.lastUpdate).isAfter(a) && moment(b.lastUpdate) || a).format('ddd, MMM D YYYY H:mm')})` : '\u200b',
					fields: [
						{
							name: top === -1 ? '\u200b' : `top ${top}`,
							value: players.join('\n') || '\u200b',
							inline: true,
						},
						{
							name: '\u200b',
							value: xp.join('\n') || '\u200b',
							inline: true,
						},
					],
				});
			});
	});
};

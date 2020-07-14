module.exports = function(channel, raid) {
	if (!raid.title || !raid.time) return null;
	if (!raid.description) raid.description = '\u200b';

	const reserved = [];
	const waitlist = [];
	if (Array.isArray(raid.members)) {
		for (let i = 0; i < raid.members.length; i++) {
			if (!channel.guild.members.cache.has(raid.members[i].memberID)) continue;
			(i < raid.count ? reserved : waitlist).push(channel.guild.members.cache.get(raid.members[i].memberID).displayName);
		}
	}

	return {
		color: channel.guild.me.displayColor,
		title: raid.title,
		description: raid.description,
		fields: [
			{
				name: 'Time',
				value: `${raid.time.format('ddd, MMM D YYYY H:mm')} (UTC${raid.time.format('Z').replace(/(?<=[-+])0|:00/g, '')})`,
			},
			{
				name: `Reserved (${reserved.length}/${raid.count})`,
				value: reserved.join('\n') || '\u200b',
				inline: true,
			},
			{
				name: `Waitlist (${waitlist.length})`,
				value: waitlist.join('\n') || '\u200b',
				inline: true,
			},
		],
		footer: {
			text: '✅ drop in/out - 🆔 get id',
		},
	};
};

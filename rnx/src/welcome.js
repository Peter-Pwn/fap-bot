const db = require(`${require.main.path}/src/db.js`);

module.exports = {
	add: async function(reaction, user) {
		const react = await db.welcomereacts.findOne({
			attributes: ['roleID'],
			where: {
				messageID: reaction.message.id,
				emojiID: reaction.emoji.id || reaction.emoji.name,
			},
		});
		if (react) reaction.message.guild.members.cache.get(user.id).roles.add(reaction.message.guild.roles.cache.get(react.roleID));
	},
	remove: async function(reaction, user) {
		const react = await db.welcomereacts.findOne({
			attributes: ['roleID'],
			where: {
				messageID: reaction.message.id,
				emojiID: reaction.emoji.id || reaction.emoji.name,
			},
		});
		if (react) reaction.message.guild.members.cache.get(user.id).roles.remove(reaction.message.guild.roles.cache.get(react.roleID));
	},
};

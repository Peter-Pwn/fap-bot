const client = require(`${require.main.path}/src/client.js`);

module.exports = {
	add: function(reaction, user) {
		const react = client.welcomeReacts.get(reaction.message.id).get(reaction.emoji.id || reaction.emoji.name);
		if (react) reaction.message.guild.members.cache.get(user.id).roles.add(reaction.message.guild.roles.cache.get(react.roleID));
	},
	remove: function(reaction, user) {
		const react = client.welcomeReacts.get(reaction.message.id).get(reaction.emoji.id || reaction.emoji.name);
		if (react) reaction.message.guild.members.cache.get(user.id).roles.remove(reaction.message.guild.roles.cache.get(react.roleID));
	},
};

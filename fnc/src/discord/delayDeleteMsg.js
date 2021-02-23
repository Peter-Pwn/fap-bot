const cfg = require(`${require.main.path}/src/config.js`);

const client = require(`${require.main.path}/src/client.js`);

//reacts with X and deletes after a delay
module.exports = async function(message, { delay = 5 } = {}) {
	if (!message) throw new TypeError('no message');
	if (isNaN(delay) || delay < 0.5) delay = 5;
	if (message.deleted || message.channel.type !== 'text') return true;
	await message.react('❌');
	await message.awaitReactions((reaction, user) => {
		return reaction.emoji.name === '❌'
		&& user.id !== client.user.id
		&& (user.id === message.author.id
			|| message.guild && message.guild.members.cache.get(user.id).hasPermission(cfg.modPerm));
	},
	{
		max: 1,
		time: delay * 60e3,
	});
	if (message.deleted) return true;
	return await message.delete();
};

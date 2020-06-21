const cfg = require('../../src/config.js');

module.exports = function(message, text, { mention = true, del = true, delay = 5 } = {}) {
	if (typeof mention !== 'boolean') mention = true;
	if (isNaN(delay) || delay < 0.5) delay = 5;
	if (typeof del !== 'boolean') del = true;
	if (mention) text = message.author.toString() + ', ' + text;
	return message.channel.send({
		embed: {
			color: message.channel.type === 'text' ? message.guild.me.displayColor : 0x7289da,
			description: text,
			footer: {
				text: del ? `This message will be self destructed in ${delay} minutes! You can delete it prematurely by pressing X.` : null,
			},
		},
	})
		.then(async reply => {
			if (del) {
				try {
					await reply.react('❌');
					await reply.awaitReactions((reaction, user) => reaction.emoji.name === '❌' && user.id !== message.client.user.id
						&& (user.id === message.author.id || (message.guild && message.guild.members.cache.get(user.id).hasPermission(cfg.modPerm)))
					, { max: 1, time: delay * 60000 }).then(() => reply.delete());
				}
				catch (e) {
					if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions') return message.channel.send(message.guild.owner.toString() + ', I don\'t have permission to add reactions here!');
				}
			}
		});
};

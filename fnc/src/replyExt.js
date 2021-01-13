const cfg = require('../../src/config.js');

module.exports = async function(message, text, { mention = true, del = true, delay = 5, color } = {}) {
	if (!message || !text) return null;
	if (typeof mention !== 'boolean') mention = true;
	if (mention) text = message.author.toString() + ', ' + text;
	if (typeof del !== 'boolean') del = true;
	if (isNaN(delay) || delay < 0.5) delay = 5;
	if (!color) color = message.channel.type === 'text' ? message.guild.me.displayColor : 0x7289da;
	try {
		const reply = await message.channel.send({
			embed: {
				color: color,
				description: text,
				footer: {
					text: del ? `This message will be self destructed in ${delay} minutes! You can delete it prematurely by pressing X.` : null,
				},
			},
		});
		if (del) {
			try {
				await reply.react('❌');
				reply.awaitReactions((reaction, user) => reaction.emoji.name === '❌' && user.id !== message.client.user.id && (user.id === message.author.id || (message.guild && message.guild.members.cache.get(user.id).hasPermission(cfg.modPerm))),
					{ max: 1, time: delay * 60e3 })
					.then(() => reply.delete());
			}
			catch (e) {
				if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return message.channel.send(`${message.guild.owner}, i don't have permission to add reactions here!`);
			}
		}
		return reply;
	}
	catch (e) {
		if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return message.guild && message.guild.owner.send(`${message.guild.owner}, i don't have permission to send messages in \`${message.guild.name} #${message.channel.name}\`!`);
		return message.client.logger.error(e);
	}
};

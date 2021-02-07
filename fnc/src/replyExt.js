const cfg = require(`${require.main.path}/src/config.js`);

module.exports = function(message, text, { mention = true, delMsg = true, delay = 5, color } = {}) {
	return new Promise((resolve) => {
		if (!message || !text) return null;
		if (typeof mention !== 'boolean') mention = true;
		if (mention) text = message.author.toString() + ', ' + text;
		if (text.length > 2048) text = text.substring(0, 2048);
		if (typeof delMsg !== 'boolean') delMsg = true;
		if (isNaN(delay) || delay < 0.5) delay = 5;
		if (!color) color = message.channel.type === 'text' ? message.guild.me.displayColor : 0x7289da;

		message.channel.send({
			embed: {
				color: color,
				description: text,
				footer: {
					text: delMsg ? `This message will be self destructed in ${delay} minutes! You can delete it prematurely by pressing X.` : null,
				},
			},
		})
			.then(reply => {
				if (delMsg) {
					reply.react('❌')
						.then(() => {
							reply.awaitReactions((reaction, user) => reaction.emoji.name === '❌' && user.id !== message.client.user.id && ((message.guild && message.guild.members.cache.get(user.id).hasPermission(cfg.modPerm)) || user.id === message.author.id), {
								max: 1,
								time: delay * 60e3,
							})
								.then(() => {
									if (reply && !reply.deleted) {
										reply.delete()
											.catch(() => null);
									}
								});
						})
						.catch(e => {
							if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return message.channel.send(`${message.guild.owner}, i don't have permission to add reactions here!`);
							if (e.name === 'DiscordAPIError' || e.name === 'Error' && e.message === 'Unknown Message') return;
							message.client.logger.warn(e);
						});
				}
				resolve(reply);
			})
			.catch(e => {
				if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return message.guild && message.guild.owner.send(`${message.guild.owner}, i don't have permission to send messages in \`${message.guild.name} #${message.channel.name}\`!`);
				message.client.logger.warn(e);
			});
	});
};

const CON = require('../../src/const.json');
const cfg = require('../../src/config.js');
const replyExt = require('./replyExt.js');

module.exports = async function(message, text, { mention = true, del = true, delay = 5, color = CON.TEXTCLR.WARN, delMsg = true } = {}) {
	if (delMsg) {
		try {
			await message.react('❌');
			message.awaitReactions((reaction, user) => reaction.emoji.name === '❌' && user.id !== message.client.user.id && (user.id === message.author.id || (message.guild && message.guild.members.cache.get(user.id).hasPermission(cfg.modPerm))),
				{ max: 1, time: delay * 60e3 })
				.then(() => message.delete());
		}
		catch (e) {
			if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return message.channel.send(`${message.guild.owner}, i don't have permission to add reactions here!`);
		}
	}

	return replyExt(message, text, { mention, del, delay, color });
};

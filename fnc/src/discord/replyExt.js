const fnc = require(`${require.main.path}/fnc`);

module.exports = async function(message, text, { mention = true, delMsg = true, delay = 5, color } = {}) {
	if (!message) throw new TypeError('no message');
	if (!text) throw new TypeError('no text');
	if (typeof mention !== 'boolean') mention = true;
	if (mention) text = `${message.author}, ${text}`;
	if (text.length > 2048) text = text.substring(0, 2048);
	if (typeof delMsg !== 'boolean') delMsg = true;
	if (isNaN(delay) || delay < 0.5) delay = 5;
	if (!color) color = message.channel.type === 'text' ? message.guild.me.displayColor : 0x7289da;

	const reply = await message.channel.send({
		embed: {
			color: color,
			description: text,
			footer: {
				text: delMsg ? `This message will be self destructed in ${delay} minutes! You can delete it prematurely by pressing X.` : null,
			},
		},
	});
	if (delMsg) fnc.discord.delayDeleteMsg(reply, message.author, delay).catch(() => null);
	return reply;
};

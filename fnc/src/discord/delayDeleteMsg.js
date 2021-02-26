const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const client = require(`${require.main.path}/src/client.js`);

//reacts with X and deletes after a delay
module.exports = async function(message, author, { delay = 5 } = {}) {
	if (!message) throw new TypeError('no message');
	if (isNaN(delay) || delay < 0.5) delay = 5;
	if (message.deleted || message.channel.type !== 'text') return true;
	await message.react('❌');
	await message.awaitReactions(async (reaction, user) => {
		const member = await message.guild.members.fetch(user.id);
		return reaction.emoji.name === '❌'
		&& user.id !== client.user.id
		&& (user.id === author.id || fnc.guilds.getPerms(member) & CON.PERMLVL.MOD);
	},
	{
		max: 1,
		time: delay * 60e3,
	});
	if (message.deleted) return true;
	return await message.delete();
};

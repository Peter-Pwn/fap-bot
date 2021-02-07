const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	aliases: [],
	description: 'Removes a channel for the clan xp list.',
	args: 1,
	usage: '<#channel>',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.MOD,
	cooldown: 3,
	deleteMsg: true,
	execute(message, args) {
		return new Promise((resolve, reject) => {
			fnc.snowflakes.getChannel(message.client, args[0], message.guild.id)
				.then(channel => {
					fnc.channels.rem(message.client, channel, CON.CHTYPE.DIV2XP)
						.then(() => {
							fnc.replyExt(message, `${message.guild.channels.cache.get(channel)} was successfully removed.`);
							resolve();
						})
						.catch(e => {
							if (e.name === 'Warn') fnc.replyWarn(message, e.message);
							else fnc.replyWarn(message, 'there was an error.');
							reject(e);
						});
				})
				.catch(() => {
					fnc.replyWarn(message, `\`${args[0]}\` is not a discord channel.`);
					reject();
				});
		});
	},
};

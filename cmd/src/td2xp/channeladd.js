const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	aliases: [],
	description: 'Adds a channel for the clan xp list.',
	descriptionLong: 'Set [player count] or [weeks to keep] to -1 for unlimited.',
	args: 1,
	usage: '<#channel> [player count (default: -1)] [weeks to keep (default: -1)]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.MOD,
	cooldown: 3,
	deleteMsg: true,
	execute(message, args) {
		//fnc.channels.add(guildID, channelID, type, { param1 = null, param2 = null } );
		//param1 = top X
		//param2 = time to keep
		return new Promise((resolve, reject) => {
			fnc.snowflakes.getChannel(args[0], message.guild.id)
				.then(channel => {
					let pCount = parseInt(args[1]);
					if (!pCount || pCount < -1) pCount = -1;
					let kWeeks = parseInt(args[2]);
					if (!kWeeks || kWeeks < -1) kWeeks = -1;
					fnc.channels.add(message.guild.id, channel, CON.CHTYPE.DIV2XP, { param1: pCount, param2: kWeeks })
						.then(chan => {
							fnc.replyExt(message, `${message.guild.channels.cache.get(channel)} was successfully added.`);
							fnc.div2xp.populate(chan)
								.catch(() => null);
							resolve();
						})
						.catch(e => {
							fnc.replyWarn(message, 'there was an error.');
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

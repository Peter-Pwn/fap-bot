const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	aliases: [],
	description: 'Removes a uplay name from the clan xp list.',
	descriptionLong: '',
	args: 1,
	usage: '<uplay name>',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.MOD,
	cooldown: 3,
	deleteMsg: true,
	execute(message, args) {
		return new Promise((resolve, reject) => {
			fnc.div2xp.remMember(message.guild.id, args[0])
				.then(() => {
					fnc.replyExt(message, `\`${args[0]}\` was successfully removed.`);
					resolve();
				})
				.catch(e => {
					if (e.name === 'Warn') fnc.replyWarn(message, e.message);
					else fnc.replyWarn(message, 'there was an error.');
					reject(e);
				});
		});
	},
};

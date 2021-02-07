const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	aliases: [],
	description: 'Displays probably wrong uplay name from the clan xp list.',
	args: 0,
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.MOD,
	cooldown: 3,
	deleteMsg: true,
	execute(message) {
		return new Promise((resolve, reject) => {
			fnc.div2xp.getFailedMem(message.client, message.guild.id)
				.then(members => {
					let text = '';
					const promises = [];
					if (members.length === 0) {
						text = 'all uplay names are valid.';
					}
					else {
						text = 'these uplay names could not be queried:';
						for (const member of members) {
							promises.push(message.guild.members.fetch(member.memberID)
								.then(disMember => text += `\n${member.uplayName} (${disMember})`)
								.catch(() => null),
							);
						}
					}
					Promise.allSettled(promises)
						.then(() => {
							fnc.replyExt(message, text);
							resolve();
						});
				})
				.catch(e => {
					fnc.replyWarn(message, 'there was an error.');
					reject(e);
				});
		});
	},
};

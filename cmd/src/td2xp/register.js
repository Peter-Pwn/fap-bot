const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	aliases: [],
	description: 'Register a uplay name to the clan xp list.',
	descriptionLong: 'You can provide multible pairs of users.',
	args: 2,
	usage: '<uplay name> <@discord user> ... [uplay name] [@discord user]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.MOD,
	cooldown: 3,
	deleteMsg: true,
	execute(message, args) {
		return new Promise((resolve, reject) => {
			if (args.length % 2) {
				fnc.replyWarn(message, 'you didn\'t provide enoght arguments.');
				return reject();
			}
			const promises = [];
			for (let i = 0; i < args.length; i += 2) {
				promises.push(new Promise((resolve, reject) => {
					fnc.snowflakes.getUser(args[i + 1], message.guild.id)
						.then(user => {
							fnc.div2xp.addMember(message.guild.id, user, args[i])
								.then(() => resolve(`\`${args[i]}\` was successfully registered.`))
								.catch(e => reject(e.message));
						})
						.catch(e => reject(e.message));
				}));
			}
			Promise.allSettled(promises)
				.then(results => {
					if (results.some(e => e.reason)) {
						fnc.replyWarn(message, results.reduce((a, b) => (a && a + '\n') + (b.value || b.reason), ''));
						reject();
					}
					else {
						fnc.replyExt(message, results.reduce((a, b) => (a && a + '\n') + (b.value || b.reason), ''));
						resolve();
					}
				});
		});
	},
};

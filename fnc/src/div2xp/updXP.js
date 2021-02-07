const Sequelize = require('sequelize');
const moment = require('moment');

const CON = require(`${require.main.path}/src/const.json`);

//const Warn = require(`${require.main.path}/fnc/src/Warn.js`);
const getUplayData = require(`${require.main.path}/fnc/src/div2xp/getUplayData.js`);
const getResetDay = require(`${require.main.path}/fnc/src/div2xp/getResetDay.js`);

//updates all div2xp of members of a guild
module.exports = function(client) {
	return new Promise((resolve, reject) => {
		const lastUpdate = moment();
		client.db.div2xp.findAll({
			where: { failed: { [Sequelize.Op.lt]: CON.DIV2XPMFAILS } },
		})
			.then(members => {
				const receives = [];
				for (const member of members) {
					receives.push(getUplayData(member.uplayName)
						.then(data => {
							member.cXP = parseInt(data.segments[0].stats.xPClan.value);
							member.lastUpdate = lastUpdate;
							member.failed = 0;
							if (member.lastSnapshot.isBefore(getResetDay())) {
								member.cXPSnapshot = member.cXP;
								member.lastSnapshot = member.lastUpdate;
							}
							member.save()
								.catch(e => reject(e));
						})
						.catch(e => {
							if (e.name === 'UplayDataError' && e.status === 400) {
								member.failed++;
								member.save()
									.catch(() => null);
							}
							else if (e.name === 'UplayDataError') {
								client.logger.warn(`UplayDataError:\n${e.message}`);
							}
							else {
								return reject(e);
							}
						}));
				}
				Promise.allSettled(receives)
					.then(() => {
						resolve();
					});
			})
			.catch(e => reject(e));
	});
};

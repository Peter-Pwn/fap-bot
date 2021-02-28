const moment = require('moment');

const fnc = require(`${require.main.path}/fnc`);

const logger = require(`${require.main.path}/src/logger.js`);
const db = require(`${require.main.path}/src/db.js`);


//updates all div2xp of members of a guild
module.exports = async function() {
	const lastUpdate = moment();
	const members = await db.div2xp.findAll();
	for (const member of members) {
		try {
			const data = await fnc.div2xp.getUplayData(member.uplayName);
			member.cXP = parseInt(data.segments[0].stats.xPClan.value);
			member.lastUpdate = lastUpdate;
			member.failed = 0;
			if (member.lastSnapshot.isBefore(fnc.div2xp.getResetDay())) {
				member.cXPSnapshot = member.cXP;
				member.lastSnapshot = member.lastUpdate;
			}
			member.save();
		}
		catch (e) {
			if (e.name === 'UplayDataError' && e.status === 400) {
				member.failed++;
				if (member.failed > 100) member.failed = 100;
				member.save();
			}
			else if (e.name === 'UplayDataError') {
				logger.warn(`UplayDataError:\n${e.message}`);
			}
			else {
				throw e;
			}
		}
	}
	return true;
};

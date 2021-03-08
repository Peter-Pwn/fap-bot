const moment = require('moment');

const fnc = require(`${require.main.path}/fnc`);

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);
const db = require(`${require.main.path}/src/db.js`);


//updates all div2xp of members of a guild
module.exports = async function() {
	const lastUpdate = moment();
	const rstDay = fnc.div2xp.getResetDay();
	const members = await db.div2xp.findAll();
	//if reset, emit event
	if (members.reduce((a, b) => moment(b.lastSnapshot).isBefore(a) && b.failed === 0 && moment(b.lastSnapshot) || moment(a)).isBefore(rstDay)) {
		client.emit('div2xpUpdate', members.flatMap(v => v.lastSnapshot.isBefore(rstDay) && v.get({ plain: true }) || []));
	}
	for (const member of members) {
		try {
			const data = await fnc.div2xp.getUplayData(member.uplayName);
			member.cXP = parseInt(data.segments[0].stats.xPClan.value);
			member.lastUpdate = lastUpdate;
			member.failed = 0;
			if (member.lastSnapshot.isBefore(rstDay)) {
				member.cXPSnapshot = member.cXP;
				member.lastSnapshot = member.lastUpdate;
			}
			else if (member.cXP - member.cXPSnapshot < 0) {
				member.cXPSnapshot = 0;
				member.lastSnapshot = member.lastUpdate;
			}
			member.save();
		}
		catch (e) {
			if (e.name === 'UplayDataError' && e.status === 400) {
				if (member.failed < 100) member.failed++;
				member.save();
				continue;
			}
			else if (e.name === 'UplayDataError') {
				logger.warn(`UplayDataError:\n${e.message}`);
				continue;
			}
			throw e;
		}
	}
	return true;
};

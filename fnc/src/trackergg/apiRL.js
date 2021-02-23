const moment = require('moment');

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const trackerggApiCD = {
	count: 0,
	time: moment(),
	queue: [],
};

module.exports = async function(func, args = []) {
	if (func) trackerggApiCD.queue.push([func, args]);
	const now = moment();
	if (trackerggApiCD.time.isSameOrBefore(now.clone().subtract(CON.DIV2XPLIMIT.INTIME))) {
		trackerggApiCD.count = 0;
		trackerggApiCD.time = now;
	}
	if (trackerggApiCD.count++ < CON.DIV2XPLIMIT.MAXCALLS) {
		const f = trackerggApiCD.queue.shift();
		if (!f) return false;
		return await f[0].apply(null, f[1]);
	}
	else {
		await fnc.wait(CON.DIV2XPLIMIT.INTIME - now.diff(trackerggApiCD.time));
		return await module.exports();
	}
};

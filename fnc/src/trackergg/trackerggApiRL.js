const CON = require(`${require.main.path}/src/const.json`);

const moment = require('moment');

const trackerggApiCD = {
	count: 0,
	time: moment(),
	queue: [],
};

module.exports = function(func = null, args = []) {
	return new Promise((resolve, reject) => {
		if (func) trackerggApiCD.queue.push([func, args]);
		const now = moment();
		if (trackerggApiCD.time.isSameOrBefore(now.subtract(CON.DIV2XPLIMIT.INTIME))) {
			trackerggApiCD.count = 0;
			trackerggApiCD.time = now;
		}
		if (trackerggApiCD.count++ < CON.DIV2XPLIMIT.MAXCALLS) {
			const f = trackerggApiCD.queue.shift();
			if (f) {
				f[0].apply(null, f[1])
					.then(r => resolve(r))
					.catch(e => reject(e));
			}
		}
		else {
			setTimeout(() => {
				module.exports()
					.then(r => resolve(r))
					.catch(e => reject(e));
			}, CON.DIV2XPLIMIT.INTIME - now.diff(trackerggApiCD.time));
		}
	});
};

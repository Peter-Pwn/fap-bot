const axios = require('axios');
const moment = require('moment');

const CON = require(`${require.main.path}/src/const.json`);
const cfg = require(`${require.main.path}/src/config.js`);

const fnc = require(`${require.main.path}/fnc`);

const trnApiCD = {
	remaining: CON.DIV2XPLIMIT.MAXCALLS,
	limit: CON.DIV2XPLIMIT.MAXCALLS,
	time: moment(),
	queue: [],
};
const trnWeb = axios.create({
	baseURL: 'https://public-api.tracker.gg/v2/',
	headers: { 'TRN-Api-Key': cfg.trnKey },
});

module.exports = async function(query) {
	if (query) trnApiCD.queue.push(query);
	const now = moment();
	if (trnApiCD.time.isSameOrBefore(now.clone().subtract(CON.DIV2XPLIMIT.TIME))) {
		trnApiCD.remaining = trnApiCD.limit;
		trnApiCD.time = now;
	}
	if (trnApiCD.remaining-- > 0) {
		const q = trnApiCD.queue.shift();
		if (!q) return false;
		try {
			const response = await trnWeb.get(q);
			if (!response || response.status !== 200) {
				const error = new Error();
				error.response = {};
				error.response.status = response && response.status || 0;
				throw error;
			}
			if (response.headers['x-ratelimit-limit-minute']) trnApiCD.limit = parseInt(response.headers['x-ratelimit-limit-minute']);
			if (response.headers['x-ratelimit-remaining-minute']) trnApiCD.remaining = parseInt(response.headers['x-ratelimit-remaining-minute']);
			return response;
		}
		catch (e) {
			//should we still hit the limit, retry after the timelimit
			if (e.response && e.response.status === 429) {
				await fnc.wait(CON.DIV2XPLIMIT.TIME);
				return await module.exports(q);
			}
			throw e;
		}
	}
	else {
		await fnc.wait(CON.DIV2XPLIMIT.TIME - now.diff(trnApiCD.time));
		return await module.exports();
	}
};

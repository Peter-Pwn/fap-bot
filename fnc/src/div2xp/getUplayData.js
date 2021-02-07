const axios = require('axios');

const trackerggApiRL = require(`${require.main.path}/fnc/src/trackergg/trackerggApiRL.js`);

//gets Division2 data of a uplayName from the web
const _getUplayData = function(uplayName) {
	return new Promise((resolve, reject) => {
		axios.get(`https://api.tracker.gg/api/v2/division-2/standard/profile/uplay/${uplayName}`)
			.then(response => {
				if (!response || response.status !== 200 || response.data.data.segments.length <= 0) {
					const error = new Error();
					error.response = {};
					error.response.status = response && response.status || 0;
					throw error;
				}
				resolve(response.data.data);
			})
			.catch(e => {
				const error = new Error();
				error.name = 'UplayDataError';
				error.status = e.response && e.response.status || 0;
				switch (error.status) {
				case 400:
					error.message = `uplay name \`${uplayName}\` not found.`;
					break;
				case 401:
					error.message = 'API key invalid.';
					break;
				case 429:
					error.message = 'rate limit reached.';
					break;
				case 451:
					error.message = 'invalid parameters supplied.';
					break;
				case 503:
					error.message = 'the request has been stopped.';
					break;
				default:
					error.message = 'request failed.';
				}
				reject(error);
			});
	});
};

module.exports = function(uplayName) {
	return new Promise((resolve, reject) => {
		trackerggApiRL(_getUplayData, [uplayName])
			.then(r => resolve(r))
			.catch(e => reject(e));
	});
};

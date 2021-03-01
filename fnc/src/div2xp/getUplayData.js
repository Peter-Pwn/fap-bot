const fnc = require(`${require.main.path}/fnc`);

//gets Division2 data of a uplayName from the web
module.exports = async function(uplayName) {
	if (!uplayName) throw new TypeError('no uplayName');
	try {
		const response = await fnc.trackergg.apiCall(`division-2/standard/profile/uplay/${uplayName}`);
		if (!response || response.status !== 200 || response.data.data.segments.length <= 0) {
			const error = new Error();
			error.response = {};
			error.response.status = response && response.status || 0;
			throw error;
		}
		return response.data.data;
	}
	catch (e) {
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
			error.message = `the request has been stopped. (\`${uplayName}\`)`;
			//error.message = e.response && e.response.data || 'the request has been stopped.';
			break;
		default:
			error.message = 'request failed.';
		}
		throw error;
	}
};

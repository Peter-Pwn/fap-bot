const client = require(`${require.main.path}/src/client.js`);

const fnc = require(`${require.main.path}/fnc`);

//fetches a message in a channel
module.exports = async function(channel, message) {
	if (!channel) throw new TypeError('no channel');
	if (!message) throw new TypeError('no message');
	try {
		const disChl = await client.channels.fetch(channel);
		const disMsg = await disChl.messages.fetch(message);
		return disMsg;
	}
	catch (e) {
		throw fnc.Warn('message not found.');
	}
};

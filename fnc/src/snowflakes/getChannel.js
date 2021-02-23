const fnc = require(`${require.main.path}/fnc`);

const client = require(`${require.main.path}/src/client.js`);

//checks if the given parameter is a channel name or snowflake and returns the discord channels snowflake
module.exports = async function(channel, guild = null) {
	if (!channel) throw new TypeError('no channel');
	//<#718051019996528755>
	try {
		let snowflake = null;
		if (parseInt(channel) > 0) {
			snowflake = channel;
		}
		else {
			const mention = channel.match(/^<(?:#(\d+))>$/);
			if (mention) {
				snowflake = mention[1];
			}
			else if (guild) {
				channel = channel.replace(/^#/, '');
				const g = await client.guilds.fetch(guild);
				const c = g.channels.cache.find(cf => cf.name === channel);
				if (c) snowflake = c.id;
			}
		}
		if (!snowflake || !await client.channels.fetch(snowflake)) throw null;
		return snowflake;
	}
	catch (e) {
		throw fnc.Warn('channel not found.');
	}
};

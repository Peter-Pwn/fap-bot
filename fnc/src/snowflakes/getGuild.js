const fnc = require(`${require.main.path}/fnc`);

const client = require(`${require.main.path}/src/client.js`);

//checks if the given parameter is a guild name or snowflake and returns the discord guilds snowflake
module.exports = async function(guild) {
	//<#718051019996528755>
	try {
		let snowflake = null;
		if (parseInt(guild) > 0) {
			snowflake = guild;
		}
		else {
			const g = client.guilds.cache.find(gf => gf.name === guild);
			if (g) snowflake = g.id;
		}
		if (!snowflake || !await client.guilds.fetch(snowflake)) throw null;
		return snowflake;
	}
	catch (e) {
		throw fnc.Warn('guild not found.');
	}
};

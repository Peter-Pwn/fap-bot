const client = require(`${require.main.path}/src/client.js`);

const Warn = require(`${require.main.path}/fnc/src/Warn.js`);

//checks if the given parameter is a guild name or snowflake and returns the discord guilds snowflake
module.exports = function(guild) {
	return new Promise((resolve, reject) => {
		//<#718051019996528755>
		let snowflake = null;
		if (parseInt(guild) > 0) {
			snowflake = guild;
		}
		else {
			const g = client.guilds.cache.find(gf => gf.name === guild);
			if (g) snowflake = g.id;
		}
		if (snowflake) {
			client.guilds.fetch(snowflake)
				.then(() => resolve(snowflake))
				.catch(() => reject(Warn('guild not found.')));
		}
		else {
			reject(Warn('guild not found.'));
		}
	});
};

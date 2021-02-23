const fnc = require(`${require.main.path}/fnc`);

const client = require(`${require.main.path}/src/client.js`);

//checks if the given parameter is a role name or snowflake and returns the discord roles snowflake
module.exports = async function(role, guild) {
	if (!role) throw new TypeError('no role');
	if (!guild) throw new TypeError('no guild');
	//<@&718051019996528755>
	try {
		let snowflake = null;
		if (parseInt(role) > 0) {
			snowflake = role;
		}
		else {
			const mention = role.match(/^<(?:@&(\d+))>$/);
			if (mention) {
				snowflake = mention[1];
			}
			else {
				const g = await client.guilds.fetch(guild);
				role = role.replace(/^@/, '');
				const r = g.roles.cache.find(rf => rf.name === role);
				if (r) snowflake = r.id;
			}
		}
		if (!snowflake || !await client.guilds.fetch(guild) || !await client.guilds.cache.get(guild).roles.fetch(snowflake)) throw null;
		return snowflake;
	}
	catch (e) {
		throw fnc.Warn('role not found.');
	}
};

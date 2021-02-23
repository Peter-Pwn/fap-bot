const fnc = require(`${require.main.path}/fnc`);

const client = require(`${require.main.path}/src/client.js`);

//checks if the given parameter is a username or snowflake and returns the discord users snowflake
module.exports = async function(user, guild = null) {
	if (!user) throw new TypeError('no user');
	//<@!578580428349505536>
	try {
		let snowflake = null;
		if (parseInt(user) > 0) {
			snowflake = user;
		}
		else {
			const mention = user.match(/^<(?:@!?(\d+))>$/);
			if (mention) {
				snowflake = mention[1];
			}
			else {
				user = user.replace(/^@/, '');
				const tag = user.match(/^.+#\d{4}$/);
				if (tag) {
					const u = client.users.cache.find(uf => uf.tag === user);
					if (u) snowflake = u.id;
				}
				if (!snowflake && guild) {
					const g = await client.guilds.fetch(guild);
					await g.members.fetch({ query: user });
					const u = g.members.cache.find(uf => uf.displayName === user);
					if (u) snowflake = u.id;
				}
				if (!snowflake) {
					const u = client.users.cache.find(uf => uf.username === user);
					if (u) snowflake = u.id;
				}
			}
		}
		if (!snowflake || !await client.users.fetch(snowflake)) throw null;
		return snowflake;
	}
	catch (e) {
		throw fnc.Warn('user not found.');
	}
};

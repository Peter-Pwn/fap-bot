const client = require(`${require.main.path}/src/client.js`);
const db = require(`${require.main.path}/src/db.js`);

const guildCfg = require(`${require.main.path}/src/guildCfg.js`);

module.exports = async function() {
	const guilds = await db.guilds.findAll({ include: ['perms'] });
	for (const guild of guilds) {
		try {
			await client.guilds.fetch(guild.guildID);
			guildCfg.set(guild.guildID, guild.get({ plain: true }));
		}
		catch (e) {
			await guild.destroy();
			continue;
		}
	}
};

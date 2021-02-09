const client = require(`${require.main.path}/src/client.js`);

const cfg = require(`${require.main.path}/src/config.js`);

module.exports = function(guild = null) {
	return guild && client.guildCfg.has(guild.id) && client.guildCfg.get(guild.id).prefix || cfg.prefix;
};

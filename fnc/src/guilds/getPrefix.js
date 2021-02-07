const cfg = require(`${require.main.path}/src/config.js`);

module.exports = function(guild = null) {
	return guild && guild.client.guildCfg.has(guild.id) && guild.client.guildCfg.get(guild.id).prefix || cfg.prefix;
};

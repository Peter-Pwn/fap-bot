const cfg = require(`${require.main.path}/src/config.js`);

const guildCfg = require(`${require.main.path}/src/guildCfg.js`);

module.exports = function(guild = null) {
	return guild && guildCfg.has(guild.id) && guildCfg.get(guild.id).prefix || cfg.prefix;
};

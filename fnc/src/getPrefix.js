const cfg = require('../../src/config.js');

module.exports = function(guild) {
	return guild && guild.client.guildCfg.has(guild.id) ? guild.client.guildCfg.get(guild.id).prefix : cfg.prefix;
};

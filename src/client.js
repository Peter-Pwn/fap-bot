const Discord = require('discord.js');

const cfg = require(`${require.main.path}/src/config.js`);

//https://discord.js.org/#/docs/main/stable/class/ClientUser?scrollTo=setPresence
const client = new Discord.Client({
	presence: cfg.presence,
	partials: ['MESSAGE', 'REACTION'],
});

module.exports = client;

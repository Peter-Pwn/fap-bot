const Discord = require('discord.js');
const Sequelize = require('sequelize');
const winston = require('winston');
//require('winston-daily-rotate-file');

const CON = require('./const.json');
const cfg = require('./config.js');
const fnc = require('../fnc');

const client = new Discord.Client();
//create DB connection
const sequelize = new Sequelize(cfg.db_URI, { logging: false });
//create logger
/*
new winston.transports.DailyRotateFile({
	dirname: cfg.logDir,
	filename: `${cfg.appName}-%DATE%.log`,
	datePattern: 'YYYY-MM',
	level: 'warn',
}),
*/
client.logger = winston.createLogger({
	transports: [
		new winston.transports.Console(),
	],
	format: winston.format.printf(info => `[${info.level.toUpperCase()}] ${(info instanceof Error) ? info.stack : info.message}`),
});

client.commands = require('../cmd');
client.db = require('../tbl')(sequelize);

const cooldowns = new Discord.Collection();
client.locks = new Discord.Collection();
client.welcomeReacts = new Discord.Collection();

client.on('message', message => {
	//handle commands send to the bot
	//TODO: guild prefix
	if (!message.content.startsWith(cfg.prefix) || message.author.bot) return;

	//split args by spaces, but not between quotes
	const args = Array.from(message.content.slice(cfg.prefix.length).matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|([^ ]+)/g), g => g[1] || g[2]);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;

	//check permissions and handle special channel type stuff
	if (command.permLvl === CON.PERMLVL.OWNER && !cfg.owners.includes(message.author.id)) return;

	if (message.channel.type === 'text' && command.msgType & CON.MSGTYPE.TEXT) {
		if (command.deleteMsg === true)	message.delete();
		if (!(fnc.getPerms(message.member) & command.permLvl)) return fnc.replyExt(message, 'you don\'t have the permission to use this command', { color: CON.TEXTCLR.WARN });
	}
	else if (message.channel.type === 'dm' && command.msgType & CON.MSGTYPE.DM) {
		//DM stuff
	}
	else {
		return;
	}

	//check for args count
	if (command.args && args.length < command.args) {
		let reply = 'you didn\'t provide enoght arguments.';
		if (command.usage) reply += `\n\`Usage:\` ${cfg.prefix}${commandName} ${command.usage}\nRequired Arguments are marked with < >, optional with [ ].\nUse quotes to commit arguments containg spaces. E.g. \`${cfg.prefix}lock "channel name"\``;
		return fnc.replyExt(message, reply, { color: CON.TEXTCLR.WARN });
	}

	//check cooldown
	if (!cooldowns.has(command.name))	cooldowns.set(command.name, new Discord.Collection());
	const timestamps = cooldowns.get(command.name);
	const cooldown = command.cooldown * 1000;
	const now = Date.now();
	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id);
		if (now < expirationTime) return fnc.replyExt(message, `please wait ${Math.ceil((expirationTime - now) / 1000)} more second(s) before reusing ${commandName}`, { color: CON.TEXTCLR.WARN });
	}
	timestamps.set(message.author.id, now + cooldown);
	client.setTimeout(() => timestamps.delete(message.author.id), cooldown);

	//execute the command
	try {
		command.execute(message, args);
	}
	catch (e) {
		client.logger.error(`Couldn't execute command ${command.name}:\n${e.stack}`);
	}
});

client.on('messageReactionAdd', (reaction, user) => {
	//handle role assignment on reactions
	if (client.welcomeReacts.has(reaction.message.id)) {
		const react = client.welcomeReacts.get(reaction.message.id).get(reaction.emoji.id || reaction.emoji.name);
		if (react) reaction.message.guild.members.cache.get(user.id).roles.add(reaction.message.guild.roles.cache.get(react.roleID));
	}
});

client.on('messageReactionRemove', (reaction, user) => {
	//handle role assignment on reactions
	if (client.welcomeReacts.has(reaction.message.id)) {
		const react = client.welcomeReacts.get(reaction.message.id).get(reaction.emoji.id || reaction.emoji.name);
		if (react) reaction.message.guild.members.cache.get(user.id).roles.remove(reaction.message.guild.roles.cache.get(react.roleID));
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	//handle auto unlock of voice channels
	if (oldState.channelID && oldState.channelID !== newState.channelID && client.locks.has(oldState.channelID)) {
		const lock = client.locks.get(oldState.channelID);
		if (oldState.member.id === lock.memberID && !lock.permanent) {
			oldState.channel.setUserLimit(lock.limit);
			client.db.locks.destroy({ where: { channelID: oldState.channelID } });
			client.locks.delete(oldState.channelID);
		}
	}
});

client.once('ready', async () => {
	//if set, set your presence
	if (cfg.presence) client.user.setPresence(cfg.presence);

	//sync the db model
	//client.db.test.sync({ force: true });
	Object.getOwnPropertyNames(client.db).forEach(async tbl => await client.db[tbl].sync());

	//get locks from db
	await client.db.locks.findAll().then(locks => locks.forEach(lock => client.locks.set(lock.channelID, lock)));

	//get welcome messages and reactions from db
	await client.db.welcomeMsgs.findAll().then(msgs => msgs.forEach(async msg => {
		try {
			const message = await client.channels.fetch(msg.channelID).then(async channel => await channel.messages.fetch(msg.messageID));
			if (msg.cmdList) msg.text += fnc.getCmdList(client, 'text', CON.PERMLVL.EVERYONE).reduce((txt, cmd) => txt + `\n● \`${cfg.prefix}${cmd[0]}\` ${cmd[1]}`, '');
			await message.edit(msg.text);
		}
		catch (e) {
			await client.db.welcomeReacts.destroy({ where: { messagelID: msg.messageID } });
			await msg.destroy();
		}
	}));
	await client.db.welcomeReacts.findAll().then(reacts => reacts.forEach(react => {
		if (!client.welcomeReacts.has(react.messagelID)) client.welcomeReacts.set(react.messagelID, new Discord.Collection());
		client.welcomeReacts.get(react.messagelID).set(react.emojiID, react);
	}));

	client.logger.info(`${cfg.appName} is ready`);
});

//handle errors
client.on('debug', e => client.logger.debug(e));
client.on('warn', e => client.logger.warn(e));
client.on('error', e => {
	if (client) {
		client.logger.error('discordError:\n' + e.stack);
		client.destroy();
	}
	else {
		console.error('[ERROR] discordError:\n', e);
	}
});
process.on('unhandledRejection', e => {
	if (client) {
		if (e.name === 'DiscordAPIError: Missing Access' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return client.logger.warn('Missing Permissions:\n' + e.stack);
		client.logger.error('unhandledRejection:\n' + e.stack);
		client.destroy();
	}
	else {
		console.error('[ERROR] unhandledRejection:\n', e);
	}
});
process.on('uncaughtException', e => {
	if (client) {
		client.logger.error('uncaughtException:\n' + e.stack);
		client.destroy();
	}
	else {
		console.error('[ERROR] uncaughtException:\n', e);
	}
});

//clean logout if bot gets terminated
process.on('SIGINT', () => {
	if (client) client.destroy();
});

//connect to discord
client.login(cfg.token);

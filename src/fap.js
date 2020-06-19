const Discord = require('discord.js');
const Sequelize = require('sequelize');
const winston = require('winston');
require('winston-daily-rotate-file');

const CON = require('./const.json');
const cfg = require('./config.json');
const fnc = require('../fnc');

const client = new Discord.Client();
const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: './db/database.sqlite',
});
client.logger = winston.createLogger({
	transports: [
		new winston.transports.Console(),
		new winston.transports.DailyRotateFile({
			dirname: cfg.logDir,
			filename: `${cfg.appName}-%DATE%.log`,
			datePattern: 'YYYY-MM',
			level: 'warn',
		}),
	],
	format: winston.format.printf(info => `[${info.level.toUpperCase()}] ${new Date().toISOString()} - ${(info instanceof Error) ? info.stack : info.message}`),
});

client.commands = require('../cmd');
client.db = require('../tbl')(sequelize);

const cooldowns = new Discord.Collection();
client.locks = new Discord.Collection();
client.welcomeReacts = new Discord.Collection();

client.on('message', message => {
	//TODO: guild prefix
	if (!message.content.startsWith(cfg.prefix) || message.author.bot) return;

	const args = Array.from(message.content.slice(cfg.prefix.length).matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|([^ ]+)/g), g => g[1] || g[2]);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;

	if (command.permLvl === CON.PERMLVL.OWNER && !cfg.owners.includes(message.author.id)) return;

	if (message.channel.type === 'text' && (command.msgType & CON.MSGTYPE.TEXT || typeof command.msgType === 'undefined')) {
		if (command.deleteMsg === true || typeof command.deleteMsg === 'undefined')	message.delete();
		if (!(fnc.getPerms(message.member) & command.permLvl)) return fnc.replyExt(message, 'you don\'t have the permission to use this command');
	}
	else if (message.channel.type === 'dm' && command.msgType & CON.MSGTYPE.DM) {
		//DM stuff
	}
	else {
		return;
	}

	if (command.args && args.length < command.args) {
		let reply = 'you didn\'t provide enoght arguments.';
		if (command.usage) reply += `\n\`Usage:\` ${cfg.prefix}${commandName} ${command.usage}\nRequired Arguments are marked with < >, optional with [ ].\nUse quotes to commit arguments containg spaces. E.g. \`${cfg.prefix}lock "channel name"\``;
		return fnc.replyExt(message, reply);
	}

	if (!cooldowns.has(command.name))	cooldowns.set(command.name, new Discord.Collection());
	const timestamps = cooldowns.get(command.name);
	const cooldown = (command.cooldown || 3) * 1000;
	const now = Date.now();
	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id);
		if (now < expirationTime) return fnc.replyExt(message, `please wait ${((expirationTime - now) / 1000).ceil()} more second(s) before reusing ${commandName}`);
	}
	timestamps.set(message.author.id, now + cooldown);
	client.setTimeout(() => timestamps.delete(message.author.id), cooldown);

	try {
		command.execute(message, args);
	}
	catch (e) {
		client.logger.error(`Couldn't execute command ${command.name}:\n${e.stack}`);
	}
});

client.on('messageReactionAdd', (reaction, user) => {
	if (client.welcomeReacts.has(reaction.message.id)) {
		const react = client.welcomeReacts.get(reaction.message.id).get(reaction.emoji.id || reaction.emoji.name);
		if (react) reaction.message.guild.members.cache.get(user.id).roles.add(reaction.message.guild.roles.cache.get(react.roleID));
	}
});

client.on('messageReactionRemove', (reaction, user) => {
	if (client.welcomeReacts.has(reaction.message.id)) {
		const react = client.welcomeReacts.get(reaction.message.id).get(reaction.emoji.id || reaction.emoji.name);
		if (react) reaction.message.guild.members.cache.get(user.id).roles.remove(reaction.message.guild.roles.cache.get(react.roleID));
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
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
	//client.user.setPresence({ status: 'invisible' });

	//client.db.test.sync({ force: true });
	Object.getOwnPropertyNames(client.db).forEach(async tbl => await client.db[tbl].sync());

	await client.db.locks.findAll().then(locks => locks.forEach(lock => client.locks.set(lock.channelID, lock)));

	await client.db.welcomeMsgs.findAll().then(msgs => msgs.forEach(async msg => {
		try {
			const message = await client.channels.fetch(msg.channelID).then(async channel => await channel.messages.fetch(msg.messageID));
			if (msg.cmdList) msg.text += '\n' + fnc.getCmdList(client, 'text', CON.PERMLVL.EVERYONE).reduce((txt, cmd) => txt + `● \`${cfg.prefix}${cmd[0]}\` ${cmd[1]}\n`, '');
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

client.on('debug', e => client.logger.debug(e));
client.on('warn', e => client.logger.warn(e));
client.on('error', e => {
	if (client) {
		client.logger.error('discordError:\n' + e.stack);
		client.destroy();
	}
	else {
		console.error('discordError:\n', e);
	}
});
process.on('unhandledRejection', e => {
	if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions') client.logger.warn('Missing Permissions\n:' + e.stack);
	if (client) {
		client.logger.error('unhandledRejection:\n' + e.stack);
		client.destroy();
	}
	else {
		console.error('unhandledRejection:\n', e);
	}
});
process.on('uncaughtException', e => {
	if (client) {
		client.logger.error('uncaughtException:\n' + e.stack);
		client.destroy();
	}
	else {
		console.error('uncaughtException:\n', e);
	}
});

process.on('SIGINT', () => {
	if (client) client.destroy();
});

client.login(cfg.token);

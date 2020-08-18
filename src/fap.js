const Discord = require('discord.js');
const Sequelize = require('sequelize');
const winston = require('winston');
//require('winston-mail');
//no file logging for now require('winston-daily-rotate-file');
const moment = require('moment');

const CON = require('./const.json');
const cfg = require('./config.js');
const fnc = require('../fnc');
const rnx = require('../rnx');

moment.suppressDeprecationWarnings = !cfg.debug;

//create discord client https://discord.js.org/#/docs/main/stable/class/ClientUser?scrollTo=setPresence
const client = new Discord.Client({ presence: cfg.presence, partials: ['MESSAGE', 'REACTION'] });
//create DB connection
const sequelize = new Sequelize(cfg.db_URI, { logging: false });
//create logger
client.logger = winston.createLogger({
	transports: [
		new winston.transports.Console(),
		/*new winston.transports.Mail({
			level: 'error',

			to: '',
			from: '',
			host: '',
			port: ,
			username: '',
			password: '',
			subject: '{{level}} {{msg}})',
			tls: { ciphers: 'SSLv3' },
			html: false,

		}),*/
		/*no file logging for now
		new winston.transports.DailyRotateFile({
			level: 'warn',
			dirname: cfg.logDir,
			filename: `${cfg.appName}-%DATE%.log`,
			datePattern: 'YYYY-MM',
		}),*/
	],
	format: winston.format.printf(info => `[${info.level.toUpperCase()}] ${(info instanceof Error) ? info.stack : info.message}`),
});

client.db = require('../tbl')(sequelize);
//sequelize.sync();

client.commands = require('../cmd');

client.guildCfg = new Discord.Collection();

client.reacts = new Discord.Collection();
client.welcomeReacts = new Discord.Collection();
client.raids = new Discord.Collection();

const cooldowns = new Discord.Collection();
client.timeouts = [];
client.locks = new Discord.Collection();

client.on('message', async message => {
	//handle commands send to the bot
	if (message.partial && !(await message.fetch().catch(e => client.logger.warn(`Error fetching message:\n${e.stack}`) && null))) return;

	if (message.author.bot) return;

	//TODO: mention other bot prefixes
	const prefix = fnc.getPrefix(message.guild);
	if (!message.content.startsWith(prefix)) return;

	//split args by spaces, but not between quotes, escapes are possible
	const args = Array.from(message.content.slice(prefix.length).matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|([^ ]+)/g), g => g[1] || g[2]);
	if (args.length === 0) return;
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
		if (command.usage) reply += `\n\`Usage:\` ${prefix}${commandName} ${command.usage}\nRequired Arguments are marked with < >, optional with [ ].\nUse quotes to commit arguments containg spaces. E.g. \`${prefix}lock "channel name"\``;
		return fnc.replyExt(message, reply, { color: CON.TEXTCLR.WARN });
	}

	//check cooldown
	//TODO: do a rework
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
		return client.logger.error(`Couldn't execute command ${command.name}:\n${e.stack}`);
	}
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.bot) return;
	if (reaction.partial && !(await reaction.fetch().catch(e => client.logger.warn(`Error fetching reaction:\n${e.stack}`) && null))) return;

	try {
		if (client.reacts.has(reaction.message.id)) client.reacts.get(reaction.message.id).add(reaction, user);
	}
	catch (e) {
		return client.logger.error(`Couldn't execute reaction:\n${e.stack}`);
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (user.bot) return;
	if (reaction.partial && !(await reaction.fetch().catch(e => client.logger.warn(`Error fetching reaction:\n${e.stack}`) && null))) return;

	try {
		if (client.reacts.has(reaction.message.id)) client.reacts.get(reaction.message.id).remove(reaction, user);
	}
	catch (e) {
		return client.logger.error(`Couldn't execute reaction:\n${e.stack}`);
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	//handle auto unlock of voice channels
	if (oldState.channelID && oldState.channelID !== newState.channelID && client.locks.has(oldState.channelID)) {
		const lock = client.locks.get(oldState.channelID);
		//unlock if user left the channel -> if (oldState.member.id === lock.memberID && !lock.permanent) {
		//unlock if all users left the channel
		if (oldState.channel.members.size === 0 && !lock.permanent && oldState.channel.editable) {
			oldState.channel.setUserLimit(lock.limit);
			client.db.locks.destroy({ where: { channelID: oldState.channelID } });
			client.locks.delete(oldState.channelID);
		}
	}
});

client.on('mainInterval', (init = false) => {
	//clear pending timeouts
	client.timeouts.forEach(t => client.clearTimeout(t));

	//look for upcoming raids in the next CON.MAININTVL and set a timeout to notify
	client.raids.filter(r => r.time.isBefore(moment().add(CON.MAININTVL))).forEach(async r => {
		//delete from db if raid message is gone
		if (!(await client.channels.fetch(r.channelID || '0').then(async channel => await channel.messages.fetch(r.messageID || '0').catch(() => false)))) {
			client.db.raids.destroy({ where: { messageID: r.messageID }, include: ['members'] });
			client.raids.delete(r.messageID);
			client.reacts.delete(r.messageID);
		}
		else {
			//notification CON.NOTIFYTIME before raid
			if (r.time.isAfter(moment())) {
				client.timeouts.push(client.setTimeout(async raidID => {
					try {
						const raid = client.raids.get(raidID);
						if (!raid || raid.members.length === 0) return;
						const channel = await client.channels.fetch(raid.channelID || '0');
						let text = `**${raid.title}** is starting in ${CON.NOTIFYTIME} minutes`;
						text += raid.members.slice(0, raid.count).reduce((txt, mem) => txt + `\n${channel.guild.members.cache.get(mem.memberID).toString()}`, '');
						client.setTimeout(m => m.delete(), moment.duration(CON.NOTIFYTIME, 'm'), await channel.send(text));
					}
					catch (e) {
						if (e.name === 'DiscordAPIError' || e.name === 'Error' && e.message === 'Unknown Message') return client.logger.warn(`raid message not found: ${raidID}`);
						if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return client.logger.warn(`Missing Permissions: ${raidID}`);
						return client.logger.error(e);
					}
				}, r.time.diff(moment().add(CON.NOTIFYTIME, 'm')), r.messageID));
			}

			//delete raid 1h after it is done
			client.timeouts.push(client.setTimeout(async raidID => {
				try {
					const raid = client.raids.get(raidID);
					if (!raid) return;
					const channel = await client.channels.fetch(raid.channelID || '0');
					const message = await channel.messages.fetch(raid.messageID || '0');
					await message.delete();
					client.db.raidMembers.destroy({ where: { messageID: raidID } });
					client.raids.delete(raidID);
					client.reacts.delete(raidID);
					if (raid.repeat > 0) {
						raid.time.add(raid.repeat, 'd');
						raid.members = [];
						const raidMsg = await channel.send(raid.roleID ? channel.guild.roles.cache.get(raid.roleID).toString() : null, { embed: fnc.getRaidEmbed(channel, raid) });
						await raidMsg.react('✅');
						await raidMsg.react('🆔');
						raid.channelID = raidMsg.channel.id;
						raid.messageID = raidMsg.id;
						client.db.raids.update(raid, { where: { messageID: raidID }, include: ['members'] });
						client.raids.set(raidMsg.id, raid);
						client.reacts.set(raidMsg.id, rnx.raid);
					}
					else {
						client.db.raids.destroy({ where: { messageID: raidID } });
					}
				}
				catch (e) {
					if (e.name === 'DiscordAPIError' || e.name === 'Error' && e.message === 'Unknown Message') return client.logger.warn(`raid message not found: ${raidID}`);
					if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return client.logger.warn(`Missing Permissions: ${raidID}`);
					return client.logger.error(e);
				}
			}, r.time.diff(moment().subtract(1, 'h')), r.messageID));
		}
	});

	if (!init) {
		//do cleanup stuff
		//console.log('cleanup');
	}
});

client.once('ready', async () => {
	//check for required guild permissions
	client.guilds.cache.forEach(g => {
		if (!g.me.permissions.has(CON.RQDPERMS)) {
			let text = `Hey ${g.owner}, i don't have the required permissions on \`${g.name}\`.\n`;
			text += 'I\'m missing the following permissions:\n`';
			text += g.me.permissions.missing(CON.RQDPERMS).join('\n').replace(/_/g, ' ');
			text += '`\nPlease make sure i also have these in the individual channels.';
			g.owner.send(text);
		}
	});

	//get guilds from db
	await client.db.guilds.findAll({ raw: true }).then(guilds => guilds.forEach(guild => client.guildCfg.set(guild.guildID, guild)));

	//get locks from db
	await client.db.locks.findAll({ raw: true }).then(locks => locks.forEach(lock => client.locks.set(lock.channelID, lock)));

	//get welcome messages and reactions from db
	await client.db.welcomeMsgs.findAll({ include: ['reacts'] }).then(msgs => msgs.forEach(async msg => {
		try {
			const message = await client.channels.fetch(msg.channelID || '0').then(async channel => await channel.messages.fetch(msg.messageID || '0'));
			if (msg.cmdList) msg.text += fnc.getCmdList(client, 'text', CON.PERMLVL.EVERYONE).reduce((txt, cmd) => txt + `\n● \`${fnc.getPrefix(message.guild)}${cmd[0]}\` ${cmd[1]}`, '');
			await message.edit(msg.text);
			if (msg.reacts.length) {
				client.welcomeReacts.set(msg.messageID, new Discord.Collection());
				client.reacts.set(msg.messageID, rnx.welcome);
				const reactMsg = client.welcomeReacts.get(msg.messageID);
				msg.reacts.forEach(async react => {
					if (message.reactions.cache.has(react.emojiID)) {
						reactMsg.set(react.emojiID, react.get({ plain: true }));
					}
					else {
						await react.destroy();
					}
				});
			}
		}
		catch (e) {
			//message not found
			if (e.name === 'DiscordAPIError' && e.message === 'Unknown Message') {
				await msg.destroy();
			}
			else {
				client.logger.error(e);
			}
		}
	}));

	//load raids
	await client.db.raids.findAll({ include: ['members'], order: [['members', 'id']] }).then(raids => raids.forEach(async raid => {
		try {
			if (await client.channels.fetch(raid.channelID || '0').then(async channel => await channel.messages.fetch(raid.messageID || '0'))) {
				client.raids.set(raid.messageID, raid.get({ plain: true }));
				client.reacts.set(raid.messageID, rnx.raid);
			}
		}
		catch (e) {
			//message not found
			if (e.name === 'DiscordAPIError' && e.message === 'Unknown Message') {
				await raid.destroy();
			}
			else {
				client.logger.error(e);
			}
		}
	}));

	//set a interval for time based events
	client.emit('mainInterval', true);
	client.setInterval(() => client.emit('mainInterval'), CON.MAININTVL);

	//INIT finished
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
		//check for error save to continue and just warn
		if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return client.logger.warn('Missing Permissions:\n' + e.stack);
		if (e.name === 'SequelizeTimeoutError') return client.logger.warn('Database timeout');
		if (e.name === 'SequelizeUniqueConstraintError') return client.logger.warn('Database unique constraint error');
		//else stop the bot
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
		//console.error('[ERROR] uncaughtException:\n', e);
	}
});

//clean logout if bot gets terminated
process.on('SIGINT', () => {
	if (client) client.destroy();
});

//connect to discord
client.login(cfg.token);
//willfail();

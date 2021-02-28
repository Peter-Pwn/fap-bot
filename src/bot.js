const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const moment = require('moment');
const tar = require('tar');
const emailjs = require('emailjs');

const CON = require(`${require.main.path}/src/const.json`);
const cfg = require(`${require.main.path}/src/config.js`);

moment.suppressDeprecationWarnings = !cfg.debug;
moment.locale('en');

const fnc = require(`${require.main.path}/fnc`);
const rnx = require(`${require.main.path}/rnx`);

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);
const sequelize = require(`${require.main.path}/src/sequelize.js`);
const db = require(`${require.main.path}/src/db.js`);

logger.info(`${cfg.appName} is initialising`);

const commands = require(`${require.main.path}/cmd`);
const aliases = require(`${require.main.path}/src/aliases.js`);

const locks = require(`${require.main.path}/src/locks.js`);
const reacts = require(`${require.main.path}/src/reacts.js`);

const cooldowns = new Discord.Collection();

const timeouts = [];

//INIT db and discord client
(async () => {
	try {
		await sequelize.sync();
		await client.login(cfg.token);
	}
	catch (e) {
		logger.error(`Could not connect to the database or discord servers\n${e}`);
	}
})();


//event listeners

//load data from db and process data
client.once('ready', async () => {
	await fnc.guilds.load();

	(await db.locks.findAll({ raw: true })).forEach(l => locks.set(l.channelID, l));

	const msgs = await db.welcomemsgs.findAll({ include: ['reacts'] });
	for (const msg of msgs) {
		try {
			const disMsg = await fnc.discord.fetchMsg(msg.channelID, msg.messageID);
			if (msg.cmdList) {
				fnc.getCmdList('text', CON.PERMLVL.EVERYONE).forEach(cmd => {
					msg.text += `\n● \`${fnc.guilds.getPrefix(disMsg.guild)}${cmd[0]}\` ${cmd[1]}`;
				});
			}
			await	disMsg.edit(msg.text);
			if (msg.reacts.length === 0) continue;
			reacts.set(msg.messageID, rnx.welcome);
			for (const react of msg.reacts) {
				if (disMsg.reactions.cache.has(react.emojiID) && disMsg.reactions.cache.get(react.emojiID).me) continue;
				await disMsg.react(react.emojiID);
			}
		}
		catch (e) {
			continue;
		}
	}

	/*
	//load raids
	await db.raids.findAll({ include: ['members'], order: [['members', 'id']] }).then(raids => raids.forEach(async raid => {
		try {
			if (await client.channels.fetch(raid.channelID || '0').then(async channel => await channel.messages.fetch(raid.messageID || '0'))) {
				client.raids.set(raid.messageID, raid.get({ plain: true }));
				client.reacts.set(raid.messageID, rnx.raid);
			}
		}
		catch (e) {
			//message not found
			if (e.name === 'DiscordAPIError' && e.message === 'Unknown Message') await raid.destroy();
		}
	}));
	*/

	//set a interval for time based events
	client.setInterval(() => client.emit('mainInterval'), CON.MAININTVL);
	client.emit('mainInterval', true);

	//INIT finished
	logger.info(`${cfg.appName} is ready`);
});

//handle commands send to the bot
//TODO: hanle edits
client.on('message', async message => {
	if (message.partial) {
		try {
			await message.fetch();
		}
		catch (e) {
			return logger.warn(`Error fetching message:\n${e.stack}`);
		}
	}
	try {
		if (message.author.bot) return;
		const prefix = fnc.guilds.getPrefix(message.guild);
		if (!message.content.startsWith(prefix)) return;
		//split args by spaces, but not between quotes, escapes are possible
		const args = Array.from(message.content.slice(prefix.length).matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|([^ ]+)/g), g => g[1] || g[2]);
		if (args.length === 0) return;
		let commandName = args.shift().toLowerCase();
		let mode = null;
		if (!commands.has(commandName) && aliases.has(commandName)) [commandName, mode] = aliases.get(commandName);
		const command = commands.get(commandName);
		if (!command) return;

		//check permissions
		if (!(fnc.guilds.getPerms(message.member || message.author) & command.permLvl)) {
			fnc.discord.replyWarn(message, 'you don\'t have the permission to use this command.').catch(() => null);
			if (message.channel.type === 'text') message.delete();
			return;
		}

		if (command.modes) {
			if (!mode) {
				if (args.length === 0) mode = Object.entries(command.modes).flatMap(m => m[1].isDefault && m[0] || [])[0] || 'default';
				else mode = args.shift().toLowerCase();
			}
			if (!Object.keys(command.modes).includes(mode)) {
				fnc.discord.replyWarn(message, `\`${mode}\` is not a valid mode.\nValid modes are: \`${Object.keys(command.modes).join('`, `')}\``).catch(() => null);
				return fnc.discord.delayDeleteMsg(message, message.author).catch(() => null);
			}
		}

		//check for args count
		if (mode && command.modes[mode].args && args.length < command.modes[mode].args || command.args && args.length < command.args) {
			let reply = 'you didn\'t provide enoght arguments.';
			if (mode && command.modes[mode].usage || command.usage) {
				reply += `\n\`Usage:\` ${prefix}${commandName} ${mode && command.modes[mode].usage || command.usage}`;
				reply += '\nRequired Arguments are marked with < >, optional with [ ].';
				reply += `\nUse quotes to commit arguments containg spaces. E.g. \`${prefix}lock "channel name"\``;
			}
			fnc.discord.replyWarn(message, reply).catch(() => null);
			return fnc.discord.delayDeleteMsg(message, message.author).catch(() => null);
		}

		//check cooldown
		if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Discord.Collection());
		const users = cooldowns.get(command.name);
		const now = moment();
		if (users.has(message.author.id)) {
			const expiration = users.get(message.author.id);
			if (now.isBefore(expiration)) {
				fnc.discord.replyWarn(message, `please wait ${expiration.diff(now, 's')} seconds before reusing ${commandName}.`).catch(() => null);
				return fnc.discord.delayDeleteMsg(message, message.author).catch(() => null);
			}
		}
		users.set(message.author.id, now.add(command.cooldown * 1000));
		client.setTimeout(() => users.delete(message.author.id), command.cooldown * 1000);

		//execute the command and delete command message
		try {
			await command.execute(message, args, mode);
			if (client && command.deleteMsg === true && message.channel.type === 'text' && !message.deleted) message.delete();
		}
		catch (e) {
			if (client && message) {
				if (e.name === 'Warn' && client && message) {
					if (e.message) fnc.discord.replyWarn(message, e.message).catch(() => null);
					if (message.channel.type === 'text') fnc.discord.delayDeleteMsg(message, message.author).catch(() => null);
					return;
				}
				fnc.discord.replyWarn(message, 'an internal error occurred.', { isError: true }).catch(() => null);
				if (message.channel.type === 'text' && !message.deleted) message.delete();
			}
			throw e;
		}
	}
	catch (e) {
		//save to skip, maybe write something into the log or the server owner
		if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return;
		if (e.name === 'DiscordAPIError' && e.message === 'Unknown Message') return;
		logger.error(e);
	}
});

//handle reactions
client.on('messageReactionAdd', async (reaction, user) => {
	if (reaction.partial) {
		try {
			await reaction.fetch();
		}
		catch (e) {
			return logger.warn(`Error fetching reaction:\n${e.stack}`);
		}
	}
	if (user.bot) return;

	try {
		if (reacts.has(reaction.message.id)) reacts.get(reaction.message.id).add(reaction, user);
	}
	catch (e) {
		logger.error(`Couldn't execute reaction:\n${e.stack}`);
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (reaction.partial) {
		try {
			await reaction.fetch();
		}
		catch (e) {
			return logger.warn(`Error fetching reaction:\n${e.stack}`);
		}
	}
	if (user.bot) return;

	try {
		if (reacts.has(reaction.message.id)) reacts.get(reaction.message.id).remove(reaction, user);
	}
	catch (e) {
		logger.error(`Couldn't execute reaction:\n${e.stack}`);
	}
});

//handle auto unlock of voice channels
client.on('voiceStateUpdate', (oldState, newState) => {
	if (oldState.channelID && oldState.channelID !== newState.channelID && locks.has(oldState.channelID)) {
		const lock = locks.get(oldState.channelID);
		//unlock if user left the channel -> if (oldState.member.id === lock.memberID && !lock.permanent) {
		//unlock if all users left the channel
		if (oldState.channel.members.size === 0 && oldState.channel.editable && !lock.permanent) {
			oldState.channel.setUserLimit(lock.limit);
			db.locks.destroy({ where: { channelID: oldState.channelID } });
			locks.delete(oldState.channelID);
		}
	}
});

//hanle interval actions
client.on('mainInterval', async (init = false) => {
	//clear pending timeouts
	timeouts.forEach(t => client.clearTimeout(t));

	//update clan XP
	await fnc.div2xp.updateXP();
	//if the xp reset is before next interval, do it in between
	const nextRst = fnc.div2xp.getResetDay(moment().add(1, 'w'));
	if (nextRst.isBefore(moment().add(CON.MAININTVL))) {
		timeouts.push(client.setTimeout(async () => {
			await fnc.div2xp.updateXP();
			await fnc.channels.populate();
		},
		nextRst.diff(moment()) + 1));
	}

	//events
	//(at some point)

	//populate all channels
	await fnc.channels.populate();

	/*

	//look for upcoming raids in the next CON.MAININTVL and set a timeout to notify
	client.raids.filter(r => r.time.isBefore(moment().add(CON.MAININTVL))).forEach(async r => {
		//delete from db if raid message is gone
		if (!(await client.channels.fetch(r.channelID || '0').then(async channel => await channel.messages.fetch(r.messageID || '0').catch(() => false)))) {
			db.raids.destroy({ where: { messageID: r.messageID }, include: ['members'] });
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
						if (e.name === 'DiscordAPIError' || e.name === 'Error' && e.message === 'Unknown Message') return logger.warn(`raid message not found: ${raidID}`);
						if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return logger.warn(`Missing Permissions: ${raidID}`);
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
					db.raidmembers.destroy({ where: { messageID: raidID } });
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
						db.raids.update(raid, { where: { messageID: raidID }, include: ['members'] });
						client.raids.set(raidMsg.id, raid);
						client.reacts.set(raidMsg.id, rnx.raid);
					}
					else {
						db.raids.destroy({ where: { messageID: raidID } });
					}
				}
				catch (e) {
					if (e.name === 'DiscordAPIError' || e.name === 'Error' && e.message === 'Unknown Message') return logger.warn(`raid message not found: ${raidID}`);
					if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return logger.warn(`Missing Permissions: ${raidID}`);
				}
			}, r.time.diff(moment().subtract(1, 'h')), r.messageID));
		}
	});
	*/

	if (!init) {
		//do cleanup stuff
		//console.log('cleanup');
	}
});

logger.fileLogger.on('new', async logFile => {
	//send old logfiles per mail
	if (cfg.log && cfg.log.file && !cfg.log.file.silent && cfg.log.maxTotalSize) {
		const maxSize = cfg.log.maxTotalSize.toLowerCase().match(/^((?:0\.)?\d+)([kmg]?)$/);
		let maxTotalSize = 0;
		if (maxSize) {
			maxTotalSize = maxSize[1];
			if (maxSize[2] === 'k') maxTotalSize *= 1024;
			else if (maxSize[2] === 'm') maxTotalSize *= 2048;
			else if (maxSize[2] === 'g') maxTotalSize *= 3072;
		}
		const logDir = path.normalize(cfg.log.file.dirname);
		let totalSize = 0;
		const files = fs.readdirSync(logDir).filter(file => file.endsWith(cfg.log.file.extension || '.log'));
		files.forEach(file => {
			totalSize += fs.statSync(`${logDir}/${file}`).size;
		});
		if (totalSize >= maxTotalSize) {
			files.splice(files.indexOf(path.basename(logFile)), 1);
			if (cfg.log.mailTo && cfg.mail && cfg.mail.server) {
				const timeStamp = moment().format('YYYY-MM-DD');
				const tarFile = `${logDir}/${cfg.appName}-${timeStamp}-logs.tar.gz`;
				await tar.c({
					gzip: true,
					file: tarFile,
					cwd: logDir,
				},
				files);
				await new emailjs.SMTPClient(cfg.mail.server).sendAsync({
					subject: `${cfg.appName} logfiles from ${timeStamp}`,
					text: `the logfiles exceeded ${cfg.log.maxTotalSize} and got deleted`,
					from: cfg.mail.from,
					to: cfg.log.mailTo,
					attachment: [{
						path: tarFile,
						type: 'application/zip',
						name: path.basename(tarFile),
					}],
				});
				fs.unlinkSync(tarFile);
			}
			files.forEach(file => {
				fs.unlinkSync(`${logDir}/${file}`);
			});
		}
	}
});

//handle errors
client.on('debug', e => logger.debug(e));
client.on('warn', e => logger.warn(e));
client.on('error', e => {
	logger.error('discordError:\n' + e.stack);
	if (client) client.destroy();
});
process.on('unhandledRejection', e => {
	if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return logger.warn('Missing Permissions:\n' + e.stack);
	logger.error(e);
	throw e;
});
process.on('uncaughtException', e => {
	if (e.name === 'Warn') return logger.warn('uncaughtWarn: ' + e.file + '\n' + e.message);
	logger.error(e);
	throw e;
});

//clean logout if bot gets terminated
process.on('SIGINT', () => {
	if (client) client.destroy();
});

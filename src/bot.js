const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const Sequelize = require('sequelize');
const moment = require('moment');
const winston = require('winston');
require('winston-daily-rotate-file');
//require('winston-mail');
const tar = require('tar');
const emailjs = require('emailjs');

const CON = require(`${require.main.path}/src/const.json`);
const cfg = require(`${require.main.path}/src/config.js`);
const fnc = require(`${require.main.path}/fnc`);
const rnx = require(`${require.main.path}/rnx`);

moment.suppressDeprecationWarnings = !cfg.debug;
moment.locale('en');

//create discord client https://discord.js.org/#/docs/main/stable/class/ClientUser?scrollTo=setPresence
const client = new Discord.Client({
	presence: cfg.presence,
	partials: ['MESSAGE', 'REACTION'],
});

//create logger
//DailyRotateFile https://github.com/winstonjs/winston-daily-rotate-file#options
//TODO: logger in ../index.js and global
client.logger = winston.createLogger({
	transports: [new winston.transports.Console(cfg.log.console)],
	format: winston.format.printf(info => `${moment().format('YYYY-MM-DD HH:mm:ss')} [${info.level.toUpperCase()}] ${(info instanceof Error) ? info.stack : info.message}`),
});
let fileLogger = null;
if (cfg.log.file) {
	fileLogger = new winston.transports.DailyRotateFile(cfg.log.file);
	client.logger.add(fileLogger);
}
//if (cfg.log.mail) client.logger.add(new winston.transports.Mail(cfg.log.mail));
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
//if (cfg.debug) client.logger.transports[0].level = 'debug';

client.logger.info(`${cfg.appName} is initialising`);


client.commands = require(`${require.main.path}/cmd`);

client.guildCfg = new Discord.Collection();

client.reacts = new Discord.Collection();
client.welcomeReacts = new Discord.Collection();
client.raids = new Discord.Collection();

const cooldowns = new Discord.Collection();
client.timeouts = [];
client.locks = new Discord.Collection();

//create DB connection
const sequelize = new Sequelize(cfg.db_URI, {
	logging: false,
	sync: {
		alter: cfg.debug,
	},
});
client.db = require(`${require.main.path}/tbl`)(sequelize);
sequelize.sync()
	.then(() => {
		//connect to discord
		client.login(cfg.token)
			.catch(e => {
				//TODO: propper Error handling, this would probably result in an uncaught Error
				throw e;
			});
	})
	.catch(e => {
		//TODO: propper Error handling, this would probably result in an uncaught Error
		throw e;
	});

//event listeners

client.once('ready', async () => {
	//check for required guild permissions
	/* disabled for now
	client.guilds.cache.forEach(async g => {
		if (!g.me.permissions.has(CON.RQDPERMS)) {
			if (!g.owner) await g.members.fetch(g.ownerID);
			if (g.owner) {
				let text = `Hey ${g.owner}, i don't have the required permissions on \`${g.name}\`.\n`;
				text += 'I\'m missing the following permissions:\n`';
				text += g.me.permissions.missing(CON.RQDPERMS).join('\n').replace(/_/g, ' ');
				text += '`\nPlease make sure i also have these in the individual channels.';
				g.owner.send(text);
			}
			else {
				let text = `Missing the following permissions on "${g.name}":\n`;
				text += g.me.permissions.missing(CON.RQDPERMS).join('\n').replace(/_/g, ' ');
				client.logger.warn(text);
			}
		}
	});
	*/

	//get guilds from db
	await client.db.guilds.findAll({ raw: true }).then(guilds => guilds.forEach(guild => client.guildCfg.set(guild.guildID, guild)));

	//get locks from db
	await client.db.locks.findAll({ raw: true }).then(locks => locks.forEach(lock => client.locks.set(lock.channelID, lock)));

	//get welcome messages and reactions from db
	await client.db.welcomeMsgs.findAll({ include: ['reacts'] }).then(msgs => msgs.forEach(async msg => {
		try {
			const message = await client.channels.fetch(msg.channelID || '0').then(async channel => await channel.messages.fetch(msg.messageID || '0'));
			if (msg.cmdList) msg.text += fnc.getCmdList(client, 'text', CON.PERMLVL.EVERYONE).reduce((txt, cmd) => txt + `\n● \`${fnc.guilds.getPrefix(message.guild)}${cmd[0]}\` ${cmd[1]}`, '');
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
			if (e.name === 'DiscordAPIError' && e.message === 'Unknown Message') await msg.destroy();
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
			if (e.name === 'DiscordAPIError' && e.message === 'Unknown Message') await raid.destroy();
		}
	}));

	//set a interval for time based events
	client.emit('mainInterval', true);
	client.setInterval(() => client.emit('mainInterval'), CON.MAININTVL);

	//INIT finished
	client.logger.info(`${cfg.appName} is ready`);
});

client.on('message', message => {
	//handle commands send to the bot
	new Promise((resolve, reject) => {
		if (message.partial) {
			message.fetch()
				.then(() => resolve())
				.catch(e => {
					client.logger.warn(`Error fetching message:\n${e.stack}`);
					reject();
				});
		}
		else {
			resolve();
		}
	})
		.then(() => {
			if (message.author.bot) return;
			const prefix = fnc.guilds.getPrefix(message.guild);
			if (!message.content.startsWith(prefix)) return;
			//split args by spaces, but not between quotes, escapes are possible
			const args = Array.from(message.content.slice(prefix.length).matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|([^ ]+)/g), g => g[1] || g[2]);
			if (args.length === 0) return;
			const commandName = args.shift().toLowerCase();
			const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
			if (!command) return;

			//check permissions and handle special channel type stuff
			if (command.permLvl === CON.PERMLVL.OWNER && !cfg.owners.includes(message.author.id)) {
				message.delete()
					.catch(() => null);
				return;
			}
			if (message.channel.type === 'text' && command.msgType & CON.MSGTYPE.TEXT) {
				if (!(fnc.getPerms(message.member) & command.permLvl)) {
					fnc.replyWarn(message, 'you don\'t have the permission to use this command.')
						.then(() => {
							message.delete()
								.catch(() => null);
						});
					return;
				}
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
				return fnc.replyWarn(message, reply);
			}

			//check cooldown
			//TODO: do a rework, with moment
			//if (!cooldowns.has(command.name))	cooldowns.set(command.name, new Discord.Collection());
			const timestamps = cooldowns.get(command.name) || cooldowns.set(command.name, new Discord.Collection());
			const cooldown = command.cooldown * 1000;
			const now = Date.now();
			if (timestamps.has(message.author.id)) {
				const expirationTime = timestamps.get(message.author.id);
				if (now < expirationTime) {
					return fnc.replyWarn(message, `please wait ${Math.ceil((expirationTime - now) / 1000)} more second(s) before reusing ${commandName}.`);
				}
			}
			timestamps.set(message.author.id, now + cooldown);
			client.setTimeout(() => timestamps.delete(message.author.id), cooldown);

			//execute the command and delete command message if command was successful
			//not all commands are async
			Promise.all([command.execute(message, args)])
				.then(() => {
					if (command.deleteMsg === true && message.channel.type === 'text' && !message.deleted) {
						message.delete()
							.catch(e => {
								if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') {
									message.channel.send(`${message.guild.owner}, i don't have permission to delete messages here!`)
										.catch(() => null);
								}
							});
					}
				})
				.catch(err => {
					if (err && err.name !== 'Warn') client.logger.warn(`Couldn't execute command ${command.name}:\n${err.stack}`);
					if (command.deleteMsg === true && message.channel.type === 'text' && !message.deleted) {
						message.react('❌')
							.then(() => {
								message.awaitReactions((reaction, user) => reaction.emoji.name === '❌' && user.id !== message.client.user.id && ((message.guild && message.guild.members.cache.get(user.id).hasPermission(cfg.modPerm)) || user.id === message.author.id), {
									max: 1,
									time: 300e3,
								})
									.then(() => {
										if (message && !message.deleted) {
											message.delete()
												.catch(e => {
													if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') {
														message.channel.send(`${message.guild.owner}, i don't have permission to delete messages here!`)
															.catch(() => null);
													}
												});
										}
									})
									.catch(() => null);
							})
							.catch(e => {
								if (e.name === 'DiscordAPIError' && e.message === 'Missing Permissions' || e.message === 'Missing Access') return message.channel.send(`${message.guild.owner}, i don't have permission to add reactions here!`);
								if (e.name === 'DiscordAPIError' || e.name === 'Error' && e.message === 'Unknown Message') return;
								message.client.logger.warn(e);
							});
					}
				});
		})
		.catch(e => {
			if (e) throw e;
		});
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (user.bot) return;
	if (reaction.partial && !(await reaction.fetch().catch(e => client.logger.warn(`Error fetching reaction:\n${e.stack}`) && null))) return;

	try {
		if (client.reacts.has(reaction.message.id)) client.reacts.get(reaction.message.id).add(reaction, user);
	}
	catch (e) {
		client.logger.error(`Couldn't execute reaction:\n${e.stack}`);
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (user.bot) return;
	if (reaction.partial && !(await reaction.fetch().catch(e => client.logger.warn(`Error fetching reaction:\n${e.stack}`) && null))) return;

	try {
		if (client.reacts.has(reaction.message.id)) client.reacts.get(reaction.message.id).remove(reaction, user);
	}
	catch (e) {
		client.logger.error(`Couldn't execute reaction:\n${e.stack}`);
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	//handle auto unlock of voice channels
	if (oldState.channelID && oldState.channelID !== newState.channelID && client.locks.has(oldState.channelID)) {
		const lock = client.locks.get(oldState.channelID);
		//unlock if user left the channel -> if (oldState.member.id === lock.memberID && !lock.permanent) {
		//unlock if all users left the channel
		if (oldState.channel.members.size === 0 && oldState.channel.editable && !lock.permanent) {
			oldState.channel.setUserLimit(lock.limit);
			client.db.locks.destroy({ where: { channelID: oldState.channelID } });
			client.locks.delete(oldState.channelID);
		}
	}
});

client.on('mainInterval', (init = false) => {
	const promises = [];
	//clan XP
	promises.push(fnc.div2xp.updXP(client)
		.catch(() => null));

	//events
	//(at some point)

	Promise.allSettled(promises)
		.then(() => {
			fnc.channels.populate(client)
				.catch(e => {
				//TODO: propper Error handling, this would probably result in an uncaught Error
					throw e;
				});
		});

	/*
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

fileLogger.on('new', logFile => {
	//send old logfiles per mail
	if (cfg.log && cfg.log.file && cfg.log.maxTotalSize && cfg.log.mailTo && cfg.mail && cfg.mail.server) {
		const maxSize = cfg.log.maxTotalSize.toLowerCase().match(/^((?:0\.)?\d+)([kmg]?)$/);
		let maxTotalSize = maxSize[1];
		if (maxSize) {
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
			const timeStamp = moment().format('YYYY-MM-DD');
			const tarFile = `${logDir}/${cfg.appName}-${timeStamp}-logs.tar.gz`;
			tar.c({
				gzip: true,
				file: tarFile,
				cwd: logDir,
			},
			files,
			)
				.then(() => {
					emailjs.server.connect(cfg.mail.server).send({
						subject: `${cfg.appName} logfiles from ${timeStamp}`,
						text: `the logfiles exceeded ${cfg.log.maxTotalSize} and got deleted`,
						from: cfg.mail.from,
						to: cfg.log.mailTo,
						attachment: [{
							path: tarFile,
							type: 'application/zip',
							name: path.basename(tarFile),
						}],
					},
					(e) => {
						if (e) return console.error('[ERROR] mailError:\n', e);
						try {
							files.forEach(file => {
								fs.unlinkSync(`${logDir}/${file}`);
							});
							fs.unlinkSync(tarFile);
						}
						catch (err) {
							console.error('[ERROR] unlinkError:\n', err);
						}
					});
				})
				.catch(e => console.error('[ERROR] tarError:\n', e));
		}
	}
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
		if (e.name === 'SequelizeUniqueConstraintError') return client.logger.warn('Database unique constraint error:\n' + e.stack);
	}
	//else stop the bot
	throw e;
});
process.on('uncaughtException', e => {
	if (client) {
		if (e.name === 'Warn') return client.logger.warn('uncaughtWarn: ' + e.file + '\n' + e.message);
	}
	throw e;
});

//clean logout if bot gets terminated
process.on('SIGINT', () => {
	if (client) client.destroy();
});


//cXP test
const xptest = async function() {
	try {
		//await fnc.div2xp.addMember(client, '715125691468873839', '578580428349505536', 'PeterPwn247');
		//await fnc.div2xp.addMember(client, '715125691468873839', '118844909787545605', 'berserkAries');
		//await fnc.div2xp.remMember(client, '715125691468873839', 'PeterPwn247');
		//await fnc.div2xp.updXP(client);
		//console.log(await fnc.div2xp.getUplayData('PeterPwn24'));
		//console.log(await fnc.div2xp.getDifference(client, '715125691468873839'));
	}
	catch (e) {
		if (e.name === 'Warn') {
			console.log(`xp test warn: ${e.message}`);
		}
		else {
			console.log('xp test error:');
			console.log(e);
		}
	}
};
xptest();

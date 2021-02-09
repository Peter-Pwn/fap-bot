const Sequelize = require('sequelize');
const moment = require('moment');

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);
const db = require(`${require.main.path}/src/db.js`);

const getEmbed = require(`${require.main.path}/fnc/src/div2xp/getEmbed.js`);
const getResetDay = require(`${require.main.path}/fnc/src/div2xp/getResetDay.js`);

//populate div2xp
module.exports = function(channel) {
	return new Promise((resolve, reject) => {
		//channel.param1 = top x players
		channel.param1 = parseInt(channel.param1);
		//channel.param2 = weeks to keep
		channel.param2 = parseInt(channel.param2);
		//delete old message
		if (channel.param2 > 0) {
			Promise.all([
				db.div2xpMsgs.findAll({
					where: {
						channelID: channel.channelID,
						time: { [Sequelize.Op.lte]: moment().subtract(channel.param2, 'w').format() },
					},
				}),
				client.channels.fetch(channel.channelID),
			])
				.then(([messages, disChannel]) => {
					for (const message of messages) {
						disChannel.messages.fetch(message.messageID)
							.then(disMessage => {
								disMessage.delete()
									.catch(() => null);
								message.destroy()
									.catch(() => null);
							})
							.catch(() => null);
					}
				})
				.catch(() => null);
		}
		//post or update messages
		Promise.all([
			db.div2xp.findAll({
				attributes: ['uplayName', 'memberID', 'lastUpdate', [Sequelize.literal('`cXP` - `cXPSnapshot`'), 'difference']],
				where: { guildID: channel.guildID },
				order: Sequelize.literal('`difference` DESC'),
				raw: true,
			}),
			db.div2xpMsgs.findOrBuild({
				where: {
					channelID: channel.channelID,
					time: { [Sequelize.Op.gt]: getResetDay().format() },
				},
				limit: 1,
			}),
			client.channels.fetch(channel.channelID),
		])
			.then(([xpList, [message, isNewRecord], disChannel]) => {
				getEmbed(disChannel, xpList, { top: channel.param1 })
					.then(embed => {
						new Promise((resolve, reject) => {
							if (isNewRecord) {
								disChannel.send({ embed: embed })
									.then(disMessage => {
										message.messageID = disMessage.id;
										resolve();
									})
									.catch(e => reject(e));
							}
							else {
								disChannel.messages.fetch(message.messageID)
									.then(disMessage => {
										if (disMessage.deleted) throw null;
										disMessage.edit({ embed: embed })
											.then(() => resolve())
											.catch(e => reject(e));
									})
									.catch(() => {
										message.destroy()
											.catch(() => null);
										reject();
									});
							}
						})
							.then(() => {
								message.time = moment();
								message.save()
									.then(() => resolve())
									.catch(() => reject());
							})
							.catch(e => {
								if (e) logger.warn(e);
								reject();
							});
					})
					.catch(e => {
						if (e) logger.warn(e);
						reject();
					});
			})
			.catch(e => {
				if (e) logger.warn(e);
				reject();
			});
	});
};

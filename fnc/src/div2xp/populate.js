const Sequelize = require('sequelize');
const moment = require('moment');

const fnc = require(`${require.main.path}/fnc`);

const client = require(`${require.main.path}/src/client.js`);
const db = require(`${require.main.path}/src/db.js`);

//populate div2xp
module.exports = async function(channel) {
	if (!channel) throw new TypeError('no channel');
	//channel.param1 = top x players
	channel.param1 = parseInt(channel.param1);
	//channel.param2 = weeks to keep
	channel.param2 = parseInt(channel.param2);
	const disChannel = await client.channels.fetch(channel.channelID);
	//delete old message
	if (channel.param2 > -1) {
		const messages = await db.div2xpmsgs.findAll({
			where: {
				channelID: channel.channelID,
				time: { [Sequelize.Op.lt]: fnc.div2xp.getResetDay().subtract(channel.param2, 'w').format() },
			},
		});
		for (const message of messages) {
			try {
				const disMessage = await disChannel.messages.fetch(message.messageID);
				await disMessage.delete();
				await message.destroy();
			}
			catch (e) {
				continue;
			}
		}
	}
	//post or update messages
	const xpList = await db.div2xp.findAll({
		attributes: ['uplayName', 'memberID', 'lastUpdate', [Sequelize.literal('`cXP` - `cXPSnapshot`'), 'difference']],
		where: { guildID: channel.guildID },
		order: Sequelize.literal('`difference` DESC'),
	});
	const [message, isNewRecord] = await db.div2xpmsgs.findOrBuild({
		where: {
			channelID: channel.channelID,
			time: { [Sequelize.Op.gt]: fnc.div2xp.getResetDay().format() },
		},
		limit: 1,
	});
	const embed = await	fnc.div2xp.getEmbed(disChannel, xpList.map(v => v.get({ plain: true })), { top: channel.param1 });
	let msgEdited = null;
	if (!isNewRecord) {
		try {
			const disMessage = await disChannel.messages.fetch(message.messageID);
			if (!disMessage.deleted) msgEdited = await disMessage.edit({ embed: embed });
		}
		catch (e) {
			if (e.name === 'DiscordAPIError' || e.name === 'Error' && e.message === 'Unknown Message') return;
			throw e;
		}
	}
	if (!msgEdited) {
		const disMessage = await disChannel.send({ embed: embed });
		message.messageID = disMessage.id;
	}
	message.time = moment();
	message.save();
	return true;
};

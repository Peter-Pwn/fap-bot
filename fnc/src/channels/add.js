const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);

//adds a channel to the list and sets the type (event, xp)
module.exports = async function(guildID, channelID, type, { param1 = null, param2 = null } = {}) {
	if (!guildID) throw new TypeError('no guildID');
	if (!channelID) throw new TypeError('no channelID');
	if (Object.values(CON.CHTYPE).indexOf(type) === -1) throw new TypeError('no valid type');
	try {
		guildID = await fnc.snowflakes.getGuild(guildID);
		channelID = await fnc.snowflakes.getChannel(channelID, guildID);
	}
	catch (e) {
		throw fnc.Warn(`\`${channelID}\` is not a discord channel.`);
	}
	const [channel] = await db.channels.findOrBuild({
		where: {
			channelID: channelID,
			type: type,
		},
		limit: 1,
	});
	channel.guildID = guildID;
	channel.param1 = param1;
	channel.param2 = param2;
	await channel.save();
	return channel.get({ plain: true });
};

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);

//gets a list of special channels (event, xp)
module.exports = async function(guildID, type = -1) {
	if (!guildID) throw new TypeError('no guildID');
	if (type !== -1 && Object.values(CON.CHTYPE).indexOf(type) === -1) throw new TypeError('no valid type');
	try {
		guildID = await fnc.snowflakes.getGuild(guildID);
	}
	catch (e) {
		throw fnc.Warn(`\`${guildID}\` is not a discord guild.`);
	}
	const where = {
		guildID: guildID,
	};
	if (type > -1) where.type = type;
	const channels = await db.channels.findAll({
		attributes: ['channelID', 'param1', 'param2'],
		where: where,
	});
	return channels.map(v => v.get({ plain: true }));
};

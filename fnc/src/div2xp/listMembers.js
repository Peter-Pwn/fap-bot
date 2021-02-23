const Sequelize = require('sequelize');

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);

//get probably wrong uplay names
module.exports = async function(guildID, failed = false) {
	if (!guildID) throw new TypeError('no guildID');
	try {
		guildID = await fnc.snowflakes.getGuild(guildID);
	}
	catch (e) {
		throw fnc.Warn(`\`${guildID}\` is not a discord guild.`);
	}
	const where = {
		guildID: guildID,
	};
	if (failed) where.failed = { [Sequelize.Op.gte]: CON.DIV2XPMFAILS };
	const div2xp = await db.div2xp.findAll({
		attributes: ['uplayName', 'memberID'],
		where: where,
	});
	return div2xp.map(v => v.get({ plain: true }));
};

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);

//gets a list of the guild permissions
module.exports = async function(guildID) {
	if (!guildID) throw new TypeError('no guildID');
	try {
		guildID = await fnc.snowflakes.getGuild(guildID);
	}
	catch (e) {
		throw fnc.Warn(`\`${guildID}\` is not a discord guild.`);
	}
	const perms = await db.guildperms.findAll({
		attributes: ['entityID', 'entityType', 'permission'],
		where: {
			guildID: guildID,
		},
	});
	return perms.map(v => v.get({ plain: true }));
};

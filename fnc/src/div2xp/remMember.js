const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);

//remove guild member from the XP list
module.exports = async function(guildID, uplayName) {
	if (!guildID) throw new TypeError('no guildID');
	if (!uplayName) throw new TypeError('no uplayName');
	try {
		guildID = await fnc.snowflakes.getGuild(guildID);
	}
	catch (e) {
		throw fnc.Warn('guild not found.');
	}
	const count = await db.div2xp.destroy({
		where: {
			uplayName: uplayName,
			guildID: guildID,
		},
	});
	if (count === 0) throw fnc.Warn(`\`${uplayName}\` does not exists in the list.`);
	return true;
};

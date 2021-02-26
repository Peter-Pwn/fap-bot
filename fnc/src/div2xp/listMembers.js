const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const client = require(`${require.main.path}/src/client.js`);
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
	const members = [];
	const guild = await client.guilds.fetch(guildID);
	const div2xp = await db.div2xp.findAll({
		attributes: ['uplayName', 'memberID', 'failed'],
		where: {
			guildID: guildID,
		},
	});
	for (const member of div2xp) {
		let reason = null;
		if (failed) {
			if (member.failed > CON.DIV2XPMFAILS) reason = 'uplay';
			try {
				await guild.members.fetch(member.memberID);
			}
			catch (e) {
				reason = 'discord';
			}
		}
		if (!failed || reason) {
			members.push({
				uplayName: member.uplayName,
				memberID: member.memberID,
				failed: reason,
			});
		}
	}
	return members;
};

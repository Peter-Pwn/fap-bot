const moment = require('moment');

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);

//add guild member to the XP list, link him with uplay and get the xp
module.exports = async function(guildID, memberID, uplayName) {
	if (!guildID) throw new TypeError('no guildID');
	if (!memberID) throw new TypeError('no memberID');
	if (!uplayName) throw new TypeError('no uplayName');
	try {
		guildID = await fnc.snowflakes.getGuild(guildID);
		memberID = await fnc.snowflakes.getUser(memberID, guildID);
	}
	catch (e) {
		throw fnc.Warn(`\`${memberID}\` not found.`);
	}
	const count = await	db.div2xp.count({
		where: {
			uplayName: uplayName,
			guildID: guildID,
		},
	});
	if (count > 0) throw fnc.Warn(`\`${uplayName}\` is already in the list.`);
	const data =	await	fnc.div2xp.getUplayData(uplayName);
	const [member, isNewRecord] = await db.div2xp.findOrBuild({
		where: {
			uplayID: data.platformInfo.platformUserId,
			guildID: guildID,
		},
		limit: 1,
	});
	const oldName = member.uplayName;
	//member.uplayName = data.platformInfo.platformUserIdentifier;
	member.uplayName = uplayName;
	member.memberID = memberID;
	member.cXP = parseInt(data.segments[0].stats.xPClan.value);
	member.lastUpdate = moment();
	if (isNewRecord || member.lastSnapshot.isBefore(fnc.div2xp.getResetDay())) {
		member.cXPSnapshot = member.cXP;
		member.lastSnapshot = member.lastUpdate;
	}
	member.failed = 0;
	await member.save();
	if (!isNewRecord) throw fnc.Warn(`\`${uplayName}\` was already in the list under the name of \`${oldName}\` and was renamed.`, CON.ERRCDE.RENAMED);
	return true;
};

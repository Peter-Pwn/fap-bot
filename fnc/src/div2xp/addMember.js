const Sequelize = require('sequelize');
const moment = require('moment');

const CON = require(`${require.main.path}/src/const.json`);

const Warn = require(`${require.main.path}/fnc/src/Warn.js`);
const getUplayData = require(`${require.main.path}/fnc/src/div2xp/getUplayData.js`);

//add guild member to the XP list, link him with uplay and get the xp
module.exports = function(client, guildID, memberID, uplayName) {
	return new Promise((resolve, reject) => {
		client.db.div2xp.count({
			where: {
				uplayName: uplayName,
				guildID: guildID,
				failed: { [Sequelize.Op.lt]: CON.DIV2XPMFAILS },
			},
		})
			.then(count => {
				if (count > 0) return reject(Warn(`\`${uplayName}\` is already in the list.`));
				getUplayData(uplayName)
					.then(data => {
						client.db.div2xp.findOrBuild({
							where: {
								uplayID: data.platformInfo.platformUserId,
								guildID: guildID,
							},
							limit: 1,
						})
							.then(([member, isNewRecord]) => {
								const oldName = member.uplayName;
								member.uplayName = data.platformInfo.platformUserIdentifier;
								member.memberID = memberID;
								member.cXP = parseInt(data.segments[0].stats.xPClan.value);
								member.lastUpdate = moment();
								member.cXPSnapshot = member.cXP;
								member.lastSnapshot = member.lastUpdate;
								member.failed = 0;
								member.save()
									.then(() => {
										if (!isNewRecord) return reject(Warn(`\`${uplayName}\` was already in the list under the name of \`${oldName}\` and was renamed.`));
										resolve();
									})
									.catch(e => reject(e));
							})
							.catch(e => reject(e));
					})
					.catch(e => reject(e));
			})
			.catch(e => reject(e));
	});
};

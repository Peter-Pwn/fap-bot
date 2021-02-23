const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);
const guildCfg = require(`${require.main.path}/src/guildCfg.js`);

//add permission of a role or user
module.exports = async function(guildID, entityID, entityType, permission) {
	if (!guildID) throw new TypeError('no guildID');
	if (!entityID) throw new TypeError('no entityID');
	if (!entityType) throw new TypeError('no entityType');
	if (Object.values(CON.ENTTYPE).indexOf(entityType) === -1) throw new TypeError('no valid entityType');
	if (!permission) throw new TypeError('no permission');
	if (Object.values(CON.PERMLVL).filter(v => v > CON.PERMLVL.EVERYONE && v < CON.PERMLVL.OWNER).indexOf(permission) === -1) throw new TypeError('no valid permission');
	try {
		guildID = await fnc.snowflakes.getGuild(guildID);
		if (entityType === CON.ENTTYPE.USER) entityID = await fnc.snowflakes.getUser(entityID, guildID);
		else entityID = await fnc.snowflakes.getRole(entityID, guildID);
	}
	catch (e) {
		throw fnc.Warn('entity not found.');
	}

	const [guild] = await db.guilds.findOrBuild({
		where: {
			guildID: guildID,
		},
	});
	const [perm] = await db.guildperms.findOrBuild({
		include: ['guilds'],
		where: {
			guildID: guildID,
			entityID: entityID,
			entityType: entityType,
		},
	});
	perm.permission |= permission;
	await guild.save();
	await perm.save();

	//put the permission in guildCfg
	if (!guildCfg.has(guildID)) {
		guildCfg.set(guildID, guild.get({ plain: true }));
		guildCfg.get(guildID).perms = [];
	}
	const g = guildCfg.get(guildID);
	let pIndex = g.perms.findIndex(v => v.entityType === entityType && v.entityID === entityID);
	if (pIndex === -1) pIndex = g.perms.push(perm.get({ plain: true })) - 1;
	else g.perms[pIndex] = perm.get({ plain: true });
	return true;
};

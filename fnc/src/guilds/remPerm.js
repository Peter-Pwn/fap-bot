const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);
const guildCfg = require(`${require.main.path}/src/guildCfg.js`);

//remove permission of a role or user
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

	const [perm] = await db.guildperms.findAll({
		include: ['guilds'],
		where: {
			guildID: guildID,
			entityID: entityID,
			entityType: entityType,
		},
	});
	if (!perm) throw fnc.Warn('permission not found.');
	perm.permission ^= permission;

	const g = guildCfg.get(guildID);
	if (!g) return false;
	const pIndex = g.perms.findIndex(v => v.entityType === entityType && v.entityID === entityID);
	if (!pIndex) return false;
	//no permissions left
	if (perm.permission === 0) {
		await perm.destroy();
		delete g.perms[pIndex];
	}
	else {
		await perm.save();
		g.perms[pIndex] = perm.get({ plain: true });
	}
	return true;
};

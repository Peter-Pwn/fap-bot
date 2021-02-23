const CON = require(`${require.main.path}/src/const.json`);
const cfg = require(`${require.main.path}/src/config.js`);

const guildCfg = require(`${require.main.path}/src/guildCfg.js`);

module.exports = function(user) {
	let perm = CON.PERMLVL.EVERYONE | (CON.PERMLVL.OWNER * cfg.owners.includes(user.id));
	if (user.guild) {
		const perms = guildCfg.has(user.guild.id) && guildCfg.get(user.guild.id).perms;
		//guild owner has all perms
		if (user.guild.owner.id === user.id) {
			perm |= CON.PERMLVL.ADMIN;
		}
		else if (perms && perms.length > 0) {
			for (const p of perms) {
				if (p.entityType === CON.ENTTYPE.USER && p.entityID === user.id || p.entityType === CON.ENTTYPE.ROLE && user.roles.cache.has(p.entityID)) perm |= p.permission ^ CON.PERMLVL.OWNER;
			}
		}
		//fallback to discord perms from config file
		else {
			perm |= (CON.PERMLVL.MOD * user.hasPermission(cfg.modPerm)) | (CON.PERMLVL.ADMIN * user.hasPermission(cfg.adminPerm));
		}
	}
	//give all lower permissions to mods an above
	if (perm >= CON.PERMLVL.MOD) perm |= Object.values(CON.PERMLVL).filter(v => v < perm).reduce((a, b) => a |= b, 0);
	return perm;
};

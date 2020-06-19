const CON = require('../../src/const.json');
const cfg = require('../../src/config.json');

module.exports = function(user) {
	let perm = CON.PERMLVL.EVERYONE;
	if (user.guild) perm |= (CON.PERMLVL.MOD * user.hasPermission(cfg.modPerm)) | (CON.PERMLVL.ADMIN * user.hasPermission(cfg.adminPerm));
	return perm |= (CON.PERMLVL.OWNER * cfg.owners.includes(user.id));
};

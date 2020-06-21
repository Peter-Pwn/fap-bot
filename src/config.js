module.exports = {
	appName: process.env.appName,
	appLongName: process.env.appLongName,
	debug: process.env.debug,
	logDir: process.env.logDir,
	prefix: process.env.prefix,
	owners: process.env.owners.split(','),
	adminPerm: process.env.adminPerm,
	modPerm: process.env.modPerm,
	token: process.env.token,
	db_URI: process.env.DATABASE_URL,
};

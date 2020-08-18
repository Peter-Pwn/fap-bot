let cfg = {};
try {
	const fs = require('fs');
	if (fs.existsSync(`${module.path}/config.json`)) {
		cfg = require('./config.json');
	}
	else {
		cfg = {
			appName: process.env.appName,
			appLongName: process.env.appLongName,
			debug: process.env.debug || false,
			logDir: process.env.logDir,
			prefix: process.env.prefix,
			owners: process.env.owners.split(','),
			adminPerm: process.env.adminPerm,
			modPerm: process.env.modPerm,
			token: process.env.token,
			db_URI: process.env.DATABASE_URL,
		};
	}
}
catch (e) {
	console.error(`Couldn't load config:\n${e.stack}`);
}

module.exports = cfg;

const fs = require('fs');

try {
	if (fs.existsSync(`${require.main.path}/src/config.json`)) {
		module.exports = require(`${require.main.path}/src/config.json`);
	}
	else if (process.env && process.env.appName) {
		module.exports = {
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
	else {
		throw new Error('No config found');
	}
}
catch (e) {
	//eslint-disable-next-line no-console
	console.error(`[ERROR] Couldn't load config:\n${e.stack}`);
	throw e;
}

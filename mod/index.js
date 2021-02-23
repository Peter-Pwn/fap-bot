//load functions from disc
const fs = require('fs');

const logger = require(`${require.main.path}/src/logger.js`);

const path = `${require.main.path}/mod/src`;
try {
	fs.readdirSync(path, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).forEach(dirent => {
		require(`${path}/${dirent.name}`);
	});
}
catch (e) {
	logger.error(`Couldn't load mod:\n${e.stack}`);
	throw e;
}

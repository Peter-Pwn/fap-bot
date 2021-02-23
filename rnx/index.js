//load message reactions from disc
const fs = require('fs');

const logger = require(`${require.main.path}/src/logger.js`);

try {
	fs.readdirSync(`${require.main.path}/rnx/src`).filter(file => file.endsWith('.js')).forEach(file => {
		module.exports[file.slice(0, -3)] = require(`./src/${file}`);
	});
}
catch (e) {
	logger.error(`Couldn't load reactions:\n${e.stack}`);
	throw e;
}

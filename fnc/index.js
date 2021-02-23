//load functions from disc
const fs = require('fs');

const logger = require(`${require.main.path}/src/logger.js`);

const path = `${require.main.path}/fnc/src`;
try {
	fs.readdirSync(path, { withFileTypes: true }).filter(dirent => dirent.isDirectory() || dirent.name.endsWith('.js')).forEach(dirent => {
		if (dirent.isDirectory()) {
			const dir = fs.readdirSync(`${path}/${dirent.name}`).filter(file => file.endsWith('.js'));
			if (dir.length > 0) {
				module.exports[dirent.name] = {};
				dir.forEach(file => {
					module.exports[dirent.name][file.slice(0, -3)] = require(`${path}/${dirent.name}/${file}`);
				});
			}
		}
		else {
			module.exports[dirent.name.slice(0, -3)] = require(`${path}/${dirent.name}`);
		}
	});
}
catch (e) {
	logger.error(`Couldn't load funktions:\n${e.stack}`);
	throw e;
}

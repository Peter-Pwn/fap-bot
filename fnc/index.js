//load functions from disc
const fs = require('fs');

const path = `${module.path}/src`;
const functions = {};
fs.readdirSync(path, { withFileTypes: true }).filter(dirent => dirent.isDirectory() || dirent.name.endsWith('.js')).forEach(dirent => {
	if (dirent.isDirectory()) {
		const dir = fs.readdirSync(`${path}/${dirent.name}`).filter(file => file.endsWith('.js'));
		if (dir.length > 0) {
			functions[dirent.name] = {};
			dir.forEach(file => {
				functions[dirent.name][file.slice(0, -3)] = require(`${path}/${dirent.name}/${file}`);
			});
		}
	}
	else {
		functions[dirent.name.slice(0, -3)] = require(`${path}/${dirent.name}`);
	}
});

module.exports = functions;

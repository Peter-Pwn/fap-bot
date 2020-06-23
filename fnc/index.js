//load functions from disc
try {
	const fs = require('fs');
	const functions = {};
	fs.readdirSync(`${module.path}/src`).filter(file => file.endsWith('.js')).forEach(file => {
		functions[file.slice(0, -3)] = require(`./src/${file}`);
	});
	module.exports = functions;
}
catch (e) {
	console.error(`[ERROR] Couldn't load functions:\n${e.stack}`);
}

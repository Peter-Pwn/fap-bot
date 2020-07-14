//load message reactions from disc
try {
	const fs = require('fs');
	const reactions = {};
	fs.readdirSync(`${module.path}/src`).filter(file => file.endsWith('.js')).forEach(file => {
		reactions[file.slice(0, -3)] = require(`./src/${file}`);
	});
	module.exports = reactions;
}
catch (e) {
	console.error(`[ERROR] Couldn't load reactions:\n${e.stack}`);
}

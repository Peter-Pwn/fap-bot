try {
	const fs = require('fs');
	module.exports = function(sequelize) {
		const db = {};
		fs.readdirSync(`${module.path}/src`).filter(file => file.endsWith('.js')).forEach(file => {
			db[file.slice(0, -3)] = sequelize.define(file.slice(0, -3), require(`./src/${file}`), { timestamps: false, freezeTableName: true });
		});
		return db;
	};
}
catch (e) {
	console.error(`Couldn't load functions:\n${e.stack}`);
}

//load db table models from disc
const fs = require('fs');

const sequelize = require(`${require.main.path}/src/sequelize.js`);

try {
	fs.readdirSync(`${module.path}/src`).filter(file => file.endsWith('.js')).reverse().forEach(file => {
		const table = require(`./src/${file}`);
		//strip sorting numbers
		const tblName = file.slice(file.indexOf('_') + 1, -3);
		if (!table.options) table.options = {};
		sequelize.define(tblName, table.attributes, Object.assign({
			timestamps: false,
			freezeTableName: true,
		}, table.options));
		if (table.associations) {
			for (const rel in table.associations) {
				table.associations[rel].forEach(tbl => {
					if (!tbl.options) tbl.options = {};
					if (typeof sequelize.models[tblName][rel] === 'function' && sequelize.models[tbl.table]) {
						sequelize.models[tblName][rel](sequelize.models[tbl.table], tbl.options);
					}
				});
			}
		}
	});
}
catch (e) {
	console.error(`[ERROR] Couldn't load database:\n${e.stack}`);
}

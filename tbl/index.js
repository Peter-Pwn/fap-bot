//load db table models from disc
const fs = require('fs');


const logger = require(`${require.main.path}/src/logger.js`);
const sequelize = require(`${require.main.path}/src/sequelize.js`);

try {
	fs.readdirSync(`${require.main.path}/tbl/src`).filter(file => file.endsWith('.js')).reverse().forEach(file => {
		const table = require(`${require.main.path}/tbl/src/${file}`);
		//strip sorting numbers
		const tblName = file.slice(file.indexOf('_') + 1, -3);
		if (!table.options) table.options = {};
		sequelize.define(tblName, table.attributes, table.options);
		if (table.associations) {
			for (const rel in table.associations) {
				table.associations[rel].forEach(tbl => {
					if (!tbl.options) tbl.options = {};
					if (typeof sequelize.models[tblName][rel] === 'function' && sequelize.models[tbl.table]) {
						sequelize.models[tblName][rel](sequelize.models[tbl.table], tbl.options);
						sequelize.models[tbl.table].belongsTo(sequelize.models[tblName], Object.assign({}, tbl.options, {
							as: tblName,
							targetKey: tbl.options.foreignKey,
							foreignKey: tbl.options.sourceKey,
							sourceKey: undefined,
						}));
					}
				});
			}
		}
	});
}
catch (e) {
	logger.error(`Couldn't load database:\n${e.stack}`);
	throw e;
}

const Sequelize = require('sequelize');

const cfg = require(`${require.main.path}/src/config.js`);

module.exports = new Sequelize(cfg.db_URI, {
	logging: false,
	define: {
		freezeTableName: true,
		timestamps: false,
		charset: 'utf8mb4',
		dialectOptions: { collate: 'utf8mb4' },
	},
	sync: {	alter: cfg.debug },
});

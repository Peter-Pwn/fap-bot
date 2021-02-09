const Sequelize = require('sequelize');

const cfg = require(`${require.main.path}/src/config.js`);

const sequelize = new Sequelize(cfg.db_URI, {
	logging: false,
	sync: {	alter: cfg.debug },
});

module.exports = sequelize;

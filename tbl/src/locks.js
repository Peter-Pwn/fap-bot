const Sequelize = require('sequelize');

module.exports = {
	channelID: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false,
	},
	memberID: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	limit: {
		type: Sequelize.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	permanent: {
		type: Sequelize.BOOLEAN,
		defaultValue: false,
		allowNull: false,
	},
};

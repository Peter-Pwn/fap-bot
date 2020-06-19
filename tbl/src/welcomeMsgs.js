const Sequelize = require('sequelize');

module.exports = {
	channelID: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false,
	},
	messageID: {
		type: Sequelize.STRING,
		unique: true,
		allowNull: false,
	},
	text: {
		type: Sequelize.TEXT,
		allowNull: false,
	},
	cmdList: {
		type: Sequelize.BOOLEAN,
		defaultValue: true,
		allowNull: false,
	},
};

const Sequelize = require('sequelize');

module.exports = {
	messageID: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	emojiID: {
		type: Sequelize.STRING,
		allowNull: false,
	},
	roleID: {
		type: Sequelize.STRING,
		allowNull: false,
	},
};

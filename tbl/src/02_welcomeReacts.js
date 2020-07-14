const Sequelize = require('sequelize');

module.exports = {
	attributes: {
		messageID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		emojiID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		roleID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
	},
	options: {
		indexes: [
			{
				fields: ['messageID'],
				unique: false,
			},
		],
	},
};

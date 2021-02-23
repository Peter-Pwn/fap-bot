const Sequelize = require('sequelize');

module.exports = {
	attributes: {
		messageID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		memberID: {
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

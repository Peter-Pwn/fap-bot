const Sequelize = require('sequelize');

module.exports = {
	attributes: {
		channelID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		memberID: {
			type: Sequelize.STRING(64),
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
	},
	options: {
		indexes: [
			{
				fields: ['channelID'],
				unique: true,
			},
		],
	},
};

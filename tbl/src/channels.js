const Sequelize = require('sequelize');

module.exports = {
	attributes: {
		channelID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		guildID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		type: {
			type: Sequelize.TINYINT,
			allowNull: false,
		},
		param1: {
			type: Sequelize.STRING(),
		},
		param2: {
			type: Sequelize.STRING(),
		},
	},
	options: {
		indexes: [
			{
				fields: ['channelID'],
				unique: false,
			},
			{
				fields: ['guildID'],
				unique: false,
			},
			{
				fields: ['type'],
				unique: false,
			},
		],
	},
};

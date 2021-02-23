const Sequelize = require('sequelize');

module.exports = {
	attributes: {
		guildID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		entityID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		entityType: {
			type: Sequelize.TINYINT,
			allowNull: false,
		},
		permission: {
			type: Sequelize.INTEGER,
			allowNull: false,
		},
	},
	options: {
		indexes: [
			{
				fields: ['guildID'],
				unique: false,
			},
		],
	},
};

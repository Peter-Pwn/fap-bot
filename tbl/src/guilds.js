const Sequelize = require('sequelize');

module.exports = {
	attributes: {
		guildID: {
			type: Sequelize.STRING(64),
			unique: true,
			allowNull: false,
		},
		prefix: {
			type: Sequelize.STRING(1),
		},
	},
	options: {
		indexes: [
			{
				fields: ['guildID'],
				unique: true,
			},
		],
	},
};

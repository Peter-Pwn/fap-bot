const Sequelize = require('sequelize');

module.exports = {
	attributes: {
		guildID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		prefix: {
			type: Sequelize.STRING(1),
		},
		locale: {
			type: Sequelize.STRING(3),
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
	associations: {
		hasMany: [
			{
				table: 'guildperms',
				options: {
					as: 'perms',
					sourceKey: 'guildID',
					foreignKey: 'guildID',
				},
			},
		],
	},
};

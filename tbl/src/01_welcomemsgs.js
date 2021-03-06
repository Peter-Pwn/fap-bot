const Sequelize = require('sequelize');

module.exports = {
	attributes: {
		channelID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		messageID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		text: {
			type: Sequelize.TEXT,
			allowNull: false,
		},
		cmdList: {
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
			{
				fields: ['messageID'],
				unique: true,
			},
		],
	},
	associations: {
		hasMany: [
			{
				table: 'welcomereacts',
				options: {
					as: 'reacts',
					sourceKey: 'messageID',
					foreignKey: 'messageID',
				},
			},
		],
	},
};

const Sequelize = require('sequelize');
const moment = require('moment');

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
		title: {
			type: Sequelize.STRING,
			allowNull: false,
		},
		description: {
			type: Sequelize.TEXT,
		},
		count: {
			type: Sequelize.INTEGER,
			allowNull: false,
		},
		time: {
			type: Sequelize.STRING(25),
			allowNull: false,
			get() {
				return moment.parseZone(this.getDataValue('time') || 0);
			},
			set(val) {
				this.setDataValue('time', val instanceof moment ? val.format() : val);
			},
		},
		repeat: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		roleID: {
			type: Sequelize.STRING(64),
		},
	},
	options: {
		indexes: [
			{
				fields: ['messageID'],
				unique: true,
			},
		],
	},
	associations: {
		hasMany: [
			{
				table: 'raidmembers',
				options: {
					as: 'members',
					sourceKey: 'messageID',
					foreignKey: 'messageID',
				},
			},
		],
	},
};

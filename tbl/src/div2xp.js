const Sequelize = require('sequelize');
const moment = require('moment');

module.exports = {
	attributes: {
		uplayID: {
			type: Sequelize.STRING(36),
			allowNull: false,
		},
		uplayName: {
			type: Sequelize.STRING(16),
			allowNull: false,
		},
		guildID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		memberID: {
			type: Sequelize.STRING(64),
			allowNull: false,
		},
		cXP: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		lastUpdate: {
			type: Sequelize.STRING(25),
			allowNull: false,
			get() {
				return moment.parseZone(this.getDataValue('lastUpdate') || 0);
			},
			set(val) {
				this.setDataValue('lastUpdate', val instanceof moment ? val.format() : val);
			},
		},
		cXPSnapshot: {
			type: Sequelize.INTEGER,
			defaultValue: 0,
			allowNull: false,
		},
		lastSnapshot: {
			type: Sequelize.STRING(25),
			allowNull: false,
			get() {
				return moment.parseZone(this.getDataValue('lastSnapshot'));
			},
			set(val) {
				this.setDataValue('lastSnapshot', val instanceof moment ? val.format() : val);
			},
		},
		failed: {
			type: Sequelize.TINYINT,
			defaultValue: 0,
			allowNull: false,
		},
	},
	options: {
		indexes: [
			{
				fields: ['uplayID', 'guildID'],
				unique: false,
			},
			{
				fields: ['uplayName'],
				unique: false,
			},
		],
	},
};

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
	},
	options: {
		indexes: [
			{
				fields: ['channelID'],
				unique: false,
			},
			{
				fields: ['messageID'],
				unique: true,
			},
		],
	},
};

const moment = require('moment');

const CON = require(`${require.main.path}/src/const.json`);

const getTime = require(`${require.main.path}/fnc/src/getTime.js`);

//get the div2 xp reset day of the week
module.exports = function(date = moment()) {
	if (date instanceof moment) {
		if (date.isoWeekday() <= CON.DIV2XPRST.DAY && getTime(date).isBefore(getTime([CON.DIV2XPRST.HOUR, CON.DIV2XPRST.MINUTE]))) {
			date.subtract(1, 'w');
		}
		date.isoWeekday(CON.DIV2XPRST.DAY).hour(CON.DIV2XPRST.HOUR).minute(CON.DIV2XPRST.MINUTE);
	}
	return date;
};

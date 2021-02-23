const moment = require('moment');

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

//get the div2 xp reset day of the week
module.exports = function(date = moment()) {
	if (!(date instanceof moment)) date = moment();
	if (date.isoWeekday() < CON.DIV2XPRST.DAY || date.isoWeekday() === CON.DIV2XPRST.DAY && fnc.getTime(date).isBefore(fnc.getTime([CON.DIV2XPRST.HOUR, CON.DIV2XPRST.MINUTE]))) {
		date.subtract(1, 'w');
	}
	date.isoWeekday(CON.DIV2XPRST.DAY).hour(CON.DIV2XPRST.HOUR).minute(CON.DIV2XPRST.MINUTE).second(0).millisecond(0);
	return date;
};

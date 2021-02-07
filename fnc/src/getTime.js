const moment = require('moment');

//gets only the time part of a moment
module.exports = function(date) {
	let time = moment(0).hour(0);
	if (date instanceof moment) {
		time.set({
			h: date.hour(),
			m: date.minute(),
			s: date.seconds(),
			ms: date.millisecond(),
		});
	}
	else if (Array.isArray(date)) {
		time = moment([time.year(), time.month(), time.date(), date].flat());
	}
	else if (date) {
		time.set(date);
	}
	return time;
};

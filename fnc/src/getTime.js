const moment = require('moment');

//gets only the time part of a moment
module.exports = function(date, utc = false) {
	let time = moment(0).hour(0);
	if (date instanceof moment) {
		time = date.clone().set({
			year: time.year(),
			month: time.month(),
			date: time.date(),
		});
	}
	else if (Array.isArray(date)) {
		date = [time.year(), time.month(), time.date(), date].flat();
		if (utc) time = moment.utc(date);
		else time = moment(date);
	}
	else if (date) {
		if (utc) time.utc();
		time.set(date);
	}
	return time;
};

module.exports = function(arg) {
	if (!arg) arg = '';
	return ['true', 't', 'yes', 'y', '1'].includes(arg.toString().toLowerCase());
};

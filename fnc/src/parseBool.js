module.exports = function(arg) {
	if (!arg) arg = '';
	return ['true', 't', 'yes', 'y', 'j', 'ja', '1'].includes(arg.toString().toLowerCase());
};

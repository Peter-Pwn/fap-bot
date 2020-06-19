module.exports = function(arg) {
	arg = arg.toString().toLowerCase();
	return (arg === 'true' || arg === 't' || arg === 'yes' || arg === 'y' || arg == 1);
};

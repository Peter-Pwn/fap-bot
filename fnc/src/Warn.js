module.exports = function(message) {
	const Warn = new Error(message);
	Warn.name = 'Warn';
	Warn.file = null;
	const file = Warn.stack && Warn.stack.match(/\(.+\)/g);
	if (file) Warn.file = file[1].slice(1, -1);
	Warn.stack = null;
	return Warn;
};

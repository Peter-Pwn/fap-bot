module.exports = {
	load: function() {
		if (require.resolve('./src/bot.js')) delete require.cache[require.resolve('./src/bot.js')];
		require('./src/bot.js');
	},
};

module.exports.load();

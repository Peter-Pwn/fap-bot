module.exports = {
	load: function() {
		if (require.resolve('./src/bot.js')) delete require.cache[require.resolve('./src/bot.js')];
		//TODO:reload mods
		require('./src/bot.js');
		require('./mod/index.js');
	},
};

module.exports.load();

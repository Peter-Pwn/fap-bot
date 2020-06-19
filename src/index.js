module.exports = {
	reload: function() {
		if (require.resolve('./fap.js')) delete require.cache[require.resolve('./fap.js')];
		require('./fap.js');
	},
};

module.exports.reload();

const CON = require(`${require.main.path}/src/const.json`);

const replyExt = require(`${require.main.path}/fnc/src/replyExt.js`);

module.exports = function(message, text, { mention = true, delMsg = true, delay = 5, color = CON.TEXTCLR.WARN } = {}) {
	return new Promise((resolve, reject) => {
		replyExt(message, text, { mention, delMsg, delay, color })
			.then(r => resolve(r))
			.catch(e => reject(e));
	});
};

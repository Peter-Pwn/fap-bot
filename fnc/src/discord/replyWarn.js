const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

module.exports = async function(message, text, { mention = true, delMsg = true, delay = 5, color = CON.TEXTCLR.WARN, isError = false } = {}) {
	if (isError && color === CON.TEXTCLR.WARN) color = CON.TEXTCLR.ERROR;
	return await fnc.discord.replyExt(message, text, { mention, delMsg, delay, color });
};

const CON = require(`${require.main.path}/src/const.json`);
const cfg = require(`${require.main.path}/src/config.js`);

const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	description: 'Displays some info about the bot.',
	args: 0,
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.OWNER,
	cooldown: 3,
	deleteMsg: true,
	async execute(message) {
		const package = require(`${require.main.path}/package.json`);
		let text = `**${cfg.appLongName}**`;
		text += `\nVersion: ${package.version}`;
		delete require.cache[require.resolve(`${require.main.path}/package.json`)];
		fnc.discord.replyExt(message, text, { mention: false, delay: 2 }).catch(() => null);
		return true;
	},
};

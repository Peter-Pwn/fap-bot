const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

const reacts = require(`${require.main.path}/src/reacts.js`);

module.exports = {
	description: 'Sets a welcome message in this channel.',
	descriptionLong: 'You can let the bot append a list of all the commands available for everyone.',
	args: 1,
	usage: '<message> [append command list (default: true)] [pin message (default: true)]',
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args) {
		let text = args[0];
		if (typeof args[1] === 'undefined') args[1] = true;
		args[1] = fnc.parseBool(args[1]);
		if (args[1]) {
			fnc.getCmdList('text', CON.PERMLVL.EVERYONE).forEach(cmd => {
				text += `\n● \`${fnc.guilds.getPrefix(message.guild)}${cmd[0]}\` ${cmd[1]}`;
			});
		}
		if (typeof args[2] === 'undefined') args[2] = true;
		args[2] = fnc.parseBool(args[2]);

		const [welcomeMsg, isNewRecord] = await db.welcomemsgs.findOrBuild({
			where: {
				channelID: message.channel.id,
			},
		});
		let disMsg = null;
		if (!isNewRecord) {
			try {
				disMsg = await message.channel.messages.fetch(welcomeMsg.messageID);
				await disMsg.edit(text);
			}
			catch (e) {
				reacts.delete(welcomeMsg.messageID);
			}
		}
		if (!disMsg) {
			disMsg = await message.channel.send(text);
			if (args[2]) await disMsg.pin();
			welcomeMsg.channelID = message.channel.id;
			welcomeMsg.messageID = disMsg.id;
		}
		welcomeMsg.text = args[0];
		welcomeMsg.cmdList = args[1];
		welcomeMsg.save();
		return true;
	},
};

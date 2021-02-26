const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);
const db = require(`${require.main.path}/src/db.js`);

//populates event, etc. channels
module.exports = async function() {
	//TODO: populate only a type of channels
	const channels = await db.channels.findAll();
	for (const channel of channels) {
		try {
			try {
				await client.channels.fetch(channel.channelID);
			}
			catch (e) {
				channel.destroy();
				continue;
			}
			if (channel.type === CON.CHTYPE.DIV2XP) await fnc.div2xp.populate(channel);
			else if (channel.type === CON.CHTYPE.EVENT) ;
		}
		catch (e) {
			logger.warn(e);
			continue;
		}
	}
	return true;
};

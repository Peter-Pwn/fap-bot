const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);

//populates event, etc. channels
module.exports = async function() {
	//TODO: populate only a type of channels
	const channels = await db.channels.findAll();
	for (const channel of channels) {
		try {
			if (channel.type === CON.CHTYPE.DIV2XP) await fnc.div2xp.populate(channel);
			else if (channel.type === CON.CHTYPE.EVENT) ;
		}
		catch (e) {
			//TODO: fetch channel and delete it from db if not found (maybe?!)
			continue;
		}
	}
	return true;
};

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);

//populates event, etc. channels
module.exports = async function(type = null) {
	//TODO: populate only a type of channels
	const channels = await db.channels.findAll();
	for (const channel of channels) {
		//TODO: fetch channel and delete it from db if not found (maybe?!)
		if (channel.type === CON.CHTYPE.DIV2XP) await fnc.div2xp.populate(channel);
		else if (channel.type === CON.CHTYPE.EVENT) ;
	}
	return true;
};

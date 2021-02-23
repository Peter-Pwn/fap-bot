const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const db = require(`${require.main.path}/src/db.js`);

//removes a channel to the list and sets the type (event, xp)
module.exports = async function(channelID, type) {
	if (!channelID) throw new TypeError('no channelID');
	if (Object.values(CON.CHTYPE).indexOf(type) === -1) throw new TypeError('no valid type');
	const count = await	db.channels.destroy({
		where: {
			channelID: channelID,
			type: type,
		},
	});
	if (count === 0) return fnc.Warn('the channel does not exists in the list.');
	return true;
};

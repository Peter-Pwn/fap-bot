const CON = require(`${require.main.path}/src/const.json`);

const Warn = require(`${require.main.path}/fnc/src/Warn.js`);

//removes a channel to the list and sets the type (event, xp)
module.exports = function(client, channelID, type) {
	return new Promise((resolve, reject) => {
		if (Object.values(CON.CHTYPE).indexOf(type) === -1) return reject(Warn('no valid type'));
		client.db.channels.destroy({
			where: {
				channelID: channelID,
				type: type,
			},
		})
			.then(count => {
				if (count === 0) return reject(Warn('the channel does not exists in the list.'));
				resolve();
			})
			.catch(e => reject(e));
	});
};

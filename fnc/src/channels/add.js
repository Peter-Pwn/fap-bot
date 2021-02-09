const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);

const Warn = require(`${require.main.path}/fnc/src/Warn.js`);

//adds a channel to the list and sets the type (event, xp)
module.exports = function(guildID, channelID, type, { param1 = null, param2 = null } = {}) {
	return new Promise((resolve, reject) => {
		if (Object.values(CON.CHTYPE).indexOf(type) === -1) return reject(Warn('no valid type'));
		db.channels.findOrBuild({
			where: {
				channelID: channelID,
				type: type,
			},
			limit: 1,
		})
			.then(([channel]) => {
				channel.guildID = guildID;
				channel.param1 = param1;
				channel.param2 = param2;
				channel.save()
					.then(() => resolve(channel.get({ raw: true })))
					.catch(e => reject(e));
			})
			.catch(e => reject(e));
	});
};

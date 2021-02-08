const CON = require(`${require.main.path}/src/const.json`);

const div2xp = { populate: require(`${require.main.path}/fnc/src/div2xp/populate.js`) };

//fetches and populates event, etc. channels
module.exports = function(client) {
	return new Promise((resolve, reject) => {
		const promises = [];
		client.db.channels.findAll()
			.then(channels => {
				for (const channel of channels) {
					promises.push(new Promise((resolve) => {
						if (channel.type === CON.CHTYPE.EVENT) {
							//do events here
							resolve();
						}
						else if (channel.type === CON.CHTYPE.DIV2XP) {
							div2xp.populate(client, channel)
								.catch(() => null)
								.finally(() => resolve());
						}
					}));
				}
			})
			.catch(e => reject(e));
		Promise.allSettled(promises)
			.then(() => resolve());
	});
};

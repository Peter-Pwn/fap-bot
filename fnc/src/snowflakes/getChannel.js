const Warn = require(`${require.main.path}/fnc/src/Warn.js`);

//checks if the given parameter is a channel name or snowflake and returns the discord channels snowflake
module.exports = function(client, channel, guild) {
	return new Promise((resolve, reject) => {
		//<#718051019996528755>
		new Promise((resolve, reject) => {
			if (parseInt(channel) > 0) {
				resolve(channel);
			}
			else {
				const mention = channel.match(/^<(?:#(\d+))>$/);
				if (mention) {
					resolve(mention[1]);
				}
				else {
					client.guilds.fetch(guild)
						.then(g => {
							channel = channel.replace(/^#/, '');
							const c = g.channels.cache.find(cf => cf.name === channel);
							if (c) resolve(c.id);
							else reject(Warn('channel name not found.'));
						})
						.catch(e => reject(e));
				}
			}
		})
			.then(snowflake => {
				if (snowflake) {
					client.channels.fetch(snowflake)
						.then(() => resolve(snowflake))
						.catch(() => reject(Warn('channel not found.')));
				}
				else {
					reject(Warn('channel not found.'));
				}
			})
			.catch(e => reject(e));
	});
};

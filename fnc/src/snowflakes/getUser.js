const client = require(`${require.main.path}/src/client.js`);

const Warn = require(`${require.main.path}/fnc/src/Warn.js`);

//checks if the given parameter is a username or snowflake and returns the discord users snowflake
module.exports = function(user, guild = null) {
	return new Promise((resolve, reject) => {
		//<@!578580428349505536>
		new Promise((resolve, reject) => {
			if (parseInt(user) > 0) {
				resolve(user);
			}
			else {
				const mention = user.match(/^<(?:@!?(\d+))>$/);
				if (mention) {
					resolve(mention[1]);
				}
				else {
					user = user.replace(/^@/, '');
					//TODO: add finding by tag
					if (guild) {
						client.guilds.fetch(guild)
							.then(g => {
								g.members.fetch({ query: user })
									.then(() => {
										const u = g.members.cache.find(uf => uf.displayName === user);
										if (u) resolve(u.id);
										else reject(Warn('user name not found.'));
									})
									.catch(e => reject(e));
							})
							.catch(e => reject(e));
					}
					else {
						const u = client.users.cache.find(uf => uf.username === user);
						if (u) resolve(u.id);
						else reject(Warn('user name not found.'));
					}
				}
			}
		})
			.then(snowflake => {
				if (snowflake) {
					client.users.fetch(snowflake)
						.then(() => resolve(snowflake))
						.catch(() => reject(Warn('user not found.')));
				}
				else {
					reject(Warn('user not found.'));
				}
			})
			.catch(e => reject(e));
	});
};

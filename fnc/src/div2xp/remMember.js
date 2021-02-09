const db = require(`${require.main.path}/src/db.js`);

const Warn = require(`${require.main.path}/fnc/src/Warn.js`);

//remove guild member from the XP list
module.exports = function(guildID, uplayName) {
	return new Promise((resolve, reject) => {
		db.div2xp.destroy({
			where: {
				uplayName: uplayName,
				guildID: guildID,
			},
		})
			.then(count => {
				if (count === 0) return reject(Warn(`\`${uplayName}\` does not exists in the list.`));
				resolve();
			})
			.catch(e => reject(e));
	});
};

const Sequelize = require('sequelize');

const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);

//get probably wrong uplay names
module.exports = function(guildID) {
	return new Promise((resolve, reject) => {
		db.div2xp.findAll({
			attributes: ['uplayName', 'memberID'],
			where: {
				guildID: guildID,
				failed: { [Sequelize.Op.gte]: CON.DIV2XPMFAILS },
			},
			raw: true,
		})
			.then(members => resolve(members))
			.catch(e => reject(e));
	});
};

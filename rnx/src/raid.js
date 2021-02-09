const client = require(`${require.main.path}/src/client.js`);
const db = require(`${require.main.path}/src/db.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	add: function(reaction, user) {
		if (reaction.emoji.name === '✅') {
			const raid = client.raids.get(reaction.message.id);
			if (raid.members.findIndex(m => m.memberID === user.id) > -1) return;
			const member = db.raidMembers.build({ messageID: reaction.message.id, memberID: user.id });
			raid.members.push(member.get({ plain: true }));
			reaction.message.edit(reaction.message.content, { embed: fnc.getRaidEmbed(reaction.message.channel, raid) });
			member.raidId = raid.id;
			member.save();
		}
		else if (reaction.emoji.name === '🆔') {
			if (fnc.getPerms(reaction.message.guild.members.cache.get(user.id)) & CON.PERMLVL.MOD) fnc.replyExt(reaction.message, `raid message id: ${reaction.message.id}`, { mention: false });
			reaction.users.remove(user.id);
		}
	},
	remove: function(reaction, user) {
		if (reaction.emoji.name === '✅') {
			const raid = client.raids.get(reaction.message.id);
			const index = raid.members.findIndex(m => m.memberID === user.id);
			if (index === -1) return;
			raid.members.splice(index, 1);
			reaction.message.edit(reaction.message.content, { embed: fnc.getRaidEmbed(reaction.message.channel, raid) });
			db.raidMembers.destroy({ where: { messageID: reaction.message.id, memberID: user.id } });
		}
	},
};

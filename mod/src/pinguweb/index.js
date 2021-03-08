const Events = require('events');
const axios = require('axios');
const moment = require('moment');

const cfgTpa = require('./config.json');
if (!cfgTpa.run) return;

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);

const pinguWeb = new Events();
const tpaWeb = axios.create(cfgTpa.webServer);
let lastCheck = moment(0);

const updateMem = async function() {
	//fetch members from the webserver, add new players to the xp list and remove those that were not supplied
	const members = await fnc.div2xp.listMembers(cfgTpa.guild);
	const response = await tpaWeb.post('AllMember', {
		gameId: 1,
		lastModified: lastCheck,
	});
	if (!response || response.status !== 200) return false;
	for (const member of response.data) {
		try {
			if (!member.Ubisoft) {
				if (cfgTpa.log) logger.warn('pinguweb: missing a uplay account.');
				continue;
			}
			const idx = members.findIndex(v => v.uplayName.toLowerCase() === member.Ubisoft.nickname.toLowerCase());
			if (member.isMember) {
				const character = member.Ubisoft.games['1'].characters;
				if (character[Object.keys(character)[0]].isMember && idx === -1) {
					if (!member.Discord) {
						if (cfgTpa.log) logger.warn(`pinguweb: \`${member.Ubisoft.nickname}\` is missing a discord account.`);
						continue;
					}
					try {
						await fnc.div2xp.addMember(cfgTpa.guild, member.Discord.officialAccountId, member.Ubisoft.nickname);
					}
					catch (e) {
						if (e.name === 'Warn' && e.code === CON.ERRCDE.RENAMED) {
							if (cfgTpa.log) logger.info(`pinguweb: ${e.message}`);
							continue;
						}
						throw e;
					}
					if (cfgTpa.log) logger.info(`pinguweb: \`${member.Ubisoft.nickname}\` added to clan xp list.`);
				}
				else if (!character[Object.keys(character)[0]].isMember && idx >= 0) {
					await fnc.div2xp.remMember(cfgTpa.guild, member.Ubisoft.nickname);
					if (cfgTpa.log) logger.info(`pinguweb: \`${member.Ubisoft.nickname}\` removed from clan xp list.`);
				}

			}
			else if (idx >= 0) {
				await fnc.div2xp.remMember(cfgTpa.guild, member.Ubisoft.nickname);
				if (cfgTpa.log) logger.info(`pinguweb: \`${member.Ubisoft.nickname}\` removed from clan xp list.`);
			}
		}
		catch (e) {
			if (cfgTpa.log) logger.warn(`pinguweb: ${e}`);
			continue;
		}
	}
	lastCheck = moment();
};


client.once('ready', () => {
	client.setInterval(() => pinguWeb.emit('mainInterval'), cfgTpa.mainInterval);
	//pinguWeb.emit('mainInterval', true);
});

client.on('div2xpUpdate', async playerData => {
	try {
		const data = playerData.map(v => {
			let activity = v.cXP - v.cXPSnapshot;
			if (activity < 0) activity = 0;
			return {
				gameId: 1,
				accountTypName: 'Ubisoft',
				officialAccountId: v.uplayID,
				accountName: v.uplayName,
				dateTime: v.lastUpdate.format(),
				value: activity,
			};
		});
		const response = await tpaWeb.post('Activity', { activities: data });
		if (!response || response.status !== 200) throw new Error('request failed.');
	}
	catch (e) {
		if (cfgTpa.log) logger.warn(`pinguweb: ${e}`);
	}
});

pinguWeb.on('mainInterval', async () => {
	try {
		await updateMem();


	}
	catch (e) {
		logger.error(`pinguweb: ${e}`);
	}
});

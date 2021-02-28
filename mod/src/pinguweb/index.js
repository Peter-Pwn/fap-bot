const Events = require('events');
const axios = require('axios');
const moment = require('moment');

const cfgTpa = require('./config.json');
if (!cfgTpa.run) return;

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);

const pinguweb = new Events();
const tpaWeb = axios.create(cfgTpa.webServer);
let lastCheck = moment(0);

client.once('ready', () => {
	client.setInterval(() => pinguweb.emit('mainInterval'), cfgTpa.mainInterval);
	pinguweb.emit('mainInterval', true);
});

pinguweb.on('mainInterval', async () => {
	try {
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
					if (!member.Discord) {
						if (cfgTpa.log) logger.warn(`pinguweb: \`${member.Ubisoft.nickname}\` is missing a discord account.`);
						continue;
					}
					const character = member.Ubisoft.games['1'].characters;
					if (character[Object.keys(character)[0]].isMember && idx === -1) {
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
	}
	catch (e) {
		logger.error(`pinguweb: ${e}`);
	}
});

/*
[
  { uplayName: 'panterthelegend', memberID: '724273492568309860' },
  { uplayName: 'Happalula', memberID: '681662794071932974' },
  { uplayName: 'eaetom', memberID: '595341356432621573' },
  { uplayName: 'PeterPwn247', memberID: '578580428349505536' },
  { uplayName: 'berserkAries', memberID: '118844909787545605' }
]

[
	{
    isMember: true,
    Ubisoft: {
      nickname: 'XxX_AzzFace_XxX',
      officialAccountId: '25213a34-7f2a-490c-b89a-398ceb0a7bec',
      games: [Object]
    },
    Discord: {
      nickname: 'AssFace | Daniel#0538',
      officialAccountId: '487953917590634506'
    }
  },
]
*/

const Events = require('events');
const axios = require('axios');

const cfgTpa = require('./config.json');
if (!cfgTpa.run) return;

const fnc = require(`${require.main.path}/fnc`);

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);

const pinguweb = new Events();
const tpaWeb = axios.create(cfgTpa.webServer);

client.once('ready', () => {
	client.setInterval(() => pinguweb.emit('mainInterval'), cfgTpa.mainInterval);
	//pinguweb.emit('mainInterval', true);
});

pinguweb.on('mainInterval', async () => {
	try {
		//fetch members from the webserver, add new players to the xp list and remove those that were not supplied
		const members = await fnc.div2xp.listMembers(cfgTpa.guild);
		const response = await tpaWeb.post('AllMember', { gameId: 1 });
		if (!response || response.status !== 200) return false;
		for (const member of response.data) {
			try {
				if (!member.Ubisoft) {
					if (cfgTpa.log) logger.warn(`pinguweb: \`${member.Discord.nickname}\` is missing a uplay account.`);
					continue;
				}
				if (!member.Discord) {
					if (cfgTpa.log) logger.warn(`pinguweb: \`${member.Ubisoft.nickname}\` is missing a discord account.`);
					continue;
				}
				const idx = members.findIndex(v => v.uplayName.toLowerCase() === member.Ubisoft.nickname.toLowerCase());
				if (idx === -1) {
					await fnc.div2xp.addMember(cfgTpa.guild, member.Discord.officialAccountId, member.Ubisoft.nickname);
					if (cfgTpa.log) logger.info(`pinguweb: \`${member.Ubisoft.nickname}\` added to clan xp list.`);
				}
				else {
					members.splice(idx, 1);
				}
			}
			catch (e) {
				if (cfgTpa.log) logger.warn(`pinguweb: ${e}`);
				continue;
			}
		}
		for (const member of members) {
			try {
				await fnc.div2xp.remMember(cfgTpa.guild, member.uplayName);
				if (cfgTpa.log) logger.info(`pinguweb: \`${member.uplayName}\` removed from clan xp list.`);
			}
			catch (e) {
				if (cfgTpa.log) logger.warn(`pinguweb: ${e}`);
				continue;
			}
		}
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
    Ubisoft: {
      nickname: 'PeterPwn247',
      officialAccountId: '00b3f464-52e7-4718-af49-fceecccf46ca'
    },
    Discord: {
      nickname: 'Peter Pwn#9566',
      officialAccountId: '578580428349505536'
    }
  },

]
*/

const CON = require(`${require.main.path}/src/const.json`);

const fnc = require(`${require.main.path}/fnc`);

const guildCfg = require(`${require.main.path}/src/guildCfg.js`);

const validPerms = Object.keys(CON.PERMLVL).filter(v => CON.PERMLVL[v] > CON.PERMLVL.EVERYONE && CON.PERMLVL[v] < CON.PERMLVL.OWNER).join('`, `');
module.exports = {
	aliases: ['guildperms'],
	description: 'Handles permissions of the guild.',
	modes: {
		list: {
			isDefault: true,
			description: 'Lists the permissions of the guild.',
		},
		check: {
			description: 'Checks the permission for a role or user.',
			args: 1,
			usage: '<@role or @user>',
		},
		add: {
			description: 'Adds the permission for a role or user.',
			descriptionLong: `Valid permissions are \`${validPerms}\`.`,
			args: 2,
			usage: '<@role or @user> <permission>',
		},
		remove: {
			description: 'Removes the permission from role or user.',
			descriptionLong: `Valid permissions are \`${validPerms}\`.`,
			args: 2,
			usage: '<@role or @user> <permission>',
		},
	},
	msgType: CON.MSGTYPE.TEXT,
	permLvl: CON.PERMLVL.ADMIN,
	cooldown: 3,
	deleteMsg: true,
	async execute(message, args, mode) {
		if (mode === 'check') {
			let entityID = '';
			let entity = null;
			let perms = CON.PERMLVL.EVERYONE;
			try {
				//user
				if (args[0].match(/^<(?:@!?(\d+))>$/)) {
					entityID = await fnc.snowflakes.getUser(args[0], message.guild.id);
					entity = await message.guild.members.fetch(entityID);
					perms = fnc.guilds.getPerms(entity);
				}
				//role
				else {
					entityID = await fnc.snowflakes.getRole(args[0], message.guild.id);
					entity = await message.guild.roles.fetch(entityID);
					const p = guildCfg.has(message.guild.id) && guildCfg.get(message.guild.id).perms.find(v => v.entityType = CON.ENTTYPE.ROLE && v.entityID === entityID);
					if (p) perms |= p.permission;
				}
			}
			catch (e) {
				throw fnc.Warn(`\`${args[0]}\` not found.`);
			}
			fnc.discord.replyExt(message, `${entity} has these permissions:\n\`${Object.keys(CON.PERMLVL).filter(v => CON.PERMLVL[v] & perms).join('`, `')}\``, { mention: false }).catch(() => null);
		}
		else if (mode === 'add' || mode === 'remove') {
			let entityID = '';
			let entity = null;
			let entityType = 0;
			try {
			//user
				if (args[0].match(/^<(?:@!?(\d+))>$/)) {
					entityID = await fnc.snowflakes.getUser(args[0], message.guild.id);
					entity = await message.guild.members.fetch(entityID);
					entityType = CON.ENTTYPE.USER;
				}
				//role
				else {
					entityID = await fnc.snowflakes.getRole(args[0], message.guild.id);
					entity = await message.guild.roles.fetch(entityID);
					entityType = CON.ENTTYPE.ROLE;
				}
			}
			catch (e) {
				throw fnc.Warn(`\`${args[0]}\` not found.`);
			}
			const permission = CON.PERMLVL[Object.keys(CON.PERMLVL).filter(v => CON.PERMLVL[v] > CON.PERMLVL.EVERYONE && CON.PERMLVL[v] < CON.PERMLVL.OWNER).find(v => v === args[1].toUpperCase())];
			if (!permission) throw fnc.Warn(`${args[1]} is not a valid permission.\nValid permissions are \`${validPerms}\`.`);
			if (mode === 'add') {
				await fnc.guilds.addPerm(message.guild.id, entityID, entityType, permission);
				fnc.discord.replyExt(message, `\`${args[1].toUpperCase()}\` was successfully added to ${entity}.`).catch(() => null);
			}
			else {
				await fnc.guilds.remPerm(message.guild.id, entityID, entityType, permission);
				fnc.discord.replyExt(message, `\`${args[1].toUpperCase()}\` was successfully removed from ${entity}.`).catch(() => null);
			}
		}
		else {
			const perms = await fnc.guilds.listPerms(message.guild.id);
			perms.sort((a, b) => a.permission > b.permission && -1 || a.permission < b.permission && 1 || 0);
			perms.sort((a, b) => a.entityType > b.entityType && -1 || a.entityType < b.entityType && 1 || 0);
			let text = '**List of the bot permissions**\n';
			let type = '';
			for (const perm of perms) {
				if (type !== Object.keys(CON.ENTTYPE).find(v => CON.ENTTYPE[v] === perm.entityType)) {
					type = Object.keys(CON.ENTTYPE).find(v => CON.ENTTYPE[v] === perm.entityType);
					text += `**${type}**\n`;
				}
				let entity = null;
				if (perm.entityType === CON.ENTTYPE.USER) entity = await message.guild.members.fetch(perm.entityID);
				else entity = await message.guild.roles.fetch(perm.entityID);
				text += `${entity} \`${Object.keys(CON.PERMLVL).filter(v => CON.PERMLVL[v] & perm.permission).join('`, `')}\`\n`;
			}
			fnc.discord.replyExt(message, text, { mention: false }).catch(() => null);
		}
		return true;
	},
};

const fs = require('fs');

const loadCmd = require(`${require.main.path}/cmd/load.js`);

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

const commands = require(`${require.main.path}/cmd`);

module.exports = {
	aliases: ['r'],
	description: 'Reloads the bot or a single command or function.',
	descriptionLong: 'If you don\'t provide a prefix (c: or f:) the argument is handled as a command name.',
	args: 0,
	usage: '[c:command|f:function]',
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.OWNER,
	cooldown: 10,
	deleteMsg: false,
	async execute(message, args) {
		if (args.length) {
			if (args[0].startsWith('f:')) {
				args[0] = args[0].replace(/^f:/, '');
				const func = args[0].match(/(\w+)\.?(\w+)?/);
				if (!func) throw fnc.Warn(`${args[0]} is not a function`);
				if (func[2]) {
					//function with .
					if (typeof fnc[func[1]] !== 'object' && typeof fnc[func[1]][func[2]] !== 'function') throw fnc.Warn(`\`${args[0]}\` is not a function`);
					logger.info(`'${message.author.tag}' is reloading function '${args[0]}'`);
					delete require.cache[require.resolve(`${require.main.path}/fnc/src/${func[1]}/${func[2]}.js`)];
					fnc[func[1]][func[2]] = require(`${require.main.path}/fnc/src/${func[1]}/${func[2]}.js`);
				}
				else {
					//normal function
					if (typeof fnc[func[1]] !== 'function') throw fnc.Warn(`\`${args[0]}\` is not a function`);
					logger.info(`'${message.author.tag}' is reloading function '${args[0]}'`);
					delete require.cache[require.resolve(`${require.main.path}/fnc/src/${func[1]}.js`)];
					fnc[func] = require(`${require.main.path}/fnc/src/${func[1]}.js`);
				}
				fnc.discord.replyExt(message, `function \`${args[0]}\` was successfully reloaded`).catch(() => null);
				if (message.channel.type === 'text') message.delete();
			}
			else {
				//command
				args[0] = args[0].replace(/^c:/, '').toLowerCase();
				try {
					const command = commands.get(args[0]);
					if (!command) throw fnc.Warn(`${args[0]} is not a command`);
					logger.info(`'${message.author.tag}' is reloading command '${command.name}'`);
					delete require.cache[require.resolve(`${require.main.path}/cmd/src/${command.file}`)];
					const newCommand = loadCmd([command.name, command.file]);
					commands.set(command.name, newCommand);
					fnc.discord.replyExt(message, `command \`${command.name}\` was successfully reloaded`).catch(() => null);
					if (message.channel.type === 'text') message.delete();
				}
				catch (e) {
					if (e.name === 'Error') throw fnc.Warn(`Couldn't reload command ${args[0]}:\n ${e.message}`);
					throw e;
				}
			}
		}
		else {
			//complete bot
			logger.info(`'${message.author.tag}' is reloading the complete bot.`);
			delete require.cache[require.resolve(`${require.main.path}/src/const.json`)];
			delete require.cache[require.resolve(`${require.main.path}/src/config.js`)];
			delete require.cache[require.resolve(`${require.main.path}/src/config.json`)];
			fs.readdirSync(`${require.main.path}/tbl/src`).filter(file => file.endsWith('.js')).forEach(file => {
				delete require.cache[require.resolve(`${require.main.path}/tbl/src/${file}`)];
			});
			commands.forEach(command => delete require.cache[require.resolve(`${require.main.path}/cmd/src/${command.file}`)]);
			delete require.cache[require.resolve(`${require.main.path}/cmd/`)];
			Object.keys(fnc).forEach(func => {
				if (typeof fnc[func] === 'object') {
					Object.keys(fnc[func]).forEach(sub => {
						delete require.cache[require.resolve(`${require.main.path}/fnc/src/${func}/${sub}.js`)];
					});
				}
				else {
					delete require.cache[require.resolve(`${require.main.path}/fnc/src/${func}.js`)];
				}
			});
			delete require.cache[require.resolve(`${require.main.path}/fnc`)];
			if (message.channel.type === 'text') await message.delete();
			client.destroy();
			delete require.cache[require.resolve(`${require.main.path}/src/client.js`)];
			require.main.exports.load();
		}
		return true;
	},
};

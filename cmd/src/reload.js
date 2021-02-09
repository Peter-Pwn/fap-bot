const fs = require('fs');

const logger = require(`${require.main.path}/src/logger.js`);
const client = require(`${require.main.path}/src/client.js`);

const CON = require(`${require.main.path}/src/const.json`);
const fnc = require(`${require.main.path}/fnc`);

module.exports = {
	aliases: ['r'],
	description: 'Reloads the bot or a single command or function.',
	descriptionLong: 'If you don\'t provide a prefix (c: or f:) the argument is handled as a command name.',
	args: 0,
	usage: '[c:command|f:function]',
	msgType: CON.MSGTYPE.TEXT | CON.MSGTYPE.DM,
	permLvl: CON.PERMLVL.OWNER,
	cooldown: 10,
	deleteMsg: true,
	async execute(message, args) {
		const commands = require(`${require.main.path}/cmd`);
		if (args.length) {
			if (args[0].startsWith('f:')) {
				args[0] = args[0].replace(/^f:/, '');
				const func = args[0].match(/(\w+)\.?(\w+)?/);
				if (!func) throw new Error(`${args[0]} is not a function`);
				try {
					if (func[2]) {
						if (typeof fnc[func[1]] !== 'object' && typeof fnc[func[1]][func[2]] !== 'function') throw new Error(`\`${args[0]}\` is not a function`);
						logger.info(`Reloading function ${args[0]}`);
						delete require.cache[require.resolve(`${require.main.path}/fnc/src/${func[1]}/${func[2]}.js`)];
						fnc[func[1]][func[2]] = require(`${require.main.path}/fnc/src/${func[1]}/${func[2]}.js`);
					}
					else {
						if (typeof fnc[func[1]] !== 'function') throw new Error(`\`${args[0]}\` is not a function`);
						logger.info(`Reloading function ${args[0]}`);
						delete require.cache[require.resolve(`${require.main.path}/fnc/src/${func[1]}.js`)];
						fnc[func] = require(`${require.main.path}/fnc/src/${func[1]}.js`);
					}
					return fnc.replyExt(message, `function \`${args[0]}\` was reloaded`);
				}
				catch (e) {
					if (e.name !== 'Error') logger.error(`Couldn't reload function ${args[0]}:\n${e.name === 'Error' ? e.message : e.stack}`);
					fnc.replyWarn(message, `there was an error while reloading function \`${args[0]}\``, { color: CON.TEXTCLR.ERROR });
				}
			}
			else {
				try {
					args[0] = args[0].replace(/^c:/, '').toLowerCase();
					const command = commands.get(args[0]);
					if (!command) throw new Error(`${args[0]} is not a command`);
					logger.info(`Reloading command ${command.name}`);
					delete require.cache[require.resolve(`${require.main.path}/cmd/src/${command.file}`)];
					const newCommand = require(`${require.main.path}/cmd/src/${command.file}`);
					if (newCommand.skip) throw new Error('skipped');
					if (newCommand.aliases && !Array.isArray(newCommand.aliases)) throw new Error('aliases is not a array');
					if (typeof newCommand.description !== 'string') throw new Error('description is not a string');
					if (typeof newCommand.descriptionLong !== 'string') newCommand.descriptionLong = null;
					if (typeof parseInt(newCommand.args) !== 'number') newCommand.args = 0;
					if (newCommand.args > 0 && typeof newCommand.usage !== 'string') throw new Error('usage is not a string');
					if (typeof newCommand.msgType !== 'number') newCommand.msgType = CON.MSGTYPE.TEXT;
					if (typeof newCommand.permLvl !== 'number') newCommand.permLvl = CON.MSGTYPE.EVERYONE;
					if (typeof newCommand.cooldown !== 'number') newCommand.cooldown = 3;
					if (typeof newCommand.deleteMsg !== 'boolean') newCommand.deleteMsg = true;
					if (typeof newCommand.execute !== 'function') throw new Error('execute is not a function');
					newCommand.name = command.name;
					newCommand.file = command.file;
					commands.set(command.name, newCommand);
					return fnc.replyExt(message, `command \`${command.name}\` was reloaded`);
				}
				catch (e) {
					if (e.name !== 'Error') logger.error(`Couldn't reload command ${args[0]}:\n${e.name === 'Error' ? e.message : e.stack}`);
					fnc.replyWarn(message, `there was an error while reloading command \`${args[0]}\``, { color: CON.TEXTCLR.ERROR });
				}
			}
		}
		else {
			try {
				logger.info(`'${message.author.tag}' is reloading the complete bot.`);
				delete require.cache[require.resolve(`${require.main.path}/src/const.json`)];
				delete require.cache[require.resolve(`${require.main.path}/src/config.js`)];
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
				await message.delete();
				client.destroy();
				delete require.cache[require.resolve(`${require.main.path}/src/client.js`)];
				require.main.exports.load();
			}
			catch (e) {
				if (message) {
					logger.error(`Couldn't reload bot:\n${e.name === 'Error' ? e.message : e.stack}`);
					fnc.replyWarn(message, 'there was an error while reloading the bot.', { color: CON.TEXTCLR.ERROR });
				}
				else {
					console.error(`[ERROR] Couldn't reload bot:\n${e.name === 'Error' ? e.message : e.stack}`);
				}
			}
		}
	},
};

const winston = require('winston');
require('winston-daily-rotate-file');
const moment = require('moment');

const cfg = require(`${require.main.path}/src/config.js`);

module.exports = winston.createLogger({
	transports: [new winston.transports.Console(cfg.log.console)],
	format: winston.format.printf(info => `${moment().format('YYYY-MM-DD HH:mm:ss')} [${info.level.toUpperCase()}] ${(info instanceof Error) ? info.stack : info.message}`),
});

//DailyRotateFile https://github.com/winstonjs/winston-daily-rotate-file#options
if (cfg.log.file) {
	module.exports.fileLogger = new winston.transports.DailyRotateFile(cfg.log.file);
	module.exports.add(module.exports.fileLogger);
}

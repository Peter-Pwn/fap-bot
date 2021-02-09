const winston = require('winston');
require('winston-daily-rotate-file');
//require('winston-mail');
const moment = require('moment');

const cfg = require(`${require.main.path}/src/config.js`);

const logger = winston.createLogger({
	transports: [new winston.transports.Console(cfg.log.console)],
	format: winston.format.printf(info => `${moment().format('YYYY-MM-DD HH:mm:ss')} [${info.level.toUpperCase()}] ${(info instanceof Error) ? info.stack : info.message}`),
});

//DailyRotateFile https://github.com/winstonjs/winston-daily-rotate-file#options
if (cfg.log.file) {
	logger.fileLogger = new winston.transports.DailyRotateFile(cfg.log.file);
	logger.add(logger.fileLogger);
}
//if (cfg.log.mail) logger.add(new winston.transports.Mail(cfg.log.mail));
/*new winston.transports.Mail({
	level: 'error',
	to: '',
	from: '',
	host: '',
	port: ,
	username: '',
	password: '',
	subject: '{{level}} {{msg}})',
	tls: { ciphers: 'SSLv3' },
	html: false,
}),*/
//if (cfg.debug) logger.transports[0].level = 'debug';

module.exports = logger;

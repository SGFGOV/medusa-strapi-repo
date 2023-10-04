// path: ./config/logger.js

'use strict';

const { winston } = require('@strapi/logger');

const alignColorsAndTime = winston.format.combine(
	winston.format.colorize({
		all: true,
	}),
	winston.format.label({
		label: '[STRAPI]',
	}),
	winston.format.timestamp({
		format: 'YY-MM-DD HH:mm:ss',
	}),
	winston.format.printf((info) => ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`)
);

module.exports = {
	transports: [
		new winston.transports.Console({
			level: 'silly',
			debugStdout: true,
			format: winston.format.combine(winston.format.colorize(), alignColorsAndTime),
			/* winston.format.combine(
        levelFilter('silly'),
        prettyPrint({ timestamps: 'YYYY-MM-DD hh:mm:ss.SSS' })
      ),*/
		}),
	],
};

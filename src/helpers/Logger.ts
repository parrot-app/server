import winston from 'winston';
import { ServerConfig } from './ParrotConfig';

const currentDate = new Date(Date.now());

const dateString = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}T${currentDate.getHours()}-${currentDate.getMinutes()}-${currentDate.getSeconds()}`;

export const logger = winston.createLogger({
  level: ServerConfig.logLevel,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      dirname: ServerConfig.logPath,
      filename: `parrot-session-${dateString}.log`
    }),
  ],
});

logger.log('debug', 'Logger configured and ready.');

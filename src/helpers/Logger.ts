import fs from 'fs-extra';
import winston from 'winston';
import { ServerConfig } from './ParrotConfig';

const currentDate = new Date(Date.now());
const logPath = `${process.cwd()}/logs`;

if (!fs.pathExistsSync(logPath)) {
  fs.mkdirSync(logPath);
}

const dateString =
  `${currentDate.getFullYear()}-${currentDate.getMonth()}-` +
  `${currentDate.getDate()}T${currentDate.getHours()}-` +
  `${currentDate.getMinutes()}-${currentDate.getSeconds()}`;

export const logger = winston.createLogger({
  level: ServerConfig.logLevel,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      dirname: logPath,
      filename: `parrot-${dateString}.log`,
    }),
  ],
});

logger.log('debug', 'Logger initialized successfully.');

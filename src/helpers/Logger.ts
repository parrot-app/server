import winston from 'winston';
import { ServerConfig } from './ParrotConfig';

export const logger = winston.createLogger({
  level: ServerConfig.logLevel,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      dirname: ServerConfig.logPath,
    }),
  ],
});

logger.log('debug', 'Logger configured and ready.');

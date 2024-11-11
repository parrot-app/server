import { Config } from '../interfaces/Config.interface';
import { Request } from 'express';
import dotenv from 'dotenv';
import { StoredCachedRequest } from '../interfaces/StoredCachedRequest.interface';

dotenv.config();

class ParrotConfig implements Config {
  safeCachePath = (value: string | undefined, defaultValue: string): string => {
    if (value) {
      if (value.includes(':/')) {
        // User set up a windows absolute path
        return value;
      } else if (value[0] === '/') {
        // User set up an absolute unix path
        return value;
      } else {
        // User set up a relative path
        return `${process.cwd()}/${value}`;
      }
    }
    // Default value
    return `${process.cwd()}/${defaultValue}`;
  };

  port = Number(process.env['PARROT_PORT']) || 3000;

  cachePath = this.safeCachePath(process.env['PARROT_CACHEPATH'], 'cache');

  logPath = this.safeCachePath(process.env['PARROT_LOGPATH'], 'logs');

  requestsCacheFileName = process.env['PARROT_CACHE_FILENAME'] ?? 'requests.json';

  encoding = (process.env['PARROT_CACHE_FILE_ENCODING'] ?? 'utf8') as BufferEncoding;
  baseUrl = process.env['PARROT_API_BASE'] || 'http://localhost';
  gracefulFail =
    (process.env['PARROT_GRACEFUL_FAIL']
      ? /true/.test(process.env['PARROT_GRACEFUL_FAIL'])
      : false) || true;
  bypassCache = process.argv.find((v) => v === 'bypass') ? true : false;
  isHttps = this.baseUrl.includes('https') || false;
  host = `http${this.isHttps ? 's' : ''}://localhost`;
  rejectUnauthorized =
    (process.env['PARROT_REJECT_UNAUTHORIZED']
      ? /true/.test(process.env['PARROT_REJECT_UNAUTHORIZED'])
      : false) || false;
  proxy = false as const;
  logLevel =
    process.env['PARROT_LOG']
    ? process.env['PARROT_LOG'].toLowerCase() : 'error';
  matchBy = (
    request: Request,
    cache: Array<StoredCachedRequest>,
  ): StoredCachedRequest | null => {
    const cachedRequest = cache.find(
      (cReq: StoredCachedRequest) =>
        cReq.method === request.method && cReq.url === request.url,
    );
    return cachedRequest || null;
  };
}

export const ServerConfig = new ParrotConfig();

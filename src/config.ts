import { Config } from './interfaces/Config.interface';
import { Request } from 'express';
import dotenv from 'dotenv';
import { StoredCachedRequest } from './interfaces/StoredCachedRequest.interface';

dotenv.config();

class ParrotConfig implements Config {
  port = process.env['PARROT_PORT'] ? Number(process.env['PARROT_PORT']) : 3000;
  cachePath = `${process.cwd()}/cache`;
  logPath = `${process.cwd()}/logs`;
  requestsCacheFileName = 'requests.json';
  encoding = 'utf8' as BufferEncoding;
  baseUrl = process.env['API_BASE'] || 'http://localhost';
  gracefulFail =
    (process.env['GRACEFUL_FAIL'] ? /true/.test(process.env['GRACEFUL_FAIL']) : false) ||
    true;
  bypassCache = process.argv.find((v) => v === 'bypass') ? true : false;
  isHttps = this.baseUrl.includes('https') || false;
  host = `http${this.isHttps ? 's' : ''}://localhost`;
  rejectUnauthorized = false;
  /* proxy = {
        host: 'YOUR_PROXY',
        port: 8888,
        auth: {
            username: '**REDACTED',
            password: '**REDACTED**'
        },
        protocol: 'http',
    }; */
  proxy = false as const;
  logLevel = process.env['LOG'] ? process.env['LOG'].toLowerCase() : 'error';
  /**
   * Customize how to tell Parrot that the request should be served from the cache.
   * Parrot will cache any successful requests without asking. This method will tell Parrot
   * how to match a given frontend request with a cache request. The below function does this
   * *naively* by just comparing the method and request url.
   * Usually it does the job, but for a lot of apps, you might have more specific things to do
   * such as comparing the content of a POST body and so on.
   * This function is your entry point to customize how Parrot should handle things for you.
   * @param request The frontend client's request
   * @param cache the whole cache of stored requests
   * @returns the entry of cached request or null
   */
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

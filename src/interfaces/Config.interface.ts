import { AxiosProxyConfig } from 'axios';
import { Request } from 'express';
import { StoredCachedRequest } from './StoredCachedRequest.interface';

export interface Config {
  port: number;
  host: string;
  cachePath: string;
  logPath: string;
  requestsCacheFileName: string;
  encoding: BufferEncoding;
  baseUrl: string;
  gracefulFail: boolean;
  bypassCache: boolean;
  isHttps: boolean;
  rejectUnauthorized: boolean;
  proxy: false | AxiosProxyConfig | undefined;
  logLevel: string;
  matchBy: (
    request: Request,
    cache: Array<StoredCachedRequest>,
  ) => StoredCachedRequest | null;
}

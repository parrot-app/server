import express from 'express';
import axios, { AxiosResponse, AxiosResponseHeaders } from 'axios';
import cors from 'cors';
import https from 'https';
import http from 'http';
import fs from 'fs-extra';

import { ServerConfig } from './helpers/ParrotConfig';
import { CacheHandler } from './handlers/Cache.handler';
import { Config } from './interfaces/Config.interface';
import { CertGenerator } from './helpers/CertGenerator';
import { CachedRequest } from './interfaces/CachedRequest.interface';
import { EventEmitter } from 'stream';
import { GetCleanHeaderKeys } from './helpers/GetCleanHeaderKeys';
import { ParrotServerEventsEnum } from './consts/ParrotServerEvents.enum';

https.globalAgent.options.rejectUnauthorized = false;

export class ParrotServer extends EventEmitter {
  public host = '';
  public target = '';
  public server: http.Server | https.Server | null = null;

  public set bypassCache(value: boolean) {
    ServerConfig.bypassCache = value;
  }

  public get bypassCache(): boolean {
    return ServerConfig.bypassCache;
  }

  public get serverConfig(): Config {
    return ServerConfig;
  }

  private app = express();
  private agent: https.Agent | null = null;

  constructor() {
    super();
    this.init();
    this.server?.listen(ServerConfig.port, () => {
      this.emit(ParrotServerEventsEnum.LOG_SUCCESS, '[OK] ParrotJS server is running.');
      this.emit(ParrotServerEventsEnum.SERVER_LISTEN);
    });
    this.server?.on('close', () => {
      this.emit(ParrotServerEventsEnum.SERVER_STOP);
    });
    this.host = `${ServerConfig.host}:${ServerConfig.port}`;
    this.target = `${ServerConfig.baseUrl}`;
  }

  private init() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded());

    CacheHandler.init(ServerConfig);

    this.agent = new https.Agent({
      rejectUnauthorized: ServerConfig.rejectUnauthorized,
    });

    this.app.use(async (req, res, next) => {
      const cachedRequest = this.getCachedRequest(req, ServerConfig);

      if (cachedRequest && !this.bypassCache) {
        return this.useCachedResponse(cachedRequest, res);
      } else {
        await this.fetchExternalAPIAndCacheResponse(req, res, ServerConfig);
      }

      next();
    });

    this.sslPrepareAndSetup();
  }

  private sslPrepareAndSetup() {
    // Make sure to generate the certificates before trying to start our server
    const serverKeysPaths = CertGenerator.generate(ServerConfig);

    if (ServerConfig.isHttps && serverKeysPaths) {
      this.server = https.createServer(
        {
          key: fs.readFileSync(serverKeysPaths.key),
          cert: fs.readFileSync(serverKeysPaths.cert),
        },
        this.app,
      );
    } else {
      this.server = http.createServer(this.app);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sendResponse(res: express.Response, response: AxiosResponse<any, any>): void {
    const headerKeys = GetCleanHeaderKeys(response.headers as AxiosResponseHeaders);
    headerKeys.forEach((key) => {
      res.setHeader(key, response.headers[key]);
    });

    res.send(response.data);
  }

  private saveCacheRequest(
    req: express.Request,
    serverConfig: Config,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: AxiosResponse<any, any>,
  ): void {
    const cacheHandler = new CacheHandler(req, serverConfig);
    cacheHandler.saveCacheRequest(response);
  }

  private async fetchExternalAPIAndCacheResponse(
    req: express.Request,
    res: express.Response,
    serverConfig: Config,
  ): Promise<void> {
    const externalUrl = `${serverConfig.baseUrl}${req.url}`;
    this.emit(ParrotServerEventsEnum.LOG_INFO, `[=>] Fetch: ${externalUrl}`);
    req.headers.host = undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await axios<any>({
        method: req.method,
        url: externalUrl,
        headers: req.headers,
        data: req.body,
        proxy: false,
        httpsAgent: this.agent || undefined,
      });

      if (!this.bypassCache) {
        this.saveCacheRequest(req, serverConfig, response);
      }
      this.sendResponse(res, response);
    } catch (error) {
      this.emit(ParrotServerEventsEnum.LOG_ERROR, `[X] Error fetching: ${error}`);
      res.status(500).send(error);
    }
  }

  private getCachedRequest(
    req: express.Request,
    serverConfig: Config,
  ): CachedRequest | null {
    const cacheHandler = new CacheHandler(req, serverConfig);
    return cacheHandler.cachedRequest;
  }

  private useCachedResponse(cachedRequest: CachedRequest, res: express.Response): void {
    this.emit(
      ParrotServerEventsEnum.LOG_INFO,
      `[#] Using cached response for ${cachedRequest.method} ${cachedRequest.url}`,
    );

    if (Object.keys(cachedRequest?.responseHeaders).length > 0) {
      const headerKeys = GetCleanHeaderKeys(cachedRequest.responseHeaders);
      Object.keys(cachedRequest?.responseHeaders).forEach((key) => {
        if (headerKeys.find((k) => key === k)) {
          res.setHeader(key, cachedRequest.responseHeaders[key] || '');
        }
      });
    }

    if (cachedRequest.code) {
      res.statusCode = cachedRequest.code;
    }

    res.send(cachedRequest.responseBody);
  }
}

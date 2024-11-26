import fs from 'fs-extra';
import https from 'https';
import http from 'http';
import { Request } from 'express';
import { AxiosResponse } from 'axios';

import { Config } from '../interfaces/Config.interface';
import { CachedRequest } from '../interfaces/CachedRequest.interface';
import { StoredCachedRequest } from '../interfaces/StoredCachedRequest.interface';
import { ParrotServerEventsEnum } from '../consts/ParrotServerEvents.enum';
import { nanoid } from 'nanoid';
import { logger } from '../helpers/Logger';

export class CacheHandler {
  private cachePath = '';
  private static serverInstance: http.Server | https.Server | null = null;

  constructor(
    private request: Request,
    private config: Config,
  ) {
    this.cachePath = `${this.config.cachePath}/${this.config.requestsCacheFileName}`;
  }

  public static init(config: Config, server: http.Server | https.Server | null = null) {
    CacheHandler.serverInstance = server;
    const cachePath = `${config.cachePath}/${config.requestsCacheFileName}`;
    if (!fs.existsSync(cachePath)) {
      fs.outputFileSync(cachePath, '[]');
    }
    return cachePath;
  }

  public get cachedRequest(): CachedRequest | null {
    const cache = JSON.parse(
      fs.readFileSync(this.cachePath, this.config.encoding).toString(),
    ) as StoredCachedRequest[];
    if (cache.length > 0) {
      // TODO: simplify this so that the config provides a unique function?
      const matchFn = (this.config.customUserFn?.matchBy !== undefined) ? this.config.customUserFn.matchBy : this.config.matchBy;
      try {
        const cachedRequest = matchFn(this.request, cache, logger);
        if (cachedRequest) {
          return this.parseCachedResponse(cachedRequest);
        }
      } catch (e) {
        logger.error(`An error occured when invoking the match function: ${e}`);
      }
      
    }
    return null;
  }

  public saveCacheRequest(response: AxiosResponse, cachedRequest?: CachedRequest | null) {
    let requestId = '';
    if (cachedRequest?.id) {
      requestId = cachedRequest.id
    } else {
      requestId = nanoid(5)
    }

    const responseFilePath = this.createResponseBodyFile(response, requestId);
    const responseHeadersFile = this.createResponseHeadersFile(response, requestId);

    const cache = JSON.parse(
      fs.readFileSync(this.cachePath, this.config.encoding).toString(),
    ) as StoredCachedRequest[];

    let newCache: StoredCachedRequest[] = [];
    if (cachedRequest?.id) {
      logger.debug(`Trying to replace cached request ${cachedRequest.id}`);
      cache.forEach(item => {
        if (item.id === cachedRequest.id) {
          item.method = this.request.method;
          item.url = this.request.url;
          item.body = this.request.body;
          item.code = response.status;
          item.responseHeaders = responseHeadersFile;
          item.responseBody = responseFilePath;
          item.timestamp = Math.floor(Date.now() / 1000);
        }
      });
      newCache = [...cache];
    } else {
      newCache = [
        ...cache,
        {
          id: requestId,
          method: this.request.method,
          url: this.request.url,
          body: this.request.body,
          code: response.status,
          responseHeaders: responseHeadersFile,
          responseBody: responseFilePath,
          timestamp: Math.floor(Date.now() / 1000),
        },
      ];
    }
    fs.outputFileSync(this.cachePath, JSON.stringify(newCache, null, 4));
  }

  private parseCachedResponse(
    storedCachedRequest: StoredCachedRequest,
  ): CachedRequest | null {
    const cachedRequest = {} as CachedRequest;

    // Keep things safe by copying our object
    Object.assign(cachedRequest, storedCachedRequest);

    this.parseResponseItem(storedCachedRequest, cachedRequest, 'responseBody');
    this.parseResponseItem(storedCachedRequest, cachedRequest, 'responseHeaders');

    cachedRequest.timestamp = new Date(storedCachedRequest.timestamp * 1000);
    return cachedRequest;
  }

  private parseResponseItem(
    storedCachedRequest: StoredCachedRequest,
    cachedRequest: CachedRequest,
    key: 'responseBody' | 'responseHeaders',
  ) {
    if (
      storedCachedRequest[key] &&
      typeof storedCachedRequest[key] === 'string'
    ) {
      try {
        // Try to parse the request's content as simple JSON (if the user created manually the entry)
        cachedRequest[key] = JSON.parse(storedCachedRequest[key]);
      } catch {
        // The entry is an automatic response that Parrot saved
        if (fs.existsSync(storedCachedRequest[key])) {
          cachedRequest[key] = JSON.parse(
            fs
              .readFileSync(storedCachedRequest[key], this.config.encoding)
              .toString(),
          );
          // The response file has been removed, remove the entry from the cache
        } else {
          this.cleanupRemovedEntries();
          return null;
        }
      }
    }
  }

  private createResponseBodyFile(response: AxiosResponse, id: string) {
    if (!response.data) {
      return undefined;
    }
    const filePath = `${this.config.cachePath}${this.request.url}_body_${id}.json`;
    fs.outputFileSync(
      filePath,
      JSON.stringify(response.data, null, 4),
      this.config.encoding,
    );
    return filePath;
  }

  private createResponseHeadersFile(response: AxiosResponse, id: string): string {
    if (!response.headers) {
      return '';
    }
    const filePath = `${this.config.cachePath}${this.request.url}_headers_${id}.json`;
    fs.outputFileSync(
      filePath,
      JSON.stringify(response.headers, null, 4),
      this.config.encoding,
    );
    return filePath;
  }

  private cleanupRemovedEntries() {
    CacheHandler.serverInstance?.emit(
      ParrotServerEventsEnum.LOG_WARN,
      'Some entries seem out of sync withe the cache files, cleaning up!',
    );
    let cache = JSON.parse(
      fs.readFileSync(this.cachePath, this.config.encoding).toString(),
    ) as StoredCachedRequest[];
    if (cache.length > 0) {
      cache = cache.filter((item) => {
        if (fs.existsSync(item.responseHeaders) && fs.existsSync(item.responseBody)) {
          return true;
        } else if (!fs.existsSync(item.responseHeaders)) {
          if (fs.existsSync(item.responseBody)) {
            fs.removeSync(item.responseBody);
            return false;
          }
        } else if (!fs.existsSync(item.responseBody)) {
          if (fs.existsSync(item.responseHeaders)) {
            fs.removeSync(item.responseHeaders);
            return false;
          }
        }
        return false;
      });
      fs.outputFileSync(this.cachePath, JSON.stringify(cache, null, 4));
    }
  }
}

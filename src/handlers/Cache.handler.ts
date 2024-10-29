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

export class CacheHandler {
  private cachePath = '';
  private static serverInstance: http.Server | https.Server | null = null;
  constructor(private request: Request, private config: Config) {
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
      const cachedRequest = this.config.matchBy(this.request, cache);
      if (cachedRequest) {
        return this.parseCachedResponse(cachedRequest);
      }
    }
    return null;
  }

  public saveCacheRequest(response: AxiosResponse) {
    const requestId = nanoid(5);
    const responseFilePath = this.createResponseBodyFile(response, requestId);
    const responseHeadersFile = this.createResponseHeadersFile(response, requestId);

    const cache = JSON.parse(
      fs.readFileSync(this.cachePath, this.config.encoding).toString(),
    ) as StoredCachedRequest[];
    const newCache: StoredCachedRequest[] = [
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
    fs.outputFileSync(this.cachePath, JSON.stringify(newCache, null, 4));
  }

  private parseCachedResponse(
    storedCachedRequest: StoredCachedRequest,
  ): CachedRequest | null {
    let cachedRequest = {} as CachedRequest;
    Object.assign(cachedRequest, storedCachedRequest);
    if (
      storedCachedRequest.responseBody &&
      typeof storedCachedRequest.responseBody === 'string'
    ) {
      if (fs.existsSync(storedCachedRequest.responseBody)) {
        cachedRequest.responseBody = JSON.parse(
          fs
            .readFileSync(storedCachedRequest.responseBody, this.config.encoding)
            .toString(),
        );
      } else {
        this.cleanupRemovedEntries();
        return null;
      }
    }
    if (
      storedCachedRequest.responseHeaders &&
      typeof storedCachedRequest.responseHeaders === 'string' &&
      fs.existsSync(storedCachedRequest.responseHeaders)
    ) {
      cachedRequest.responseHeaders = JSON.parse(
        fs
          .readFileSync(storedCachedRequest.responseHeaders, this.config.encoding)
          .toString(),
      );
    } else {
      this.cleanupRemovedEntries();
      return null;
    }
    cachedRequest.timestamp = new Date(storedCachedRequest.timestamp * 1000);
    return cachedRequest;
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

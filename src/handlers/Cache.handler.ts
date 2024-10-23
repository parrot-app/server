import fs from 'fs-extra';
import { Request, Response } from "express";
import { AxiosResponse } from "axios";

import { Config } from "../interfaces/Config.interface";
import { CachedRequest } from "../interfaces/CachedRequest.interface";
import { StoredCachedRequest } from "../interfaces/StoredCachedRequest.interface";
import { logError, logIn } from '../helpers/Logger';

export class CacheHandler {
    private cachePath = '';
    constructor(
        private request: Request,
        private response: Response,
        private config: Config,
    ) {
        this.cachePath = `${this.config.cachePath}/${this.config.requestsCacheFileName}`;
    }

    public static init(config: Config) {
        const cachePath = `${config.cachePath}/${config.requestsCacheFileName}`;
        if (!fs.existsSync(cachePath)) {
            fs.outputFileSync(cachePath, '[]');
        }
        return cachePath;
    }

    public get cachedRequest(): CachedRequest | null {
        const cache = JSON.parse(fs.readFileSync(this.cachePath, this.config.encoding)) as StoredCachedRequest[];
        if (cache.length > 0) {
            const cachedRequest = this.config.matchBy(this.request, cache);
            if (cachedRequest) {
                return this.parseCachedResponse(cachedRequest);
            }
        }
        return null;
    }

    public saveCacheRequest(response: AxiosResponse) {
        const responseFilePath = this.createResponseBodyFile(response);
        const responseHeadersFile = this.createResponseHeadersFile(response);

        const cache = JSON.parse(fs.readFileSync(this.cachePath, this.config.encoding));
        const newCache: CachedRequest[] = [
            ...cache,
            {
                method: this.request.method,
                url: this.request.url,
                body: this.request.body,
                code: response.status,
                responseHeaders: responseHeadersFile ? responseHeadersFile : undefined,
                responseBody: responseFilePath ? responseFilePath : undefined,
            },
        ];
        fs.outputFileSync(this.cachePath, JSON.stringify(newCache, null, 4));
    }

    private parseCachedResponse(storedCachedRequest: StoredCachedRequest): CachedRequest | null {
        let cachedRequest = {} as CachedRequest;
        Object.assign(cachedRequest, storedCachedRequest);
        if (
            storedCachedRequest.responseBody
            && typeof storedCachedRequest.responseBody === 'string'
        ) {
            if (fs.existsSync(storedCachedRequest.responseBody)) {
                cachedRequest.responseBody = JSON.parse(fs.readFileSync(storedCachedRequest.responseBody, this.config.encoding));
            } else {
                this.cleanupRemovedEntries();
                return null;
            }
        }
        if (
            storedCachedRequest.responseHeaders
            && typeof storedCachedRequest.responseHeaders === 'string'
            && fs.existsSync(storedCachedRequest.responseHeaders)
        ) {
            cachedRequest.responseHeaders = JSON.parse(fs.readFileSync(storedCachedRequest.responseHeaders, this.config.encoding));
        } else {
            this.cleanupRemovedEntries();
            return null;
        }
        return cachedRequest;
    }

    private createResponseBodyFile(response: AxiosResponse) {
        if (!response.data) {
            return undefined
        }
        const filePath = `${this.config.cachePath}${this.request.url}_body.json`
        fs.outputFileSync(filePath, JSON.stringify(response.data, null, 4), this.config.encoding);
        return filePath;
    }

    private createResponseHeadersFile(response: AxiosResponse) {
        if (!response.headers) {
            return undefined
        }
        const filePath = `${this.config.cachePath}${this.request.url}_headers.json`
        fs.outputFileSync(filePath, JSON.stringify(response.headers, null, 4), this.config.encoding);
        return filePath;
    }

    private cleanupRemovedEntries() {
        logError('Some entries seem out of sync withe the cache files, cleaning up!')
        let cache = JSON.parse(fs.readFileSync(this.cachePath, this.config.encoding)) as StoredCachedRequest[];
        if (cache.length > 0) {
            cache = cache.filter(item => {
                if (
                    fs.existsSync(item.responseHeaders)
                    && fs.existsSync(item.responseBody)
                ) {
                    return true;
                } else if (
                    !fs.existsSync(item.responseHeaders)
                ) {
                    if (fs.existsSync(item.responseBody)) {
                        fs.removeSync(item.responseBody);
                        return false;
                    }
                } else if (
                    !fs.existsSync(item.responseBody)
                ) {
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

import { Request, Response } from "express";
import fs from 'fs-extra';
import { AxiosResponse } from "axios";
import { Config } from "../interfaces/Config.interface";
import { CachedRequest } from "../interfaces/CachedRequest.interface";
import { StoredCachedRequest } from "../interfaces/StoredCachedRequest.interface";

export class CacheHandler {
    constructor(
        private request: Request,
        private response: Response,
        private config: Config,
    ) { }

    public static init(config: Config) {
        const cachePath = `${config.cachePath}/${config.requestsCacheFileName}`;
        if (!fs.existsSync(cachePath)) {
            fs.outputFileSync(cachePath, '[]');
        }
        return cachePath;
    }

    public get cachedRequest(): CachedRequest | null {
        const cachePath = `${this.config.cachePath}/${this.config.requestsCacheFileName}`;
        const cache = JSON.parse(fs.readFileSync(cachePath, this.config.encoding));
        const cachedRequest = this.config.matchBy(this.request, cache);
        if (cachedRequest) {
            return this.parseCachedResponse(cachedRequest);
        }
        return null;
    }

    public saveCacheRequest(response: AxiosResponse) {
        const cachePath = `${this.config.cachePath}/${this.config.requestsCacheFileName}`;
        const responseFilePath = this.createResponseBodyFile(response);
        const responseHeadersFile = this.createResponseHeadersFile(response);

        const cache = JSON.parse(fs.readFileSync(cachePath, this.config.encoding));
        const newCache: CachedRequest[] = [
            ...cache,
            {
                method: this.request.method,
                url: this.request.url,
                body: this.request.body,
                code: response.status,
                headers: responseHeadersFile ? responseHeadersFile : undefined,
                response: responseFilePath ? responseFilePath : undefined,
            },
        ];
        fs.outputFileSync(cachePath, JSON.stringify(newCache, null, 4));
    }

    private parseCachedResponse(storedCachedRequest: StoredCachedRequest): CachedRequest {
        let cachedRequest = {} as CachedRequest;
        Object.assign(cachedRequest, storedCachedRequest)
        if (
            storedCachedRequest.responseBody
            && typeof storedCachedRequest.responseBody === 'string'
            && fs.existsSync(storedCachedRequest.responseBody)
        ) {
            cachedRequest.responseBody = JSON.parse(fs.readFileSync(storedCachedRequest.responseBody, this.config.encoding));
        }
        if (
            storedCachedRequest.responseHeaders
            && typeof storedCachedRequest.responseHeaders === 'string'
            && fs.existsSync(storedCachedRequest.responseHeaders)
        ) {
            cachedRequest.responseHeaders = JSON.parse(fs.readFileSync(storedCachedRequest.responseHeaders, this.config.encoding));
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
}

import { Request, Response } from "express";
import fs from 'fs';
import { Config } from "../interfaces/Config.interface";
import { CachedRequest } from "../interfaces/CachedRequest.interface";
import { AxiosResponse } from "axios";

export class CacheHandler {
    constructor(
        private request: Request,
        private response: Response,
        private config: Config,
    ) { }

    public static init(config: Config) {
        const cachePath = `${config.cachePath}/${config.requestsCacheFileName}`;
        if (!fs.existsSync(cachePath)) {
            fs.writeFileSync(cachePath, '[]');
        }
        return cachePath;
    }

    public get cachedRequest(): CachedRequest | null {
        const cachePath = `${this.config.cachePath}/${this.config.requestsCacheFileName}`;
        const cache = JSON.parse(fs.readFileSync(cachePath, this.config.encoding));
        const cachedRequest = this.config.matchBy(this.request, cache);
        // Attempt to parse the sub-item response
        if (cachedRequest?.response) {
            if (fs.existsSync(cachedRequest.response)) {
                cachedRequest.response = JSON.parse(fs.readFileSync(cachedRequest.response, this.config.encoding));
            }
        }
        // Attempt to parse the sub-item headers
        if (cachedRequest?.headers && typeof cachedRequest.headers === 'string') {
            if (fs.existsSync(cachedRequest.headers)) {
                cachedRequest.headers = JSON.parse(fs.readFileSync(cachedRequest.headers, this.config.encoding));
            }
        }
        return cachedRequest;
    }

    public saveCacheRequest(response: AxiosResponse) {
        const cachePath = `${this.config.cachePath}/${this.config.requestsCacheFileName}`;
        const responseFilePath = this.createResponseBodyFile(response);
        const responseHeadersFile = this.createResponseHeadersFile(response);

        const cache = JSON.parse(fs.readFileSync(cachePath, this.config.encoding));
        const newCache = [
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
        fs.writeFileSync(cachePath, JSON.stringify(newCache, null, 4));
    }
    private createResponseBodyFile(response: AxiosResponse) {
        if (!response.data) {
            return undefined
        }
        const cachePath = `${this.config.cachePath}/${this.config.requestsCacheFileName}`;
        const filePath = `${cachePath}${this.request.url}_body.json`
        fs.writeFileSync(filePath, JSON.stringify(response.data), this.config.encoding);
        return filePath;
    }

    private createResponseHeadersFile(response: AxiosResponse) {
        if (!response.headers) {
            return undefined
        }
        const cachePath = `${this.config.cachePath}/${this.config.requestsCacheFileName}`;
        const filePath = `${cachePath}${this.request.url}_headers.json`
        fs.writeFileSync(filePath, JSON.stringify(response.headers), this.config.encoding);
        return filePath;
    }
}
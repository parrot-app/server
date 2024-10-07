import { AxiosProxyConfig } from "axios";
import { CachedRequest } from "./CachedRequest.interface";
import { Request } from "express";

export interface Config {
    port: number;
    host: string;
    cachePath: string;
    requestsCacheFileName: string;
    encoding: BufferEncoding;
    baseUrl: string;
    gracefulFail: boolean;
    bypassCache: boolean;
    proxy: false | AxiosProxyConfig | undefined;
    matchBy: (request: Request, cache: Array<CachedRequest>) => CachedRequest | null;
}
import { CachedRequest } from "./CachedRequest.interface";
import { Request } from "express";

export interface Config {
    port: number;
    host: string;
    cachePath: string;
    requestsCacheFileName: string;
    encoding: string;
    baseUrl: string;
    gracefulFail: boolean;
    bypassCache: boolean;
    matchBy: (request: Request, cache: Array<CachedRequest>) => CachedRequest | null;
}
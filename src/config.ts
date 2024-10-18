import { CachedRequest } from "./interfaces/CachedRequest.interface";
import { Config } from "./interfaces/Config.interface";
import { Request } from "express";
import dotenv from 'dotenv';

dotenv.config();

class ParrotConfig implements Config {
    port = process.env.PARROT_PORT ? Number(process.env.PARROT_PORT) : 3000;
    host = 'localhost';
    cachePath = `${process.cwd()}/cache`;
    requestsCacheFileName = 'requests.json';
    encoding = 'utf8' as BufferEncoding;
    baseUrl = process.env.API_BASE || 'localhost';
    gracefulFail = (process.env.GRACEFUL_FAIL ? /true/.test(process.env.GRACEFUL_FAIL) : false) || true;
    bypassCache = process.argv.find(v => v === 'bypass') ? true : false;
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
    matchBy = (request: Request, cache: Array<CachedRequest>) => {
        const cachedRequest = cache.find((cReq: CachedRequest) =>
            cReq.method === request.method && cReq.url === request.url
        );
        return cachedRequest || null;
    };
}

export const ServerConfig = new ParrotConfig;
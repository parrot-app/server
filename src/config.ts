import { Config } from "./interfaces/Config.interface";

class ParrotConfig implements Config {
    port = 3000;
    host = 'localhost';
    cachePath = `${process.cwd()}/cache`;
    encoding = 'utf8';
    baseUrl = process.env.API_BASE || 'localhost';
    gracefulFail = (process.env.GRACEFUL_FAIL ? /true/.test(process.env.GRACEFUL_FAIL) : false) || true;
    bypassCache = process.argv.find(v => v === 'bypass') ? true : false;
}

export const ServerConfig = new ParrotConfig;
export interface Config {
    port: number;
    host: string;
    cachePath: string;
    encoding: string;
    baseUrl: string;
    gracefulFail: boolean;
    bypassCache: boolean;
}
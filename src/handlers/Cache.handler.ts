import { Request, Response } from "express";
import fs from 'fs';
import { Config } from "../interfaces/Config.interface";

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
}
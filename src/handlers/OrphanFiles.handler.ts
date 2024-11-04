import fs from 'fs-extra';
import { Config } from "../interfaces/Config.interface";
import { StoredCachedRequest } from '../interfaces/StoredCachedRequest.interface';
import path from 'path';
import { EventEmitter } from 'stream';

export class OrphanFilesHandler extends EventEmitter {
    private cachePath = '';
    constructor(
      private config: Config,
    ) {
      super();
      this.cachePath = `${this.config.cachePath}/${this.config.requestsCacheFileName}`;
    }

    public async cleanFiles() {
        const cache = JSON.parse(
            fs.readFileSync(this.cachePath, this.config.encoding).toString(),
          ) as StoredCachedRequest[];

        if (cache.length > 0) {
            const allFilesInDirectory = await this.getFilePaths(this.cachePath);
        }
    }

    private async getFilePaths(dir: string): Promise<string[]> {
        const files: string[] = [];
      
        try {
          await fs.promises.readdir(dir, { withFileTypes: true }).then(async (dirents) => {
            for (const dirent of dirents) {
              const fullPath = path.join(dir, dirent.name);
      
              if (dirent.isDirectory()) {
                files.push(...await this.getFilePaths(fullPath));
              } else {
                files.push(fullPath);
              }
            }
          });
        } catch {}
        this.emit('Files', files);
        return files;
      }
}
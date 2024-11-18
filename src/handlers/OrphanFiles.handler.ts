import { Config } from '../interfaces/Config.interface';
import { EventEmitter } from 'stream';
import { Node } from 'graph-fs';
import fs from 'fs-extra';
import { logger } from '../helpers/Logger';
import { ParrotServerEventsEnum } from '../consts/ParrotServerEvents.enum';
import { StoredCachedRequest } from '../interfaces/StoredCachedRequest.interface';

export class OrphanFilesHandler extends EventEmitter {
  private cacheFolderPath = '';
  constructor(private config: Config) {
    super();
    this.cacheFolderPath = `${this.config.cachePath}`;
  }

  public cleanFiles() {
    const filePaths = this.getFilePaths(this.cacheFolderPath);
    const orphanFilesList = this.getOrphanFiles(filePaths);
    orphanFilesList.forEach(filePath => {
      logger.info(`[i] Removed orphan file ${filePath}`);
      fs.removeSync(filePath);
    });
    this.emit(ParrotServerEventsEnum.LOG_INFO, `[i] Removed ${orphanFilesList.length} orphan files.`)
  }

  private getFilePaths(dir: string): string[] {
    const directory = new Node(dir);
    if (directory && directory.children) {
      // Get all files list and ignore the ssl folder and its content + the requestsCacheFile
      const files =
        directory.getDescendants().filter(child => child.is.file).map(i => i.path).filter(el => !(el.includes('ssl/') || el.includes(this.config.requestsCacheFileName)));
      return files;
    }
    return [];
  }

  private getOrphanFiles(filePaths: Array<string>) {
    const cache = JSON.parse(
      fs.readFileSync(`${this.cacheFolderPath}/${this.config.requestsCacheFileName}`, this.config.encoding).toString(),
    ) as StoredCachedRequest[];
    const list = cache.flatMap(item => [item.responseBody, item.responseHeaders]);
    const orphanFilesList = filePaths.filter(item => !list.find(lf => lf === item));
    return orphanFilesList;
  }

}

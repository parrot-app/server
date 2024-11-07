import { Config } from '../interfaces/Config.interface';
import { EventEmitter } from 'stream';
import { Node } from 'graph-fs';

export class OrphanFilesHandler extends EventEmitter {
  private cachePath = '';
  constructor(private config: Config) {
    super();
    this.cachePath = `${this.config.cachePath}`;
  }

  public async cleanFiles() {

      this.getFilePaths(this.cachePath);
  }

  private getFilePaths(dir: string): string[] {
    const directory = new Node(dir);
    if (directory && directory.children) {
      const files =
        directory.getDescendants().filter(child => child.is.file).map(i => i.path);
      this.emit('Files', [...files]);
      return files;
    }
    this.emit('Files', [])
    return [];
  }

}

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';

export interface StoredFile {
  key: string;
  size: number;
}

@Injectable()
export class StorageService {
  async put(key: string, data: Buffer): Promise<StoredFile> {
    if ((process.env.STORAGE_DRIVER || 'local') !== 'local') {
      throw new Error('S3 storage provider is not configured in the initial local runtime.');
    }
    const root = resolve(process.env.UPLOAD_DIR || './uploads');
    const safeKey = key.replace(/[^a-zA-Z0-9/_.-]/g, '_');
    const destination = join(root, safeKey);
    if (!destination.startsWith(root)) throw new Error('invalid storage key');
    await mkdir(join(destination, '..'), { recursive: true });
    await writeFile(destination, data, { flag: 'wx' });
    return { key: safeKey, size: data.byteLength };
  }
}

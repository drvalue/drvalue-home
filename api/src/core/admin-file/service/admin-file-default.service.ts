import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { FileEntity } from '../../../common/entity/file.entity';
import { CommonError } from '../../../common/error/common-error';
import { imageSize } from '../../../common/image/image-size';
import { AdminFileError } from '../error/admin-file.error';
import { FileDefaultRepository } from '../repository/file-default.repository';

const ALLOWED: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
};

/** 업로드 파일이 놓이는 곳. 컨테이너는 /data/uploads, 로컬은 저장소의 data/uploads. */
export function uploadsDir(): string {
  return resolve(process.env.UPLOADS_DIR || './data/uploads');
}

@Injectable()
export class AdminFileDefaultService {
  constructor(private readonly fileDefaultRepository: FileDefaultRepository) {}

  /** 디스크에 `<uuid>.<ext>` 로 쓰고 directus_files 행을 만든다. 그림이면 치수까지. */
  async upload(
    file:
      | { originalname: string; mimetype: string; size: number; buffer: Buffer }
      | undefined,
    title?: string,
  ): Promise<FileEntity> {
    if (!file) throw new CommonError(AdminFileError.NO_FILE);
    const ext = ALLOWED[file.mimetype];
    if (!ext) throw new CommonError(AdminFileError.TYPE_NOT_ALLOWED);
    const id = randomUUID();
    const filenameDisk = `${id}${ext}`;
    mkdirSync(uploadsDir(), { recursive: true });
    writeFileSync(join(uploadsDir(), filenameDisk), file.buffer);
    const size = file.mimetype.startsWith('image/')
      ? imageSize(file.buffer)
      : null;
    const original = file.originalname || `upload${ext}`;
    const row = this.fileDefaultRepository.repository.create({
      id,
      storage: 'local',
      filenameDisk,
      filenameDownload: extname(original) ? original : original + ext,
      title: title || original.replace(/\.[^.]+$/, ''),
      type: file.mimetype,
      filesize: String(file.size),
      width: size?.width ?? null,
      height: size?.height ?? null,
      createdOn: new Date(),
      modifiedOn: new Date(),
    });
    return this.fileDefaultRepository.repository.save(row);
  }

  async get(id: string): Promise<FileEntity> {
    const row = await this.fileDefaultRepository.findById(id);
    if (!row) throw new CommonError(AdminFileError.NOT_FOUND);
    return row;
  }

  /** 행과 디스크 파일을 같이 지운다. 글에 물려 있던 연결은 DB 가 SET NULL 로 푼다. */
  async remove(id: string): Promise<void> {
    const row = await this.get(id);
    rmSync(this.diskPath(row), { force: true });
    await this.fileDefaultRepository.repository.remove(row);
  }

  /** 디스크 경로. filename_disk 에 경로 문자가 들어 있으면 거른다. */
  diskPath(row: FileEntity): string {
    const name = String(row.filenameDisk ?? '').replace(/[/\\]/g, '');
    return join(uploadsDir(), name);
  }
}

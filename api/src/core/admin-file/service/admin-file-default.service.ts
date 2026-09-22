import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { Brackets } from 'typeorm';
import { FileEntity } from '../../../common/entity/file.entity';
import { CommonError } from '../../../common/error/common-error';
import { imageSize } from '../../../common/image/image-size';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import { AppConfig } from '../../../common/config/app-config';
import { AdminFileError } from '../error/admin-file.error';
import { FileDefaultRepository } from '../repository/file-default.repository';

const ALLOWED: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

const MB = 1024 * 1024;
/** 영상만 200MB, 나머지는 20MB. 컨트롤러의 multer 상한(200MB)은 가장 큰 쪽이다. */
export const MAX_UPLOAD = 200 * MB;
function limitOf(mime: string): number {
  return mime.startsWith('video/') ? 200 * MB : 20 * MB;
}

const PAGE = 40;

export interface AdminFileView {
  id: string;
  title: string | null;
  filename_download: string;
  type: string | null;
  filesize: number | null;
  width: number | null;
  height: number | null;
  created_on: Date;
  /** 공개 주소 — 게시된 글이 참조해야 열린다(/api/content/assets 의 관문). */
  url: string;
  /** 관리 화면 미리보기 — 참조 여부와 무관하게 열린다. */
  preview_url: string;
  used: number;
}

@Injectable()
export class AdminFileDefaultService {
  constructor(
    private readonly fileDefaultRepository: FileDefaultRepository,
    private readonly revisionService: RevisionService,
  ) {}

  /** 디스크에 `<uuid>.<ext>` 로 쓰고 directus_files 행을 만든다. 그림이면 치수까지. */
  async upload(
    file:
      | { originalname: string; mimetype: string; size: number; buffer: Buffer }
      | undefined,
    title?: string,
    who?: SessionPayload,
  ): Promise<FileEntity> {
    if (!file) throw CommonError.createByErrorCode(AdminFileError.NO_FILE);
    const ext = ALLOWED[file.mimetype];
    if (!ext)
      throw CommonError.createByErrorCode(AdminFileError.TYPE_NOT_ALLOWED);
    if (file.size > limitOf(file.mimetype))
      throw CommonError.createByErrorCode(AdminFileError.TOO_LARGE);
    const id = randomUUID();
    const filenameDisk = `${id}${ext}`;
    mkdirSync(AppConfig.uploadsDir, { recursive: true });
    writeFileSync(join(AppConfig.uploadsDir, filenameDisk), file.buffer);
    const size = file.mimetype.startsWith('image/')
      ? imageSize(file.buffer)
      : null;
    // multer 는 파일 이름을 latin1 로 준다 — 한글 이름이 깨진다. utf8 로 되돌린다.
    const original = decodeName(file.originalname) || `upload${ext}`;
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
    const saved = await this.fileDefaultRepository.repository.save(row);
    if (who) {
      await this.revisionService.record({
        actor: who.email,
        action: 'create',
        collection: 'files',
        itemId: id,
        after: this.view(saved, 0),
      });
    }
    return saved;
  }

  /** 최신순. type 은 image · pdf · video, q 는 이름·원본 파일명. */
  async list(options: { q?: string; type?: string; page?: number }) {
    const page = Math.max(1, options.page ?? 1);
    const qb = this.fileDefaultRepository.repository
      .createQueryBuilder('f')
      .orderBy('f.createdOn', 'DESC')
      .addOrderBy('f.id', 'ASC');
    if (options.type === 'image') qb.andWhere("f.type LIKE 'image/%'");
    else if (options.type === 'pdf') qb.andWhere("f.type = 'application/pdf'");
    else if (options.type === 'video') qb.andWhere("f.type LIKE 'video/%'");
    const q = (options.q ?? '').trim();
    if (q) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('f.title ILIKE :q', { q: `%${q}%` }).orWhere(
            'f.filenameDownload ILIKE :q',
            {
              q: `%${q}%`,
            },
          );
        }),
      );
    }
    const [rows, total] = await qb
      .skip((page - 1) * PAGE)
      .take(PAGE)
      .getManyAndCount();
    const used = await this.fileDefaultRepository.usage(rows.map((r) => r.id));
    return {
      data: rows.map((r) => this.view(r, used.get(r.id) ?? 0)),
      total,
      page,
      pageSize: PAGE,
    };
  }

  async get(id: string): Promise<FileEntity> {
    const row = await this.fileDefaultRepository.findById(id);
    if (!row) throw CommonError.createByErrorCode(AdminFileError.NOT_FOUND);
    return row;
  }

  async rename(
    id: string,
    title: string,
    who: SessionPayload,
  ): Promise<AdminFileView> {
    const row = await this.get(id);
    const used = (await this.fileDefaultRepository.usage([id])).get(id) ?? 0;
    const before = this.view(row, used);
    row.title = title.trim();
    row.modifiedOn = new Date();
    const saved = await this.fileDefaultRepository.repository.save(row);
    const after = this.view(saved, used);
    await this.revisionService.record({
      actor: who.email,
      action: 'update',
      collection: 'files',
      itemId: id,
      before,
      after,
    });
    return after;
  }

  /**
   * 행과 디스크 파일을 같이 지운다. 글에서 쓰는 파일이면 409 — force 면 그 글들에서
   * 빼고(그림 비움 · 첨부 제거) 지운다.
   */
  async remove(
    id: string,
    force: boolean,
    who?: SessionPayload,
  ): Promise<void> {
    const row = await this.get(id);
    const used = (await this.fileDefaultRepository.usage([id])).get(id) ?? 0;
    if (used > 0 && !force)
      throw CommonError.createByErrorCode(AdminFileError.IN_USE);
    const before = this.view(row, used);
    await this.fileDefaultRepository.repository.manager.transaction(
      async (m) => {
        if (used > 0) await this.fileDefaultRepository.detach(m, id);
        await m.remove(row);
      },
    );
    rmSync(this.diskPath(row), { force: true });
    if (who) {
      await this.revisionService.record({
        actor: who.email,
        action: 'delete',
        collection: 'files',
        itemId: id,
        before,
      });
    }
  }

  /** 디스크 경로. filename_disk 에 경로 문자가 들어 있으면 거른다. */
  diskPath(row: FileEntity): string {
    const name = String(row.filenameDisk ?? '').replace(/[/\\]/g, '');
    return join(AppConfig.uploadsDir, name);
  }

  view(r: FileEntity, used: number): AdminFileView {
    return {
      id: r.id,
      title: r.title,
      filename_download: r.filenameDownload,
      type: r.type,
      filesize: r.filesize === null ? null : Number(r.filesize),
      width: r.width,
      height: r.height,
      created_on: r.createdOn,
      url: `/api/content/assets/${r.id}`,
      preview_url: `/api/admin/files/${r.id}`,
      used,
    };
  }
}

/** multer 가 latin1 로 준 파일 이름을 utf8 로. 이미 utf8 이면 그대로. */
function decodeName(name: string): string {
  if (!name) return name;
  const round = Buffer.from(name, 'latin1').toString('utf8');
  // 되돌린 결과에 대체 문자가 생기면 원래 utf8 이었던 것이다.
  return round.includes('�') ? name : round;
}

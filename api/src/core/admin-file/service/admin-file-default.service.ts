import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { AppConfig } from '../../../common/config/app-config';
import { FileEntity } from '../../../common/entity/file.entity';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { imageSize } from '../../../common/image/image-size';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import {
  AdminFilePreview,
  ControllerAdminFileDefaultResponseDto,
} from '../dto/controller-admin-file-default-response.dto';
import { ControllerAdminFileDefaultListQueryDto } from '../dto/controller-admin-file-default.dto';
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

/** multer 가 넘기는 파일 중 쓰는 칸. */
export interface UploadedFileInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * 관리 화면 미디어. 업로드 폴더에 `<uuid>.<ext>` 로 쓰고 directus_files 에 한 행.
 * 디스크와 DB 는 한 트랜잭션이 아니다 — 행을 못 만들면 쓴 파일을 지우고, 행을 지운 뒤에 파일을 지운다
 * (파일이 먼저 사라지면 살아 있는 행이 깨진 파일을 가리킨다).
 */
@Injectable()
export class AdminFileDefaultService {
  constructor(
    private readonly fileDefaultRepository: FileDefaultRepository,
    private readonly revisionService: RevisionService,
  ) {}

  /** 파일 하나를 올린다. 형식·크기(그림·PDF 20MB · 영상 200MB)를 보고, 그림이면 치수까지 적는다. */
  @ServiceException({ errorCode: AdminFileError.UPLOAD_UNKNOWN })
  async upload(
    ctx: ITransactionContext,
    file: UploadedFileInput | undefined,
    title: string | undefined,
    who: SessionPayload,
  ): Promise<ControllerAdminFileDefaultResponseDto> {
    if (!file) throw CommonError.createByErrorCode(AdminFileError.NO_FILE);
    const ext = ALLOWED[file.mimetype];
    if (!ext)
      throw CommonError.createByErrorCode(AdminFileError.TYPE_NOT_ALLOWED);
    if (file.size > limitOf(file.mimetype))
      throw CommonError.createByErrorCode(AdminFileError.TOO_LARGE);
    const id = randomUUID();
    const filenameDisk = `${id}${ext}`;
    const path = join(AppConfig.uploadsDir, filenameDisk);
    mkdirSync(AppConfig.uploadsDir, { recursive: true });
    writeFileSync(path, file.buffer);
    try {
      return await this.insertRow(ctx, id, filenameDisk, ext, file, title, who);
    } catch (e) {
      rmSync(path, { force: true });
      throw e;
    }
  }

  /** 최신순 한 쪽(40). 쓰는 곳의 수를 같이 싣는다. */
  @ServiceException({ errorCode: AdminFileError.LIST_UNKNOWN })
  async list(
    ctx: ITransactionContext,
    query: ControllerAdminFileDefaultListQueryDto,
  ): Promise<{
    data: ControllerAdminFileDefaultResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const [rows, total] = await this.fileDefaultRepository.findPage(ctx, {
      type: query.type,
      q: (query.q ?? '').trim() || undefined,
      skip: (page - 1) * PAGE,
      take: PAGE,
    });
    const used = await this.fileDefaultRepository.usage(
      ctx,
      rows.map((r) => r.id),
    );
    return {
      data: rows.map((r) =>
        ControllerAdminFileDefaultResponseDto.from(r, used.get(r.id) ?? 0),
      ),
      total,
      page,
      pageSize: PAGE,
    };
  }

  /** 관리 화면 미리보기로 보낼 파일(가리키는 곳과 상관없이). 없으면 404. */
  @ServiceException({ errorCode: AdminFileError.GET_UNKNOWN })
  async preview(
    ctx: ITransactionContext,
    id: string,
  ): Promise<AdminFilePreview> {
    const row = await this.findOrThrow(ctx, id);
    return {
      type: row.type ?? 'application/octet-stream',
      path: this.diskPath(row),
    };
  }

  /** 보이는 이름만 바꾼다. 디스크 이름(uuid)은 그대로 — 이미 박힌 주소가 안 깨진다. */
  @ServiceException({ errorCode: AdminFileError.RENAME_UNKNOWN })
  @Transactional()
  async rename(
    ctx: ITransactionContext,
    id: string,
    title: string,
    who: SessionPayload,
  ): Promise<ControllerAdminFileDefaultResponseDto> {
    const row = await this.findOrThrow(ctx, id);
    const used =
      (await this.fileDefaultRepository.usage(ctx, [id])).get(id) ?? 0;
    const before = ControllerAdminFileDefaultResponseDto.from(row, used);
    row.title = title.trim();
    row.modifiedOn = new Date();
    const after = ControllerAdminFileDefaultResponseDto.from(
      await this.fileDefaultRepository.save(ctx, row),
      used,
    );
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'update',
        collection: 'files',
        itemId: id,
        before,
        after,
      },
      ctx,
    );
    return after;
  }

  /**
   * 행과 디스크 파일을 지운다. 쓰는 곳이 있으면 409 — force 면 그곳에서 빼고(그림 칸 비움 · 첨부 제거 ·
   * 본문 그림 걷음) 지운다. 행을 지우는 트랜잭션이 끝난 뒤에 디스크 파일을 지운다.
   */
  @ServiceException({ errorCode: AdminFileError.DELETE_UNKNOWN })
  async remove(
    ctx: ITransactionContext,
    id: string,
    force: boolean,
    who: SessionPayload,
  ): Promise<void> {
    const path = await this.deleteRow(ctx, id, force, who);
    rmSync(path, { force: true });
  }

  @Transactional()
  private async insertRow(
    ctx: ITransactionContext,
    id: string,
    filenameDisk: string,
    ext: string,
    file: UploadedFileInput,
    title: string | undefined,
    who: SessionPayload,
  ): Promise<ControllerAdminFileDefaultResponseDto> {
    const size = file.mimetype.startsWith('image/')
      ? imageSize(file.buffer)
      : null;
    // multer 는 파일 이름을 latin1 로 준다 — 한글 이름이 깨진다. utf8 로 되돌린다.
    const original = decodeName(file.originalname) || `upload${ext}`;
    const saved = await this.fileDefaultRepository.save(
      ctx,
      this.fileDefaultRepository.newRow(ctx, {
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
      }),
    );
    const view = ControllerAdminFileDefaultResponseDto.from(saved, 0);
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'create',
        collection: 'files',
        itemId: id,
        after: view,
      },
      ctx,
    );
    return view;
  }

  /** 행을 지우고(필요하면 쓰는 곳에서 먼저 뺀다) 디스크 경로를 돌려준다. */
  @Transactional()
  private async deleteRow(
    ctx: ITransactionContext,
    id: string,
    force: boolean,
    who: SessionPayload,
  ): Promise<string> {
    const row = await this.findOrThrow(ctx, id);
    const used =
      (await this.fileDefaultRepository.usage(ctx, [id])).get(id) ?? 0;
    if (used > 0 && !force)
      throw CommonError.createByErrorCode(AdminFileError.IN_USE);
    const before = ControllerAdminFileDefaultResponseDto.from(row, used);
    const path = this.diskPath(row);
    if (used > 0) await this.fileDefaultRepository.detach(ctx, id);
    await this.fileDefaultRepository.remove(ctx, row);
    await this.revisionService.record(
      {
        actor: who.email,
        action: 'delete',
        collection: 'files',
        itemId: id,
        before,
      },
      ctx,
    );
    return path;
  }

  private async findOrThrow(
    ctx: ITransactionContext,
    id: string,
  ): Promise<FileEntity> {
    const row = await this.fileDefaultRepository.findById(ctx, id);
    if (!row) throw CommonError.createByErrorCode(AdminFileError.NOT_FOUND);
    return row;
  }

  /** 디스크 경로. filename_disk 에 경로 문자가 들어 있으면 거른다. */
  private diskPath(row: FileEntity): string {
    const name = String(row.filenameDisk ?? '').replace(/[/\\]/g, '');
    return join(AppConfig.uploadsDir, name);
  }
}

/** multer 가 latin1 로 준 파일 이름을 utf8 로. 이미 utf8 이면 그대로. */
function decodeName(name: string): string {
  if (!name) return name;
  const round = Buffer.from(name, 'latin1').toString('utf8');
  // 되돌린 결과에 대체 문자가 생기면 원래 utf8 이었던 것이다.
  return round.includes('�') ? name : round;
}

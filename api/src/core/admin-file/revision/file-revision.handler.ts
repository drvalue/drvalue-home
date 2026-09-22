import { Injectable, OnModuleInit } from '@nestjs/common';
import type { RevisionEntity } from '../../../common/entity/revision.entity';
import {
  RevisionHandler,
  RevisionRestoreRegistry,
} from '../../../common/revision/revision-restore.registry';
import { AdminFileError } from '../error/admin-file.error';

/** 미디어 파일(files)의 변경 이력 — 보기만 한다. 지운 파일의 본체(디스크)는 남지 않아 되돌리지 않는다. */
@Injectable()
export class FileRevisionHandler implements RevisionHandler, OnModuleInit {
  readonly collection = 'files';
  readonly restorable = false;
  readonly notRestorable = AdminFileError.NOT_RESTORABLE;

  constructor(private readonly registry: RevisionRestoreRegistry) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  label(rev: RevisionEntity): string {
    const s = (rev.after ?? rev.before) as Record<string, unknown> | null;
    return String(s?.title || s?.filename_download || rev.itemId);
  }
}

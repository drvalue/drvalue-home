import { Injectable } from '@nestjs/common';
import { LANGUAGES } from '../../../common/entity/post-translation.entity';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import { RevisionService } from '../../../common/revision/revision.service';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import {
  ControllerPageDefaultDetailResponseDto,
  ControllerPageDefaultLangResponseDto,
  ControllerPageDefaultPublicResponseDto,
  ControllerPageDefaultRowResponseDto,
} from '../dto/controller-page-default-response.dto';
import type { ControllerPageDefaultSaveDto } from '../dto/controller-page-default.dto';
import { PageError } from '../error/page.error';
import { PageDefaultRepository } from '../repository/page-default.repository';
import { PageFileDefaultRepository } from '../repository/page-file-default.repository';
import { PAGE_SCHEMAS, pageSchemaOf } from '../schema';
import type { PageSchema } from '../schema/page-schema';
import {
  checkContent,
  dropImages,
  emptyContent,
  PageContentError,
  withImageSizes,
} from './page-content';

/** 요청 언어의 글이 없을 때 내는 언어. 게시판(content)과 같다. */
const DEFAULT_LANGUAGE = 'ko-KR';

/**
 * 페이지 글(회사소개·오시는 길 …). 칸 구조는 schema/ 가 정하고, 저장은 그 구조로 검사한다.
 *
 * 규칙: 스키마에 없는 장은 404 · 스키마에 없는 칸은 400 · 그림은 미디어에 있는 파일만 ·
 * 저장은 변경 이력과 한 트랜잭션 · 저장한 것이 곧 공개(초안 없음).
 */
@Injectable()
export class PageDefaultService {
  constructor(
    private readonly pageDefaultRepository: PageDefaultRepository,
    private readonly pageFileDefaultRepository: PageFileDefaultRepository,
    private readonly revisionService: RevisionService,
  ) {}

  private schemaOrThrow(key: string): PageSchema {
    const schema = pageSchemaOf(key);
    if (!schema) throw CommonError.createByErrorCode(PageError.NOT_FOUND);
    return schema;
  }

  /** 편집할 수 있는 장 전부와 마지막으로 고친 때(목록 순서 = 스키마 등록 순서). */
  @ServiceException({ errorCode: PageError.LIST_UNKNOWN })
  async list(
    ctx: ITransactionContext,
  ): Promise<ControllerPageDefaultRowResponseDto[]> {
    const latest = await this.pageDefaultRepository.findLatestByKeys(
      ctx,
      PAGE_SCHEMAS.map((s) => s.key),
    );
    return PAGE_SCHEMAS.map((s) =>
      ControllerPageDefaultRowResponseDto.from(s, latest.get(s.key)),
    );
  }

  /** 편집 화면 한 장 — 칸 구조와 언어별 글. 아직 없는 언어는 빈 글이다. */
  @ServiceException({ errorCode: PageError.GET_UNKNOWN })
  async get(
    ctx: ITransactionContext,
    key: string,
  ): Promise<ControllerPageDefaultDetailResponseDto> {
    const schema = this.schemaOrThrow(key);
    const rows = await this.pageDefaultRepository.findByKey(ctx, key);
    const empty = emptyContent(schema.fields);
    const languages: Record<string, ControllerPageDefaultLangResponseDto> = {};
    for (const code of LANGUAGES)
      languages[code] = ControllerPageDefaultLangResponseDto.from(
        rows.find((r) => r.languagesCode === code) ?? null,
        empty,
      );
    return { schema, languages };
  }

  /**
   * 한 언어의 글을 저장한다. 스키마로 검사·정리하고(richtext 는 허용 태그만), 그림이 미디어에
   * 있는지 본 뒤 덮어쓴다. 이력의 item 은 `<key>/<언어>`.
   */
  @ServiceException({ errorCode: PageError.SAVE_UNKNOWN })
  @Transactional()
  async save(
    ctx: ITransactionContext,
    key: string,
    dto: ControllerPageDefaultSaveDto,
    who: SessionPayload,
  ): Promise<ControllerPageDefaultLangResponseDto> {
    const schema = this.schemaOrThrow(key);
    return this.write(ctx, schema, key, dto.languages_code, dto.content, who);
  }

  /**
   * 변경 이력의 글(한 장 · 한 언어)로 되돌린다. 저장과 같은 검사를 거친다. 그 사이에 미디어에서
   * 지운 그림은 비우고 경고로 알린다(비운 칸이 필수면 검사에서 400). 되돌림도 이력(restore) 한 줄이다.
   */
  @ServiceException({ errorCode: PageError.RESTORE_UNKNOWN })
  @Transactional()
  async restoreContent(
    ctx: ITransactionContext,
    key: string,
    languagesCode: string,
    content: unknown,
    who: SessionPayload,
  ): Promise<{
    data: ControllerPageDefaultLangResponseDto;
    warnings: string[];
  }> {
    const schema = this.schemaOrThrow(key);
    const { fileIds } = this.check(schema, content);
    const sizes = await this.pageFileDefaultRepository.findSizes(ctx, fileIds);
    const gone = new Set(fileIds.filter((id) => !sizes.has(id)));
    const data = await this.write(
      ctx,
      schema,
      key,
      languagesCode,
      gone.size ? dropImages(content, gone) : content,
      who,
      'restore',
    );
    return {
      data,
      warnings: gone.size
        ? [`그림 ${gone.size}개는 파일이 지워져 있어 비워 두었습니다.`]
        : [],
    };
  }

  /** 검사·치수 적기·덮어쓰기·변경 이력. 저장과 되돌리기가 같이 쓴다. */
  private async write(
    ctx: ITransactionContext,
    schema: PageSchema,
    key: string,
    languagesCode: string,
    raw: unknown,
    who: SessionPayload,
    action?: 'restore',
  ): Promise<ControllerPageDefaultLangResponseDto> {
    const checked = this.check(schema, raw);
    const sizes = await this.pageFileDefaultRepository.findSizes(
      ctx,
      checked.fileIds,
    );
    if (checked.fileIds.some((id) => !sizes.has(id)))
      throw CommonError.createByErrorCode(PageError.FILE_GONE);
    const content = withImageSizes(checked.content, sizes);

    const pages = this.pageDefaultRepository.repository(ctx);
    const before = await this.pageDefaultRepository.findOne(
      ctx,
      key,
      languagesCode,
    );
    const saved = await pages.save(
      pages.create({
        key,
        languagesCode,
        content,
        updatedOn: new Date(),
        updatedBy: who.email,
      }),
    );
    await this.revisionService.record(
      {
        actor: who.email,
        action: action ?? (before ? 'update' : 'create'),
        collection: 'pages',
        itemId: `${key}/${languagesCode}`,
        before: before?.content ?? null,
        after: saved.content,
      },
      ctx,
    );
    return ControllerPageDefaultLangResponseDto.from(
      saved,
      emptyContent(schema.fields),
    );
  }

  /**
   * 공개 읽기. 요청 언어가 없으면 기본 언어(ko-KR). 둘 다 없으면 404 — 화면은 코드의 글을 쓴다.
   * 누가 고쳤는지(updated_by)는 싣지 않는다.
   */
  @ServiceException({ errorCode: PageError.GET_UNKNOWN })
  async findPublic(
    ctx: ITransactionContext,
    key: string,
    lang?: string,
  ): Promise<ControllerPageDefaultPublicResponseDto> {
    this.schemaOrThrow(key);
    const want = lang ?? DEFAULT_LANGUAGE;
    const row =
      (await this.pageDefaultRepository.findOne(ctx, key, want)) ??
      (want === DEFAULT_LANGUAGE
        ? null
        : await this.pageDefaultRepository.findOne(ctx, key, DEFAULT_LANGUAGE));
    if (!row) throw CommonError.createByErrorCode(PageError.CONTENT_NOT_FOUND);
    return { data: row.content, language: row.languagesCode };
  }

  /** 스키마 검사. 틀리면 칸 이름이 든 문구로 400. */
  private check(schema: PageSchema, content: unknown) {
    try {
      return checkContent(schema.fields, content);
    } catch (e) {
      if (e instanceof PageContentError)
        throw CommonError.createByErrorCode(PageError.INVALID, e.message);
      throw e;
    }
  }
}

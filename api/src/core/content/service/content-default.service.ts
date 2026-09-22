import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AppConfig } from '../../../common/config/app-config';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import {
  ContentPublicFile,
  ControllerContentAttachmentResponseDto,
  ControllerContentDefaultPostDetailEnvelopeDto,
  ControllerContentDefaultPostListResponseDto,
  ControllerContentDefaultPostResponseDto,
} from '../dto/controller-content-default-response.dto';
import { ControllerContentDefaultPostsQueryDto } from '../dto/controller-content-default.dto';
import { ContentError } from '../error/content.error';
import { ContentFileDefaultRepository } from '../repository/file-default.repository';
import { ContentPostDefaultRepository } from '../repository/post-default.repository';

/** 게시판 한 쪽의 글 수. 화면의 페이지 번호가 이 값을 전제한다. */
export const PAGE_SIZE = 10;
/** `limit` 으로 늘릴 수 있는 상한. 연혁·증서처럼 한 장에 다 보이는 목록용. */
export const MAX_LIMIT = 100;

const LANGS = ['ko-KR', 'en-US'];
/** 공개 사이트 기본 언어. 요청 언어 번역이 없을 때 여기로 떨어진다. */
const DEFAULT_LANGUAGE = 'ko-KR';
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-fA-F-]{36}$/;

/**
 * 공개 사이트가 읽는 게시판과 공개 파일 관문. DB 를 직접 읽는다 — 지금 공개된 글만.
 * 응답 모양은 contracts.md 의 약속이다. verify.sh 가 그 약속을 잰다.
 */
@Injectable()
export class ContentDefaultService {
  private readonly logger = new Logger(ContentDefaultService.name);

  constructor(
    private readonly contentPostDefaultRepository: ContentPostDefaultRepository,
    private readonly contentFileDefaultRepository: ContentFileDefaultRepository,
  ) {}

  /**
   * 공개 게시판 한 쪽. 틀린 쿼리 값은 거절하지 않고 자른다 — 쪽은 1 이상, 크기는 1..100(없으면 10),
   * 검색어는 200자, 날짜는 YYYY-MM-DD 모양일 때만 조건에 넣는다. FAQ 는 답(본문)까지 싣는다.
   */
  @ServiceException({ errorCode: ContentError.POSTS_UNKNOWN })
  async findPosts(
    ctx: ITransactionContext,
    query: ControllerContentDefaultPostsQueryDto,
  ): Promise<ControllerContentDefaultPostListResponseDto> {
    const language = this.language(query.lang);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(query.limit) || PAGE_SIZE),
    );
    const page = Math.max(1, Number(query.page) || 1);
    const [rows, total] = await this.contentPostDefaultRepository.findLivePage(
      ctx,
      {
        languages: this.languages(language),
        board: query.board || undefined,
        keyword: (query.q ?? '').trim().slice(0, 200) || undefined,
        startDate:
          query.startDate && DAY_RE.test(query.startDate)
            ? query.startDate
            : undefined,
        endDate:
          query.endDate && DAY_RE.test(query.endDate)
            ? query.endDate
            : undefined,
        skip: (page - 1) * limit,
        take: limit,
      },
    );
    const withBody = query.board === 'faq';
    return {
      data: rows.map((r) =>
        ControllerContentDefaultPostResponseDto.from(r, language, withBody),
      ),
      total,
      pageSize: limit,
      language,
    };
  }

  /** 공개 글 하나(본문·첨부까지). 없거나 공개 전·내린 뒤면 404. */
  @ServiceException({ errorCode: ContentError.POST_UNKNOWN })
  async findPost(
    ctx: ITransactionContext,
    slug: string,
    lang?: string,
  ): Promise<ControllerContentDefaultPostDetailEnvelopeDto> {
    const language = this.language(lang);
    const row = await this.contentPostDefaultRepository.findLiveBySlug(
      ctx,
      slug,
      this.languages(language),
    );
    if (!row) throw CommonError.createByErrorCode(ContentError.POST_NOT_FOUND);
    return {
      data: {
        ...ControllerContentDefaultPostResponseDto.from(row, language, true),
        attachments: ControllerContentAttachmentResponseDto.fromPost(row),
      },
      language,
    };
  }

  /**
   * 파일 원본 한 벌. 공개된 곳이 실제로 가리키는 파일만 통과시킨다 — 공개 글의 대표·공유 그림·첨부·
   * 본문 그림, 정적 장 공유 그림, 페이지 글 그림, 살아 있는 메인 배너·팝업. 업로드 폴더에는 초안 첨부도
   * 있으므로 uuid 모양만 보고 흘리면 안 된다. 행은 있는데 디스크에 없으면 밖으로는 404, 원인은 로그에.
   */
  @ServiceException({ errorCode: ContentError.FILE_UNKNOWN })
  async publicFile(
    ctx: ITransactionContext,
    id: string,
  ): Promise<ContentPublicFile> {
    if (!UUID_RE.test(id))
      throw CommonError.createByErrorCode(ContentError.FILE_ID_INVALID);
    const isPublic =
      (await this.contentPostDefaultRepository.isReferencedByLivePost(
        ctx,
        id,
      )) ||
      (await this.contentFileDefaultRepository.isReferencedOutsidePosts(
        ctx,
        id,
      ));
    if (!isPublic)
      throw CommonError.createByErrorCode(ContentError.FILE_NOT_FOUND);
    const row = await this.contentFileDefaultRepository.findById(ctx, id);
    const name = String(row?.filenameDisk ?? '').replace(/[/\\]/g, '');
    const path = join(AppConfig.uploadsDir, name);
    if (!row || !name || !existsSync(path)) {
      this.logger.warn(`파일 ${id}: 디스크에 없음`);
      throw CommonError.createByErrorCode(ContentError.FILE_NOT_FOUND);
    }
    return {
      type: row.type ?? 'application/octet-stream',
      size: statSync(path).size,
      stream: createReadStream(path),
    };
  }

  private language(requested?: string): string {
    return requested && LANGS.includes(requested)
      ? requested
      : DEFAULT_LANGUAGE;
  }

  /** 요청 언어 + 기본 언어. 한 언어만 실으면 번역 없는 글이 제목 없이 나간다. */
  private languages(requested: string): string[] {
    return requested === DEFAULT_LANGUAGE
      ? [requested]
      : [requested, DEFAULT_LANGUAGE];
  }
}

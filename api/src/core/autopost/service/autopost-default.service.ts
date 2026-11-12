import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppConfig } from '../../../common/config/app-config';
import { CommonError } from '../../../common/error/common-error';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { TransactionContextFactory } from '../../../common/typeorm/transaction-context.factory';
import { Transactional } from '../../../common/typeorm/transactional.decorator';
import { AdminPostDefaultService } from '../../admin-post/service/admin-post-default.service';
import {
  AUTOPOST_CLIENT,
  AutopostClient,
  Usage,
} from '../client/autopost-claude.client';
import { AutopostError } from '../error/autopost.error';
import type { Article } from '../model/article';
import { AutopostRunDefaultRepository } from '../repository/autopost-run-default.repository';
import { planRun } from './autopost-plan';
import { produce, Produced } from './autopost-produce';
import { renderArticle } from './autopost-render';
import { isDue, kstDate, weekKey } from './autopost-week';

const ACTOR = 'autopost@system';
const BOARD = 'news';
const LANGUAGE = 'ko-KR';

/** auto: cron(주 1회, 통과하면 공개) · preview: 보기만(저장 없음) · draft: 통과한 글만 초안으로 저장(공개 안 함). */
export type AutopostMode = 'auto' | 'preview' | 'draft';

export interface AutopostResult {
  outcome: 'published' | 'drafted' | 'skipped' | 'preview';
  /** 검사에서 떨어진 사유. 통과했으면 빈 배열. */
  reasons: string[];
  /** 시도마다의 사유(첫 번째 · 다시 쓴 것). */
  attempts: string[][];
  /** 진단용 증거(조사 결과·시도마다의 글과 판정 기록). */
  evidence: Produced['evidence'];
  article: Article;
  html: string;
  postId?: number;
  usage: Usage;
}

/**
 * 제조 AI 주간 글. 한 주(ISO 주, 한국 시간)에 한 편 — 화요일 09:00 이후 한 시간마다 「이번 주 기록이 있나」를 보고
 * 없으면 만든다(정해진 시각에 한 번 쏘면 배포로 내려가 있던 주를 통째로 놓친다).
 *
 *   검사 통과 → 뉴스 게시판에 **공개**로 저장. 사람 검수가 없다(결정 0020).
 *   검사 탈락 → 글을 만들지 않고 기록 표에만 남긴다. 그 주는 건너뛴다.
 *   호출 실패 → 오류로 닫고 그 주에 한 번 더 한다.
 *
 * 조사·집필은 몇 분이 걸린다 — 그동안 트랜잭션을 열지 않는다. 주 잡기와 글 저장만 짧게 쓴다.
 * 빠뜨리면 꺼진다: 켜기 값과 키가 없으면 Claude 를 부르지 않는다.
 */
@Injectable()
export class AutopostDefaultService {
  private readonly logger = new Logger(AutopostDefaultService.name);

  constructor(
    private readonly autopostRunDefaultRepository: AutopostRunDefaultRepository,
    private readonly adminPostDefaultService: AdminPostDefaultService,
    private readonly transactionContextFactory: TransactionContextFactory,
    @Inject(AUTOPOST_CLIENT) private readonly client: AutopostClient,
  ) {}

  /** cron 입구. 요청 밖이라 문맥을 직접 만든다. 실패해도 다음 틱이 다시 본다 — 던지지 않고 로그만. */
  @Cron(CronExpression.EVERY_HOUR)
  async tick(): Promise<void> {
    try {
      await this.run(this.transactionContextFactory.create(), 'auto');
    } catch {
      // @ServiceException 이 스택을 이미 남겼다.
    }
  }

  /**
   * 한 번 돈다. `auto` 는 때가 아니거나 이번 주를 못 잡으면 null(아무것도 안 했다).
   * `preview`·`draft` 는 손으로 돌리는 것이라 켜기 값·요일·기록 표를 보지 않는다(키는 본다).
   */
  @ServiceException({ errorCode: AutopostError.RUN_UNKNOWN })
  async run(
    ctx: ITransactionContext,
    mode: AutopostMode,
    now: Date = new Date(),
  ): Promise<AutopostResult | null> {
    if (mode !== 'auto') return this.runManual(ctx, mode, now);
    if (!AppConfig.autopost.ready || !isDue(now)) return null;

    const week = weekKey(now);
    const plan = planRun(
      await this.autopostRunDefaultRepository.findByWeek(ctx, week),
      now,
    );
    if (plan === 'none') return null;
    if (plan === 'reap') {
      await this.autopostRunDefaultRepository.reap(ctx, week);
      this.logger.warn(`자동 글 ${week}: 멈춘 실행을 닫았습니다`);
      return null; // 다시 하기는 다음 틱이 본다
    }
    const claimed =
      plan === 'start'
        ? await this.autopostRunDefaultRepository.claim(ctx, week)
        : await this.autopostRunDefaultRepository.claimRetry(ctx, week);
    if (!claimed) return null; // 다른 프로세스가 먼저 잡았다

    const today = kstDate(now);
    let made: Produced;
    try {
      made = await produce(this.client, await this.avoid(ctx, today));
    } catch (e) {
      await this.autopostRunDefaultRepository.finish(ctx, week, {
        status: 'error',
        reason: reasonOf(e),
      });
      this.logger.error(`자동 글 ${week}: 만들지 못했습니다 — ${reasonOf(e)}`);
      return null;
    }
    const base = {
      reasons: made.reasons,
      attempts: made.attempts,
      evidence: made.evidence,
      article: made.article,
      html: made.ok ? renderArticle(made.article) : '',
      usage: made.usage,
    };
    const tokens = {
      article: made.article,
      inputTokens: made.usage.input,
      outputTokens: made.usage.output,
    };
    if (!made.ok) {
      await this.autopostRunDefaultRepository.finish(ctx, week, {
        status: 'skipped',
        reason: made.reasons.join('\n'),
        ...tokens,
      });
      this.logger.warn(
        `자동 글 ${week}: 검사에 떨어져 건너뜁니다 (사유 ${made.reasons.length}건)`,
      );
      return { outcome: 'skipped', ...base };
    }
    let postId: number;
    try {
      postId = await this.publish(
        ctx,
        week,
        made.article,
        base.html,
        today,
        tokens,
      );
    } catch (e) {
      await this.autopostRunDefaultRepository.finish(ctx, week, {
        status: 'error',
        reason: `저장 실패: ${reasonOf(e)}`,
        ...tokens,
      });
      this.logger.error(
        `자동 글 ${week}: 저장하지 못했습니다 — ${reasonOf(e)}`,
      );
      return null;
    }
    this.logger.log(`자동 글 ${week}: 공개했습니다 (글 ${postId})`);
    return { outcome: 'published', postId, ...base };
  }

  /**
   * 글 저장과 기록 닫기를 한 트랜잭션으로. 기록을 못 닫으면(그사이 멈춘 실행으로 닫혀 다른 실행이 잡았다) 글도 되돌린다 —
   * 글은 나갔는데 기록은 「공개」가 아닌 주가 생기면 다음 실행이 같은 주에 또 만든다.
   */
  @Transactional()
  private async publish(
    ctx: ITransactionContext,
    week: string,
    article: Article,
    html: string,
    today: string,
    tokens: { article: Article; inputTokens: number; outputTokens: number },
  ): Promise<number> {
    const postId = await this.save(ctx, article, html, today, {
      status: 'published',
      // 주소는 주 키로 짓는다 — 같은 주에 두 번째 글이 생기려 하면 주소가 겹쳐 막힌다.
      slug: `mfg-ai-${week.toLowerCase()}`,
    });
    const closed = await this.autopostRunDefaultRepository.finish(ctx, week, {
      status: 'published',
      postId,
      ...tokens,
    });
    if (!closed) throw new Error('닫을 기록이 없습니다 — 글 저장을 되돌립니다');
    return postId;
  }

  private async runManual(
    ctx: ITransactionContext,
    mode: 'preview' | 'draft',
    now: Date,
  ): Promise<AutopostResult> {
    if (!AppConfig.autopost.hasKey)
      throw CommonError.createByErrorCode(AutopostError.NOT_CONFIGURED);
    const today = kstDate(now);
    const made = await produce(this.client, await this.avoid(ctx, today));
    // 손으로 돌린 것은 떨어진 글도 보여 준다 — 만든 HTML 을 읽어 보려고 돌리는 것이다.
    const html = safeRender(made.article);
    const base = {
      reasons: made.reasons,
      attempts: made.attempts,
      evidence: made.evidence,
      article: made.article,
      html,
      usage: made.usage,
    };
    // 검사에 떨어진 글은 초안으로도 저장하지 않는다 — 관리 화면에 일반 초안처럼 놓이면 한 번 눌러 공개된다.
    if (mode === 'preview' || !html || !made.ok)
      return { outcome: 'preview', ...base };
    const postId = await this.save(ctx, made.article, html, today, {
      status: 'draft',
      slug: `mfg-ai-${weekKey(now).toLowerCase()}-draft-${now.getTime().toString(36)}`,
    });
    return { outcome: 'drafted', postId, ...base };
  }

  /** 이미 공개한 자동 글의 제목·출처 주소 — 조사가 피하고 검사가 겹침을 본다. */
  private async avoid(
    ctx: ITransactionContext,
    today: string,
  ): Promise<{ today: string; avoidTitles: string[]; avoidUrls: string[] }> {
    const past = (await this.autopostRunDefaultRepository.findPublishedArticles(
      ctx,
    )) as Partial<Article>[];
    return {
      today,
      avoidTitles: past.flatMap((a) =>
        typeof a.title === 'string' ? [a.title] : [],
      ),
      avoidUrls: past.flatMap((a) =>
        Array.isArray(a.sources)
          ? a.sources.flatMap((s) =>
              typeof s?.url === 'string' ? [s.url] : [],
            )
          : [],
      ),
    };
  }

  /** 글 저장은 글 서비스의 시스템 행위자 입구로 — 변경 이력·소독·주소 겹침·IndexNow 가 거기 있다. */
  private async save(
    ctx: ITransactionContext,
    article: Article,
    html: string,
    today: string,
    opts: { status: 'published' | 'draft'; slug: string },
  ): Promise<number> {
    const saved = await this.adminPostDefaultService.createAsSystem(
      ctx,
      {
        board: BOARD,
        slug: opts.slug,
        status: opts.status,
        published_date: today,
        translations: [
          {
            languages_code: LANGUAGE,
            title: article.title.trim(),
            summary: article.summary.trim(),
            body: html,
            seo_title: article.title.trim(),
            seo_description: article.seo_description.trim(),
          },
        ],
      },
      ACTOR,
    );
    return saved.id;
  }
}

/** 기록·로그에 남길 한 줄. 키나 요청 본문이 실리지 않게 짧게 자른다. */
function reasonOf(e: unknown): string {
  const text = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  return text.replace(/\s+/g, ' ').slice(0, 300);
}

/** 형이 깨진 글은 그릴 수 없다 — 빈 글자를 돌려준다. */
function safeRender(article: Article): string {
  try {
    return renderArticle(article);
  } catch {
    return '';
  }
}

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { AppConfig } from '../config/app-config';
import {
  onCommit,
  type ITransactionContext,
} from '../typeorm/transaction-context';
import { SITE_ORIGIN, toSiteUrls } from './indexnow-urls';

/** 공용 끝점 — 받은 주소를 참여 검색엔진(Bing · Naver · Yandex …)끼리 나눈다. */
const ENDPOINT = 'https://api.indexnow.org/indexnow';
/** 같은 저장이 여러 번 이어져도(되돌리기 · 예약 여러 건) 한 번에 보낸다. */
const BATCH_MS = 2_000;
/** 관리 화면 저장을 기다리게 하지 않는다 — 보내기는 커밋 뒤, 이 시간 안에 못 끝나면 버린다. */
const TIMEOUT_MS = 5_000;
/** 규약의 한 번 한도. */
const MAX_URLS = 10_000;
/** 관리 화면 「검색엔진 설정」이 보여 줄 최근 보내기 수. 프로세스 메모리라 api 를 다시 띄우면 빈다. */
const RECENT_MAX = 20;

/** 보내기 한 번의 기록. 주소·키·응답 본문은 싣지 않는다(수와 상태만). */
export interface IndexNowSubmission {
  /** 보낸 시각(ISO). */
  at: string;
  url_count: number;
  status: 'ok' | 'fail';
  /** 받은 HTTP 상태. 응답이 없었으면(네트워크·시간 초과) null. */
  http_status: number | null;
}

/**
 * 공개 내용이 바뀐 주소를 IndexNow 로 알린다(Bing · Naver 가 빨리 다시 긁어 가게).
 *
 * `INDEXNOW_KEY` 가 없거나 모양이 틀리거나 미리보기(NOINDEX=1)면 아무것도 안 한다(AppConfig.indexNowKey).
 * 키 파일(`/<키>.txt`)은 web 이 같은 값으로 낸다. 알림은 트랜잭션 커밋 뒤에만, 기다리지 않고 보낸다 —
 * 실패는 로그 한 줄로 끝나고 저장 결과를 바꾸지 않는다. 로그에 키·요청 본문을 찍지 않는다(주소 수와 상태만).
 */
@Injectable()
export class IndexNowService implements OnModuleDestroy {
  private readonly logger = new Logger(IndexNowService.name);
  private readonly pending = new Set<string>();
  private timer: NodeJS.Timeout | null = null;
  /** 최근 보내기(새것이 앞). RECENT_MAX 를 넘으면 오래된 것부터 버린다. */
  private readonly log: IndexNowSubmission[] = [];

  /** 알림이 켜져 있나 — 키가 있고 모양이 맞고 미리보기(NOINDEX=1)가 아니다. 키 자체는 밖으로 안 낸다. */
  get enabled(): boolean {
    return AppConfig.indexNowKey !== null;
  }

  /** 최근 보내기 기록(새것이 앞, 최대 RECENT_MAX). 복사본을 준다. */
  recent(): IndexNowSubmission[] {
    return this.log.map((e) => ({ ...e }));
  }

  private remember(
    urlCount: number,
    status: 'ok' | 'fail',
    httpStatus: number | null,
  ): void {
    this.log.unshift({
      at: new Date().toISOString(),
      url_count: urlCount,
      status,
      http_status: httpStatus,
    });
    if (this.log.length > RECENT_MAX) this.log.length = RECENT_MAX;
  }

  /** 트랜잭션이 커밋된 뒤 이 경로들을 알린다. 꺼져 있거나 경로가 없으면 아무것도 안 한다. 던지지 않는다. */
  submitAfterCommit(ctx: ITransactionContext, paths: string[]): void {
    if (!paths.length || !AppConfig.indexNowKey) return;
    onCommit(ctx, () => this.enqueue(paths));
  }

  /** 경로를 모아 두었다가 잠시 뒤 한 번에 보낸다. 사이트 밖 경로는 버린다. */
  enqueue(paths: string[]): void {
    for (const url of toSiteUrls(paths)) this.pending.add(url);
    if (!this.pending.size || this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, BATCH_MS);
    // 보낼 것이 남아 있어도 프로세스 종료를 붙잡지 않는다.
    this.timer.unref();
  }

  /** 모인 주소를 보낸다. 어떤 실패도 던지지 않는다. */
  async flush(): Promise<void> {
    const key = AppConfig.indexNowKey;
    const urls = [...this.pending].slice(0, MAX_URLS);
    for (const u of urls) this.pending.delete(u);
    if (!key || !urls.length) return;
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: new URL(SITE_ORIGIN).host,
          key,
          keyLocation: `${SITE_ORIGIN}/${key}.txt`,
          urlList: urls,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      // 200 받음 · 202 받음(키 확인 중). 403 은 키 파일이 안 열린다는 뜻 — web 의 INDEXNOW_KEY 를 본다.
      this.remember(urls.length, res.ok ? 'ok' : 'fail', res.status);
      if (res.ok)
        this.logger.log(`IndexNow ${res.status}: 주소 ${urls.length}개`);
      else
        this.logger.warn(
          `IndexNow ${res.status}: 주소 ${urls.length}개를 못 보냈다`,
        );
    } catch (e) {
      this.remember(urls.length, 'fail', null);
      const why = e instanceof Error ? e.name : 'Error';
      this.logger.warn(`IndexNow 보내기 실패(${why}): 주소 ${urls.length}개`);
    }
    if (this.pending.size) this.enqueue([]);
  }

  /** 종료 때 기다리는 틱을 걷는다(모은 주소는 버린다 — 다음 저장이나 사이트맵이 다시 알린다). */
  onModuleDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}

import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AppModule } from './app/app.module';
import { AppConfig } from './common/config/app-config';
import { TransactionContextFactory } from './common/typeorm/transaction-context.factory';
import {
  AutopostDefaultService,
  AutopostMode,
} from './core/autopost/service/autopost-default.service';
import { SCOPE, STYLE, TOPIC } from './core/autopost/client/autopost-prompts';
import { Article, ARTICLE_JSON_SCHEMA } from './core/autopost/model/article';

/**
 * 제조 AI 주간 글을 손으로 한 번 만든다(빌드 뒤 `npm run autopost -- --preview`).
 *
 *   --preview  만들어서 검사 결과·글·토큰 수를 찍는다. 저장하지 않는다.
 *   --draft    같은 일을 하고, 검사를 통과한 글만 뉴스 게시판에 **초안**으로 저장한다. 공개하지 않는다.
 *   --article 글.json  조사·집필을 건너뛰고 받은 글을 검사·판정·그림에 넣는다(글을 바깥에서 쓸 때). 떨어져도 다시 쓰지 않는다.
 *   --article 글.json --bundle 묶음.json  위와 같되, 통과하면 글과 그림을 한 파일로 묶는다(다른 기계로 보낼 것).
 *   --publish-bundle 묶음.json  묶음을 이 DB 에 **공개**한다 — 주간 기록을 잡고 닫는다. AUTOPOST_ENABLED=1 이 있어야 한다.
 *   --rules    글을 쓰는 쪽이 읽을 주제 기준·이미 다룬 글·규칙·구조를 찍는다(DB 를 읽는다).
 *
 * 켜기 값·요일·주 단위 기록을 보지 않는다. Claude API 키만 있으면 돈다(돈이 든다 — 한 번에 호출 대여섯 번).
 * `AUTOPOST_PROVIDER=webgpt` 면 키 없이 그 기계의 ego 브라우저로 chatgpt.com 을 조작해 돈다(로그인돼 있어야 한다).
 * 키 값은 찍지 않는다.
 */
const MODES: Record<string, AutopostMode> = {
  '--preview': 'preview',
  '--draft': 'draft',
};

/** 다른 기계로 넘기는 글 묶음(검사·판정을 지난 글과 그림). */
interface Bundle {
  article: Article;
  pictures: { section: number | null; mime: 'image/jpeg'; data: string }[];
  madeOn: string;
}

const USAGE =
  '쓰는 법: npm run autopost -- --preview | --draft [--article 글.json [--bundle 묶음.json]] | --publish-bundle 묶음.json | --rules';

function readJson<T>(path: string, what: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    console.error(`${what} 파일을 읽지 못했습니다(JSON 이어야 합니다).`);
    return null;
  }
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const rules = args[0] === '--rules' && args.length === 1;
  const publishing = args[0] === '--publish-bundle' && args.length === 2;
  const mode = MODES[args[0] ?? ''];
  const withArticle =
    args[1] === '--article' &&
    (args.length === 3 || (args.length === 5 && args[3] === '--bundle'));
  if (!rules && !publishing && (!mode || (args.length !== 1 && !withArticle))) {
    console.error(USAGE);
    return 2;
  }
  let given: Article | undefined;
  if (withArticle) {
    given = readJson<Article>(args[2], '글') ?? undefined;
    if (!given) return 2;
  }
  const bundleOut = withArticle && args.length === 5 ? args[4] : null;
  const bundleIn = publishing ? readJson<Bundle>(args[1], '묶음') : null;
  if (publishing && !bundleIn) return 2;
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  // 이 프로세스에서는 cron 을 돌리지 않는다 — 명령이 정시를 걸치면 자동 발행 틱이 여기서 돌아 글을 공개할 수 있다.
  for (const job of app.get(SchedulerRegistry).getCronJobs().values())
    void job.stop();
  try {
    if (rules) {
      // 글을 바깥에서 쓰는 쪽(사람·에이전트)이 읽는 것. 코드가 쓰는 것과 같은 글자다.
      const past = await app
        .get(AutopostDefaultService)
        .avoid(app.get(TransactionContextFactory).create(), '');
      const list = (items: string[]) =>
        items.map((x) => `- ${x}`).join('\n') || '(없음)';
      console.log(
        `${SCOPE}\n\n소식을 고르는 기준(한 건만 고른다):\n${TOPIC}\n- 아래 「이미 다룬 것」과 겹치지 않는다.\n\n이미 다룬 글의 제목:\n${list(past.avoidTitles)}\n\n이미 쓴 출처 주소:\n${list(past.avoidUrls)}\n\n${STYLE}\n\n글의 구조(JSON Schema):\n${JSON.stringify(ARTICLE_JSON_SCHEMA)}`,
      );
      return 0;
    }
    if (bundleIn) {
      // 다른 기계에서 만든 묶음을 이 DB 에 공개한다. 켜기 값(AUTOPOST_ENABLED)이 있어야 한다.
      if (!AppConfig.autopost.enabled) {
        console.error(
          '꺼져 있습니다. 이 명령에 AUTOPOST_ENABLED=1 을 줘야 공개합니다.',
        );
        return 1;
      }
      const done = await app.get(AutopostDefaultService).publishGiven(
        app.get(TransactionContextFactory).create(),
        bundleIn.article,
        (Array.isArray(bundleIn.pictures) ? bundleIn.pictures : []).map(
          (pic) => ({
            section: pic.section,
            mime: 'image/jpeg' as const,
            bytes: Buffer.from(String(pic.data ?? ''), 'base64'),
          }),
        ),
      );
      console.log(
        done.outcome === 'published'
          ? `결과: published (글 ${done.postId} · 그림 ${done.pictures}장)`
          : `결과: refused\n${done.reasons.map((x) => `  - ${x}`).join('\n')}`,
      );
      return done.outcome === 'published' ? 0 : 1;
    }
    // 설정은 앱이 뜬 뒤에 본다 — `.env` 는 ConfigModule 이 채운다.
    if (!AppConfig.autopost.canRun) {
      console.error(
        'Claude API 키가 없습니다. 루트 .env 에 넣거나 AUTOPOST_PROVIDER=webgpt 로 돌려 주세요.',
      );
      return 1;
    }
    const result = await app
      .get(AutopostDefaultService)
      .run(
        app.get(TransactionContextFactory).create(),
        mode,
        new Date(),
        given,
      );
    if (!result) return 1;
    const line = '─'.repeat(60);
    console.log(
      `결과: ${result.outcome}${result.postId ? ` (글 ${result.postId})` : ''}`,
    );
    result.attempts.forEach((reasons, i) =>
      console.log(
        reasons.length
          ? `검사 ${i + 1}차: 떨어짐 — 사유 ${reasons.length}건\n${reasons.map((r) => `  - ${r}`).join('\n')}`
          : `검사 ${i + 1}차: 통과`,
      ),
    );
    console.log(`최종: ${result.reasons.length ? '떨어짐' : '통과'}`);
    console.log(
      `토큰: 입력 ${result.usage.input} · 출력 ${result.usage.output}`,
    );
    // 그림은 파일로 떨군다 — 미리보기는 저장하지 않으므로 여기서만 볼 수 있다.
    // 통과한 글만 묶는다 — 묶음은 다른 기계에서 판정 없이 공개된다.
    if (bundleOut) {
      if (result.reasons.length || !result.html)
        console.log('묶음: 만들지 않았습니다(검사에 떨어진 글)');
      else {
        const bundle: Bundle = {
          article: result.article,
          pictures: result.pictures.map((pic) => ({
            section: pic.section,
            mime: pic.mime,
            data: pic.bytes.toString('base64'),
          })),
          madeOn: new Date().toISOString(),
        };
        writeFileSync(bundleOut, JSON.stringify(bundle));
        console.log(`묶음: ${bundleOut}`);
      }
    }
    if (!result.pictures.length) console.log('그림: 없음');
    const stamp = Date.now();
    for (const pic of result.pictures) {
      const where = pic.section === null ? 'cover' : `s${pic.section + 1}`;
      const path = join(tmpdir(), `autopost-${stamp}-${where}.jpg`);
      writeFileSync(path, pic.bytes);
      console.log(
        `그림(${pic.section === null ? '표지' : `${pic.section + 1}번 단락`}): ${path}`,
      );
    }
    console.log(
      `${line}\n제목: ${result.article?.title ?? ''}\n요약: ${result.article?.summary ?? ''}\n${line}`,
    );
    console.log(result.html.replace(/(<\/p>|<\/h2>|<\/ul>|<\/li>)/g, '$1\n'));
    console.log(`${line}\n주장과 출처:`);
    for (const c of result.article?.claims ?? [])
      console.log(`  - ${c.value} ← ${c.source_url}\n      원문: ${c.quote}`);
    // 진단용: 조사 결과·시도마다의 글·열린 주소·판정 기록. 한 줄 JSON 이라 따로 떼어 읽는다.
    console.log(`${line}\n증거(JSON):`);
    console.log(JSON.stringify(result.evidence));
    return 0;
  } catch (e) {
    console.error(
      `만들지 못했습니다: ${e instanceof Error ? e.message : String(e)}`.slice(
        0,
        400,
      ),
    );
    return 1;
  } finally {
    await app.close();
  }
}

void main().then((code) => process.exit(code));

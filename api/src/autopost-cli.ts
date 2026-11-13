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
import { SCOPE, STYLE } from './core/autopost/client/autopost-prompts';
import { Article, ARTICLE_JSON_SCHEMA } from './core/autopost/model/article';

/**
 * 제조 AI 주간 글을 손으로 한 번 만든다(빌드 뒤 `npm run autopost -- --preview`).
 *
 *   --preview  만들어서 검사 결과·글·토큰 수를 찍는다. 저장하지 않는다.
 *   --draft    같은 일을 하고, 검사를 통과한 글만 뉴스 게시판에 **초안**으로 저장한다. 공개하지 않는다.
 *   --article 글.json  조사·집필을 건너뛰고 받은 글을 검사·판정·그림에 넣는다(글을 바깥에서 쓸 때). 떨어져도 다시 쓰지 않는다.
 *   --rules    글을 쓰는 쪽이 읽을 범위·규칙·구조를 찍는다.
 *
 * 켜기 값·요일·주 단위 기록을 보지 않는다. Claude API 키만 있으면 돈다(돈이 든다 — 한 번에 호출 대여섯 번).
 * `AUTOPOST_PROVIDER=webgpt` 면 키 없이 그 기계의 ego 브라우저로 chatgpt.com 을 조작해 돈다(로그인돼 있어야 한다).
 * 키 값은 찍지 않는다.
 */
const MODES: Record<string, AutopostMode> = {
  '--preview': 'preview',
  '--draft': 'draft',
};

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  if (args[0] === '--rules' && args.length === 1) {
    // 글을 바깥에서 쓰는 쪽(사람·에이전트)이 읽는 규칙과 답의 구조. 코드가 쓰는 것과 같은 글자다.
    console.log(
      `${SCOPE}\n\n${STYLE}\n\n글의 구조(JSON Schema):\n${JSON.stringify(ARTICLE_JSON_SCHEMA)}`,
    );
    return 0;
  }
  const mode = MODES[args[0] ?? ''];
  const withArticle = args[1] === '--article' && args.length === 3;
  if (!mode || (args.length !== 1 && !withArticle)) {
    console.error(
      '쓰는 법: npm run autopost -- --preview | --draft [--article 글.json] | --rules',
    );
    return 2;
  }
  let given: Article | undefined;
  if (withArticle) {
    try {
      given = JSON.parse(readFileSync(args[2], 'utf8')) as Article;
    } catch {
      console.error('글 파일을 읽지 못했습니다(JSON 이어야 합니다).');
      return 2;
    }
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  // 이 프로세스에서는 cron 을 돌리지 않는다 — 명령이 정시를 걸치면 자동 발행 틱이 여기서 돌아 글을 공개할 수 있다.
  for (const job of app.get(SchedulerRegistry).getCronJobs().values())
    void job.stop();
  try {
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

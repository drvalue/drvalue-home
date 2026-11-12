import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AppConfig } from './common/config/app-config';
import { TransactionContextFactory } from './common/typeorm/transaction-context.factory';
import {
  AutopostDefaultService,
  AutopostMode,
} from './core/autopost/service/autopost-default.service';

/**
 * 제조 AI 주간 글을 손으로 한 번 만든다(빌드 뒤 `npm run autopost -- --preview`).
 *
 *   --preview  만들어서 검사 결과·글·토큰 수를 찍는다. 저장하지 않는다.
 *   --draft    같은 일을 하고 뉴스 게시판에 **초안**으로 저장한다. 공개하지 않는다.
 *
 * 켜기 값·요일·주 단위 기록을 보지 않는다. Claude API 키만 있으면 돈다(돈이 든다 — 한 번에 호출 대여섯 번).
 * 키 값은 찍지 않는다.
 */
const MODES: Record<string, AutopostMode> = {
  '--preview': 'preview',
  '--draft': 'draft',
};

async function main(): Promise<number> {
  const mode = MODES[process.argv[2] ?? ''];
  if (!mode || process.argv.length !== 3) {
    console.error('쓰는 법: npm run autopost -- --preview | --draft');
    return 2;
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    // 설정은 앱이 뜬 뒤에 본다 — `.env` 는 ConfigModule 이 채운다.
    if (!AppConfig.autopost.hasKey) {
      console.error(
        'Claude API 키가 없습니다. 루트 .env 에 넣고 다시 돌려 주세요.',
      );
      return 1;
    }
    const result = await app
      .get(AutopostDefaultService)
      .run(app.get(TransactionContextFactory).create(), mode);
    if (!result) return 1;
    const line = '─'.repeat(60);
    console.log(
      `결과: ${result.outcome}${result.postId ? ` (글 ${result.postId})` : ''}`,
    );
    console.log(
      result.reasons.length
        ? `검사: 떨어짐 — 사유 ${result.reasons.length}건\n${result.reasons.map((r) => `  - ${r}`).join('\n')}`
        : '검사: 통과',
    );
    console.log(
      `토큰: 입력 ${result.usage.input} · 출력 ${result.usage.output}`,
    );
    console.log(
      `${line}\n제목: ${result.article?.title ?? ''}\n요약: ${result.article?.summary ?? ''}\n${line}`,
    );
    console.log(result.html.replace(/(<\/p>|<\/h2>|<\/ul>|<\/li>)/g, '$1\n'));
    console.log(`${line}\n주장과 출처:`);
    for (const c of result.article?.claims ?? [])
      console.log(`  - ${c.value} ← ${c.source_url}\n      원문: ${c.quote}`);
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

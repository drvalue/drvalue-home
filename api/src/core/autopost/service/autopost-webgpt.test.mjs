// node --test src/core/autopost/service/autopost-webgpt.test.mjs  (빌드 뒤 dist 를 읽는다. 브라우저·네트워크 없이)
// ChatGPT 웹 길의 코드 쪽 — 답에서 JSON 꺼내기, 코드가 열어도 되는 주소, 출처 글자 받기.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  jsonFromAnswer,
  isPublicHttps,
  htmlToText,
  fetchSourceText,
} = require('../../../../dist/core/autopost/client/autopost-webgpt.client.js');
const { AppConfig } = require('../../../../dist/common/config/app-config.js');

test('답의 코드 블록에서 JSON 을 꺼낸다 — 머리글이 붙어도', () => {
  assert.deepEqual(jsonFromAnswer('json\n코드 복사\n{"a":{"b":1}}\n'), {
    a: { b: 1 },
  });
  assert.throws(() => jsonFromAnswer('죄송합니다. 답할 수 없습니다.'));
  assert.throws(() => jsonFromAnswer('{"a": 1'));
});

test('코드가 여는 주소는 바깥 https 뿐이다', () => {
  for (const ok of [
    'https://www.example.com/a?b=1',
    'https://news.example.co.kr/view/1',
  ])
    assert.equal(isPublicHttps(ok), true, ok);
  for (const bad of [
    'http://example.com/a',
    'https://127.0.0.1/a',
    'https://[::1]/a',
    'https://localhost/a',
    'https://router.local/a',
    'https://intranet/a',
    'https://user:pw@example.com/a',
    'https://example.com:8443/a',
    'file:///etc/passwd',
    'javascript:alert(1)',
    '',
  ])
    assert.equal(isPublicHttps(bad), false, bad);
});

test('HTML 에서 글자만 남긴다', () => {
  const text = htmlToText(
    '<html><head><style>p{}</style><script>var a="불량률 99%"</script></head><body><p>불량률이 30% 줄었습니다.</p><div>A&amp;B &#44; &lt;끝&gt;</div><!-- 숨김 --></body></html>',
  );
  assert.match(text, /불량률이 30% 줄었습니다\./);
  assert.match(text, /A&B , <끝>/);
  assert.doesNotMatch(text, /99|숨김|var a/);
});

const page =
  (body, init = {}) =>
  async (url) => ({
    ok: true,
    url,
    headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    ...init,
  });

test('출처 글자 받기 — 못 받은 것은 null (열린 출처로 안 센다)', async () => {
  const long = `<p>${'설비 이상을 미리 찾는 모델입니다. '.repeat(40)}</p>`;
  assert.match(
    await fetchSourceText('https://example.com/a', page(long)),
    /설비 이상을/,
  );
  assert.equal(
    await fetchSourceText(
      'https://example.com/a',
      page('<p>접근이 차단되었습니다.</p>'),
    ),
    null,
  ); // 너무 짧다
  assert.equal(
    await fetchSourceText('https://example.com/a', page(long, { ok: false })),
    null,
  );
  assert.equal(
    await fetchSourceText(
      'https://example.com/a',
      page(long, { url: 'https://127.0.0.1/x' }),
    ),
    null,
  ); // 안쪽으로 넘겨 보냄
  assert.equal(await fetchSourceText('http://example.com/a', page(long)), null); // 부르지도 않는다
  assert.equal(
    await fetchSourceText('https://example.com/a', async () => {
      throw new Error('x');
    }),
    null,
  );
});

test('모델을 부를 길: webgpt 는 키 없이, 그 밖은 키가 있어야', () => {
  const set = (provider, key, enabled) => {
    for (const [n, v] of [
      ['AUTOPOST_PROVIDER', provider],
      ['ANTHROPIC_API_KEY', key],
      ['AUTOPOST_ENABLED', enabled],
    ])
      if (v === undefined) delete process.env[n];
      else process.env[n] = v;
  };
  set('webgpt', undefined, undefined);
  assert.equal(AppConfig.autopost.canRun, true);
  assert.equal(AppConfig.autopost.ready, false); // 켜기 값이 없으면 여전히 꺼짐
  set('webgpt', undefined, '1');
  assert.equal(AppConfig.autopost.ready, true);
  for (const p of ['WebGPT', 'gpt', 'codex', ' webgpt', '']) {
    set(p, undefined, '1');
    assert.equal(AppConfig.autopost.provider, 'claude', JSON.stringify(p));
    assert.equal(AppConfig.autopost.ready, false, JSON.stringify(p));
  }
  assert.ok(!('ANTHROPIC_API_KEY' in AppConfig.autopost.browser.env)); // 자식에게 비밀을 안 넘긴다
  set(undefined, undefined, undefined);
});

test('브라우저가 답을 표준 오류로 찍어도 읽는다 — 앞에 다른 글자가 붙어도', async () => {
  const { mkdtemp, writeFile, chmod, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const {
    AutopostWebGptClient,
  } = require('../../../../dist/core/autopost/client/autopost-webgpt.client.js');
  const dir = await mkdtemp(join(tmpdir(), 'fake-ego-'));
  const answer = JSON.stringify({
    code:
      'json\n' +
      JSON.stringify({
        topic: 't',
        notes: 'n',
        sourceUrls: ['https://example.com/a'],
      }),
  });
  const make = async (name, body) => {
    const file = join(dir, name);
    await writeFile(file, `#!/bin/sh\ncat > /dev/null\n${body}\n`);
    await chmod(file, 0o755);
    return new AutopostWebGptClient({
      bin: file,
      env: { PATH: process.env.PATH },
    });
  };
  const input = { today: '2026-11-13', avoidTitles: [], avoidUrls: [] };
  try {
    const ok = await make(
      'ok',
      `printf '%s\\n' '[ego] @@AUTOPOST_ANSWER@@${answer.replace(/'/g, '')}' >&2`,
    );
    assert.equal((await ok.research(input)).research.topic, 't');
    const thrown = await make(
      'thrown',
      `echo 'Error: 답에 코드 블록이 없습니다: 한도 안내' >&2; exit 1`,
    );
    await assert.rejects(
      thrown.research(input),
      /브라우저 조작이 실패했습니다\(1\) — .*코드 블록이 없습니다/,
    );
    const silent = await make('silent', 'echo done');
    await assert.rejects(
      silent.research(input),
      /브라우저 조작이 실패했습니다\(0\)$/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('그림 지시문에는 글의 숫자가 실리지 않는다', async () => {
  const {
    coverPrompt,
    sectionPicturePrompt,
    pictureSections,
    withoutNumbers,
  } = require('../../../../dist/core/autopost/client/autopost-prompts.js');
  const { good } = await import('./autopost-fixture.mjs');
  assert.equal(
    withoutNumbers(
      '생산성 30.1% 향상, 불량률 -15.5 퍼센트 · 245곳 · 1,200억 원',
    ),
    '생산성 향상, 불량률 · 곳 · 억 원',
  );
  const a = {
    ...good,
    title: '공장 245곳 확산…생산성 30.1% 향상',
    sections: good.sections.map((s) => ({
      ...s,
      paragraphs: ['불량률이 15.5% 줄었습니다.', ...s.paragraphs],
    })),
  };
  // 지시문에 남는 숫자는 코드가 적은 비율(16:9)뿐이다
  for (const prompt of [
    coverPrompt(a),
    ...pictureSections(a).map((i) => sectionPicturePrompt(a, i)),
  ])
    assert.equal(prompt.replace('16:9', '').match(/\d/), null);
  assert.deepEqual(pictureSections(a), [1, 3]);
  assert.deepEqual(
    pictureSections({ ...a, sections: a.sections.slice(0, 3) }),
    [1],
  );
});

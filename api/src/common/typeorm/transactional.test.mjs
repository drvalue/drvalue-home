// node --test src/common/typeorm/transactional.test.mjs  (빌드 뒤 dist 를 읽는다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Transactional } = require('../../../dist/common/typeorm/transactional.decorator.js');
const { ServiceException } = require('../../../dist/common/error/service-exception.decorator.js');
const { CommonError } = require('../../../dist/common/error/common-error.js');

/** transaction() 을 몇 번 열었는지 세는 가짜 DataSource. 콜백이 던지면 그대로 던진다(= 롤백). */
function fakeDataSource() {
  const ds = {
    opened: 0,
    async transaction(fn) {
      ds.opened += 1;
      return fn({ tx: ds.opened });
    },
  };
  return ds;
}

function decorate(cls, name, ...decorators) {
  const d = Object.getOwnPropertyDescriptor(cls.prototype, name);
  // 아래(메서드에 가까운 것)부터 감싼다 — TypeScript 와 같은 순서.
  for (const dec of [...decorators].reverse()) dec(cls.prototype, name, d);
  Object.defineProperty(cls.prototype, name, d);
}

test('Transactional: 트랜잭션 manager 를 실은 문맥을 넘긴다', async () => {
  class S {
    async run(ctx) {
      return ctx.manager;
    }
  }
  decorate(S, 'run', Transactional());
  const ds = fakeDataSource();
  assert.deepEqual(await new S().run({ dataSource: ds }), { tx: 1 });
  assert.equal(ds.opened, 1);
});

test('Transactional: 이미 트랜잭션 안이면 새로 열지 않는다', async () => {
  class S {
    async outer(ctx) {
      return this.inner(ctx);
    }
    async inner(ctx) {
      return ctx.manager;
    }
  }
  decorate(S, 'outer', Transactional());
  decorate(S, 'inner', Transactional());
  const ds = fakeDataSource();
  assert.deepEqual(await new S().outer({ dataSource: ds }), { tx: 1 });
  assert.equal(ds.opened, 1);
});

test('Transactional: 첫 인자가 문맥이 아니면 거부한다', async () => {
  class S {
    async run() {}
  }
  decorate(S, 'run', Transactional());
  await assert.rejects(() => new S().run('x'), /ITransactionContext/);
});

const CODE = { code: 'X_UNKNOWN', message: '저장하지 못했습니다.', status: 500 };

test('ServiceException: CommonError 는 그대로 다시 던진다', async () => {
  const notFound = CommonError.createByErrorCode({ code: 'X_NOT_FOUND', message: '없습니다.', status: 404 });
  class S {
    async run() {
      throw notFound;
    }
  }
  decorate(S, 'run', ServiceException({ errorCode: CODE }));
  await assert.rejects(() => new S().run(), (e) => e === notFound);
});

test('ServiceException: 그 밖은 코드로 바꾸고 원래 문구를 싣지 않는다', async () => {
  class S {
    async run() {
      throw new Error('duplicate key value violates unique constraint "posts_slug"');
    }
  }
  decorate(S, 'run', ServiceException({ errorCode: CODE }));
  await assert.rejects(
    () => new S().run(),
    (e) => e instanceof CommonError && e.getResultCode() === 'X_UNKNOWN' && e._message === '저장하지 못했습니다.',
  );
});

test('ServiceException 위 · Transactional 아래: 안에서 던지면 트랜잭션 밖으로 나온 뒤 코드가 된다', async () => {
  const seen = [];
  const ds = {
    async transaction(fn) {
      try {
        return await fn({ tx: 1 });
      } catch (e) {
        seen.push('rollback'); // 실제 DataSource 는 여기서 롤백한다
        throw e;
      }
    },
  };
  class S {
    async run() {
      throw new Error('boom');
    }
  }
  decorate(S, 'run', ServiceException({ errorCode: CODE }), Transactional());
  await assert.rejects(() => new S().run({ dataSource: ds }), (e) => e instanceof CommonError);
  assert.deepEqual(seen, ['rollback']);
});

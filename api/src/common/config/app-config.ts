import { resolve } from 'node:path';

function list(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * `.env` 값은 항상 문자열이다. Express 는 문자열 `'1'` 을 홉 수가 아니라
 * 신뢰 대역(IP 0.0.0.1)으로 읽어 결과적으로 아무것도 믿지 않는다.
 */
function trustProxyValue(raw: string): boolean | number | string {
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw;
}

/**
 * 환경변수를 읽는 유일한 곳. 이름은 루트 `.env.example` 과 compose 가 주는 것과 같다.
 * 부를 때마다 읽는다 — ConfigModule 이 `.env` 를 채운 뒤에 쓰인다.
 */
export const AppConfig = {
  get port(): number {
    return Number(process.env.PORT ?? 3500);
  },
  /** 비어 있으면 undefined — 프록시를 믿지 않는다. */
  get trustProxy(): boolean | number | string | undefined {
    const raw = process.env.TRUST_PROXY;
    return raw ? trustProxyValue(raw) : undefined;
  },

  /** 관리자 세션 서명 비밀. 안전한 기본값은 없다 — 비면 main 이 뜨지 않는다. */
  get sessionSecret(): string {
    return process.env.ADMIN_SESSION_SECRET ?? '';
  },
  get iamCallbackUrl(): string {
    return process.env.ADMIN_IAM_CALLBACK_URL ?? '';
  },
  /** https 로 돌아오는 배포면 쿠키에 Secure. 로컬 http 콜백이면 끈다. */
  get secureCookies(): boolean {
    return AppConfig.iamCallbackUrl.startsWith('https://');
  },

  db: {
    /** compose 는 db:5432. 로컬은 localhost:3330(compose 가 연 포트). */
    get host(): string {
      return process.env.DB_HOST ?? 'localhost';
    },
    get port(): number {
      return Number(process.env.DB_PORT ?? 3330);
    },
    get password(): string {
      return process.env.DB_PASSWORD ?? '';
    },
  },

  /**
   * 업로드 폴더. 컨테이너는 compose 가 /data/uploads 를 준다. 로컬은 저장소 루트의
   * data/uploads — dist/common/config 에서 네 칸 위다. cwd 기준으로 잡지 않는다
   * (api/ 에서 띄우면 api/data/uploads 가 돼서 빈 폴더를 본다).
   */
  get uploadsDir(): string {
    return (
      process.env.UPLOADS_DIR || resolve(__dirname, '../../../../data/uploads')
    );
  },

  mail: {
    get accessKey(): string {
      return process.env.NCP_ACCESS_KEY ?? '';
    },
    get secretKey(): string {
      return process.env.NCP_SECRET_KEY ?? '';
    },
    get sender(): string {
      return process.env.NCP_MAIL_SENDER_ADDRESS ?? '';
    },
    get to(): string[] {
      return list(process.env.NCP_MAIL_TO);
    },
  },
};

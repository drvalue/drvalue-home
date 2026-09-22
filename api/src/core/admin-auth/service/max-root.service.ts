import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createPool, Pool } from 'mysql2/promise';

/**
 * M.AX(nxcms) 마스터 DB 의 root 사용자 표로 「이 IAM 사용자가 drvalue 테넌트의
 * root 인가」를 본다. PHP 가 게이트웨이 root/iam 으로 물어보던 것을 DB 로 직접 본다.
 *
 *   rn_default_root_user.iamUserId ← IAM 의 sub. IAM 로그인이 이 칸을 채운다.
 *   rn_tenant.rootUserId → 그 root 가 어느 테넌트의 것인가. code = 'drvalue'.
 *   status = 'ACTIVE' 만. nxcms 에서 비활성·삭제하면 다음 검사(60초)에서 막힌다.
 *   email 은 iamUserId 가 아직 비어 있는 행(IAM 미연결)에만 맞춘다 — 다른 sub 에
 *   이미 연결된 행을 같은 이메일로 가로채지 못하게.
 *
 * 읽기 전용. 우리 쪽에 사용자 사본을 두지 않는다 — 두면 그게 어긋나는 사본이 된다.
 * ADMIN_MAX_DB_URL(mysql://user:pass@host:3306/nx_cms_database)이 비면 꺼진 것이다.
 */
@Injectable()
export class MaxRootService implements OnModuleDestroy {
  private readonly log = new Logger(MaxRootService.name);
  private pool: Pool | null = null;

  get configured(): boolean {
    return Boolean(process.env.ADMIN_MAX_DB_URL);
  }

  /** 홈페이지는 drvalue 테넌트의 것이다. */
  private readonly tenantCode = 'drvalue';

  /**
   * null = 설정이 없다(판정 안 함). 'unavailable' = 설정은 있는데 DB 가 안 닿는다.
   * true/false = 봤다. 안 닿을 때 열리는 쪽으로 떨어지지 않도록 셋을 구분한다.
   */
  async isTenantRoot(
    iamUserId: string,
    email: string,
  ): Promise<boolean | null | 'unavailable'> {
    if (!this.configured) return null;
    try {
      const [rows] = await this.getPool().query(
        `SELECT u.id
           FROM rn_default_root_user u
           JOIN rn_tenant t ON t.rootUserId = u.id
          WHERE t.code = ? AND u.status = 'ACTIVE'
            AND (u.iamUserId = ? OR (u.iamUserId IS NULL AND u.email = ?))
          LIMIT 1`,
        [this.tenantCode, iamUserId, email],
      );
      return Array.isArray(rows) && rows.length > 0;
    } catch (e) {
      this.log.warn(`M.AX DB 를 못 본다 (${(e as Error).message})`);
      return 'unavailable';
    }
  }

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = createPool({
        uri: process.env.ADMIN_MAX_DB_URL,
        connectionLimit: 2,
        connectTimeout: 5_000,
      });
    }
    return this.pool;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}

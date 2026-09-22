import { Injectable } from '@nestjs/common';
import { BOARDS } from '../../../common/entity/post.entity';
import { ServiceException } from '../../../common/error/service-exception.decorator';
import type { SessionPayload } from '../../../common/session/session-token';
import type { ITransactionContext } from '../../../common/typeorm/transaction-context';
import { visibleBoards } from '../../admin-auth/service/board-access';
import { AdminRevisionDefaultService } from '../../admin-revision/service/admin-revision-default.service';
import { ControllerAdminDashboardDefaultResponseDto } from '../dto/controller-admin-dashboard-default-response.dto';
import { AdminDashboardError } from '../error/admin-dashboard.error';
import { InquiryDefaultRepository } from '../repository/inquiry-default.repository';
import { PostDefaultRepository } from '../repository/post-default.repository';

/** 홈에 올리는 최근 변경 줄 수. */
const RECENT = 5;

/**
 * 관리 화면 홈. 게시판마다 목록 API 를 부르던 것을 요청 한 번으로 모은다.
 *
 * 범위 규칙은 각 화면의 API 와 같다: 문의는 전체 권한·마케팅만(`admin-inquiry` 의 `@AdminRoles`),
 * 변경 이력 목록은 전체 권한만(`admin-revision`), 게시판 수는 이 범위가 만질 수 있는 게시판만.
 */
@Injectable()
export class AdminDashboardDefaultService {
  constructor(
    private readonly postDefaultRepository: PostDefaultRepository,
    private readonly inquiryDefaultRepository: InquiryDefaultRepository,
    private readonly adminRevisionDefaultService: AdminRevisionDefaultService,
  ) {}

  /** 이 범위의 홈 요약 — 새 문의 · 내 담당 · 게시판별 초안 · 예약 대기 · 최근 변경. */
  @ServiceException({ errorCode: AdminDashboardError.SUMMARY_UNKNOWN })
  async summary(
    ctx: ITransactionContext,
    who: SessionPayload,
  ): Promise<ControllerAdminDashboardDefaultResponseDto> {
    const boards = visibleBoards(who.role, BOARDS);
    const seesInquiries = who.role === 'admin' || who.role === 'marketing';
    const [drafts, scheduled, inquiries, recent] = await Promise.all([
      this.postDefaultRepository.countDraftsByBoard(ctx, boards),
      this.postDefaultRepository.countScheduledByBoard(ctx, boards),
      seesInquiries ? this.inquiryCounts(ctx, who) : Promise.resolve(null),
      who.role === 'admin'
        ? this.adminRevisionDefaultService.recent(RECENT)
        : Promise.resolve(null),
    ]);
    return { inquiries, drafts, scheduled, recent };
  }

  private async inquiryCounts(ctx: ITransactionContext, who: SessionPayload) {
    const [fresh, mineOpen] = await Promise.all([
      this.inquiryDefaultRepository.countNew(ctx),
      this.inquiryDefaultRepository.countOpenAssignedTo(ctx, who.email),
    ]);
    return { new: fresh, mine_open: mineOpen };
  }
}

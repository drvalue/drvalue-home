import { Module } from '@nestjs/common';
import { IndexNowService } from './indexnow.service';

/** 공개 내용이 바뀐 주소를 IndexNow 로 알린다. 글·페이지 글·검색 정보·예약 게시 모듈이 가져다 쓴다. */
@Module({
  providers: [IndexNowService],
  exports: [IndexNowService],
})
export class IndexNowModule {}

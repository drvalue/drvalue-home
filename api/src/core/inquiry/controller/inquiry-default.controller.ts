import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ControllerInquiryDefaultCreateDto } from '../dto/controller-inquiry-default.dto';
import { InquiryDefaultService } from '../service/inquiry-default.service';

/**
 * 공개 홈페이지가 직접 부른다. 무인증.
 * 속도 제한 가드는 여기에만 건다 — APP_GUARD 로 넣으면 게시판 조회까지 묶인다.
 */
@UseGuards(ThrottlerGuard)
@Controller('inquiry')
export class InquiryDefaultController {
  constructor(private readonly inquiryDefaultService: InquiryDefaultService) {}
  @Post()
  async create(@Body() dto: ControllerInquiryDefaultCreateDto) {
    await this.inquiryDefaultService.create(dto);
    return { ok: true };
  }
}

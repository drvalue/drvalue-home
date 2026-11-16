import { ApiProperty } from '@nestjs/swagger';

/** 묶음을 넣은 결과. 거절은 오류가 아니다 — 사유를 읽고 글을 고쳐 다시 넣는다. */
export class ControllerAutopostDefaultBundleResponseDto {
  @ApiProperty({ enum: ['published', 'refused'] })
  outcome!: 'published' | 'refused';
  @ApiProperty({
    type: [String],
    description: '거절 사유(사람이 읽는 문장). 공개했으면 빈 배열',
  })
  reasons!: string[];
  @ApiProperty({ nullable: true, type: Number, description: '공개한 글의 id' })
  post_id!: number | null;
  @ApiProperty({ description: '글에 들어간 그림 수' })
  pictures!: number;

  static from(r: {
    outcome: 'published' | 'refused';
    reasons: string[];
    postId?: number;
    pictures: number;
  }): ControllerAutopostDefaultBundleResponseDto {
    return {
      outcome: r.outcome,
      reasons: r.reasons,
      post_id: r.postId ?? null,
      pictures: r.pictures,
    };
  }
}

/** 글을 쓰는 쪽이 읽는 글자. */
export class ControllerAutopostDefaultRulesResponseDto {
  @ApiProperty({
    description:
      '주제 기준 · 이미 다룬 글의 제목과 출처 주소 · 글 규칙 · 글의 구조(JSON Schema)',
  })
  text!: string;

  static from(text: string): ControllerAutopostDefaultRulesResponseDto {
    return { text };
  }
}

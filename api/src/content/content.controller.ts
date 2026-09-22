import {
  BadGatewayException,
  BadRequestException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common'
import type { Response } from 'express'
import { Readable } from 'node:stream'
import type { ReadableStream as WebReadable } from 'node:stream/web'
import { pipeline } from 'node:stream/promises'
import { Public, SkipGatewaySignature } from '@drvalue-oss/iam-nestjs'
import { DirectusService } from './directus.service'

/** 게시판 한 쪽에 보여 줄 글 수. 화면의 페이지 번호가 이 값을 전제한다. */
const PAGE_SIZE = 10

type Row = Record<string, unknown>

/**
 * 공개 사이트가 읽는 콘텐츠. notice_api.php 의 조회 부분을 대신한다.
 *
 * Directus 의 플로우 엔드포인트(uuid 주소)를 쓰지 않는다. 그건 백엔드가 없을
 * 때의 임시 방편이었고, 여기서는 주소도 사람이 읽을 수 있고 전체 건수도
 * 같이 내려줄 수 있다.
 */
/**
 * 이 컨트롤러는 **공개 홈페이지가 직접 부르는 자리**다. 게이트웨이를 거치지
 * 않으므로 서명이 없다. `@Public()` 은 인증만 면제할 뿐 게이트웨이 가드는
 * 그대로 통과 못 하므로, 여기에 `@SkipGatewaySignature()` 를 명시한다.
 *
 * 이렇게 해 두면 enforceGatewayOnly 의 기본값을 켠 쪽으로 둘 수 있다 —
 * 표시하지 않은 새 경로는 자동으로 게이트웨이 뒤에 서게 된다.
 */
@SkipGatewaySignature()
@Controller('content')
export class ContentController {
  private readonly log = new Logger(ContentController.name)

  constructor(private readonly directus: DirectusService) {}

  private guard() {
    if (!this.directus.configured) {
      throw new ServiceUnavailableException('DIRECTUS_URL / DIRECTUS_TOKEN 이 비어 있다')
    }
  }

  /**
   * 번역 한 벌을 본문 옆에 펴 준다.
   *
   * Directus 는 `translations: [{...}]` 로 준다. 화면마다 `[0]` 을 꺼내고
   * 없을 때를 처리하면 같은 실수가 화면 수만큼 생긴다. 번역 행의 `id` 는
   * 버린다 — 그대로 펴면 글 번호를 덮어쓴다.
   */
  private flat(row: Row, language?: string): Row {
    const { translations, ...rest } = row as Row & { translations?: Row[] }
    // 요청 언어 번역이 없으면 기본 언어로 떨어뜨린다. 없는 채로 펴면 제목도
    // 본문도 빈 글이 **정상 응답으로** 나간다 — 화면에는 빈 줄만 남는다.
    const rows = Array.isArray(translations) ? translations : []
    const t =
      rows.find((r) => r['languages_code'] === language) ?? rows[0] ?? {}
    // 번역 행이 들고 있는 자기 id·언어·부모 참조는 본문이 아니다.
    // (부모 참조 이름은 Directus 가 `posts` 로 만든다 — 실측)
    const { id: _id, languages_code: _lang, posts: _owner, posts_id: _owner2, ...text } = t
    return { ...rest, ...text }
  }

  /** 파일 uuid 를 우리 주소로 바꾼다. 비어 있으면 null — 화면이 그걸 본다. */
  private asset(id: unknown): string | null {
    return typeof id === 'string' && id ? `/api/content/assets/${id}` : null
  }

  private attachments(rows: unknown): Array<{ id: string; name: string; url: string }> {
    if (!Array.isArray(rows)) return []
    return rows.flatMap((r) => {
      const f = (r as Row)?.['directus_files_id'] as Row | undefined
      const id = f?.['id']
      if (typeof id !== 'string' || !id) return []
      const name =
        (f?.['title'] as string) || (f?.['filename_download'] as string) || '첨부파일'
      return [{ id, name, url: `/api/content/assets/${id}` }]
    })
  }

  /**
   * 게시판 목록. 전체 건수를 같이 준다 — 페이지 번호 UI 를 그릴 수 있다.
   *
   * `q`·`startDate`·`endDate` 는 옛 게시판의 검색을 그대로 받는다. 검색은
   * 언어를 가리지 않는다 — 영어 번역이 걸려 같은 글이 나오는 것은 맞는 결과다.
   */
  @Public()
  @Get('posts')
  async posts(
    @Query('board') board: string,
    @Query('page') page = '1',
    @Query('q') q?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('lang') lang?: string,
  ) {
    this.guard()
    const language = this.directus.language(lang)
    const keyword = (q ?? '').trim().slice(0, 200)
    const day = /^\d{4}-\d{2}-\d{2}$/
    const and: unknown[] = [
      { status: { _eq: 'published' } },
      ...(board ? [{ board: { _eq: board } }] : []),
    ]
    if (keyword) {
      and.push({
        _or: ['title', 'summary', 'body'].map((f) => ({
          translations: { [f]: { _icontains: keyword } },
        })),
      })
    }
    // 화면의 기간 검색은 목록에 보이는 날짜(표시 날짜)를 기준으로 한다.
    // publish_at 은 예약 장치이지 사람이 보는 날짜가 아니다.
    if (startDate && day.test(startDate)) and.push({ published_date: { _gte: startDate } })
    if (endDate && day.test(endDate)) and.push({ published_date: { _lte: endDate } })

    const res = await this.directus.get<Row[]>('/items/posts', {
      filter: JSON.stringify({ _and: and }),
      fields:
        'id,board,slug,published_date,publish_at,unpublish_at,thumbnail,is_pinned,translations.*',
      deep: JSON.stringify({
        translations: { _filter: { languages_code: { _in: this.directus.languages(language) } } },
      }),
      sort: '-is_pinned,-published_date,-id',
      limit: PAGE_SIZE,
      page: Math.max(1, Number(page) || 1),
      meta: 'filter_count',
    })
    const data = (res.data ?? []).map((row) => {
      const it = this.flat(row, language)
      return { ...it, thumbnail: this.asset(it['thumbnail']) }
    })
    return { data, total: res.meta?.['filter_count'] ?? null, pageSize: PAGE_SIZE, language }
  }

  @Public()
  @Get('posts/:slug')
  async post(@Param('slug') slug: string, @Query('lang') lang?: string) {
    this.guard()
    const language = this.directus.language(lang)
    const res = await this.directus.get<Row[]>('/items/posts', {
      filter: JSON.stringify({
        _and: [{ status: { _eq: 'published' } }, { slug: { _eq: slug } }],
      }),
      fields:
        '*,translations.*,attachments.directus_files_id.id,' +
        'attachments.directus_files_id.title,attachments.directus_files_id.filename_download',
      deep: JSON.stringify({
        translations: { _filter: { languages_code: { _in: this.directus.languages(language) } } },
      }),
      limit: 1,
    })
    // 없는 글에 200 을 주면 화면이 404 를 그릴 수가 없다. 초안도 여기로 온다 —
    // 위 filter 가 published 만 남기므로 "없다" 와 구별할 필요가 없다.
    const row = res.data?.[0]
    if (!row) throw new NotFoundException('없는 글이다')
    const post = this.flat(row, language)
    return {
      data: {
        ...post,
        thumbnail: this.asset(post['thumbnail']),
        attachments: this.attachments(post['attachments']),
      },
      language,
    }
  }

  /**
   * 이 파일을 공개해도 되는가.
   *
   * **uuid 모양만 보고 흘려보내면 안 된다.** 서비스 토큰은 `directus_files`
   * 전체를 읽을 수 있어서, 주소만 알면 초안 글의 첨부도, 게시판과 무관한
   * 파일도 다 나간다. 그래서 "게시된 글이 실제로 가리키는 파일" 만 통과시킨다.
   *
   * 새 화면이 다른 컬렉션의 이미지를 쓰기 시작하면 **여기에 추가해야 한다.**
   * 안 하면 그 이미지는 404 가 된다 — 조용히 새는 것보다 눈에 띄게 깨지는
   * 쪽이 낫다.
   */
  private async fileIsPublic(id: string): Promise<boolean> {
    const res = await this.directus.get<Row[]>('/items/posts', {
      filter: JSON.stringify({
        _and: [
          { status: { _eq: 'published' } },
          {
            _or: [
              { thumbnail: { _eq: id } },
              { og_image: { _eq: id } },
              { attachments: { directus_files_id: { _eq: id } } },
            ],
          },
        ],
      }),
      fields: 'id',
      limit: 1,
    })
    return (res.data?.length ?? 0) > 0
  }

  /**
   * 파일 원본. 대표 이미지와 첨부가 이 주소로 나간다.
   *
   * 브라우저가 Directus 를 직접 부르지 않게 하려고 여기를 통한다 — 그 이유는
   * DirectusService.file() 주석에 적었다.
   */
  @Public()
  @Get('assets/:id')
  async asset_(@Param('id') id: string, @Res() res: Response) {
    this.guard()
    // uuid 만 받는다. 이 값이 그대로 Directus 주소에 붙는다.
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) throw new BadRequestException('잘못된 파일 주소')
    if (!(await this.fileIsPublic(id))) throw new NotFoundException('없는 파일이다')
    const up = await this.directus.file(id)
    // 위 관문을 통과했는데도 못 가져오면 파일이 지워졌거나 권한이 틀어진
    // 것이다. 밖으로는 둘 다 404 로 답한다 — 어느 쪽인지 알려 줄 이유가 없다.
    // 대신 **진짜 코드를 로그에 남긴다.** 안 남기면 권한 사고가 "없는 파일"
    // 로 보여서 원인을 못 찾는다. 서버가 죽은 것(5xx)만 502 로 구분한다.
    if (!up.ok || !up.body) {
      this.log.warn(`파일 ${id}: Directus ${up.status}`)
      if (up.status >= 500) throw new BadGatewayException('파일을 가져오지 못했다')
      throw new NotFoundException('없는 파일이다')
    }
    for (const h of ['content-type', 'content-length', 'last-modified', 'etag']) {
      const v = up.headers.get(h)
      if (v) res.setHeader(h, v)
    }
    // 파일 이름을 그대로 쓰지 않는다. 헤더 주입과 한글 깨짐이 같이 생긴다.
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    // 직접 write 로 밀면 backpressure 를 무시해서 큰 파일에 메모리가 쌓인다.
    // pipeline 은 소비 속도에 맞춰 멈췄다 간다.
    await pipeline(Readable.fromWeb(up.body as WebReadable), res)
  }

  /**
   * 페이지 상세. 경로를 쿼리로 받는다 — `/about` 처럼 슬래시가 들어 있어서
   * 경로 파라미터로 받으면 Express 5 에서 와일드카드 문법이 필요하고,
   * 그 문법이 4 와 5 사이에 바뀌었다.
   */
  @Public()
  @Get('pages')
  async page(@Query('path') path: string, @Query('lang') lang?: string) {
    this.guard()
    const language = this.directus.language(lang)
    const res = await this.directus.get<unknown[]>('/items/pages', {
      filter: JSON.stringify({
        _and: [{ status: { _eq: 'published' } }, { path: { _eq: path.startsWith('/') ? path : `/${path}` } }],
      }),
      fields: '*,translations.*,blocks.*,blocks.translations.*',
      deep: JSON.stringify({
        translations: { _filter: { languages_code: { _eq: language } } },
        blocks: {
          _sort: ['sort', 'id'],
          translations: { _filter: { languages_code: { _eq: language } } },
        },
      }),
      limit: 1,
    })
    const page = res.data?.[0]
    if (!page) throw new NotFoundException('없는 페이지다')
    return { data: page, language }
  }

  @Public()
  @Get('menu')
  async menu(@Query('lang') lang?: string) {
    this.guard()
    const language = this.directus.language(lang)
    const res = await this.directus.get<unknown[]>('/items/menu_items', {
      filter: JSON.stringify({ is_visible: { _eq: true } }),
      fields: '*,translations.*',
      deep: JSON.stringify({ translations: { _filter: { languages_code: { _eq: language } } } }),
      sort: 'location,sort,id',
      limit: 200,
    })
    return { data: res.data, language }
  }
}

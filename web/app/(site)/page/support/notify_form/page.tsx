import ClientAction from '@/components/ClientAction'
import Script from 'next/script'
import { PAGE_CSS as MAX_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { seoMeta } from '@/lib/seo'

/**
 * /page/support/notify_form.php 를 옮긴 것.
 *
 * **글쓰기는 더 이상 여기서 하지 않는다.** 게시판 내용이 CMS(Directus)로
 * 옮겨졌고, 이 폼은 옛 게시판 백엔드로 저장한다. 그대로 두면 글을 써도
 * 사이트에는 안 나오고 어디에 갔는지도 안 보인다 — 조용한 유실이다.
 * 그래서 화면 뼈대는 원본 그대로 두되 저장 경로를 끊고 관리 화면으로 보낸다.
 *
 * 주소를 살려 두는 것은 북마크·이력 때문이다.
 *
 * 주소에서 `.php` 를 뺐다. 옛 주소는 lib/phpRoutes.mjs 의 목록대로 308 로
 * 넘어오므로 검색에 쌓인 것을 잃지 않는다.
 *
 * 2026-09-18 껍데기를 옛 꾸밈(사진 머리 + t_inner)에서 M.AX 계열과 같은
 * SolutionShell 로 옮겼다. 폼의 필드·id·안내 스크립트는 그대로다.
 */

/**
 * 이 페이지만 주소의 물음표 뒤를 읽는다. PHP 의
 *   $board = $_GET['board'] ?? 'notice';
 * 자리다. 나머지 값은 전부 여기서 갈린다 — 원본의 삼항 연산을 그대로 옮겼다.
 */

const PATH = '/page/support/notify_form'

export const generateMetadata = seoMeta({
  title: '글 작성',
  description:
    '게시판 글 작성은 관리 화면에서 합니다.',
  path: PATH, noIndex: true,
})

/* 폼 자리(장 전용 CSS — 이름이 PAGE_CSS 여야 check-src 가 본다). 필드 꼴(.dv_field 등)은 public/css/style.css 에 있다. 옛 t_inner 폭(860)을 지킨다. */
const PAGE_CSS = `
#dvmax .sp_form { max-width: 860px; padding-bottom: 96px; }
`

function boardOf(v: string | string[] | undefined): 'notice' | 'press' {
  // 원본은 목록에 없는 값이면 notice 로 되돌린다. 그 판정을 그대로 둔다.
  return v === 'press' ? 'press' : 'notice'
}

export default async function Page(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> },
) {
  const board = boardOf((await searchParams).board)
  // 운영마다 다르다. 비면 링크 없이 안내만 낸다 — 틀린 주소를 박아 두는 것보다 낫다.
  // 관리 화면은 같은 사이트의 /admin 이다.
  const cmsUrl = '/admin'
  const default_type = board === 'press' ? 'NEWSROOM' : 'NOTICE'
  const page_title = board === 'press' ? '보도자료' : '공지사항'
  const hero_text = board === 'press'
    ? '디알밸류의 보도자료와 언론 보도를 확인하세요.'
    : '디알밸류의 소식과 공지사항을 안내드립니다.'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MAX_CSS + PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        kicker={page_title}
        kickerSub="고객센터"
        headLead=""
        headStrong="글 작성"
        desc={hero_text}
        ctaTitle="문의사항이 있으신가요?"
        ctaDesc="프로젝트 문의는 문의하기에서 남길 수 있습니다."
      >
        <div className="sp_form" data-rv>
          <h2 id="dvFormTitle">글 작성</h2>
          <ClientAction as="form" on="submit" prevent calls={[]} id="dvNotifyForm">
            <input type="hidden" id="dvId" value="" />
            <div className="dv_form_top">
              <div className="dv_checks">
                <label><input type="checkbox" id="dvShow" defaultChecked={true} /> 공개</label>
                <label><input type="checkbox" id="dvPin" /> 상단 고정</label>
              </div>
            </div>
            <div className="dv_field">
              <label htmlFor="dvType">유형</label>
              <select id="dvType">
                <option value="NOTICE">공지사항</option>
                <option value="NEWSROOM">보도자료</option>
              </select>
            </div>
            <div className="dv_field">
              <label htmlFor="dvTitle">제목</label>
              <input type="text" id="dvTitle" placeholder="제목을 입력하세요" />
            </div>
            <div className="dv_field">
              <label htmlFor="dvContent">내용</label>
              <textarea id="dvContent" placeholder="내용을 입력하세요"></textarea>
            </div>
            <div className="dv_row">
              <div className="dv_field"><label htmlFor="dvStart">시작일</label><input type="date" id="dvStart" /></div>
              <div className="dv_field"><label htmlFor="dvEnd">종료일</label><input type="date" id="dvEnd" /></div>
            </div>
            <div className="dv_actions">
              <button type="button" className="dv_save" id="dvSave">저장</button>
              <ClientAction calls={[{ fn: 'history.back' }]} type="button" className="dv_cancel">취소</ClientAction>
            </div>
            <div className="dv_err" id="dvFormErr"></div>
          </ClientAction>
        </div>
      </SolutionShell>

      <Script id="page-script-0" strategy="afterInteractive">{`
// 이 폼은 옛 게시판 백엔드에 저장하던 것이다. 게시판이 CMS 로 옮겨간 뒤로는
// 여기서 저장하면 사이트에 안 나온다. 그래서 요청 자체를 보내지 않는다.
var CMS_URL = ${JSON.stringify(cmsUrl)};

$(function(){
    $('#dvNotifyForm').hide();
    $('#dvFormTitle').text('글 작성은 관리 화면으로 옮겼습니다');
    // 안내는 폼 **밖에** 붙인다. #dvFormErr 는 폼 안에 있어서, 폼을 감추면
    // 안내까지 같이 사라진다(실제로 그렇게 나왔다).
    var $box = $('<div>').css({ margin:'24px 0 48px', lineHeight:'1.7' });
    $('<p>').text('게시판 내용이 콘텐츠 관리 화면(CMS)으로 옮겨졌습니다. 글 작성과 수정은 그곳에서 합니다.')
            .appendTo($box);
    if(CMS_URL){
        $('<a>').attr({ href: CMS_URL + '/admin/content/posts', target:'_blank', rel:'noopener' })
                .text('관리 화면 열기 →')
                .css({ display:'inline-block', marginTop:'12px', color:'#d71920', fontWeight:'600' })
                .appendTo($box);
    }
    $box.insertAfter('#dvNotifyForm');
});
      `}</Script>
    </>
  )
}

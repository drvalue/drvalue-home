import ClientAction from '@/components/ClientAction'
import Script from 'next/script'
import { PAGE_CSS as MAX_CSS } from '../../business/max/maxStyles'
import SolutionShell from '../../business/max/SolutionShell'
import { pageMeta } from '@/lib/seo'

/**
 * /page/support/notice.php 를 옮긴 것.
 *
 * 주소에서 `.php` 를 뺐다. 옛 주소는 lib/phpRoutes.mjs 의 목록대로 308 로
 * 넘어오므로 검색에 쌓인 것을 잃지 않는다.
 *
 * 2026-09-18 껍데기를 옛 꾸밈(사진 머리 + t_inner + AOS)에서 M.AX 계열과 같은
 * SolutionShell 로 옮겼다. 목록·상세를 그리는 jQuery 스크립트와 #dvBoardList ·
 * #dvBoardDetail · #dvAuthBar · #dvDelModal 골격은 그대로다. 글도 옛 것 그대로.
 */

const PATH = '/page/support/notice'

export const metadata = pageMeta({
  title: '공지사항',
  description:
    '디알밸류의 서비스 오픈, 시스템 점검, 안내 사항을 전합니다.',
  path: PATH,
})

/* 게시판 자리(장 전용 CSS — 이름이 PAGE_CSS 여야 check-src 가 본다). 목록·기사 꼴(.dv_news · .dv_art)은 public/css/style.css 에 있다. */
const PAGE_CSS = `
#dvmax .sp_board { padding-bottom: 96px; }
`

export default function Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MAX_CSS + PAGE_CSS }} />
      <SolutionShell
        path={PATH}
        kicker="공지사항"
        kickerSub="고객센터"
        headLead="디알밸류의 소식과 "
        headStrong="공지사항을 안내드립니다."
        desc="디알밸류의 서비스 오픈, 시스템 점검, 안내 사항을 전합니다."
        ctaTitle="문의사항이 있으신가요?"
        ctaDesc="프로젝트 문의는 문의하기에서 남길 수 있습니다."
      >
        <div className="sp_board" data-rv>
          <div id="dvBoardList"></div>
          <div id="dvBoardDetail"></div>
          <div className="dv_authbar" id="dvAuthBar"></div>
        </div>
      </SolutionShell>

      <div className="dv_ov" id="dvDelModal">
        <div className="dv_modal">
          <h3>정말 삭제하시겠습니까?</h3>
          <div className="dv_mbtns">
            <button className="dv_mok" id="dvDelYes">예</button>
            <ClientAction calls={[{ fn: 'dvCloseDel' }]} className="dv_mno">아니오</ClientAction>
          </div>
        </div>
      </div>

      <Script id="page-script-1" strategy="afterInteractive">{`
window.BOARD = { key: "notice", api: '/api/content/posts', pageSize: 10, title: "\\uacf5\\uc9c0\\uc0ac\\ud56d" };

function dvEsc(s){ return $('<div>').text(s == null ? '' : String(s)).html(); }
function dvAttr(s){ return dvEsc(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function dvSafeUrl(u){ u = (u == null ? '' : String(u)); return /^\\s*javascript:/i.test(u) ? '' : u; }
function dvDate(s){ if(!s) return '-'; return String(s).slice(0,10); }
function dvDotDate(s){ var d = dvDate(s); return d === '-' ? d : d.replace(/-/g, '.'); }
function dvQS(params){ return Object.entries(params).filter(function(e){ return e[1]!=='' && e[1]!=null; }).map(function(e){ return e[0]+'='+encodeURIComponent(e[1]); }).join('&'); }

// 글이 없거나 못 불러왔을 때 보여 줄 자리. 회색 한 줄만 두면 고장 난 화면으로 읽힌다.
function dvStateBox(icon, title, desc, action){
    var ico = icon === 'warn'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>';
    return '<div class="dv_state">'
      + '<div class="dv_state_ico" aria-hidden="true">' + ico + '</div>'
      + '<p class="dv_state_t">' + dvEsc(title) + '</p>'
      + '<p class="dv_state_d">' + dvEsc(desc) + '</p>'
      + (action || '')
      + '</div>';
}

function dvGetParams(){
    var p = new URLSearchParams(location.search);
    return { id:p.get('id')||'', q:p.get('q')||'', startDate:p.get('startDate')||'', endDate:p.get('endDate')||'', page:Math.max(1, parseInt(p.get('page')||'1',10) || 1) };
}

function dvLoadList(){
    var cur = dvGetParams();
    var hasSearch = cur.q || cur.startDate || cur.endDate;
    var url = BOARD.api + '?' + dvQS({ board:BOARD.key, page:cur.page, q:cur.q, startDate:cur.startDate, endDate:cur.endDate });
    $('#dvBoardList').html('<div class="dv_empty">불러오는 중...</div>');
    $.getJSON(url).done(function(payload){
        dvRenderSearch(cur);
        dvRenderList(payload, cur, hasSearch);
    }).fail(function(){
        $('#dvBoardList').html(dvStateBox('warn', '목록을 불러오지 못했습니다', '잠시 뒤 다시 시도해 주세요. 계속 같으면 고객센터로 알려 주세요.',
            '<button type="button" class="dv_state_act" onclick="dvLoadList()">다시 불러오기</button>'));
    });
}

function dvRenderSearch(cur){
    var html = ''
      + '<form id="dvSearchForm" class="dv_search">'
      + '  <div class="dv_qwrap">'
      + '    <input type="text" name="q" aria-label="제목 / 내용 검색" placeholder="제목 / 내용 검색" value="'+dvAttr(cur.q)+'">'
      + '    <button type="submit" class="dv_qicon" aria-label="검색"><img src="/img/search.svg" alt="검색"></button>'
      + '  </div>'
      + '  <input type="date" name="startDate" aria-label="시작일" value="'+dvAttr(cur.startDate)+'">'
      + '  <input type="date" name="endDate" aria-label="종료일" value="'+dvAttr(cur.endDate)+'">'
      + '  <button type="button" class="dv_btn dv_btn_reset" onclick="location.href=location.pathname">초기화</button>'
      + '</form>';
    if(!$('#dvSearchForm').length){ $('#dvBoardList').before(html); }
    else { $('#dvSearchForm input[name=q]').val(cur.q); }
}

function dvRenderList(payload, cur, hasSearch){
    var items = (payload && payload.data) || [];
    var total = (payload && payload.total) || 0;
    // 한 쪽 크기는 서버가 정한다. 여기에 숫자를 박아 두면 서버가 바뀔 때
    // 마지막 쪽이 조용히 사라진다.
    if(payload && payload.pageSize) BOARD.pageSize = payload.pageSize;
    // 표(번호·시작일·종료일)가 아니라 뉴스룸 목록이다. 시작일·종료일은 글마다
    // 비어 있어 '-' 만 두 줄 찍혔고, 번호는 읽는 사람에게 아무 뜻이 없다.
    if(!items.length){
        var box = hasSearch
            ? dvStateBox('doc', '검색 결과가 없습니다', '다른 낱말로 찾아보거나 기간을 넓혀 보세요.',
                '<button type="button" class="dv_state_act" onclick="location.href=location.pathname">검색 조건 지우기</button>')
            : dvStateBox('doc', '아직 등록된 공지가 없습니다', '새 공지가 올라오면 이곳에 바로 보입니다.',
                '<a class="dv_state_act" href="/page/support/notify_form">문의 남기기</a>');
        $('#dvBoardList').html('<div class="dv_news">'+box+'</div>');
        return;
    }
    var rows = items.map(function(it){
        var titleLink = location.pathname + '?id=' + encodeURIComponent(it.slug);
        var tag = it.is_pinned ? '<span class="dv_pin">고정</span>'
                : it.press_media ? '<span class="dv_news_media">'+dvEsc(it.press_media)+'</span>' : '';
        return '<li class="dv_news_row'+(it.is_pinned?' is-pinned':'')+'">'
          + '<time class="dv_news_date" datetime="'+dvAttr(dvDate(it.published_date||it.publish_at))+'">'+dvDotDate(it.published_date||it.publish_at)+'</time>'
          + '<div class="dv_news_txt">'
          +   '<a class="dv_news_title" href="'+titleLink+'">'+tag+dvEsc(it.title)+'</a>'
          +   (it.summary ? '<p class="dv_news_sum">'+dvEsc(it.summary)+'</p>' : '')
          + '</div>'
          + '<span class="dv_news_arrow" aria-hidden="true">→</span>'
          + '</li>';
    }).join('');
    $('#dvBoardList').html('<ul class="dv_news">' + rows + '</ul>' + dvRenderPager(total, cur.page));
}

function dvRenderPager(total, page){
    var totalPages = Math.max(1, Math.ceil(total / BOARD.pageSize));
    if(totalPages <= 1) return '';
    var block = 5, startP = Math.floor((page-1)/block)*block + 1, endP = Math.min(startP+block-1, totalPages);
    function btn(p, label, opt){ opt=opt||{};
        return '<button '+(opt.disabled?'disabled':'')+' class="'+(opt.on?'on':'')+'" onclick="dvGoPage('+p+')">'+(label||p)+'</button>'; }
    var h = '<div class="dv_pager">';
    h += btn(page-1, '‹', {disabled: page<=1});
    for(var p=startP; p<=endP; p++) h += btn(p, p, {on: p===page});
    h += btn(page+1, '›', {disabled: page>=totalPages});
    h += '</div>';
    return h;
}

function dvGoPage(p){
    var cur = dvGetParams();
    location.href = location.pathname + '?' + dvQS({ q:cur.q, startDate:cur.startDate, endDate:cur.endDate, page:p });
}

function dvLoadDetail(id){
    $('#dvBoardList').hide();
    $('#dvBoardDetail').show().html('<div class="dv_empty">불러오는 중...</div>');
    $.getJSON(BOARD.api + '/' + encodeURIComponent(id))
     .done(function(payload){ dvRenderDetail(payload && payload.data); })
     .fail(function(xhr){
        var msg = xhr.status === 404 ? '존재하지 않는 게시글입니다.' : '게시글을 불러오지 못했습니다.';
        $('#dvBoardDetail').html('<div class="dv_empty">'+msg+'</div>');
     });
}

// 이미 이스케이프된 텍스트에서 http(s) URL 을 새창 링크로 변환.
function dvLinkify(escaped){
    return escaped.replace(/https?:\\/\\/[^\\s<]+/g, function(m){
        var trail = '', mt = m.match(/[)\\].,;!?]+$/);  // 끝 문장부호는 링크 제외
        if(mt){ trail = mt[0]; m = m.slice(0, -trail.length); }
        return '<a href="'+m.replace(/"/g,'&quot;')+'" target="_blank" rel="noopener noreferrer" class="dv_art_link">'+m+'</a>'+trail;
    });
}
function dvRenderContent(content){
    var s = content || '';
    // 관리 도구가 준 본문은 이미 HTML 이다. 그 안의 주소가 맨글자로 남아 있으면
    // 눌리게 만든다(태그 안은 안 건드린다 — 정규식이 '<' 앞에서 멈춘다).
    if(/<[a-z][\\s\\S]*>/i.test(s)) return /<a\\s/i.test(s) ? s : dvLinkify(s);
    return '<p>' + dvLinkify(dvEsc(s)).replace(/\\n/g, '<br>') + '</p>';
}

function dvRenderFiles(attachments){
    var arr = Array.isArray(attachments) ? attachments : [];
    if(!arr.length) return '';
    var links = arr.map(function(f){
        var url = dvSafeUrl((typeof f === 'string') ? f : (f.url || f.path || ''));
        var name = (typeof f === 'string') ? f.split('/').pop() : (f.name || (url.split('/').pop()) || '첨부파일');
        if(!url) return '';
        return '<a href="'+dvAttr(url)+'" target="_blank" rel="noopener" style="margin-right:10px;color:#d71920;">📎 '+dvEsc(name)+'</a>';
    }).join('');
    return links ? '<div style="margin-top:24px;border-top:1px solid #eef0f3;padding-top:18px;">'+links+'</div>' : '';
}

function dvRenderDetail(it){
    if(!it || !it.slug){ $('#dvBoardDetail').html('<div class="dv_empty">존재하지 않는 게시글입니다.</div>'); return; }
    var thumb = it.thumbnail ? '<img src="'+dvAttr(dvSafeUrl(it.thumbnail))+'" alt="" style="max-width:100%;border-radius:12px;margin-bottom:24px;">' : '';
    var rng = (it.publish_at && it.unpublish_at) ? (dvDate(it.publish_at)+' ~ '+dvDate(it.unpublish_at))
            : it.publish_at ? (dvDate(it.publish_at)+' ~')
            : it.unpublish_at ? ('~ '+dvDate(it.unpublish_at))
            : '';
    // 기사 꼴로 그린다 — 머리표(갈래·매체) · 표제 · 부제(요약) · 바이라인 · 본문.
    var kicker = BOARD.title + (it.press_media ? ' <i aria-hidden="true">·</i> ' + dvEsc(it.press_media) : '');
    var date = dvDotDate(it.published_date||it.publish_at);
    var html = '<article class="dv_art">'
      + '<header class="dv_art_head">'
      +   '<p class="dv_art_kicker">'+kicker+'</p>'
      +   '<h2 class="dv_art_title">'+dvEsc(it.title)+'</h2>'
      +   (it.summary ? '<p class="dv_art_deck">'+dvEsc(it.summary)+'</p>' : '')
      +   '<div class="dv_art_byline">'
      +     '<span><b>디알밸류</b> <time datetime="'+dvAttr(dvDate(it.published_date||it.publish_at))+'">'+date+'</time>'+(rng ? ' <i aria-hidden="true">·</i> '+rng : '')+'</span>'
      +     '<button type="button" class="dv_art_copy" onclick="dvCopyLink(this)">링크 복사</button>'
      +   '</div>'
      + '</header>'
      + thumb
      + '<div class="dv_art_body">'+dvRenderContent(it.body)+'</div>'
      + dvRenderFiles(it.attachments)
      + '<footer class="dv_art_foot"><a class="dv_art_back" href="'+location.pathname+'">← '+BOARD.title+' 목록</a></footer>'
      + '</article>';
    document.title = ((it.title||BOARD.title)) + ' | 디알밸류';
    $('#dvBoardDetail').html(html);
}


function dvRenderAuthBar(isDetail){
    // 하단 우측: 목록=글작성(관리자) / 상세=목록으로. 로그인/로그아웃은 전역 헤더로 이동.
    // 상세의 「목록으로」는 기사 발치(dv_art_foot)로 옮겼다. 이 줄은 비워 둔다.
    $('#dvAuthBar').html('');
}

function dvCopyLink(btn){
    var url = location.href;
    function done(){ btn.textContent = '복사됨'; setTimeout(function(){ btn.textContent = '링크 복사'; }, 1600); }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(done, function(){ dvToast(url); }); }
    else { dvToast(url); }
}


// 토스트 — 상단 중앙 알림
var dvToastTimer = null;
function dvToast(msg){
    var $t = $('#dvToast');
    if(!$t.length){ $t = $('<div id="dvToast" class="dv_toast"></div>').appendTo('body'); }
    $t.removeClass('show').text(msg);
    $t[0].offsetHeight; // 강제 reflow — 첫 표시에도 페이드 트랜지션 적용
    $t.addClass('show');
    if(dvToastTimer) clearTimeout(dvToastTimer);
    dvToastTimer = setTimeout(function(){ $t.removeClass('show'); }, 2200);
}

// 통합 검색: 키워드(2글자 이상) 또는 기간(시작·종료 모두) 중 하나라도 충족하면 검색.
function dvDoSearch(){
    var $f = $('#dvSearchForm');
    var q = ($f.find('[name=q]').val() || '').trim();
    var sd = $f.find('[name=startDate]').val();
    var ed = $f.find('[name=endDate]').val();
    var hasKeyword = q.length >= 2;
    var hasDates = !!(sd && ed);
    if(!hasKeyword && !hasDates){ dvToast('검색어를 두 글자 이상 입력하거나 기간을 모두 선택해주세요.'); return; }
    location.href = location.pathname + '?' + dvQS({ q: hasKeyword ? q : '', startDate:sd, endDate:ed, page:1 });
}

$(function(){
    $(document).on('submit', '#dvSearchForm', function(e){ e.preventDefault(); dvDoSearch(); });
    // 시작·종료일을 모두 입력하면 자동으로 날짜 검색
    $(document).on('change', '#dvSearchForm [name=startDate], #dvSearchForm [name=endDate]', function(){
        var $f = $('#dvSearchForm');
        if($f.find('[name=startDate]').val() && $f.find('[name=endDate]').val()) dvDoSearch();
    });
    // 검색어를 모두 지우면 전체 목록 1페이지로 재로딩 (검색/페이지 상태가 있을 때만)
    $(document).on('input', '#dvSearchForm [name=q]', function(){
        if($(this).val().trim() === '' && location.search !== '') location.href = location.pathname;
    });
    // 쓰기·삭제는 CMS 관리 화면(Directus)으로 갔다. 공개 화면은 읽기만 한다.
    var p = dvGetParams();
    dvRenderAuthBar(!!p.id);
    if(p.id){ $('#dvBoardList').hide(); dvLoadDetail(p.id); }
    else { dvLoadList(); }
});
      `}</Script>
    </>
  )
}

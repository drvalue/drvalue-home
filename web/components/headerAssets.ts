// header.php 의 인라인 <style> 과 <script> 를 그대로 뽑아 둔 것.
//
// 손으로 옮기지 않는다 — 모달이 숨겨지는 건 이 CSS 의 display:none 하나
// 때문이고, 한 줄만 빠져도 폼이 페이지 위에 그대로 노출된다(실제로 겪었다).
// 스크립트는 openContactModal·toggleMobileMenu 같은 전역 함수를 정의한다.
// 마크업의 onclick 이 이 이름들을 부른다.

export const HEADER_CSS = String.raw`
/* 모달 관련 핵심 스타일 (우선순위 강제를 위해 상단 배치) */
        .dv_modal_overlay {
            display: none; 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%;
            background: rgba(0,0,0,0.7); 
            z-index: 999999 !important; 
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }
        .dv_modal_window {
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            background: #fff; 
            width: 90%; 
            max-width: 480px; 
            border-radius: 24px;
            padding: 35px; 
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); 
            z-index: 1000000 !important;
            box-sizing: border-box;
        }
        .dv_modal_head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .dv_modal_head h3 { font-size: 22px; font-weight: 800; margin: 0; color: #191f28; font-family: 'Pretendard'; }
        .dv_btn_close { background: none; border: none; font-size: 32px; cursor: pointer; color: #b0b8c1; line-height: 1; padding: 0; }
        
        .dv_contact_form .form_group { margin-bottom: 15px; text-align: left; }
        .dv_contact_form label { display: block; font-size: 13px; font-weight: 600; color: #4e5968; margin-bottom: 8px; }
        .dv_contact_form input, .dv_contact_form textarea, .dv_contact_form select {
            width: 100%; padding: 14px; border: 1px solid #e5e8eb; border-radius: 12px;
            font-size: 16px; background: #f9fafb; outline: none; box-sizing: border-box; font-family: 'Pretendard';
        }
        .dv_contact_form input:focus-visible, .dv_contact_form textarea:focus-visible, .dv_contact_form select:focus-visible { outline: 3px solid #d71920; outline-offset: 2px; }
        .dv_contact_form select { appearance: none; -webkit-appearance: none; cursor: pointer;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%234e5968' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
            background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px;
        }
        .dv_btn_submit {
            width: 100%; background: #d71920; color: #fff; border: none; padding: 16px;
            border-radius: 14px; font-size: 17px; font-weight: 700; cursor: pointer; margin-top: 10px; transition: 0.3s;
        }
        .dv_btn_submit:hover { background: #b80000; }
        body.no-scroll { overflow: hidden !important; }
`

export const HEADER_JS = String.raw`
/**
 * 화면 알림. 원본은 브라우저 기본 대화상자를 썼는데 그것은 **페이지를 멈춘다.**
 * 사용자가 확인을 누르기 전까지 아무것도 못 하고, 모달이 닫히는 것도
 * 뒤로 밀린다. 자동 확인 도구도 여기서 통째로 멎는다(실제로 막혔다).
 * 같은 문구를 그대로 띄우되 막지 않는다.
 */
function dvNotify(msg, kind){
    var box = document.getElementById('dvNotifyBox');
    if(!box){
        box = document.createElement('div');
        box.id = 'dvNotifyBox';
        // 스크린리더도 읽게 한다. 기본 대화상자는 저절로 읽혔지만 이건 아니다.
        box.setAttribute('role', 'status');
        box.setAttribute('aria-live', 'polite');
        // 아래에 띄운다. 위쪽은 고정 헤더가 있어서 겹친다(실제로 겹쳤다).
        box.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);'
            + 'z-index:99999;display:flex;flex-direction:column;gap:8px;'
            + 'align-items:center;pointer-events:none;max-width:92vw';
        document.body.appendChild(box);
    }
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'padding:14px 22px;border-radius:8px;font-size:15px;line-height:1.5;'
        + 'color:#fff;box-shadow:0 6px 24px rgba(0,0,0,.18);pointer-events:auto;'
        + 'background:' + (kind === 'error' ? '#d71920' : '#1f2937')
        + ';opacity:0;transition:opacity .2s';
    box.appendChild(el);
    requestAnimationFrame(function(){ el.style.opacity = '1'; });
    setTimeout(function(){
        el.style.opacity = '0';
        setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 250);
    }, 4000);
}

// 관리자 로그인은 CMS 관리 화면으로 옮겼다.
// 예전에는 헤더에 로그인 단추가 있었고 notice_api.php 로 세션을 물었는데,
// 그 주소는 Nest 로 넘어가는 자리라 공개 사이트에서 부를 이유가 없다 —
// 페이지를 열 때마다 실패한 요청이 한 번씩 나가고 있었다(실측: 404).

// 1. 모달 제어 함수 (전역)
let lastFocusedElement = null;

function openContactModal(prefillMsg, prefillType) {
    lastFocusedElement = document.activeElement;
    $('#dvModalOverlay').css('display', 'block');
    $('#dvModalOverlay').attr('aria-hidden', 'false');
    $('body').addClass('no-scroll');
    // 특정 경로로 열렸을 때 문의 내용에 기본 문구를 채우고, 일반 경로로 열리면 초기화한다.
    $('#dvContactForm textarea[name="user_msg"]').val(typeof prefillMsg === 'string' ? prefillMsg : '');
    // 특정 경로로 열렸을 때 문의 유형도 자동 선택, 일반 경로면 미선택(placeholder)으로 초기화.
    $('#dvContactForm select[name="user_type"]').val(typeof prefillType === 'string' ? prefillType : '');
    // 포커스는 첫 입력칸(회사명/성함)에 둔다.
    $('#dvContactForm input:first').trigger('focus');
}

function closeContactModal() {
    $('#dvModalOverlay').css('display', 'none');
    $('#dvModalOverlay').attr('aria-hidden', 'true');
    $('body').removeClass('no-scroll');
    if (lastFocusedElement) {
        $(lastFocusedElement).trigger('focus');
    }
}

// 2. 모바일 메뉴 제어
function toggleMobileMenu(forceOpen) {
    const isOpen = typeof forceOpen === 'boolean'
        ? forceOpen
        : !$('#mobile_menu_layer').hasClass('active');
    $('.m_menu_btn').toggleClass('open', isOpen).attr('aria-expanded', String(isOpen));
    $('#mobile_menu_layer').toggleClass('active', isOpen).attr('aria-hidden', String(!isOpen));
    $('body').toggleClass('no-scroll', isOpen);
}

function toggleSubMenu(obj) {
    const $target = $(obj);
    const isExpanded = $target.attr('aria-expanded') === 'true';
    $target.attr('aria-expanded', String(!isExpanded)).toggleClass('active', !isExpanded);
    $target.next('.m_sub_list').slideToggle(200);
}

$(document).ready(function() {
    // 배경(바깥) 클릭으로는 모달을 닫지 않음 — X 버튼/ESC로만 닫기

    $(document).on('keydown', function(e) {
        if (e.key !== 'Escape') return;
        if ($('#dvModalOverlay').is(':visible')) closeContactModal();
        if ($('#mobile_menu_layer').hasClass('active')) toggleMobileMenu(false);
    });

    // 실제 이동 링크 클릭 시에만 메뉴 닫기 (서브메뉴 펼치기 토글은 제외)
    $('#mobile_menu_layer a:not([onclick])').on('click', function() {
        if ($('#mobile_menu_layer').hasClass('active')) toggleMobileMenu(false);
    });

    // 폼 발송 Ajax
    $('#dvContactForm').on('submit', function(e) {
        e.preventDefault();
        const $btn = $('#dvSubmitBtn');
        $btn.text('발송 중...').prop('disabled', true);

        // mail_send.php 대신 Nest 로 보낸다. 주소는 /api 로 같은 출처를 쓴다 —
        // next.config.mjs 의 rewrite 가 Nest 로 넘긴다. 브라우저가 다른
        // 출처를 직접 부르면 CORS 설정이 하나 더 늘고, 운영에서 API 주소가
        // 페이지 소스에 박힌다.
        $.ajax({
            type: "POST",
            url: "/api/inquiry",
            dataType: "json",
            contentType: "application/json",
            // PHP 는 form-urlencoded 를 받았고 Nest 는 JSON 을 받는다.
            // 칸 이름(user_name·user_tel·user_type·user_msg)은 그대로다. user_email 은 새로 받는다.
            data: JSON.stringify($(this).serializeArray().reduce(function(o, f) {
                o[f.name] = f.value; return o;
            }, {})),
            success: function(res) {
                if (res && res.ok) {
                    dvNotify("문의가 성공적으로 접수되었습니다.");
                    closeContactModal();
                    $('#dvContactForm')[0].reset();
                } else {
                    dvNotify("처리 중 오류가 발생했습니다. hi@drvalue.co.kr로 직접 문의 부탁드립니다.", 'error');
                }
            },
            error: function(xhr) {
                if (xhr.status === 429) {
                    dvNotify("짧은 시간에 너무 많이 전송되었습니다. 잠시 후 다시 시도해 주세요.", 'error');
                    return;
                }
                // 400 은 칸 하나가 틀린 것이다. 서버가 어느 칸인지 사용자에게 하는 말로 준다.
                var said = xhr.status === 400 && xhr.responseJSON && xhr.responseJSON.message;
                dvNotify(typeof said === 'string' && said ? said : "오류가 발생했습니다. hi@drvalue.co.kr로 직접 문의 부탁드립니다.", 'error');
            },
            complete: function() {
                $btn.text('메일 발송하기').prop('disabled', false);
            }
        });
    });
});
`

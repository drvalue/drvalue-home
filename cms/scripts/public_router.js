// 공개 읽기 라우터. Directus Flows 의 "스크립트 실행" 작업으로 돌아간다.
//
// 왜 하나의 스크립트가 전부를 처리하나
// -----------------------------------
// Directus Core 는 플로우를 5개까지만 허용한다(초과 시 flows limit exceeded).
// 예약 게시 크론과 문의 등록을 빼면 공개 읽기에 쓸 수 있는 플로우는 몇 개
// 남지 않는다. 그래서 엔드포인트를 컬렉션마다 두지 않고, ?resource= 로
// 갈라지는 라우터 하나를 둔다.
//
// 이 스크립트의 반환값을 다음 작업(item-read)이 collection 과 query 로 쓴다.
// 즉 여기 적힌 것만 밖에서 읽을 수 있다. routes 에 없는 이름은 예외를 던져
// 플로우가 거기서 멈춘다(응답은 빈 객체).
//
// 고치는 곳은 여기다. 관리 화면에서 직접 고치면 public_api.py 재실행 때
// 되돌아간다.

module.exports = function (data) {
  var q = (data['$trigger'] && data['$trigger'].query) || {};
  var PUBLISHED = { status: { _eq: 'published' } };

  // 글로 된 값은 전부 <컬렉션>_translations 에 있다(요구사항 11번). 언어를
  // 안 고르면 한국어를 준다. 목록에 없는 코드는 받지 않는다 — 그대로 필터에
  // 넣으면 아무것도 안 나오는 응답이 조용히 돌아간다.
  var LANGUAGES = ['ko-KR', 'en-US'];
  var lang = LANGUAGES.indexOf(q.lang) >= 0 ? q.lang : 'ko-KR';
  var LANG_FILTER = { _filter: { languages_code: { _eq: lang } } };

  // 목록에 본문까지 실어 보내면 응답이 쓸데없이 커진다.
  var POST_LIST = [
    'id', 'board', 'slug', 'published_date', 'thumbnail',
    'is_pinned', 'is_featured', 'press_media', 'case_category',
    'period_start', 'period_end', 'program_status',
    'program_field', 'program_region', 'deadline', 'sort',
    'translations.*'
  ];
  var RECRUIT_LIST = [
    'id', 'slug', 'published_date', 'employment_type',
    'deadline', 'is_open_ended', 'sort', 'translations.*'
  ];
  var PAGE_LIST = [
    'id', 'path', 'code', 'layout', 'og_image', 'no_index', 'canonical',
    'sort', 'translations.*'
  ];

  // 호출자가 준 값은 문자열이다. 그대로 limit/page 에 넣으면 음수나 거대한
  // 값이 들어올 수 있다.
  function pageNo() {
    var n = parseInt(q.page, 10);
    if (isNaN(n) || n < 1) return 1;
    return n > 500 ? 500 : n;
  }

  function need(name) {
    var v = q[name];
    if (typeof v !== 'string' || v === '') {
      throw new Error('missing required query parameter: ' + name);
    }
    return v;
  }

  function and(extra) {
    return { _and: [PUBLISHED, extra] };
  }

  var routes = {
    // 사이트맵과 메뉴 검증용. 본문(blocks)은 빼고 머리말만 준다.
    'pages': function () {
      return {
        collection: 'pages',
        query: {
          filter: PUBLISHED, limit: 200, sort: ['sort', 'path'], fields: PAGE_LIST,
          deep: { translations: LANG_FILTER }
        }
      };
    },
    'page': function () {
      return {
        collection: 'pages',
        query: {
          filter: and({ path: { _eq: need('path') } }),
          limit: 1,
          fields: ['*', 'translations.*', 'blocks.*', 'blocks.translations.*'],
          deep: {
            translations: LANG_FILTER,
            blocks: { _sort: ['sort', 'id'], translations: LANG_FILTER }
          }
        }
      };
    },
    'posts': function () {
      return {
        collection: 'posts',
        query: {
          filter: and({ board: { _eq: need('board') } }),
          limit: 50,
          page: pageNo(),
          sort: ['-is_pinned', '-published_date', '-id'],
          fields: POST_LIST,
          deep: { translations: LANG_FILTER }
        }
      };
    },
    // 메인 화면에서 게시판 구분 없이 최신 글을 보여줄 때.
    'posts-latest': function () {
      return {
        collection: 'posts',
        query: {
          filter: PUBLISHED, limit: 12,
          sort: ['-published_date', '-id'], fields: POST_LIST,
          deep: { translations: LANG_FILTER }
        }
      };
    },
    'post': function () {
      return {
        collection: 'posts',
        query: {
          filter: and({ slug: { _eq: need('slug') } }), limit: 1,
          fields: ['*', 'translations.*'], deep: { translations: LANG_FILTER }
        }
      };
    },
    'recruits': function () {
      return {
        collection: 'recruits',
        query: {
          filter: PUBLISHED, limit: 50, page: pageNo(),
          sort: ['-published_date', '-id'], fields: RECRUIT_LIST,
          deep: { translations: LANG_FILTER }
        }
      };
    },
    'recruit': function () {
      return {
        collection: 'recruits',
        query: {
          filter: and({ slug: { _eq: need('slug') } }), limit: 1,
          fields: ['*', 'translations.*'], deep: { translations: LANG_FILTER }
        }
      };
    },
    'hero-slides': function () {
      return {
        collection: 'hero_slides',
        query: {
          filter: PUBLISHED, limit: 20, sort: ['sort', 'id'],
          fields: ['*', 'translations.*'], deep: { translations: LANG_FILTER }
        }
      };
    },
    'popups': function () {
      return {
        collection: 'popups',
        query: {
          filter: PUBLISHED, limit: 20, sort: ['sort', 'id'],
          fields: ['*', 'translations.*'], deep: { translations: LANG_FILTER }
        }
      };
    },
    // 평면으로 준다. 트리는 parent 를 보고 화면에서 조립한다.
    'menu': function () {
      return {
        collection: 'menu_items',
        query: {
          filter: { is_visible: { _eq: true } },
          limit: 200, sort: ['location', 'sort', 'id'],
          fields: ['*', 'translations.*'], deep: { translations: LANG_FILTER }
        }
      };
    }
  };

  var route = routes[q.resource];
  if (!route) {
    throw new Error('unknown resource: ' + String(q.resource));
  }
  return route();
};

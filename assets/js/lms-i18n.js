// ============================================================
//  LMS 페이지 번역(다국어) 기능
//  Google 웹사이트 번역기 위젯을 커스텀 언어 드롭다운으로 감싸서 제공한다.
//  로그인 화면 / 로그인 후 헤더 등 여러 곳에 동일한 드롭다운(.tsa-lang-switcher)을
//  둘 수 있으며, 모든 인스턴스가 같은 선택 상태를 공유한다.
//  googtrans 쿠키 + 새로고침 방식을 사용해 어떤 화면에서 전환해도 항상 반영되도록 한다.
// ============================================================
(function () {
  var STORAGE_KEY = 'tsa-lms-lang';
  var COOKIE_NAME = 'googtrans';
  var SOURCE_LANG = 'ko';

  var LANGUAGES = [
    { code: 'ko', flag: '🇰🇷', label: '한국어' },
    { code: 'en', flag: '🇺🇸', label: 'English' },
    { code: 'zh-CN', flag: '🇨🇳', label: '简体中文' },
    { code: 'zh-TW', flag: '🇹🇼', label: '繁體中文' },
    { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
    { code: 'ja', flag: '🇯🇵', label: '日本語' }
  ];

  function getSavedLang() {
    try {
      return localStorage.getItem(STORAGE_KEY) || SOURCE_LANG;
    } catch (e) {
      return SOURCE_LANG;
    }
  }

  function saveLang(code) {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch (e) { /* ignore */ }
  }

  function setCookie(name, value) {
    document.cookie = name + '=' + value + '; path=/';
  }

  function clearCookie(name) {
    var expire = 'expires=Thu, 01 Jan 1970 00:00:00 UTC';
    document.cookie = name + '=; ' + expire + '; path=/';
    document.cookie = name + '=; ' + expire + '; path=/; domain=' + location.hostname;
  }

  function applyGoogTransCookie(code) {
    if (code === SOURCE_LANG) {
      clearCookie(COOKIE_NAME);
    } else {
      setCookie(COOKIE_NAME, '/' + SOURCE_LANG + '/' + code);
    }
  }

  function findLanguage(code) {
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (LANGUAGES[i].code === code) return LANGUAGES[i];
    }
    return LANGUAGES[0];
  }

  function getSwitchers() {
    return document.querySelectorAll('[data-lang-switcher]');
  }

  function updateButtonLabel(code) {
    var lang = findLanguage(code);
    getSwitchers().forEach(function (wrap) {
      var flagEl = wrap.querySelector('[data-lang-flag]');
      var labelEl = wrap.querySelector('[data-lang-label]');
      if (flagEl) flagEl.textContent = lang.flag;
      if (labelEl) labelEl.textContent = lang.label;

      var items = wrap.querySelectorAll('.tsa-lang-menu-item');
      items.forEach(function (item) {
        item.classList.toggle('active', item.getAttribute('data-lang') === code);
      });
    });
  }

  function buildLanguageMenu(wrap) {
    var menu = wrap.querySelector('[data-lang-menu]');
    if (!menu) return;
    menu.innerHTML = '';
    LANGUAGES.forEach(function (lang) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tsa-lang-menu-item';
      btn.setAttribute('data-lang', lang.code);
      btn.innerHTML = '<span class="tsa-lang-flag">' + lang.flag + '</span><span>' + lang.label + '</span>';
      btn.onclick = function () {
        selectLanguage(lang.code);
      };
      menu.appendChild(btn);
    });
  }

  function closeAllMenus(except) {
    getSwitchers().forEach(function (wrap) {
      if (wrap === except) return;
      var menu = wrap.querySelector('[data-lang-menu]');
      var btn = wrap.querySelector('[data-lang-toggle]');
      if (menu) menu.classList.remove('open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', function (event) {
    var toggleBtn = event.target.closest && event.target.closest('[data-lang-toggle]');
    if (toggleBtn) {
      var wrap = toggleBtn.closest('[data-lang-switcher]');
      var menu = wrap && wrap.querySelector('[data-lang-menu]');
      if (!menu) return;
      var willOpen = !menu.classList.contains('open');
      closeAllMenus(willOpen ? wrap : null);
      menu.classList.toggle('open', willOpen);
      toggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      return;
    }

    var insideSwitcher = event.target.closest && event.target.closest('[data-lang-switcher]');
    if (!insideSwitcher) closeAllMenus(null);
  });

  function selectLanguage(code) {
    closeAllMenus(null);
    if (code === getSavedLang()) return;
    saveLang(code);
    applyGoogTransCookie(code);
    location.reload();
  }

  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement({
      pageLanguage: SOURCE_LANG,
      includedLanguages: 'en,zh-CN,zh-TW,vi,ja,ko',
      autoDisplay: false
    }, 'google_translate_element');
  };

  function loadGoogleTranslateScript() {
    if (document.getElementById('google-translate-script')) return;
    var script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', function () {
    getSwitchers().forEach(buildLanguageMenu);
    updateButtonLabel(getSavedLang());
    // 저장된 언어를 쿠키에도 맞춰둔다 (새로고침 없이 다른 탭에서 넘어온 경우 대비)
    applyGoogTransCookie(getSavedLang());
    loadGoogleTranslateScript();
    if (window.refreshIcons) window.refreshIcons();
  });
})();

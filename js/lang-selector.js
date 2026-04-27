/* ═══════════════════════════════════════════════════════
   WOLI FARM — Custom Language Selector
   Funciona seteando la cookie googtrans que Google Translate
   lee al cargar. Es 100% confiable, no depende de widgets visibles.
═══════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const LANGS = [
    { code: 'es',    flag: '🇪🇸', name: 'Español',     english: 'Spanish' },
    { code: 'en',    flag: '🇺🇸', name: 'English',     english: 'English' },
    { code: 'de',    flag: '🇩🇪', name: 'Deutsch',     english: 'German' },
    { code: 'pt',    flag: '🇧🇷', name: 'Português',   english: 'Portuguese' },
    { code: 'tl',    flag: '🇵🇭', name: 'Tagalog',     english: 'Tagalog' },
    { code: 'zh-CN', flag: '🇨🇳', name: '简体中文',     english: 'Chinese (Simplified)' },
    { code: 'zh-TW', flag: '🇹🇼', name: '繁體中文',     english: 'Chinese (Traditional)' },
    { code: 'fr',    flag: '🇫🇷', name: 'Français',    english: 'French' },
    { code: 'it',    flag: '🇮🇹', name: 'Italiano',    english: 'Italian' },
    { code: 'ja',    flag: '🇯🇵', name: '日本語',       english: 'Japanese' },
    { code: 'ko',    flag: '🇰🇷', name: '한국어',       english: 'Korean' },
    { code: 'ru',    flag: '🇷🇺', name: 'Русский',     english: 'Russian' },
    { code: 'ar',    flag: '🇸🇦', name: 'العربية',    english: 'Arabic' },
    { code: 'hi',    flag: '🇮🇳', name: 'हिन्दी',     english: 'Hindi' }
  ];

  // Helpers para cookies (Google Translate lee 'googtrans')
  function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/';
    // También set sin domain para localhost y con domain para production
    if (location.hostname !== 'localhost') {
      document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;domain=' + location.hostname;
    }
  }

  function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      const [k, v] = c.trim().split('=');
      if (k === name) return v;
    }
    return null;
  }

  // Detectar idioma actual (de cookie o fallback al del navegador)
  function getCurrentLang() {
    // Cookie googtrans tiene formato "/auto/es" o "/es/en"
    const cookie = getCookie('googtrans');
    if (cookie) {
      const parts = cookie.split('/');
      const lang = parts[parts.length - 1];
      if (lang && lang !== 'auto') return lang;
    }
    // Fallback: idioma del navegador
    const browserLang = (navigator.language || 'es').split('-')[0];
    const matchedLang = LANGS.find(l => l.code === browserLang || l.code.startsWith(browserLang));
    return matchedLang ? matchedLang.code : 'es';
  }

  // Cambiar idioma
  function setLang(langCode) {
    if (langCode === 'es') {
      // Eliminar la cookie para volver al original
      setCookie('googtrans', '', -1);
      document.cookie = 'googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      const host = location.hostname;
      if (host !== 'localhost') {
        document.cookie = 'googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + host;
        document.cookie = 'googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' + host;
      }
    } else {
      setCookie('googtrans', '/es/' + langCode, 365);
    }
    // Recargar para que Google Translate aplique el cambio
    location.reload();
  }

  // Crear el botón flotante
  function createButton() {
    const current = getCurrentLang();
    const lang = LANGS.find(l => l.code === current) || LANGS[0];

    const wrapper = document.createElement('div');
    wrapper.id = 'lang-selector';
    wrapper.innerHTML = `
      <button id="lang-btn" type="button" aria-label="Change language">
        <span id="lang-flag">${lang.flag}</span>
        <span id="lang-code">${lang.code.toUpperCase()}</span>
        <span id="lang-arrow">▾</span>
      </button>
      <div id="lang-menu" role="menu">
        ${LANGS.map(l => `
          <button class="lang-option ${l.code === current ? 'active' : ''}"
                  data-lang="${l.code}" type="button" role="menuitem">
            <span class="lang-option-flag">${l.flag}</span>
            <span class="lang-option-name">${l.name}</span>
            ${l.code === current ? '<span class="lang-option-check">✓</span>' : ''}
          </button>
        `).join('')}
      </div>
    `;

    document.body.appendChild(wrapper);

    // Event listeners
    const btn = document.getElementById('lang-btn');
    const menu = document.getElementById('lang-menu');
    const arrow = document.getElementById('lang-arrow');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.toggle('open');
      arrow.style.transform = isOpen ? 'rotate(180deg)' : '';
    });

    document.addEventListener('click', () => {
      menu.classList.remove('open');
      arrow.style.transform = '';
    });

    menu.addEventListener('click', (e) => e.stopPropagation());

    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const code = opt.getAttribute('data-lang');
        setLang(code);
      });
    });
  }

  // CSS embedded
  function injectStyles() {
    const css = `
      #lang-selector {
        position: fixed !important;
        top: 14px !important;
        right: 14px !important;
        z-index: 99999 !important;
        font-family: 'DM Sans', system-ui, sans-serif !important;
        visibility: visible !important;
      }
      #lang-btn {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 8px 14px;
        background: rgba(15, 45, 24, 0.92);
        border: 1px solid rgba(77, 184, 122, 0.4);
        border-radius: 22px;
        color: #f5f0e8;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.78rem;
        font-weight: 500;
        cursor: pointer;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        transition: all 0.2s;
      }
      #lang-btn:hover {
        border-color: rgba(77, 184, 122, 0.7);
        background: rgba(15, 45, 24, 0.98);
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.45);
      }
      #lang-flag { font-size: 1.05rem; line-height: 1; }
      #lang-code {
        letter-spacing: 0.05em;
        font-family: 'DM Mono', monospace;
        font-size: 0.72rem;
        color: #8fd4a8;
      }
      #lang-arrow {
        font-size: 0.7rem;
        color: rgba(245,240,232,0.5);
        transition: transform 0.2s;
        margin-left: 1px;
      }
      #lang-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 220px;
        max-height: 0;
        overflow: hidden;
        background: rgba(10, 31, 16, 0.98);
        border: 1px solid rgba(77, 184, 122, 0.25);
        border-radius: 14px;
        opacity: 0;
        transform: translateY(-8px);
        transition: all 0.25s ease;
        backdrop-filter: blur(14px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.5);
        pointer-events: none;
      }
      #lang-menu.open {
        max-height: 480px;
        opacity: 1;
        transform: translateY(0);
        pointer-events: all;
        overflow-y: auto;
      }
      .lang-option {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 11px;
        padding: 9px 14px;
        background: transparent;
        border: none;
        color: rgba(245, 240, 232, 0.78);
        font-family: 'DM Sans', sans-serif;
        font-size: 0.83rem;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s;
        border-bottom: 1px solid rgba(77, 184, 122, 0.06);
      }
      .lang-option:last-child { border-bottom: none; }
      .lang-option:hover {
        background: rgba(77, 184, 122, 0.13);
        color: #f5f0e8;
      }
      .lang-option.active {
        background: rgba(77, 184, 122, 0.12);
        color: #8fd4a8;
        font-weight: 500;
      }
      .lang-option-flag { font-size: 1.1rem; line-height: 1; flex-shrink: 0; }
      .lang-option-name { flex: 1; }
      .lang-option-check { color: #4caf78; font-weight: bold; }
      /* Hide Google's default banner if it loads */
      .skiptranslate, .goog-te-banner-frame { display: none !important; }
      body { top: 0 !important; }
      .goog-te-spinner-pos { display: none !important; }
      .goog-tooltip, .goog-tooltip:hover { display: none !important; }
      .goog-text-highlight {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      /* Hide the actual Google widget element since we use our own */
      #google_translate_element { display: none !important; }
      /* Mobile */
      @media (max-width: 480px) {
        #lang-selector { top: 10px !important; right: 10px !important; }
        #lang-btn { padding: 7px 11px; font-size: 0.72rem; }
      }
    `;
    const style = document.createElement('style');
    style.id = 'lang-selector-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Setup Google Translate (oculto, lo usamos solo para procesar la traducción)
  function setupGoogleTranslate() {
    // El div oculto que Google usa internamente
    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      document.body.appendChild(div);
    }

    // Función global que el script de Google llama al cargar
    window.googleTranslateElementInit = function() {
      new google.translate.TranslateElement({
        pageLanguage: 'es',
        includedLanguages: 'en,es,de,tl,zh-CN,zh-TW,pt,fr,it,ja,ko,ru,ar,hi',
        autoDisplay: false
      }, 'google_translate_element');
    };

    // Cargar el script de Google Translate
    if (!document.querySelector('script[src*="translate_a/element.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }

  // Init: ejecutar cuando el DOM esté listo
  function init() {
    injectStyles();
    createButton();
    setupGoogleTranslate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

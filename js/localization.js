// js/localization.js
/**
 * Localization System (Epic Seven Card Battle)
 * - Auto-detect, allow manual switch
 * - All string must use key, ex: t("menu.team")
 * - Work with all modular code, async/dynamic
 * (c) 2024
 */

let langData = {};       // Object of all text key:value
let langList = ['th', 'en']; // So far - more add as needed
let currentLang = 'th';  // Default: Thai

// Load language data from /data/lang/*.json
async function loadLang(lang) {
    if (!langList.includes(lang)) lang = 'en';
    currentLang = lang;
    langData = {};
    try {
        langData = await fetch(`data/lang/${lang}.json`).then(r => r.json());
        localStorage.setItem('user_lang', lang);
    } catch {
        langData = {};
    }
    applyLanguageToUI();
}

// Localizer function t(key) | lang(key)
function t(key, args = {}) {
    let keys = key.split('.');
    let val = langData;
    for (let k of keys) {
        val = (val || {})[k];
        if (!val) break;
    }
    if (!val) return key;
    // Replace {xxx} in text by args.xxx
    if (typeof val === 'string') {
        return val.replace(/{(\w+)}/g, (a, b) => args[b] || '');
    }
    return val;
}

// Apply language to all .trans-key UI (with data-trans="key")
function applyLanguageToUI() {
    document.querySelectorAll('[data-trans]').forEach(el => {
        el.innerHTML = t(el.getAttribute('data-trans'));
    });
}

// Add lang switcher menu/button in your UI
function renderLangMenu(containerId = "langMenu") {
    let html = `<select id="langSel" style="padding:.4em 1.4em;font-size:1em;">` +
        langList.map(code => `<option value="${code}" ${code === currentLang ? "selected" : ""}>${langName(code)}</option>`).join('') +
        `</select>`;
    (document.getElementById(containerId) || document.body).innerHTML = html;
    setTimeout(() => {
        document.getElementById('langSel').onchange = e => {
            loadLang(e.target.value);
            applyLanguageToUI();
        };
    }, 1);
}

function langName(code) {
    return {
        en: 'English',
        th: 'ไทย',
        ja: '日本語'
    }[code] || code.toUpperCase();
}

// On startup: load language (from localStorage or browser)
document.addEventListener('DOMContentLoaded', () => {
    let userLang = localStorage.getItem('user_lang') || navigator.language.substr(0,2) || 'th';
    if (!langList.includes(userLang)) userLang = 'th';
    loadLang(userLang);
    // Optional: render switcher menu somewhere (ex: footer)
    if (document.getElementById('footerLangMenu')) renderLangMenu('footerLangMenu');
});

// Expose for modules
window.t = t;
window.lang = t;
window.selectLang = loadLang;
window.applyLanguageToUI = applyLanguageToUI;
window.renderLangMenu = renderLangMenu;
import { ar } from './ar.js';
import { en } from './en.js';

const LANG_KEY = 'cs-lang';

const translations = { ar, en };
let currentLang = localStorage.getItem(LANG_KEY) || 'ar';

export function getCurrentLang() { return currentLang; }

export function t(key) {
  const parts = key.split('.');
  let obj = translations[currentLang];
  for (const p of parts) {
    if (obj == null) return key;
    obj = obj[p];
  }
  return obj ?? key;
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyLang();
}

export function applyLang() {
  const lang = currentLang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.dataset.lang = lang;

  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // Update aria-labels
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });

  // Update lang toggle buttons
  document.querySelectorAll('.lang-label').forEach(el => {
    el.textContent = lang === 'ar' ? 'EN' : 'عر';
  });

  // Update document title
  document.title = lang === 'ar' ? 'MF.COLOR — أداة الألوان الاحترافية' : 'MF.COLOR — Professional Color Tool';
}

export function toggleLang() {
  setLang(currentLang === 'ar' ? 'en' : 'ar');
}

// Initialize
applyLang();

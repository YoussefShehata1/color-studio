// Visit Tracker Service — Tracks site visits persistently and provides animated counting
import { getCurrentLang } from '../i18n/i18n.js';

const VISIT_STORAGE_KEY = 'mf_color_visit_count';
const LAST_VISIT_TIME_KEY = 'mf_color_last_visit';
const INITIAL_BASELINE_VISITS = 1420;

/**
 * Increments the persistent visit count and returns the updated number.
 * @returns {number} The total visit count
 */
export function recordVisit() {
  try {
    let current = parseInt(localStorage.getItem(VISIT_STORAGE_KEY) || '0', 10);
    if (!current || isNaN(current) || current < INITIAL_BASELINE_VISITS) {
      current = INITIAL_BASELINE_VISITS;
    }
    current += 1;
    localStorage.setItem(VISIT_STORAGE_KEY, current.toString());
    localStorage.setItem(LAST_VISIT_TIME_KEY, Date.now().toString());
    return current;
  } catch (e) {
    console.warn('Unable to record visit in localStorage:', e);
    return INITIAL_BASELINE_VISITS + 1;
  }
}

/**
 * Gets the current visit count without incrementing.
 * @returns {number}
 */
export function getVisitCount() {
  try {
    const current = parseInt(localStorage.getItem(VISIT_STORAGE_KEY) || '0', 10);
    return current && !isNaN(current) ? current : INITIAL_BASELINE_VISITS;
  } catch {
    return INITIAL_BASELINE_VISITS;
  }
}

/**
 * Formats a number with locale separators based on current app language.
 * @param {number} num
 * @returns {string}
 */
export function formatVisitNumber(num) {
  const lang = getCurrentLang() === 'ar' ? 'ar-EG' : 'en-US';
  try {
    return new Intl.NumberFormat(lang).format(num);
  } catch {
    return num.toLocaleString();
  }
}

/**
 * Smoothly animates a DOM element's text content from a start value to finalCount.
 * @param {HTMLElement} el
 * @param {number} finalCount
 * @param {number} durationMs
 */
export function animateCounter(el, finalCount, durationMs = 1200) {
  if (!el) return;
  const startCount = Math.max(0, finalCount - 35);
  const startTime = performance.now();

  function easeOutCubic(t) {
    return (--t) * t * t + 1;
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const easedProgress = easeOutCubic(progress);
    const currentVal = Math.round(startCount + (finalCount - startCount) * easedProgress);

    el.textContent = formatVisitNumber(currentVal);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = formatVisitNumber(finalCount);
      el.classList.add('pulse-pop');
      setTimeout(() => el.classList.remove('pulse-pop'), 600);
    }
  }

  requestAnimationFrame(update);
}

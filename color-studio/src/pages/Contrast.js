import { t } from '../i18n/i18n.js';
import { contrastRatio, isValidHex, normalizeHex } from '../services/colorUtils.js';
import { showNotification } from '../services/notification.js';

let state = {
  fg: '#ffffff',
  bg: '#1a1a2e',
};

export function renderContrast(container) {
  drawPage(container);
}

function drawPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('contrast.title')}</h1>
      <p class="page-subtitle">${t('contrast.subtitle')}</p>
    </div>

    <div class="contrast-layout">
      <div>
        <!-- Controls -->
        <div class="card" style="margin-bottom:var(--space-5)">
          <div class="form-group" style="margin-bottom:var(--space-4)">
            <label class="form-label" for="fgColorHex">${t('contrast.foreground')}</label>
            <div class="color-input-row">
              <input type="color" class="color-picker-thumb" id="fgColorPicker" value="${state.fg}" aria-label="${t('contrast.foreground')}">
              <input type="text" class="form-input hex-input" id="fgColorHex" value="${state.fg}" maxlength="7">
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-4)">
            <button class="btn btn-ghost btn-sm" id="swapColorsBtn" aria-label="${t('contrast.swap')}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
              ${t('contrast.swap')}
            </button>
          </div>

          <div class="form-group">
            <label class="form-label" for="bgColorHex">${t('contrast.background')}</label>
            <div class="color-input-row">
              <input type="color" class="color-picker-thumb" id="bgColorPicker" value="${state.bg}" aria-label="${t('contrast.background')}">
              <input type="text" class="form-input hex-input" id="bgColorHex" value="${state.bg}" maxlength="7">
            </div>
          </div>
        </div>

        <!-- Ratio display -->
        <div class="contrast-ratio-display">
          <div class="contrast-ratio-number" id="ratioDisplay">—</div>
          <div style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">${t('contrast.ratio')}</div>
        </div>

        <!-- WCAG Levels -->
        <div class="contrast-levels" role="list" aria-label="WCAG compliance results">
          <div class="contrast-level-card" role="listitem">
            <div class="contrast-level-label">${t('contrast.aa')} · ${t('contrast.normalText')}</div>
            <div class="contrast-level-result" id="aaNormal">—</div>
          </div>
          <div class="contrast-level-card" role="listitem">
            <div class="contrast-level-label">${t('contrast.aa')} · ${t('contrast.largeText')}</div>
            <div class="contrast-level-result" id="aaLarge">—</div>
          </div>
          <div class="contrast-level-card" role="listitem">
            <div class="contrast-level-label">${t('contrast.aaa')} · ${t('contrast.normalText')}</div>
            <div class="contrast-level-result" id="aaaNormal">—</div>
          </div>
          <div class="contrast-level-card" role="listitem">
            <div class="contrast-level-label">${t('contrast.aaa')} · ${t('contrast.largeText')}</div>
            <div class="contrast-level-result" id="aaaLarge">—</div>
          </div>
        </div>

        <p style="font-size:11px;color:var(--text-muted);margin-top:var(--space-4);line-height:1.6">${t('contrast.wcagExplain')}</p>
      </div>

      <!-- Text Preview -->
      <div class="contrast-preview-area" id="textPreviewArea">
        <div class="contrast-preview-header">
          <span style="font-size:var(--font-size-sm);font-weight:600;color:var(--text-secondary)">${t('contrast.preview')}</span>
        </div>
        <div class="contrast-preview-body" id="textPreviewBody">
          <h2 id="sampleHeading" style="margin-bottom:var(--space-3);font-size:22px;font-weight:700">${t('contrast.sampleHeading')}</h2>
          <p id="sampleBody" style="font-size:15px;line-height:1.7;margin-bottom:var(--space-4)">${t('contrast.sampleBody')}</p>
          <p id="sampleSmall" style="font-size:12px">${t('contrast.sampleSmall')}</p>
        </div>
      </div>
    </div>
  `;

  updateContrast(container);
  bindContrastEvents(container);
}

function updateContrast(container) {
  const ratio = contrastRatio(state.fg, state.bg);
  const ratioRounded = Math.round(ratio * 100) / 100;

  // Update ratio display
  const ratioEl = container.querySelector('#ratioDisplay');
  if (ratioEl) {
    ratioEl.textContent = `${ratioRounded.toFixed(2)}:1`;
    // Color the ratio
    if (ratio >= 7) ratioEl.style.color = 'var(--pass-text)';
    else if (ratio >= 4.5) ratioEl.style.color = 'var(--success)';
    else if (ratio >= 3) ratioEl.style.color = 'var(--warning)';
    else ratioEl.style.color = 'var(--fail-text)';
  }

  // WCAG compliance
  const levels = {
    aaNormal:  { required: 4.5 },
    aaLarge:   { required: 3.0 },
    aaaNormal: { required: 7.0 },
    aaaLarge:  { required: 4.5 },
  };

  Object.entries(levels).forEach(([id, { required }]) => {
    const el = container.querySelector(`#${id}`);
    if (!el) return;
    const pass = ratio >= required;
    el.innerHTML = pass
      ? `<span class="badge-pass" role="status" aria-label="${t('contrast.pass')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>${t('contrast.pass')}</span> — ${required}:1`
      : `<span class="badge-fail" role="status" aria-label="${t('contrast.fail')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>${t('contrast.fail')}</span> — ${required}:1`;
  });

  // Update preview
  const previewBody = container.querySelector('#textPreviewBody');
  if (previewBody) {
    previewBody.style.backgroundColor = state.bg;
    previewBody.style.color = state.fg;
  }
  const previewHeader = container.querySelector('#contrast-preview-header');
}

function bindContrastEvents(container) {
  const fgPicker = container.querySelector('#fgColorPicker');
  const fgHex = container.querySelector('#fgColorHex');
  const bgPicker = container.querySelector('#bgColorPicker');
  const bgHex = container.querySelector('#bgColorHex');

  function syncFg(val) {
    state.fg = val;
    fgPicker.value = val;
    fgHex.value = val.toUpperCase();
    updateContrast(container);
  }

  function syncBg(val) {
    state.bg = val;
    bgPicker.value = val;
    bgHex.value = val.toUpperCase();
    updateContrast(container);
  }

  fgPicker?.addEventListener('input', () => syncFg(fgPicker.value));
  fgHex?.addEventListener('input', () => {
    const v = fgHex.value.trim();
    if (isValidHex(v)) { syncFg(normalizeHex(v)); fgHex.classList.remove('error'); }
    else fgHex.classList.add('error');
  });

  bgPicker?.addEventListener('input', () => syncBg(bgPicker.value));
  bgHex?.addEventListener('input', () => {
    const v = bgHex.value.trim();
    if (isValidHex(v)) { syncBg(normalizeHex(v)); bgHex.classList.remove('error'); }
    else bgHex.classList.add('error');
  });

  container.querySelector('#swapColorsBtn')?.addEventListener('click', () => {
    const tmp = state.fg;
    syncFg(state.bg);
    syncBg(tmp);
  });
}

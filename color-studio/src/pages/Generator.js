import { t } from '../i18n/i18n.js';
import { generatePalette, isValidHex, normalizeHex, randomVibrantHex, getReadableTextColor } from '../services/colorUtils.js';
import { savePalette, getPaletteById } from '../services/storage.js';
import { showNotification } from '../services/notification.js';
import { renderExportPanel } from './ExportPanel.js';
import { navigate } from '../main.js';

let state = {
  palette: [],
  lockedIndices: [],
  baseColor: '#14734F',
  size: 5,
  activeEditIdx: null,
};

export function renderGenerator(container, opts = {}) {
  // Load from saved palette if provided
  if (opts.paletteId) {
    const saved = getPaletteById(opts.paletteId);
    if (saved) {
      state.palette = [...saved.colors];
      state.lockedIndices = [];
    }
  }

  if (state.palette.length === 0) {
    state.palette = generatePalette(state.baseColor, state.size, [], []);
  }

  renderLayout(container);
}

function renderLayout(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('generator.title')}</h1>
      <p class="page-subtitle">${t('generator.subtitle')}</p>
    </div>

    <div class="generator-controls card" style="padding:var(--space-5)">
      <div class="form-group">
        <label class="form-label">${t('generator.baseColor')}</label>
        <div class="color-input-row">
          <input type="color" class="color-picker-thumb" id="genBaseColorPicker" value="${state.baseColor}" aria-label="${t('generator.baseColor')}">
          <input type="text" class="form-input hex-input" id="genBaseColorHex" value="${state.baseColor}" maxlength="7" style="width:110px" aria-label="HEX value">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('generator.paletteSize')}</label>
        <select class="form-select" id="genSizeSelect" style="width:120px" aria-label="${t('generator.paletteSize')}">
          ${[3,5,6,8].map(n => `<option value="${n}" ${n===state.size?'selected':''}>${n}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-top:auto">
        <button class="btn btn-primary" id="genGenerateBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.97"/></svg>
          ${t('generator.regenerate')}
        </button>
        <button class="btn btn-secondary" id="genSaveBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          ${t('generator.savePalette')}
        </button>
        <button class="btn btn-ghost" id="genExportBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          ${t('generator.exportPalette')}
        </button>
      </div>
      <div style="align-self:flex-end">
        <span class="chip" style="font-size:11px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-inline-end:4px" aria-hidden="true"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
          ${t('generator.spaceTip')}
        </span>
      </div>
    </div>

    <div class="palette-display" id="paletteDisplay" role="list" aria-label="Color palette"></div>

    <div id="exportPanel" style="display:none"></div>
    <div id="saveModal" style="display:none" class="card" style="max-width:400px">
      <h3 class="card-title" style="margin-bottom:var(--space-4)">${t('generator.savePalette')}</h3>
      <div class="form-group" style="margin-bottom:var(--space-4)">
        <label class="form-label" for="paletteName">${t('generator.namePalette')}</label>
        <input type="text" id="paletteName" class="form-input" placeholder="${t('generator.namePlaceholder')}" maxlength="60">
        <span class="form-error" id="paletteNameError" style="display:none"></span>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-primary" id="confirmSaveBtn">${t('common.save')}</button>
        <button class="btn btn-ghost" id="cancelSaveBtn">${t('common.cancel')}</button>
      </div>
    </div>
  `;

  renderPalette();
  bindEvents(container);
}

function renderPalette() {
  const display = document.getElementById('paletteDisplay');
  if (!display) return;

  display.innerHTML = state.palette.map((hex, i) => {
    const textColor = getReadableTextColor(hex);
    const isLocked = state.lockedIndices.includes(i);
    return `
      <div class="palette-swatch" role="listitem" data-index="${i}" style="position:relative">
        <div class="palette-color-area" style="background:${hex}" data-tip="${t('generator.copyHex')}" data-copy-idx="${i}" role="button" tabindex="0" aria-label="Color ${hex}">
          ${isLocked ? `<div class="locked-indicator"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" width="11" height="11"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>` : ''}
        </div>
        <div class="palette-swatch-footer">
          <span class="palette-swatch-hex" data-copy-idx="${i}" role="button" tabindex="0" aria-label="Copy ${hex}">${hex.toUpperCase()}</span>
          <button class="swatch-lock-btn${isLocked?' is-locked':''}" data-lock-idx="${i}" title="${isLocked ? t('generator.unlock') : t('generator.lock')}" aria-label="${isLocked ? t('generator.unlock') : t('generator.lock')} color ${hex}" aria-pressed="${isLocked}">
            ${isLocked
              ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`}
          </button>
          <button class="swatch-edit-btn" data-edit-idx="${i}" title="${t('generator.edit')}" aria-label="${t('generator.edit')} color ${hex}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
        <div class="color-edit-popover" id="editPopover-${i}" style="display:none">
          <div class="form-group" style="gap:6px">
            <label class="form-label" style="font-size:11px">Edit Color</label>
            <div class="color-input-row">
              <input type="color" class="color-picker-thumb" id="editPicker-${i}" value="${hex}" style="width:32px;height:32px">
              <input type="text" class="form-input hex-input" id="editHex-${i}" value="${hex}" maxlength="7" style="font-size:12px">
            </div>
            <span class="form-error" id="editError-${i}" style="display:none;font-size:11px"></span>
            <div style="display:flex;gap:6px;margin-top:4px">
              <button class="btn btn-primary btn-sm" id="applyEdit-${i}">Apply</button>
              <button class="btn btn-ghost btn-sm" id="cancelEdit-${i}">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  bindPaletteEvents();
}

function bindPaletteEvents() {
  const display = document.getElementById('paletteDisplay');
  if (!display) return;

  // Copy
  display.querySelectorAll('[data-copy-idx]').forEach(el => {
    el.addEventListener('click', () => copyColor(parseInt(el.dataset.copyIdx)));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') copyColor(parseInt(el.dataset.copyIdx)); });
  });

  // Lock toggle
  display.querySelectorAll('[data-lock-idx]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.lockIdx);
      if (state.lockedIndices.includes(idx)) {
        state.lockedIndices = state.lockedIndices.filter(i => i !== idx);
      } else {
        state.lockedIndices.push(idx);
      }
      renderPalette();
    });
  });

  // Edit popover
  display.querySelectorAll('[data-edit-idx]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.editIdx);
      // Close others
      display.querySelectorAll('.color-edit-popover').forEach(p => p.style.display = 'none');
      const popover = document.getElementById(`editPopover-${idx}`);
      if (popover) popover.style.display = popover.style.display === 'none' ? 'block' : 'none';

      // Sync picker ↔ hex
      const picker = document.getElementById(`editPicker-${idx}`);
      const hexInput = document.getElementById(`editHex-${idx}`);
      const errEl = document.getElementById(`editError-${idx}`);

      if (picker) picker.addEventListener('input', () => {
        hexInput.value = picker.value.toUpperCase();
        errEl.style.display = 'none';
      });

      if (hexInput) hexInput.addEventListener('input', () => {
        if (isValidHex(hexInput.value)) {
          picker.value = normalizeHex(hexInput.value);
          errEl.style.display = 'none';
        }
      });

      document.getElementById(`applyEdit-${idx}`)?.addEventListener('click', () => {
        const val = hexInput.value.trim();
        if (!isValidHex(val)) {
          errEl.textContent = t('generator.invalidHex');
          errEl.style.display = 'block';
          return;
        }
        state.palette[idx] = normalizeHex(val);
        popover.style.display = 'none';
        renderPalette();
      });

      document.getElementById(`cancelEdit-${idx}`)?.addEventListener('click', () => {
        popover.style.display = 'none';
      });
    });
  });

  // Click outside closes popovers
  document.addEventListener('click', closePopovers, { once: true });
}

function closePopovers(e) {
  if (!e.target.closest('.color-edit-popover') && !e.target.closest('[data-edit-idx]')) {
    document.querySelectorAll('.color-edit-popover').forEach(p => p.style.display = 'none');
  }
}

function copyColor(idx) {
  const hex = state.palette[idx];
  if (!hex) return;
  navigator.clipboard.writeText(hex).then(() => {
    showNotification(`${t('generator.colorCopied')}: ${hex.toUpperCase()}`, 'success');
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = hex;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showNotification(`${t('generator.colorCopied')}: ${hex.toUpperCase()}`, 'success');
  });
}

function generate() {
  const lockedColors = state.lockedIndices.reduce((acc, i) => { acc[i] = state.palette[i]; return acc; }, {});
  state.palette = generatePalette(state.baseColor, state.size, state.lockedIndices, lockedColors);
  renderPalette();
}

function bindEvents(container) {
  // Base color picker
  const picker = container.querySelector('#genBaseColorPicker');
  const hexIn = container.querySelector('#genBaseColorHex');

  picker?.addEventListener('input', () => {
    state.baseColor = picker.value;
    hexIn.value = picker.value.toUpperCase();
  });

  hexIn?.addEventListener('input', () => {
    const val = hexIn.value.trim();
    if (isValidHex(val)) {
      state.baseColor = normalizeHex(val);
      picker.value = state.baseColor;
      hexIn.classList.remove('error');
    } else {
      hexIn.classList.add('error');
    }
  });

  // Size select
  container.querySelector('#genSizeSelect')?.addEventListener('change', (e) => {
    state.size = parseInt(e.target.value);
    // Keep only valid locked indices
    state.lockedIndices = state.lockedIndices.filter(i => i < state.size);
    generate();
  });

  // Generate button
  container.querySelector('#genGenerateBtn')?.addEventListener('click', generate);

  // Space to regenerate (not when typing)
  const spaceHandler = (e) => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'SELECT') {
      e.preventDefault();
      generate();
    }
  };
  document.addEventListener('keydown', spaceHandler);
  // Cleanup on page change (use one-time flag)
  container.dataset.hasSpaceListener = '1';

  // Save button
  const saveModal = container.querySelector('#saveModal');
  container.querySelector('#genSaveBtn')?.addEventListener('click', () => {
    saveModal.style.display = 'block';
    container.querySelector('#paletteName')?.focus();
  });

  container.querySelector('#cancelSaveBtn')?.addEventListener('click', () => {
    saveModal.style.display = 'none';
  });

  container.querySelector('#confirmSaveBtn')?.addEventListener('click', () => {
    const nameInput = container.querySelector('#paletteName');
    const errEl = container.querySelector('#paletteNameError');
    const name = nameInput?.value.trim();
    if (!name) {
      errEl.textContent = t('generator.paletteNameRequired');
      errEl.style.display = 'block';
      return;
    }
    savePalette({ name, colors: [...state.palette], id: crypto.randomUUID() });
    saveModal.style.display = 'none';
    showNotification(t('generator.paletteSaved'), 'success');
  });

  // Export button
  container.querySelector('#genExportBtn')?.addEventListener('click', () => {
    const panel = container.querySelector('#exportPanel');
    if (panel.style.display === 'none') {
      panel.style.display = 'block';
      renderExportPanel(panel, state.palette, 'My Palette');
      panel.scrollIntoView({ behavior: 'smooth' });
    } else {
      panel.style.display = 'none';
    }
  });
}

export function getCurrentPalette() {
  return [...state.palette];
}

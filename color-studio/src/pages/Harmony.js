import { t } from '../i18n/i18n.js';
import { generateHarmony, isValidHex, normalizeHex, getReadableTextColor } from '../services/colorUtils.js';
import { savePalette } from '../services/storage.js';
import { showNotification } from '../services/notification.js';
import { renderExportPanel } from './ExportPanel.js';

let state = {
  baseColor: '#14734F',
  type: 'analogous',
  colors: [],
};

export function renderHarmony(container) {
  state.colors = generateHarmony(state.baseColor, state.type);
  drawPage(container);
}

function drawPage(container) {
  const types = ['complementary', 'analogous', 'triadic', 'splitComplementary', 'monochromatic'];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('harmony.title')}</h1>
      <p class="page-subtitle">${t('harmony.subtitle')}</p>
    </div>

    <div class="harmony-controls card">
      <div class="form-group">
        <label class="form-label">${t('harmony.baseColor')}</label>
        <div class="color-input-row">
          <input type="color" class="color-picker-thumb" id="harmBaseColorPicker" value="${state.baseColor}" aria-label="${t('harmony.baseColor')}">
          <input type="text" class="form-input hex-input" id="harmBaseColorHex" value="${state.baseColor}" maxlength="7" style="width:110px">
        </div>
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label">${t('harmony.harmonyType')}</label>
        <div class="harmony-type-pills" role="group" aria-label="${t('harmony.harmonyType')}">
          ${types.map(type => `
            <button class="harmony-pill${type === state.type ? ' active' : ''}" data-type="${type}" role="radio" aria-checked="${type === state.type}">
              ${t('harmony.' + type)}
            </button>
          `).join('')}
        </div>
      </div>
      <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;margin-top:auto">
        <button class="btn btn-primary" id="harmGenerateBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.97"/></svg>
          ${t('harmony.generate')}
        </button>
        <button class="btn btn-secondary" id="harmSaveBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          ${t('harmony.savePalette')}
        </button>
      </div>
    </div>

    <div class="palette-display" id="harmPaletteDisplay" role="list" aria-label="Harmony palette"></div>

    <div id="harmExportPanel"></div>
  `;

  renderColors(container);
  bindHarmonyEvents(container);
}

function renderColors(container) {
  const display = container.querySelector('#harmPaletteDisplay');
  if (!display) return;

  display.innerHTML = state.colors.map((hex, i) => {
    return `
      <div class="palette-swatch" role="listitem" data-index="${i}">
        <div class="palette-color-area" style="background:${hex}" data-copy-idx="${i}" role="button" tabindex="0" aria-label="Color ${hex}" data-tip="Copy"></div>
        <div class="palette-swatch-footer">
          <span class="palette-swatch-hex" data-copy-idx="${i}" role="button" tabindex="0">${hex.toUpperCase()}</span>
        </div>
      </div>
    `;
  }).join('');

  display.querySelectorAll('[data-copy-idx]').forEach(el => {
    el.addEventListener('click', () => {
      const hex = state.colors[parseInt(el.dataset.copyIdx)];
      navigator.clipboard.writeText(hex).catch(() => {});
      showNotification(`${t('harmony.colorCopied')}: ${hex.toUpperCase()}`, 'success');
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });
}

function bindHarmonyEvents(container) {
  const picker = container.querySelector('#harmBaseColorPicker');
  const hexIn = container.querySelector('#harmBaseColorHex');

  picker?.addEventListener('input', () => {
    state.baseColor = picker.value;
    hexIn.value = picker.value.toUpperCase();
    regenerate(container);
  });

  hexIn?.addEventListener('input', () => {
    const val = hexIn.value.trim();
    if (isValidHex(val)) {
      state.baseColor = normalizeHex(val);
      picker.value = state.baseColor;
      hexIn.classList.remove('error');
      regenerate(container);
    } else {
      hexIn.classList.add('error');
    }
  });

  container.querySelectorAll('.harmony-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.type = pill.dataset.type;
      container.querySelectorAll('.harmony-pill').forEach(p => {
        p.classList.toggle('active', p === pill);
        p.setAttribute('aria-checked', p === pill ? 'true' : 'false');
      });
      regenerate(container);
    });
  });

  container.querySelector('#harmGenerateBtn')?.addEventListener('click', () => regenerate(container));

  container.querySelector('#harmSaveBtn')?.addEventListener('click', () => {
    const name = `${t('harmony.' + state.type)} ${new Date().toLocaleDateString()}`;
    savePalette({ name, colors: [...state.colors], id: crypto.randomUUID() });
    showNotification(t('generator.paletteSaved'), 'success');
    const exportPanel = container.querySelector('#harmExportPanel');
    renderExportPanel(exportPanel, state.colors, name);
  });
}

function regenerate(container) {
  state.colors = generateHarmony(state.baseColor, state.type);
  renderColors(container);
}

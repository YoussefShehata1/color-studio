import { t } from '../i18n/i18n.js';
import { isValidHex, normalizeHex } from '../services/colorUtils.js';
import { showNotification } from '../services/notification.js';
import { downloadText } from '../services/exportUtils.js';

let state = {
  type: 'linear',
  angle: 135,
  stops: [
    { color: '#063D2E', position: 0 },
    { color: '#0B513B', position: 50 },
    { color: '#14734F', position: 100 },
  ],
};

export function renderGradient(container) {
  drawPage(container);
}

function computeGradientCSS() {
  const stops = state.stops.map(s => `${s.color} ${s.position}%`).join(', ');
  if (state.type === 'linear') {
    return `linear-gradient(${state.angle}deg, ${stops})`;
  } else {
    return `radial-gradient(circle, ${stops})`;
  }
}

function computeFullCSS() {
  return `.element {\n  background: ${computeGradientCSS()};\n}`;
}

function drawPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('gradient.title')}</h1>
      <p class="page-subtitle">${t('gradient.subtitle')}</p>
    </div>

    <div class="gradient-preview-bar" id="gradientPreview" role="img" aria-label="Gradient preview"></div>

    <div class="card" style="margin-bottom:var(--space-6)">
      <div class="gradient-controls-grid">
        <div class="form-group">
          <label class="form-label" for="gradTypeSelect">${t('gradient.type')}</label>
          <select class="form-select" id="gradTypeSelect">
            <option value="linear" ${state.type==='linear'?'selected':''}>${t('gradient.linear')}</option>
            <option value="radial" ${state.type==='radial'?'selected':''}>${t('gradient.radial')}</option>
          </select>
        </div>
        <div class="form-group" id="angleGroup" style="${state.type==='radial'?'opacity:0.4;pointer-events:none':''}">
          <label class="form-label" for="gradAngle">${t('gradient.angle')}: <span id="angleVal">${state.angle}°</span></label>
          <input type="range" class="form-range" id="gradAngle" min="0" max="360" value="${state.angle}" aria-label="${t('gradient.angle')}">
        </div>
      </div>

      <div class="section-header" style="margin-bottom:var(--space-3)">
        <label class="form-label">${t('gradient.colorStop')}</label>
        <button class="btn btn-ghost btn-sm" id="addStopBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ${t('gradient.addStop')}
        </button>
      </div>

      <div class="gradient-stops" id="gradientStops"></div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${t('gradient.cssCode')}</h3>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn-primary btn-sm" id="copyCssBtn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            ${t('gradient.copy')}
          </button>
          <button class="btn btn-secondary btn-sm" id="downloadCssBtn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            ${t('gradient.download')}
          </button>
        </div>
      </div>
      <div class="gradient-css-output" id="cssOutput" aria-label="Generated CSS code"></div>
    </div>
  `;

  renderStops(container);
  updatePreview(container);
  bindGradientEvents(container);
}

function renderStops(container) {
  const stopsContainer = container.querySelector('#gradientStops');
  if (!stopsContainer) return;

  stopsContainer.innerHTML = state.stops.map((stop, i) => `
    <div class="gradient-stop-row" data-stop-idx="${i}">
      <input type="color" class="color-picker-thumb" id="stopPicker-${i}" value="${stop.color}" aria-label="Stop ${i+1} color">
      <input type="text" class="form-input hex-input" id="stopHex-${i}" value="${stop.color.toUpperCase()}" maxlength="7" style="width:110px" aria-label="Stop ${i+1} hex">
      <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;flex:1">
        <input type="range" class="form-range" id="stopPos-${i}" min="0" max="100" value="${stop.position}" aria-label="Stop ${i+1} position">
        <span style="font-size:12px;color:var(--text-muted);width:35px;font-family:var(--font-sans-en)" id="stopPosVal-${i}">${stop.position}%</span>
      </div>
      ${state.stops.length > 2 ? `
        <button class="btn btn-ghost btn-sm" data-remove-stop="${i}" aria-label="Remove stop ${i+1}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      ` : '<div style="width:32px"></div>'}
    </div>
  `).join('');

  // Bind stop events
  state.stops.forEach((_, i) => {
    const picker = container.querySelector(`#stopPicker-${i}`);
    const hexIn = container.querySelector(`#stopHex-${i}`);
    const posSlider = container.querySelector(`#stopPos-${i}`);
    const posVal = container.querySelector(`#stopPosVal-${i}`);

    picker?.addEventListener('input', () => {
      state.stops[i].color = picker.value;
      hexIn.value = picker.value.toUpperCase();
      updatePreview(container);
    });

    hexIn?.addEventListener('input', () => {
      if (isValidHex(hexIn.value)) {
        state.stops[i].color = normalizeHex(hexIn.value);
        picker.value = state.stops[i].color;
        updatePreview(container);
      }
    });

    posSlider?.addEventListener('input', () => {
      state.stops[i].position = parseInt(posSlider.value);
      posVal.textContent = posSlider.value + '%';
      updatePreview(container);
    });

    container.querySelector(`[data-remove-stop="${i}"]`)?.addEventListener('click', () => {
      state.stops.splice(i, 1);
      renderStops(container);
      updatePreview(container);
    });
  });
}

function updatePreview(container) {
  const css = computeGradientCSS();
  const preview = container.querySelector('#gradientPreview');
  if (preview) preview.style.background = css;

  const output = container.querySelector('#cssOutput');
  if (output) output.textContent = computeFullCSS();
}

function bindGradientEvents(container) {
  container.querySelector('#gradTypeSelect')?.addEventListener('change', (e) => {
    state.type = e.target.value;
    const angleGroup = container.querySelector('#angleGroup');
    if (angleGroup) {
      angleGroup.style.opacity = state.type === 'radial' ? '0.4' : '1';
      angleGroup.style.pointerEvents = state.type === 'radial' ? 'none' : '';
    }
    updatePreview(container);
  });

  container.querySelector('#gradAngle')?.addEventListener('input', (e) => {
    state.angle = parseInt(e.target.value);
    const angleVal = container.querySelector('#angleVal');
    if (angleVal) angleVal.textContent = state.angle + '°';
    updatePreview(container);
  });

  container.querySelector('#addStopBtn')?.addEventListener('click', () => {
    const lastPos = state.stops[state.stops.length - 1]?.position || 100;
    const newPos = Math.min(100, Math.round((lastPos + 100) / 2));
    state.stops.push({ color: '#a855f7', position: newPos });
    renderStops(container);
    updatePreview(container);
  });

  container.querySelector('#copyCssBtn')?.addEventListener('click', () => {
    const css = computeFullCSS();
    navigator.clipboard.writeText(css).then(() => {
      showNotification(t('gradient.copied'), 'success');
    }).catch(() => {
      showNotification(t('gradient.copied'), 'success');
    });
  });

  container.querySelector('#downloadCssBtn')?.addEventListener('click', () => {
    downloadText(computeFullCSS(), 'gradient.css');
  });
}

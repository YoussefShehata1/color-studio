import { t } from '../i18n/i18n.js';
import { getCurrentPalette } from './Generator.js';
import { contrastRatio, getReadableTextColor } from '../services/colorUtils.js';
import { showNotification } from '../services/notification.js';

let tokens = {
  primary: '#14734F',
  secondary: '#0B513B',
  accent: '#10b981',
  bgPrimary: '#04231A',
  bgSurface: '#063D2E',
  textPrimary: '#f0fbf6',
  textSecondary: '#9ecbb9',
};

export function renderPreview(container) {
  // Get current palette from generator
  const palette = getCurrentPalette();
  if (palette.length >= 5) {
    autoAssignTokens(palette);
  }

  drawPage(container, palette);
}

function autoAssignTokens(palette) {
  tokens.primary    = palette[2] || tokens.primary;
  tokens.secondary  = palette[1] || tokens.secondary;
  tokens.accent     = palette[3] || tokens.accent;
  tokens.bgPrimary  = palette[4] || tokens.bgPrimary;
  tokens.bgSurface  = lighten(palette[4] || tokens.bgPrimary, 8);
  tokens.textPrimary   = '#f0f2f8';
  tokens.textSecondary = '#8892aa';
}

function lighten(hex, amount) {
  // Simple lighten by adding to all channels
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const toHex = v => Math.min(255, v + amount).toString(16).padStart(2,'0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function drawPage(container, palette = []) {
  const tokenNames = ['primary','secondary','accent','bgPrimary','bgSurface','textPrimary','textSecondary'];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('preview.title')}</h1>
      <p class="page-subtitle">${t('preview.subtitle')}</p>
    </div>

    <div class="preview-layout">
      <!-- Token Panel -->
      <div class="preview-token-panel">
        <div class="section-header" style="margin-bottom:var(--space-4)">
          <h3 class="card-title">${t('preview.tokens')}</h3>
          <button class="btn btn-ghost btn-sm" id="autoAssignBtn">${t('preview.autoAssign')}</button>
        </div>
        <div id="tokenList">
          ${tokenNames.map(name => `
            <div class="token-row" data-token="${name}">
              <input type="color" class="token-color-dot" id="tokenPicker-${name}" value="${tokens[name]}" aria-label="${t('preview.' + name.replace(/([A-Z])/g, ' $1').toLowerCase())}">
              <div class="token-info">
                <div class="token-name">${t('preview.' + name)}</div>
                <div class="token-hex" id="tokenHexLabel-${name}">${tokens[name].toUpperCase()}</div>
              </div>
              ${palette.length > 0 ? `
                <select class="token-select" id="tokenSelect-${name}" aria-label="Assign palette color">
                  <option value="">Custom</option>
                  ${palette.map((c, i) => `<option value="${c}" ${tokens[name] === c ? 'selected' : ''}>${i+1}: ${c.toUpperCase()}</option>`).join('')}
                </select>
              ` : ''}
            </div>
          `).join('')}
        </div>
        <div id="contrastWarning" style="display:none;margin-top:var(--space-3);padding:var(--space-3);background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-md);font-size:11px;color:var(--warning)">
          ⚠ ${t('preview.contrastWarn')}
        </div>
      </div>

      <!-- Mockup -->
      <div>
        <div class="mockup-wrapper" id="uiMockup"></div>
      </div>
    </div>
  `;

  renderMockup(container);
  bindPreviewEvents(container, palette);
}

function renderMockup(container) {
  const mockup = container.querySelector('#uiMockup');
  if (!mockup) return;

  const t_ = tokens;
  const sidebar_text = getReadableTextColor(t_.secondary);
  const main_text = getReadableTextColor(t_.bgPrimary);

  // Check contrast
  const textBgContrast = contrastRatio(t_.textPrimary, t_.bgSurface);
  const warnEl = container.querySelector('#contrastWarning');
  if (warnEl) warnEl.style.display = textBgContrast < 3 ? 'block' : 'none';

  mockup.innerHTML = `
    <div class="mockup-app" style="font-family:'Inter',sans-serif">
      <!-- Sidebar -->
      <div class="mockup-sidebar" style="background:${t_.secondary};color:${getReadableTextColor(t_.secondary)}">
        <div class="mockup-logo" style="background:${t_.primary};color:${getReadableTextColor(t_.primary)}">
          ● MF.COLOR
        </div>
        ${['Dashboard', 'Analytics', 'Projects', 'Team', 'Settings'].map((item, i) => `
          <div class="mockup-nav-item" style="background:${i===0 ? t_.primary : 'transparent'};color:${i===0 ? getReadableTextColor(t_.primary) : getReadableTextColor(t_.secondary)};opacity:${i===0?1:0.75}">
            ${item}
          </div>
        `).join('')}
        <div style="flex:1"></div>
        <div style="padding:8px;font-size:11px;opacity:0.6">v2.0.0</div>
      </div>

      <!-- Main Content -->
      <div class="mockup-main" style="background:${t_.bgPrimary}">
        <div class="mockup-header">
          <div class="mockup-page-title" style="color:${t_.textPrimary}">Dashboard</div>
          <div style="display:flex;gap:8px;align-items:center">
            <div style="width:28px;height:28px;border-radius:50%;background:${t_.accent}"></div>
            <button class="mockup-btn" style="background:${t_.primary};color:${getReadableTextColor(t_.primary)}">+ New</button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="mockup-cards">
          ${[
            { label: 'Revenue', value: '$48.2K', pct: '75%' },
            { label: 'Users', value: '1,284', pct: '60%' },
            { label: 'Projects', value: '36', pct: '45%' },
          ].map((card, i) => `
            <div class="mockup-card" style="background:${t_.bgSurface};color:${t_.textPrimary}">
              <div class="mockup-card-value">${card.value}</div>
              <div class="mockup-card-label" style="color:${t_.textSecondary}">${card.label}</div>
              <div class="mockup-chart-bar" style="background:${t_.primary};width:${card.pct}"></div>
            </div>
          `).join('')}
        </div>

        <!-- Table + Activity -->
        <div class="mockup-content-row">
          <div class="mockup-table" style="background:${t_.bgSurface};color:${t_.textPrimary}">
            <div style="font-size:12px;font-weight:700;margin-bottom:8px">Recent Projects</div>
            ${['Website Redesign', 'Brand Identity', 'Mobile App'].map(name => `
              <div class="mockup-table-row">
                <span>${name}</span>
                <span class="mockup-badge" style="background:${t_.primary}22;color:${t_.primary}">Active</span>
              </div>
            `).join('')}
          </div>
          <div class="mockup-activity" style="background:${t_.bgSurface};color:${t_.textPrimary}">
            <div style="font-size:12px;font-weight:700;margin-bottom:8px">Activity</div>
            ${['Deployed', 'Updated', 'Reviewed'].map((act, i) => `
              <div class="mockup-activity-item">
                <div class="mockup-dot" style="background:${[t_.primary, t_.accent, t_.secondary][i]}"></div>
                <span style="font-size:11px;color:${t_.textSecondary}">${act}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindPreviewEvents(container, palette) {
  // Auto-assign button
  container.querySelector('#autoAssignBtn')?.addEventListener('click', () => {
    autoAssignTokens(palette);
    // Re-render token pickers
    Object.keys(tokens).forEach(name => {
      const picker = container.querySelector(`#tokenPicker-${name}`);
      const label = container.querySelector(`#tokenHexLabel-${name}`);
      if (picker) picker.value = tokens[name];
      if (label) label.textContent = tokens[name].toUpperCase();
    });
    renderMockup(container);
  });

  // Token color pickers
  Object.keys(tokens).forEach(name => {
    const picker = container.querySelector(`#tokenPicker-${name}`);
    picker?.addEventListener('input', () => {
      tokens[name] = picker.value;
      const label = container.querySelector(`#tokenHexLabel-${name}`);
      if (label) label.textContent = picker.value.toUpperCase();
      renderMockup(container);
    });

    const select = container.querySelector(`#tokenSelect-${name}`);
    select?.addEventListener('change', () => {
      if (select.value) {
        tokens[name] = select.value;
        const picker2 = container.querySelector(`#tokenPicker-${name}`);
        const label = container.querySelector(`#tokenHexLabel-${name}`);
        if (picker2) picker2.value = select.value;
        if (label) label.textContent = select.value.toUpperCase();
        renderMockup(container);
      }
    });
  });
}

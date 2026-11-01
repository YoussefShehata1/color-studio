import { t } from '../i18n/i18n.js';
import { generateExport, downloadText, exportPng } from '../services/exportUtils.js';
import { showNotification } from '../services/notification.js';

export function renderExportPanel(container, palette, name = 'My Palette') {
  if (!palette || palette.length === 0) {
    container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">${t('export.noPalette')}</p></div>`;
    return;
  }

  const formats = ['hex', 'rgb', 'hsl', 'css', 'json', 'tailwind', 'png'];
  let activeFormat = 'css';

  function getContent() {
    if (activeFormat === 'png') return '/* Click Download to export PNG image */';
    return generateExport(palette, activeFormat, name);
  }

  function render() {
    container.innerHTML = `
      <div class="card" style="margin-top:var(--space-6)">
        <div class="card-header">
          <h3 class="card-title">${t('export.title')}</h3>
        </div>
        <div class="export-format-tabs" role="tablist">
          ${formats.map(f => `
            <button class="export-tab${f === activeFormat ? ' active' : ''}" data-format="${f}" role="tab" aria-selected="${f === activeFormat}" aria-label="${t('export.' + f)}">
              ${t('export.' + f)}
            </button>
          `).join('')}
        </div>
        <div class="export-code-block" id="exportCodeBlock" role="tabpanel">${escapeHtml(getContent())}</div>
        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4);flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" id="exportCopyBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            ${t('export.copy')}
          </button>
          <button class="btn btn-secondary btn-sm" id="exportDownloadBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            ${t('export.download')}
          </button>
        </div>
      </div>
    `;

    // Tab switching
    container.querySelectorAll('.export-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeFormat = tab.dataset.format;
        render();
      });
    });

    // Copy
    container.querySelector('#exportCopyBtn')?.addEventListener('click', () => {
      if (activeFormat === 'png') {
        showNotification(t('export.noPalette'), 'error');
        return;
      }
      const content = getContent();
      navigator.clipboard.writeText(content).then(() => {
        showNotification(t('export.copied'), 'success');
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = content;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showNotification(t('export.copied'), 'success');
      });
    });

    // Download
    container.querySelector('#exportDownloadBtn')?.addEventListener('click', () => {
      if (activeFormat === 'png') {
        exportPng(palette, name);
        return;
      }
      const content = getContent();
      const ext = { hex: 'txt', rgb: 'txt', hsl: 'txt', css: 'css', json: 'json', tailwind: 'js' }[activeFormat] || 'txt';
      downloadText(content, `palette-${activeFormat}.${ext}`);
    });
  }

  render();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

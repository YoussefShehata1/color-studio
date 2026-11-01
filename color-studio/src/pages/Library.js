import { t } from '../i18n/i18n.js';
import { getAllPalettes, deletePalette, renamePalette, toggleFavorite, exportBackup, importBackup } from '../services/storage.js';
import { showNotification } from '../services/notification.js';
import { navigate } from '../main.js';
import { renderExportPanel } from './ExportPanel.js';

let filterMode = 'all'; // 'all' | 'favorites'
let searchQuery = '';

export function renderLibrary(container) {
  drawPage(container);
}

function drawPage(container) {
  const allPalettes = getAllPalettes();
  let palettes = allPalettes
    .filter(p => filterMode === 'favorites' ? p.favorite : true)
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('library.title')}</h1>
      <p class="page-subtitle">${t('library.subtitle')}</p>
    </div>

    <div class="library-toolbar">
      <div class="library-search form-group" style="flex:1;margin-bottom:0">
        <div style="position:relative">
          <svg style="position:absolute;inset-inline-start:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-muted)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" class="form-input" id="librarySearch" placeholder="${t('library.search')}" value="${searchQuery}" style="padding-inline-start:38px" aria-label="${t('library.search')}">
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2)">
        <button class="harmony-pill${filterMode==='all'?' active':''}" id="filterAll" role="radio" aria-checked="${filterMode==='all'}">${t('library.filterAll')}</button>
        <button class="harmony-pill${filterMode==='favorites'?' active':''}" id="filterFavorites" role="radio" aria-checked="${filterMode==='favorites'}">
          ★ ${t('library.filterFavorites')}
        </button>
      </div>
      <button class="btn btn-secondary btn-sm" id="exportBackupBtn">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        ${t('library.export')}
      </button>
      <label class="btn btn-ghost btn-sm" style="cursor:pointer">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        ${t('library.import')}
        <input type="file" id="importFileInput" accept=".json" style="display:none" aria-label="${t('library.import')}">
      </label>
    </div>

    <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-5)">
      <span class="chip">${allPalettes.length} ${t('library.count')}</span>
      <p style="font-size:11px;color:var(--text-muted)">${t('library.storageNote')}</p>
    </div>

    ${palettes.length === 0 ? `
      <div class="empty-state" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg)">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <div class="empty-state-title">${t('library.emptyTitle')}</div>
        <div class="empty-state-desc">${t('library.emptyDesc')}</div>
        <button class="btn btn-primary btn-sm" id="goGeneratorBtn">${t('dashboard.createFirst')}</button>
      </div>
    ` : `
      <div class="palette-library-grid" id="libraryGrid">
        ${palettes.map(p => renderPaletteCard(p)).join('')}
      </div>
    `}

    <div id="exportPanelContainer" style="margin-top:var(--space-6)"></div>
  `;

  bindLibraryEvents(container);
}

function renderPaletteCard(p) {
  return `
    <div class="library-palette-card" data-palette-id="${p.id}">
      <div class="library-palette-swatches" role="img" aria-label="Palette colors">
        ${p.colors.map(c => `<div class="library-palette-swatch" style="background:${c}" title="${c}"></div>`).join('')}
      </div>
      <div class="library-palette-info">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div class="library-palette-name" id="palName-${p.id}">${escapeHtml(p.name)}</div>
          <button class="swatch-btn" data-favorite="${p.id}" style="width:28px;height:28px" aria-label="${p.favorite ? t('library.unfavorite') : t('library.favorite')}" aria-pressed="${p.favorite}">
            <svg viewBox="0 0 24 24" fill="${p.favorite ? 'var(--warning)' : 'none'}" stroke="var(--warning)" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        </div>
        <div class="library-palette-meta">${p.colors.length} ${t('library.colors')} · ${formatDate(p.createdAt)}</div>
        <div class="library-palette-actions">
          <button class="btn btn-sm btn-primary" data-open="${p.id}">${t('library.open')}</button>
          <button class="btn btn-sm btn-secondary" data-export-palette="${p.id}">${t('common.copy')}</button>
          <button class="btn btn-sm btn-ghost" data-rename="${p.id}">${t('library.rename')}</button>
          <button class="btn btn-sm btn-danger" data-delete="${p.id}">${t('library.delete')}</button>
        </div>
      </div>
    </div>
  `;
}

function bindLibraryEvents(container) {
  // Search
  container.querySelector('#librarySearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    drawPage(container);
  });

  // Filter buttons
  container.querySelector('#filterAll')?.addEventListener('click', () => { filterMode = 'all'; drawPage(container); });
  container.querySelector('#filterFavorites')?.addEventListener('click', () => { filterMode = 'favorites'; drawPage(container); });

  // Go to generator
  container.querySelector('#goGeneratorBtn')?.addEventListener('click', () => navigate('generator'));

  // Export backup
  container.querySelector('#exportBackupBtn')?.addEventListener('click', () => {
    exportBackup();
    showNotification(t('library.exportSuccess'), 'success');
  });

  // Import
  container.querySelector('#importFileInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importBackup(text);
      if (imported === -1) {
        showNotification(t('library.importError'), 'error');
      } else {
        showNotification(`${t('library.importSuccess')}: ${imported}`, 'success');
        drawPage(container);
      }
    } catch {
      showNotification(t('library.importError'), 'error');
    }
    e.target.value = '';
  });

  // Palette actions (event delegation)
  const grid = container.querySelector('#libraryGrid');
  if (!grid) return;

  grid.addEventListener('click', (e) => {
    const target = e.target.closest('[data-open],[data-rename],[data-delete],[data-favorite],[data-export-palette]');
    if (!target) return;

    if (target.dataset.open) {
      navigate('generator', { paletteId: target.dataset.open });
    } else if (target.dataset.favorite) {
      const isFav = toggleFavorite(target.dataset.favorite);
      showNotification(isFav ? t('library.favorite') : t('library.unfavorite'), 'success');
      drawPage(container);
    } else if (target.dataset.rename) {
      const id = target.dataset.rename;
      const card = container.querySelector(`[data-palette-id="${id}"]`);
      const nameEl = card?.querySelector(`#palName-${id}`);
      if (!nameEl) return;
      const currentName = nameEl.textContent;
      const newName = prompt(t('library.newName'), currentName);
      if (newName && newName.trim() !== currentName) {
        renamePalette(id, newName.trim());
        showNotification(t('library.renamed'), 'success');
        drawPage(container);
      }
    } else if (target.dataset.delete) {
      const id = target.dataset.delete;
      if (confirm(t('library.deleteConfirm'))) {
        deletePalette(id);
        showNotification(t('library.deleted'), 'success');
        drawPage(container);
      }
    } else if (target.dataset.exportPalette) {
      const id = target.dataset.exportPalette;
      const palettes = getAllPalettes();
      const p = palettes.find(x => x.id === id);
      if (p) {
        const exportContainer = container.querySelector('#exportPanelContainer');
        renderExportPanel(exportContainer, p.colors, p.name);
        exportContainer.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(ts) {
  if (!ts) return '';
  try { return new Date(ts).toLocaleDateString(); } catch { return ''; }
}

import { t } from '../i18n/i18n.js';
import { getAllPalettes } from '../services/storage.js';
import { navigate } from '../main.js';
import { recordVisit, formatVisitNumber, animateCounter } from '../services/visitTracker.js';

export function renderDashboard(container) {
  const visitCount = recordVisit();
  const recent = getAllPalettes().slice(0, 4);
  const tools = [
    { page: 'generator', icon: generatorIcon(), colorClass: 'emerald'   },
    { page: 'harmony',   icon: harmonyIcon(),   colorClass: 'blue'      },
    { page: 'extractor', icon: extractorIcon(), colorClass: 'green'     },
    { page: 'contrast',  icon: contrastIcon(),  colorClass: 'orange'    },
    { page: 'gradient',  icon: gradientIcon(),  colorClass: 'teal'      },
    { page: 'preview',   icon: previewIcon(),   colorClass: 'cyan'      },
    { page: 'library',   icon: libraryIcon(),   colorClass: 'deepgreen' },
  ];

  const iconBgColors = {
    emerald: 'rgba(20,115,79,0.22)', blue: 'rgba(59,130,246,0.15)',
    green: 'rgba(34,197,94,0.15)', orange: 'rgba(249,115,22,0.15)',
    teal: 'rgba(20,184,166,0.15)', cyan: 'rgba(6,182,212,0.15)',
    deepgreen: 'rgba(16,185,129,0.2)',
  };
  const iconFgColors = {
    emerald: '#14734F', blue: '#3b82f6', green: '#22c55e',
    orange: '#f97316', teal: '#14b8a6', cyan: '#06b6d4', deepgreen: '#10b981',
  };

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title" style="display:none">Dashboard</h1>
    </div>

    <section class="dashboard-hero">
      <div class="hero-top-bar">
        <div class="visit-counter-badge" id="visitCounterBadge" role="status" aria-label="${t('dashboard.totalVisits')}">
          <span class="live-dot-wrap" aria-hidden="true">
            <span class="live-dot-pulse"></span>
            <span class="live-dot"></span>
          </span>
          <span class="visit-counter-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </span>
          <span class="visit-counter-label">${t('dashboard.totalVisits')}</span>
          <span class="visit-counter-divider"></span>
          <span class="visit-counter-number" id="visitCounterNumber">${formatVisitNumber(visitCount)}</span>
          <span class="visit-counter-suffix">${t('dashboard.visitsSuffix')}</span>
        </div>
        <div class="hero-features-chips">
          <span class="chip-feature">${t('dashboard.featureInstant')}</span>
          <span class="chip-feature">${t('dashboard.featureAi')}</span>
          <span class="chip-feature">${t('dashboard.featureFree')}</span>
        </div>
      </div>

      <div class="hero-main-layout">
        <div class="hero-content">
          <h1 class="hero-title">
            ${t('dashboard.heroTitle')}<span class="hero-gradient-text">${t('dashboard.heroTitleAccent')}</span>
          </h1>
          <p class="hero-subtitle">${t('dashboard.heroSubtitle')}</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg" id="heroStartBtn" data-page="generator">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              ${t('dashboard.startBtn')}
            </button>
            <button class="btn btn-ghost btn-lg" id="heroExploreBtn">
              ${t('dashboard.exploreBtn')}
            </button>
          </div>
        </div>

        <div class="hero-avatar-showcase">
          <div class="avatar-glow-ambient" aria-hidden="true"></div>
          <div class="avatar-interactive-container" id="creatorContainer">
            <div class="floating-badge badge-top">
              <span class="badge-icon">✨</span>
              <span class="badge-text">${t('dashboard.creatorBadge')}</span>
            </div>
            <div class="creator-image-card">
              <img src="./creator.png" alt="MO.FARID" class="creator-cutout-img" id="creatorCutoutImg" loading="eager" fetchpriority="high" decoding="sync" />
              <div class="card-glass-sheen" aria-hidden="true"></div>
            </div>
            <div class="floating-badge badge-bottom">
              <span class="badge-pulse-dot"></span>
              <span class="badge-text">${t('dashboard.creatorRole')}</span>
            </div>
            <div class="avatar-ground-shadow" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-section" style="margin-bottom:var(--space-8)">
      <div class="section-header">
        <h2 class="section-title">${t('dashboard.tools')}</h2>
      </div>
      <div class="tool-grid">
        ${tools.map(tool => `
          <button class="tool-card" data-page="${tool.page}" aria-label="${t('tools.' + tool.page)}">
            <div class="tool-icon" style="background:${iconBgColors[tool.colorClass]}; color:${iconFgColors[tool.colorClass]}">
              ${tool.icon}
            </div>
            <div class="tool-card-title">${t('tools.' + tool.page)}</div>
            <div class="tool-card-desc">${t('tools.' + tool.page + 'Desc')}</div>
          </button>
        `).join('')}
      </div>
    </section>

    <section class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">${t('dashboard.recentPalettes')}</h2>
        ${recent.length > 0 ? `<button class="btn btn-ghost btn-sm" data-page="library">${t('dashboard.viewAll')}</button>` : ''}
      </div>
      ${recent.length === 0 ? `
        <div class="empty-state" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg)">
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <div class="empty-state-title">${t('dashboard.emptyTitle')}</div>
          <div class="empty-state-desc">${t('dashboard.emptyDesc')}</div>
          <button class="btn btn-primary btn-sm" data-page="generator">${t('dashboard.createFirst')}</button>
        </div>
      ` : `
        <div class="palette-library-grid">
          ${recent.map(p => `
            <div class="library-palette-card" data-palette-id="${p.id}" style="cursor:pointer">
              <div class="library-palette-swatches">
                ${p.colors.map(c => `<div class="library-palette-swatch" style="background:${c}"></div>`).join('')}
              </div>
              <div class="library-palette-info">
                <div class="library-palette-name">${escapeHtml(p.name)}</div>
                <div class="library-palette-meta">${p.colors.length} ${t('library.colors')} · ${formatDate(p.createdAt)}</div>
                <div class="library-palette-actions">
                  <button class="btn btn-sm btn-secondary" data-open-palette="${p.id}">${t('library.open')}</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </section>
  `;

  // Wire up navigation
  container.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      const page = el.dataset.page;
      if (page) navigate(page);
    });
  });

  // Open palette buttons
  container.querySelectorAll('[data-open-palette]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.openPalette;
      navigate('generator', { paletteId: id });
    });
  });

  // Scroll to tools
  container.querySelector('#heroExploreBtn')?.addEventListener('click', () => {
    container.querySelector('.dashboard-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Animate visit counter with smooth counting up
  const counterEl = container.querySelector('#visitCounterNumber');
  if (counterEl) {
    animateCounter(counterEl, visitCount, 1300);
  }

  // Interactive 3D tilt & hover response on creator showcase
  const heroSection = container.querySelector('.dashboard-hero');
  const avatarContainer = container.querySelector('#creatorContainer');
  if (heroSection && avatarContainer) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = avatarContainer.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);
      const rotateY = Math.max(-14, Math.min(14, deltaX * 10));
      const rotateX = Math.max(-14, Math.min(14, -deltaY * 10));
      avatarContainer.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`;
    });

    heroSection.addEventListener('mouseleave', () => {
      avatarContainer.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleDateString();
  } catch { return ''; }
}

// SVG Icons
function generatorIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>`;
}
function harmonyIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
}
function extractorIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
}
function contrastIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20V2z" fill="currentColor" opacity="0.3"/></svg>`;
}
function gradientIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="10" rx="2"/><line x1="3" y1="12" x2="21" y2="12" opacity="0.4"/></svg>`;
}
function previewIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
}
function libraryIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
}

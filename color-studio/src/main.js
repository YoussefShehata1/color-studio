// MF.COLOR — Main Entry Point
import { applyLang, toggleLang, getCurrentLang } from './i18n/i18n.js';
import { getPrefs, setPrefs } from './services/storage.js';
import { showNotification } from './services/notification.js';

// Page imports (lazy-ish via dynamic approach but kept simple)
import { renderDashboard } from './pages/Dashboard.js';
import { renderGenerator } from './pages/Generator.js';
import { renderHarmony } from './pages/Harmony.js';
import { renderExtractor } from './pages/Extractor.js';
import { renderContrast } from './pages/Contrast.js';
import { renderGradient } from './pages/Gradient.js';
import { renderPreview } from './pages/Preview.js';
import { renderLibrary } from './pages/Library.js';

// ============================================================
// State
// ============================================================

let currentPage = 'dashboard';
let currentPageOpts = {};

const pageRenderers = {
  dashboard: renderDashboard,
  generator: renderGenerator,
  harmony:   renderHarmony,
  extractor: renderExtractor,
  contrast:  renderContrast,
  gradient:  renderGradient,
  preview:   renderPreview,
  library:   renderLibrary,
};

// ============================================================
// Navigation
// ============================================================

export function navigate(page, opts = {}) {
  if (!pageRenderers[page]) return;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
    item.setAttribute('aria-current', item.dataset.page === page ? 'page' : 'false');
  });

  currentPage = page;
  currentPageOpts = opts;

  // Close mobile sidebar
  closeMobileSidebar();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  const main = document.getElementById('main-content');
  if (!main) return;

  // Clear and render
  main.innerHTML = '';
  try {
    pageRenderers[page](main, opts);
  } catch (err) {
    console.error(`Error rendering page ${page}:`, err);
    main.innerHTML = `<div class="card" style="color:var(--error)">
      <h2>Error loading page</h2>
      <p style="margin-top:8px;font-size:13px">${err.message}</p>
    </div>`;
  }

  // Re-apply i18n for newly rendered content
  applyLang();
}

// ============================================================
// Theme
// ============================================================

function applyTheme(theme) {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  document.body.classList.toggle('theme-light', theme === 'light');
  setPrefs({ theme });
}

function toggleTheme() {
  const isDark = document.body.classList.contains('theme-dark');
  applyTheme(isDark ? 'light' : 'dark');
}

// ============================================================
// Mobile Sidebar
// ============================================================

function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  const toggle = document.getElementById('menuToggle');
  sidebar?.classList.add('open');
  overlay?.classList.add('open');
  toggle?.setAttribute('aria-expanded', 'true');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  const toggle = document.getElementById('menuToggle');
  sidebar?.classList.remove('open');
  overlay?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}

// ============================================================
// App Init
// ============================================================

function init() {
  // Restore theme
  const prefs = getPrefs();
  applyTheme(prefs.theme || 'dark');

  // Apply language
  applyLang();

  // Theme toggle buttons
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('mobileThemeToggle')?.addEventListener('click', toggleTheme);

  // Language toggle buttons
  const handleLangToggle = () => {
    toggleLang();
    navigate(currentPage, currentPageOpts);
  };
  document.getElementById('langToggle')?.addEventListener('click', handleLangToggle);
  document.getElementById('mobileLangToggle')?.addEventListener('click', handleLangToggle);

  // Sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) navigate(page);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) navigate(page);
      }
    });
  });

  // Mobile menu toggle
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar?.classList.contains('open')) {
      closeMobileSidebar();
    } else {
      openMobileSidebar();
    }
  });

  document.getElementById('mobileOverlay')?.addEventListener('click', closeMobileSidebar);

  // Keyboard navigation: Escape closes mobile sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileSidebar();
  });

  // Check for injected palette (from extractor "Use in Generator")
  const injected = sessionStorage.getItem('cs-inject-palette');
  if (injected) {
    sessionStorage.removeItem('cs-inject-palette');
    navigate('generator', { injectedPalette: JSON.parse(injected) });
    return;
  }

  // Render initial page
  navigate('dashboard');
}

// Start app
init();

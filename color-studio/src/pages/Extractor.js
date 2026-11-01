import { t } from '../i18n/i18n.js';
import { rgbToHex, colorDistance } from '../services/colorUtils.js';
import { savePalette } from '../services/storage.js';
import { showNotification } from '../services/notification.js';
import { navigate } from '../main.js';

let currentObjectUrl = null;

export function renderExtractor(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('extractor.title')}</h1>
      <p class="page-subtitle">${t('extractor.subtitle')}</p>
    </div>

    <div class="form-group" style="flex-direction:row;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4)">
      <label class="form-label" for="colorCountSelect">${t('extractor.colorCount')}:</label>
      <select class="form-select" id="colorCountSelect" style="width:90px">
        ${[5,6,8,10,12].map(n => `<option value="${n}" ${n===8?'selected':''}>${n}</option>`).join('')}
      </select>
    </div>

    <div class="upload-zone" id="uploadZone" tabindex="0" role="button" aria-label="${t('extractor.uploadTitle')}">
      <input type="file" id="imageFileInput" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Upload image">
      <div class="upload-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <div class="upload-title">${t('extractor.uploadTitle')}</div>
      <div class="upload-hint">${t('extractor.uploadHint')}</div>
    </div>

    <div id="processingIndicator" style="display:none;text-align:center;padding:var(--space-6);color:var(--text-secondary)">
      <div style="font-size:var(--font-size-sm)">${t('extractor.processing')}</div>
    </div>

    <div id="extractionResults" style="display:none">
      <div class="extractor-layout">
        <div>
          <div class="card-header" style="margin-bottom:var(--space-3)">
            <h3 class="card-title">Preview</h3>
            <button class="btn btn-ghost btn-sm" id="changeImageBtn">${t('extractor.changeImage')}</button>
          </div>
          <div class="image-preview-container" id="imagePreviewContainer">
            <img id="imagePreview" alt="Uploaded image">
          </div>
        </div>
        <div>
          <div class="card-header" style="margin-bottom:var(--space-4)">
            <h3 class="card-title">${t('extractor.extractedColors')}</h3>
            <div style="display:flex;gap:var(--space-2)">
              <button class="btn btn-primary btn-sm" id="saveExtractedBtn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/></svg>
                ${t('extractor.savePalette')}
              </button>
              <button class="btn btn-secondary btn-sm" id="useInGeneratorBtn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                ${t('extractor.useInGenerator')}
              </button>
            </div>
          </div>
          <div class="palette-display" id="extractedPaletteDisplay" style="min-height:160px;flex-wrap:wrap" role="list"></div>
        </div>
      </div>
    </div>

    <p id="extractError" style="display:none;color:var(--error);font-size:var(--font-size-sm);padding:var(--space-4)"></p>
  `;

  bindExtractorEvents(container);
}

function bindExtractorEvents(container) {
  const fileInput = container.querySelector('#imageFileInput');
  const uploadZone = container.querySelector('#uploadZone');

  // File input change
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file, container);
  });

  // Drag & drop
  uploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));

  uploadZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, container);
  });

  uploadZone?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput?.click(); }
  });

  container.querySelector('#changeImageBtn')?.addEventListener('click', () => {
    container.querySelector('#extractionResults').style.display = 'none';
    container.querySelector('#uploadZone').style.display = 'block';
    revokeUrl();
    fileInput.value = '';
  });
}

async function handleFile(file, container) {
  // Validate
  const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    showError(container, t('extractor.errorInvalid'));
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showError(container, t('extractor.errorLarge'));
    return;
  }

  hideError(container);
  container.querySelector('#uploadZone').style.display = 'none';
  container.querySelector('#processingIndicator').style.display = 'block';
  container.querySelector('#extractionResults').style.display = 'none';

  revokeUrl();
  currentObjectUrl = URL.createObjectURL(file);

  try {
    const colors = await extractColors(currentObjectUrl, parseInt(container.querySelector('#colorCountSelect')?.value || '8'));
    container.querySelector('#processingIndicator').style.display = 'none';
    container.querySelector('#extractionResults').style.display = 'block';

    const imgEl = container.querySelector('#imagePreview');
    imgEl.src = currentObjectUrl;
    imgEl.alt = file.name;

    renderExtractedColors(container, colors);
  } catch (err) {
    container.querySelector('#processingIndicator').style.display = 'none';
    container.querySelector('#uploadZone').style.display = 'block';
    showError(container, t('extractor.errorExtract'));
    revokeUrl();
  }
}

function extractColors(src, count = 8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Downscale for performance
        const maxDim = 200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample pixels
        const pixels = [];
        const step = Math.max(1, Math.floor(data.length / (4 * 2000)));
        for (let i = 0; i < data.length; i += 4 * step) {
          const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
          if (a < 128) continue; // Skip transparent
          // Skip near-white and near-black
          const brightness = (r + g + b) / 3;
          if (brightness > 245 || brightness < 10) continue;
          pixels.push([r, g, b]);
        }

        if (pixels.length === 0) { resolve([]); return; }

        // Simple k-means clustering
        const clusters = kMeans(pixels, count);
        const hexColors = clusters.map(([r, g, b]) => rgbToHex(r, g, b));

        // Deduplicate similar colors
        const deduped = deduplicateColors(hexColors, 30);
        resolve(deduped.slice(0, count));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = src;
  });
}

function kMeans(pixels, k, iterations = 15) {
  if (pixels.length < k) k = pixels.length;

  // Initialize centroids randomly
  let centroids = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[Math.min(i * step, pixels.length - 1)]]);
  }

  for (let iter = 0; iter < iterations; iter++) {
    const clusters = Array.from({ length: k }, () => []);

    // Assign pixels to nearest centroid
    for (const px of pixels) {
      let minDist = Infinity, nearest = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = dist3(px, centroids[c]);
        if (d < minDist) { minDist = d; nearest = c; }
      }
      clusters[nearest].push(px);
    }

    // Update centroids
    let changed = false;
    for (let c = 0; c < k; c++) {
      if (clusters[c].length === 0) continue;
      const mean = [0, 0, 0];
      for (const px of clusters[c]) { mean[0] += px[0]; mean[1] += px[1]; mean[2] += px[2]; }
      const n = clusters[c].length;
      const newCentroid = [Math.round(mean[0]/n), Math.round(mean[1]/n), Math.round(mean[2]/n)];
      if (newCentroid.some((v, i) => v !== centroids[c][i])) changed = true;
      centroids[c] = newCentroid;
    }
    if (!changed) break;
  }

  return centroids;
}

function dist3(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

function deduplicateColors(hexColors, threshold) {
  const result = [];
  for (const hex of hexColors) {
    if (!result.some(existing => colorDistance(existing, hex) < threshold)) {
      result.push(hex);
    }
  }
  return result;
}

function renderExtractedColors(container, colors) {
  const display = container.querySelector('#extractedPaletteDisplay');
  if (!display) return;

  display.innerHTML = colors.map((hex, i) => `
    <div class="palette-swatch" role="listitem" style="min-width:90px;max-width:160px">
      <div class="palette-color-area" style="background:${hex};min-height:120px" data-copy-idx="${i}" role="button" tabindex="0" aria-label="Color ${hex}" data-tip="Copy"></div>
      <div class="palette-swatch-footer">
        <span class="palette-swatch-hex" data-copy-idx="${i}" role="button" tabindex="0">${hex.toUpperCase()}</span>
      </div>
    </div>
  `).join('');

  display.querySelectorAll('[data-copy-idx]').forEach(el => {
    el.addEventListener('click', () => {
      const hex = colors[parseInt(el.dataset.copyIdx)];
      navigator.clipboard.writeText(hex).catch(() => {});
      showNotification(`${t('extractor.colorCopied')}: ${hex.toUpperCase()}`, 'success');
    });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  });

  // Save palette
  container.querySelector('#saveExtractedBtn')?.addEventListener('click', () => {
    savePalette({ name: `Extracted ${new Date().toLocaleDateString()}`, colors, id: crypto.randomUUID() });
    showNotification(t('generator.paletteSaved'), 'success');
  });

  // Use in generator
  container.querySelector('#useInGeneratorBtn')?.addEventListener('click', () => {
    // Store in sessionStorage for generator to pick up
    sessionStorage.setItem('cs-inject-palette', JSON.stringify(colors));
    navigate('generator');
  });
}

function showError(container, msg) {
  const errEl = container.querySelector('#extractError');
  if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
}

function hideError(container) {
  const errEl = container.querySelector('#extractError');
  if (errEl) errEl.style.display = 'none';
}

function revokeUrl() {
  if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
}

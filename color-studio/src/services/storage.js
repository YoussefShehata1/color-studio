// Storage service — versioned localStorage for palette library

const STORAGE_KEY = 'cs-palettes';
const PREFS_KEY = 'cs-prefs';
const STORAGE_VERSION = 2;

function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: STORAGE_VERSION, palettes: [] };
    const data = JSON.parse(raw);
    // Migrate v1 → v2
    if (!data.version || data.version < 2) {
      return { version: STORAGE_VERSION, palettes: Array.isArray(data) ? data : (data.palettes || []) };
    }
    return data;
  } catch {
    return { version: STORAGE_VERSION, palettes: [] };
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export function getAllPalettes() {
  return getStore().palettes || [];
}

export function getPaletteById(id) {
  return getAllPalettes().find(p => p.id === id) || null;
}

export function savePalette(palette) {
  const store = getStore();
  const idx = store.palettes.findIndex(p => p.id === palette.id);
  const entry = {
    id: palette.id || crypto.randomUUID(),
    name: palette.name || 'Untitled',
    colors: palette.colors || [],
    favorite: palette.favorite || false,
    createdAt: palette.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  if (idx >= 0) {
    store.palettes[idx] = entry;
  } else {
    store.palettes.unshift(entry);
  }
  saveStore(store);
  return entry;
}

export function deletePalette(id) {
  const store = getStore();
  store.palettes = store.palettes.filter(p => p.id !== id);
  saveStore(store);
}

export function renamePalette(id, newName) {
  const store = getStore();
  const p = store.palettes.find(p => p.id === id);
  if (p) { p.name = newName; p.updatedAt = Date.now(); }
  saveStore(store);
}

export function toggleFavorite(id) {
  const store = getStore();
  const p = store.palettes.find(p => p.id === id);
  if (p) { p.favorite = !p.favorite; p.updatedAt = Date.now(); }
  saveStore(store);
  return p?.favorite;
}

export function exportBackup() {
  const store = getStore();
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mf-color-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.palettes || !Array.isArray(data.palettes)) throw new Error('Invalid format');
    const store = getStore();
    const existingIds = new Set(store.palettes.map(p => p.id));
    let imported = 0;
    for (const p of data.palettes) {
      if (p.id && !existingIds.has(p.id) && p.colors && Array.isArray(p.colors)) {
        store.palettes.push(p);
        imported++;
      }
    }
    saveStore(store);
    return imported;
  } catch {
    return -1;
  }
}

// Preferences
export function getPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch { return {}; }
}

export function setPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...getPrefs(), ...prefs }));
  } catch {}
}

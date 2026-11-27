// Persistent settings (localStorage, with safe fallbacks).
const KEY = 'ocarina-studio:settings:v1';

export const DEFAULTS = {
  scheme: 'n64',          // 'n64' | 'remake'
  labelStyle: 'auto',     // 'auto' | 'nintendo' | 'xbox' | 'ps'
  deadzone: 0.15,
  bendMode: 'smooth',     // 'smooth' (analog) | 'snap' (half/whole steps)
  vibratoDepth: 45,       // cents at full tilt
  vibratoRate: 5.8,       // Hz
  octave: 0,              // sound register shift in octaves
  volume: 0.75,
  reverb: 0.3,
  timbre: 'glaze',        // 'glaze' | 'clay' | 'pure'
  skin: 'blue',           // 'blue' | 'clay'
  noteNames: 'sharp',     // 'sharp' | 'flat' | 'both'
  recognition: 'buttons', // 'buttons' (any modifiers) | 'strict' (naturals only)
  replaySong: true,
  visual: 'both',         // 'ocarina' | 'controller' | 'both'
  showKeys: true,
  partial: false,
  rumble: true,
  bindings: {},
  scarecrow: null,
  customSongs: [],
  transpose: {},
  tempo: {},
  panels: {},
};

const clone = (o) => JSON.parse(JSON.stringify(o));

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...clone(DEFAULTS), ...JSON.parse(raw) };
  } catch (e) { /* storage unavailable */ }
  return clone(DEFAULTS);
}

export const settings = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ }
}

export function resetSettings() {
  const keep = { customSongs: settings.customSongs, scarecrow: settings.scarecrow, bindings: settings.bindings };
  for (const k of Object.keys(settings)) delete settings[k];
  Object.assign(settings, clone(DEFAULTS), keep);
  save();
}

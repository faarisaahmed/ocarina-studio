// Persistent settings (localStorage, with safe fallbacks).
const KEY = 'ocarina-studio:settings:v1';

export const DEFAULTS = {
  scheme: 'n64',          // 'n64' | 'remake'
  labelStyle: 'auto',     // 'auto' | 'nintendo' | 'xbox' | 'ps'
  deadzone: 0.15,
  bendMode: 'smooth',     // 'smooth' (analog) | 'snap' (half/whole steps)
  vibratoDepth: 45,       // cents at full tilt
  vibratoRate: 5.8,       // Hz
  octave: 1,              // sound register shift in octaves (1 = alto ocarina)
  volume: 0.75,
  reverb: 0.22,
  timbre: 'real',         // 'real' (recorded) | 'glaze' | 'clay' | 'pure'
  soundVersion: 2,
  skin: 'blue',           // 'blue' | 'clay'
  noteNames: 'sharp',     // 'sharp' | 'flat' | 'both'
  recognition: 'buttons', // 'buttons' (any modifiers) | 'strict' (naturals only)
  detectSongs: true,
  replaySong: false,
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
    if (raw) {
      const s = { ...clone(DEFAULTS), ...JSON.parse(raw) };
      if ((s.soundVersion || 1) < 2) Object.assign(s, { timbre: 'real', octave: 1, reverb: 0.22, soundVersion: 2 });
      return s;
    }
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

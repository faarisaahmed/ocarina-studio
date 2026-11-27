// Pitch math, note names, and "fingering" (button combo) logic.
//
// The ocarina has five natural notes, one per button. Every other pitch comes
// from combining a note button with a half-step modifier (sharp / flat) and/or
// the analog stick, which bends the pitch by up to a whole step.

export const NOTE_IDS = ['a', 'cd', 'cr', 'cl', 'cu']; // low -> high
export const BASE_MIDI = { a: 62, cd: 65, cr: 69, cl: 71, cu: 74 }; // D4 F4 A4 B4 D5
export const BEND_RANGE = 2; // full stick tilt = one whole step
export const LOWEST = 59;  // B3  (D4, flat, stick fully down)
export const HIGHEST = 77; // F5  (D5, sharp, stick fully up)

const SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function noteParts(midi, pref = 'sharp') {
  const m = Math.round(midi);
  const pc = ((m % 12) + 12) % 12;
  const octave = Math.floor(m / 12) - 1;
  const s = SHARP[pc], f = FLAT[pc];
  const accidental = s.length > 1;
  const main = pref === 'flat' && accidental ? f : s;
  const alt = accidental ? (main === s ? f : s) : null;
  return {
    midi: m, pc, octave, accidental,
    name: main, letter: main[0], acc: main.slice(1),
    alt, label: main + octave, altLabel: alt ? alt + octave : null,
  };
}

export function noteLabel(midi, pref = 'sharp') {
  const p = noteParts(midi, pref === 'both' ? 'sharp' : pref);
  if (pref === 'both' && p.altLabel) return `${p.label} / ${p.altLabel}`;
  return p.label;
}

const PCS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function parseNote(str) {
  const m = /^([A-Ga-g])(#|♯|b|♭|s)?(-?\d)$/.exec(String(str).trim());
  if (!m) return null;
  let pc = PCS[m[1].toUpperCase()];
  if (m[2] === '#' || m[2] === '♯' || m[2] === 's') pc++;
  else if (m[2] === 'b' || m[2] === '♭') pc--;
  return (parseInt(m[3], 10) + 1) * 12 + pc;
}

// Lower is easier. Half-step modifiers are always preferred; the stick is only
// used when a note can't be reached any other way, and half tilts come last.
export function comboCost(half, bend) {
  let c = 0;
  if (half) c += 1;
  if (Math.abs(bend) === 2) c += 2;
  if (Math.abs(bend) === 1) c += 6;
  return c;
}

export function methodLabel(c) {
  if (!c.half && !c.bend) return 'Button only';
  if (c.half && !c.bend) return 'Button + half step';
  if (!c.half) return Math.abs(c.bend) === 2 ? 'Stick needed' : 'Half tilt';
  return 'Half step + stick';
}

export function difficultyLabel(cost) {
  if (cost === 0) return 'natural';
  if (cost <= 1) return 'modifier';
  if (cost <= 1.2) return 'full tilt';
  if (cost <= 2.2) return 'modifier + tilt';
  return 'half tilt';
}

/** Every way to produce `midi`, easiest first. */
export function combosFor(midi, partial = true) {
  const out = [];
  for (const id of NOTE_IDS) {
    for (const half of [0, 1, -1]) {
      for (const bend of [0, 2, -2, 1, -1]) {
        if (!partial && Math.abs(bend) === 1) continue;
        if (half * bend < 0) continue; // opposing modifiers are redundant
        if (BASE_MIDI[id] + half + bend === midi) out.push({ id, half, bend, cost: comboCost(half, bend) });
      }
    }
  }
  return out.sort((a, b) => a.cost - b.cost);
}

const BEST = new Map();
export function bestCombo(midi) {
  if (!BEST.has(midi)) BEST.set(midi, combosFor(midi, true)[0] || null);
  return BEST.get(midi);
}

/**
 * Song text format: space-separated tokens  NOTE[:beats]
 *   e.g.  "D4 F#4:0.5 G4:2 r:1 | Bb3"
 * `r` is a rest; `|` bar lines and commas are ignored. Default length is 1 beat.
 */
export function parseSong(text) {
  const out = [];
  for (const tok of String(text).replace(/\|/g, ' | ').split(/[\s,]+/)) {
    if (!tok) continue;
    if (tok === '|') { if (out.length) out[out.length - 1].barAfter = true; continue; }
    const [n, d] = tok.split(':');
    const beats = d !== undefined && d !== '' ? parseFloat(d) : 1;
    if (!(beats > 0)) throw new Error(`Bad length in "${tok}"`);
    if (/^(r|rest|-)$/i.test(n)) { out.push({ midi: null, beats }); continue; }
    const midi = parseNote(n);
    if (midi == null) throw new Error(`Can't read note "${tok}" (try something like F#4 or Bb3:2)`);
    out.push({ midi, beats });
  }
  return out;
}

export function songToText(notes) {
  return notes.map((n) => {
    const name = n.midi == null ? 'r' : noteParts(n.midi).label.replace('♯', '#');
    return n.beats === 1 ? name : `${name}:${+n.beats.toFixed(3)}`;
  }).join(' ');
}

export function songCost(notes, t) {
  let c = 0;
  for (const n of notes) {
    if (n.midi == null) continue;
    const m = n.midi + t;
    if (m < LOWEST || m > HIGHEST) return Infinity;
    c += bestCombo(m).cost;
  }
  return c;
}

const AUTO = new WeakMap();
export function autoTranspose(notes) {
  if (AUTO.has(notes)) return AUTO.get(notes);
  let best = 0, bestCost = Infinity;
  for (let t = -24; t <= 24; t++) {
    const c = songCost(notes, t);
    if (c < bestCost - 1e-9 || (Math.abs(c - bestCost) < 1e-9 && Math.abs(t) < Math.abs(best))) {
      bestCost = c; best = t;
    }
  }
  const res = { t: best, cost: bestCost };
  AUTO.set(notes, res);
  return res;
}

export function songRange(notes) {
  const ms = notes.filter((n) => n.midi != null).map((n) => n.midi);
  return ms.length ? { lo: Math.min(...ms), hi: Math.max(...ms) } : { lo: 0, hi: 0 };
}

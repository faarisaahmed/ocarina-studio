// SVG building blocks: note-button icons, modifier/stick glyphs, the staff,
// the ocarina illustration and the two controller diagrams.
import { NOTE_IDS } from './music.js';

export const NOTE_COLORS = { a: '#5fd3e6', cd: '#b794f6', cr: '#ff8a7a', cl: '#ffc94d', cu: '#5ee39a' };

export const FACE = {
  nintendo: { a: 'L', cd: 'R', cr: 'A', cl: 'Y', cu: 'X', sharp: 'D-pad ↑', flat: 'D-pad ↓', stick: 'Left stick' },
  xbox: { a: 'LB', cd: 'RB', cr: 'B', cl: 'X', cu: 'Y', sharp: 'D-pad ↑', flat: 'D-pad ↓', stick: 'Left stick' },
  ps: { a: 'L1', cd: 'R1', cr: '○', cl: '□', cu: '△', sharp: 'D-pad ↑', flat: 'D-pad ↓', stick: 'Left stick' },
};
export const N64_NAMES = { a: 'A', cd: 'C-Down', cr: 'C-Right', cl: 'C-Left', cu: 'C-Up', sharp: 'R', flat: 'Z', stick: 'Control Stick' };

export function buttonName(id, scheme, style) {
  return scheme === 'n64' ? N64_NAMES[id] : FACE[style][id];
}

const ROT = { cu: 0, cr: 90, cd: 180, cl: 270 };
const pos = (o) => (o && o.size != null ? `x="${o.x - o.size / 2}" y="${o.y - o.size / 2}" width="${o.size}" height="${o.size}"` : '');

export function noteIcon(id, scheme, style = 'nintendo', o = {}) {
  const cls = `ni ni-${id} ${o.cls || ''}`;
  const P = pos(o);
  if (scheme === 'n64') {
    if (id === 'a') {
      return `<svg ${P} class="${cls}" viewBox="0 0 100 100" role="img" aria-label="A"><circle cx="50" cy="50" r="44" fill="url(#g-n64a)" stroke="#173a8a" stroke-width="5"/><ellipse cx="42" cy="32" rx="20" ry="10" fill="#fff" opacity=".22"/><text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-size="54" font-weight="900" fill="#fff" font-family="Nunito, sans-serif">A</text></svg>`;
    }
    return `<svg ${P} class="${cls}" viewBox="0 0 100 100" role="img" aria-label="${N64_NAMES[id]}"><circle cx="50" cy="50" r="44" fill="url(#g-n64c)" stroke="#9c7410" stroke-width="5"/><ellipse cx="42" cy="30" rx="20" ry="9" fill="#fff" opacity=".3"/><path d="M50 20 L76 64 L24 64 Z" transform="rotate(${ROT[id]} 50 50)" fill="#6b4a00" opacity=".85" stroke-linejoin="round" stroke="#6b4a00" stroke-width="4"/></svg>`;
  }
  const label = FACE[style][id];
  const col = NOTE_COLORS[id];
  if (id === 'a' || id === 'cd') {
    return `<svg ${P} class="${cls}" viewBox="0 0 100 100" role="img" aria-label="${label}"><rect x="5" y="24" width="90" height="52" rx="24" fill="#1b2134" stroke="${col}" stroke-width="5"/><rect x="14" y="30" width="72" height="12" rx="6" fill="#fff" opacity=".08"/><text x="50" y="51" text-anchor="middle" dominant-baseline="central" font-size="${label.length > 1 ? 32 : 38}" font-weight="900" fill="#fff" font-family="Nunito, sans-serif">${label}</text></svg>`;
  }
  const sym = style === 'ps';
  return `<svg ${P} class="${cls}" viewBox="0 0 100 100" role="img" aria-label="${label}"><circle cx="50" cy="50" r="43" fill="#1b2134" stroke="${col}" stroke-width="6"/><ellipse cx="42" cy="30" rx="20" ry="9" fill="#fff" opacity=".08"/><text x="50" y="${sym ? 50 : 52}" text-anchor="middle" dominant-baseline="central" font-size="${sym ? 52 : 50}" font-weight="900" fill="${sym ? col : '#fff'}" font-family="Nunito, 'DejaVu Sans', sans-serif">${label}</text></svg>`;
}

export function modIcon(kind, scheme, o = {}) {
  const P = pos(o);
  const acc = kind === 'sharp' ? '♯' : '♭';
  if (scheme === 'n64') {
    const L = kind === 'sharp' ? 'R' : 'Z';
    return `<svg ${P} class="mi mi-${kind} ${o.cls || ''}" viewBox="0 0 100 100" role="img" aria-label="${L} (${kind})"><rect x="4" y="22" width="92" height="56" rx="14" fill="#454c5c" stroke="#a3acbf" stroke-width="4"/><text x="34" y="51" text-anchor="middle" dominant-baseline="central" font-size="40" font-weight="900" fill="#fff" font-family="Nunito, sans-serif">${L}</text><text x="72" y="49" text-anchor="middle" dominant-baseline="central" font-size="40" font-weight="700" fill="#e3c06b" font-family="'DejaVu Sans', sans-serif">${acc}</text></svg>`;
  }
  const up = kind === 'sharp';
  return `<svg ${P} class="mi mi-${kind} ${o.cls || ''}" viewBox="0 0 100 100" role="img" aria-label="D-pad ${up ? 'up' : 'down'} (${kind})"><path d="M38 8h24v30h30v24H62v30H38V62H8V38h30z" fill="#2a3044" stroke="#7d87a3" stroke-width="3" stroke-linejoin="round"/><path d="${up ? 'M38 8h24v30H38z' : 'M38 62h24v30H38z'}" fill="#e3c06b"/><text x="80" y="20" text-anchor="middle" dominant-baseline="central" font-size="28" font-weight="700" fill="#e3c06b" font-family="'DejaVu Sans', sans-serif">${acc}</text></svg>`;
}

export function stickIcon(bend, o = {}) {
  const P = pos(o);
  const full = Math.abs(bend) >= 2;
  const up = bend > 0;
  // A bold chevron arrow reads clearly even at 20px.
  const a = full ? 'M50 16 L80 50 H62 V82 H38 V50 H20 Z' : 'M50 26 L74 52 H60 V74 H40 V52 H26 Z';
  return `<svg ${P} class="si ${o.cls || ''}" viewBox="0 0 100 100" role="img" aria-label="Stick ${up ? 'up' : 'down'}${full ? '' : ' halfway'}"><circle cx="50" cy="50" r="45" fill="#232a3d" stroke="#8a93a8" stroke-width="5"/><path d="${a}" fill="${full ? '#e3c06b' : '#68e0f0'}" transform="${up ? '' : 'rotate(180 50 50)'}"/>${full ? '' : `<text x="50" y="${up ? 86 : 22}" text-anchor="middle" dominant-baseline="central" font-size="24" font-weight="900" fill="#fff" font-family="Nunito, sans-serif">½</text>`}</svg>`;
}

export function vibIcon(o = {}) {
  return `<svg ${pos(o)} class="si ${o.cls || ''}" viewBox="0 0 100 100" role="img" aria-label="Stick sideways (vibrato)"><circle cx="50" cy="50" r="44" fill="#232a3d" stroke="#6b7590" stroke-width="4"/><circle cx="50" cy="50" r="15" fill="#c9ced9"/><path d="M10 50 L24 40 V60 Z M90 50 L76 40 V60 Z" fill="#e3c06b"/></svg>`;
}

export function comboHTML(c, scheme, style, extraCls = '') {
  let h = `<span class="combo ${extraCls}">${noteIcon(c.id, scheme, style)}`;
  if (c.half) h += `<i class="plus">+</i>${modIcon(c.half > 0 ? 'sharp' : 'flat', scheme)}`;
  if (c.bend) h += `<i class="plus">+</i>${stickIcon(c.bend)}`;
  return h + '</span>';
}

export function comboText(c, scheme, style) {
  const parts = [buttonName(c.id, scheme, style)];
  if (c.half) parts.push(scheme === 'n64' ? (c.half > 0 ? 'R' : 'Z') : (c.half > 0 ? 'D-pad up' : 'D-pad down'));
  if (c.bend) parts.push(`stick ${Math.abs(c.bend) === 2 ? 'full' : 'half'} ${c.bend > 0 ? 'up' : 'down'}`);
  return parts.join(' + ');
}

// ---------- Staff ----------
// Five lines, game-style: icons sit at their button's pitch position.
const STAFF_Y = { a: 157.5, cd: 132.5, cr: 107.5, cl: 95, cu: 70 };
export const STAFF_SLOTS = 8;

export function staffSVG(items, scheme, style, opts = {}) {
  const lines = [45, 70, 95, 120, 145].map((y) => `<line x1="40" x2="790" y1="${y}" y2="${y}"/>`).join('');
  let notes = '';
  items.forEach((it, i) => {
    const x = 128 + i * 88;
    const y = STAFF_Y[it.id];
    const cls = [it.cls || '', i === items.length - 1 && opts.popLast ? 'pop' : ''].join(' ');
    let acc = '';
    if (it.half) acc += `<text class="st-acc" x="${x - 34}" y="${y + 2}" text-anchor="middle" dominant-baseline="central">${it.half > 0 ? '♯' : '♭'}</text>`;
    if (Math.abs(it.bend) >= 0.5) acc += `<text class="st-bend" x="${x + 34}" y="${y + 2}" text-anchor="middle" dominant-baseline="central">${it.bend > 0 ? '↑' : '↓'}</text>`;
    notes += `<g class="st-note ${cls}" style="--d:${i * 40}ms">${acc}${noteIcon(it.id, scheme, style, { x, y, size: 46 })}</g>`;
  });
  return `<svg class="staff" viewBox="0 0 820 190" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Notes played">
    <defs><linearGradient id="staffFade" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="790" y2="0"><stop offset="0" stop-color="#e3c06b" stop-opacity=".1"/><stop offset=".08" stop-color="#e3c06b" stop-opacity=".55"/><stop offset=".92" stop-color="#e3c06b" stop-opacity=".55"/><stop offset="1" stop-color="#e3c06b" stop-opacity=".1"/></linearGradient></defs>
    <g class="st-lines" stroke="url(#staffFade)" stroke-width="2">${lines}</g>
    <g class="st-cap"><path d="M58 40 L70 95 L58 150 L46 95 Z" fill="none" stroke="#e3c06b" stroke-width="2" opacity=".7"/><circle cx="58" cy="95" r="5" fill="#e3c06b" opacity=".8"/></g>
    ${notes}</svg>`;
}

export { NOTE_IDS };

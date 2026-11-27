// Plain text "key" labels for buttons, modifiers and stick directions.
// Everything renders as simple labeled keys so inputs read like documentation.

export const FACE = {
  nintendo: { a: 'L', cd: 'R', cr: 'A', cl: 'Y', cu: 'X' },
  xbox: { a: 'LB', cd: 'RB', cr: 'B', cl: 'X', cu: 'Y' },
  ps: { a: 'L1', cd: 'R1', cr: '○', cl: '□', cu: '△' },
};
export const N64_SHORT = { a: 'A', cd: 'C▼', cr: 'C▶', cl: 'C◀', cu: 'C▲' };
export const N64_NAMES = { a: 'A', cd: 'C-Down', cr: 'C-Right', cl: 'C-Left', cu: 'C-Up' };
export const STAFF_SLOTS = 8;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Long, human-readable button name (for sentences and tables). */
export function buttonName(id, scheme, style) {
  return scheme === 'n64' ? N64_NAMES[id] : FACE[style][id];
}

/** Short key label for a note button. */
export function keyLabel(id, scheme, style) {
  return scheme === 'n64' ? N64_SHORT[id] : FACE[style][id];
}

export function modLabel(kind, scheme) {
  if (scheme === 'n64') return kind === 'sharp' ? 'R ♯' : 'Z ♭';
  return kind === 'sharp' ? 'D-pad ↑ ♯' : 'D-pad ↓ ♭';
}

export function noteIcon(id, scheme, style = 'nintendo', o = {}) {
  return `<kbd class="k k-note ${o.cls || ''}" title="${esc(buttonName(id, scheme, style))}">${esc(keyLabel(id, scheme, style))}</kbd>`;
}

export function modIcon(kind, scheme, o = {}) {
  return `<kbd class="k k-mod ${o.cls || ''}">${esc(modLabel(kind, scheme))}</kbd>`;
}

export function stickIcon(bend, o = {}) {
  const full = Math.abs(bend) >= 2;
  return `<kbd class="k k-stick ${o.cls || ''}">Stick ${full ? '' : '½ '}${bend > 0 ? '↑' : '↓'}</kbd>`;
}

export function vibIcon(o = {}) {
  return `<kbd class="k k-stick ${o.cls || ''}">Stick ↔</kbd>`;
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

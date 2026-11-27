// Keyboard, touch and gamepad input, merged into one logical ocarina state:
//   { notes:{a,cd,cr,cl,cu}, sharp, flat, bendY (-1..1, up +), vibX (-1..1) }
import { NOTE_IDS } from './music.js';

const b = (i) => ({ t: 'b', i });
const ax = (i, s) => ({ t: 'a', i, s });

// Default bindings for controllers that report the browser "standard" layout
// (Xbox, PlayStation, Switch Pro, 8BitDo, most modern pads). Button indices
// are positional: 0 bottom, 1 right, 2 left, 3 top, 4 L/LB, 5 R/RB, 6 ZL/LT,
// 7 ZR/RT, 12-15 D-pad up/down/left/right. Axes: 0/1 left stick, 2/3 right.
export const SCHEMES = {
  n64: {
    id: 'n64',
    name: 'N64 Original',
    blurb: 'A plays D. The C-buttons play F, A, B and high D. Hold R for a half step up and Z for a half step down. Tilt the Control Stick up or down to bend the pitch up to a whole step, or left and right for vibrato.',
    std: {
      a: [b(0), b(1)],
      cu: [ax(3, -1), b(12)], cd: [ax(3, 1), b(13)],
      cl: [ax(2, -1), b(14)], cr: [ax(2, 1), b(15)],
      sharp: [b(5), b(7)], flat: [b(6), b(4)],
      bendY: { i: 1, inv: true }, vibX: { i: 0, inv: false },
    },
  },
  remake: {
    id: 'remake',
    name: 'Switch 2 Remake',
    blurb: 'The five notes go on L, R, A, Y and X, from low to high. D-pad up or down moves a half step, the left stick bends up to a whole step, and tilting the stick sideways adds vibrato.',
    std: {
      a: [b(4)], cd: [b(5)], cr: [b(1)], cl: [b(2)], cu: [b(3)],
      sharp: [b(12)], flat: [b(13)],
      bendY: { i: 1, inv: true }, vibX: { i: 0, inv: false },
    },
  },
};

export const KEYMAP = {
  a: ['Space', 'Digit1'],
  cd: ['ArrowDown', 'Digit2'],
  cr: ['ArrowRight', 'Digit3'],
  cl: ['ArrowLeft', 'Digit4'],
  cu: ['ArrowUp', 'Digit5'],
  sharp: ['KeyR', 'KeyE', 'ShiftLeft', 'ShiftRight'],
  flat: ['KeyZ', 'KeyQ'],
  up: ['KeyW'], down: ['KeyS'],
  vib: ['KeyA', 'KeyD'],
};

export const KEY_HELP = {
  a: 'Space / 1', cd: '↓ / 2', cr: '→ / 3', cl: '← / 4', cu: '↑ / 5',
  sharp: 'R / E / Shift', flat: 'Z / Q', up: 'W', down: 'S', vib: 'A / D',
};

const ALL_KEYS = new Set(Object.values(KEYMAP).flat());

export function detectStyle(id = '') {
  const s = id.toLowerCase();
  if (/045e|xbox|xinput/.test(s)) return 'xbox';
  if (/057e|nintendo|pro controller|joy-con|switch/.test(s)) return 'nintendo';
  if (/054c|dualsense|dualshock|playstation|^wireless controller/.test(s)) return 'ps';
  return 'xbox';
}

export function looksN64(pad) {
  return /n64|nintendo 64|raphnet|mayflash.*n64|retro-bit/i.test(pad.id) || pad.mapping !== 'standard';
}

const clamp = (v, a, b2) => Math.max(a, Math.min(b2, v));
const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));

export class Input {
  constructor(settings) {
    this.s = settings;
    this.keys = new Set();
    this.kb = { bend: 0, vib: 0 };
    this.touch = { notes: {}, sharp: false, flat: false, bendY: 0, vibX: 0 };
    this.calib = {};
    this.enabled = true;
    this.onActivity = null;
    this.lastPadPress = false;

    window.addEventListener('keydown', (e) => {
      if (isTyping(e.target)) return;
      if (ALL_KEYS.has(e.code)) {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault();
        const ae = document.activeElement;
        if (ae && ae !== document.body && (ae.tagName === 'BUTTON' || ae.tagName === 'A')) ae.blur();
        this.keys.add(e.code);
        this.onActivity && this.onActivity('key');
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  mapFor(pad) {
    const custom = this.s.bindings[`${this.s.scheme}|${pad.id}`];
    if (custom) return custom;
    // Non-standard layouts (most N64 adapters) report unpredictable indices and
    // resting axes, so they stay silent until mapped in the wizard.
    return pad.mapping === 'standard' ? SCHEMES[this.s.scheme].std : null;
  }

  pads() {
    const list = navigator.getGamepads ? [...navigator.getGamepads()] : [];
    return list.filter((p) => p && p.connected);
  }

  readBinding(p, bd) {
    if (bd.t === 'b') {
      const btn = p.buttons[bd.i];
      return !!btn && (btn.pressed || btn.value > 0.5);
    }
    const v = p.axes[bd.i];
    return v != null && v * bd.s > 0.6;
  }

  readAxis(p, bd) {
    if (!bd) return 0;
    let v = p.axes[bd.i];
    if (v == null || Number.isNaN(v)) return 0;
    if (bd.inv) v = -v;
    // Auto-calibrate: N64 sticks often only reach ~0.7-0.8 through adapters.
    const key = `${p.index}:${bd.i}`;
    const c = (this.calib[key] = Math.max(this.calib[key] || 0.75, Math.abs(v)));
    v = clamp(v / c, -1, 1);
    const dz = this.s.deadzone, a = Math.abs(v);
    return a < dz ? 0 : (Math.sign(v) * (a - dz)) / (1 - dz);
  }

  poll(dt) {
    const st = { notes: { a: false, cd: false, cr: false, cl: false, cu: false }, sharp: false, flat: false, bendY: 0, vibX: 0 };
    if (!this.enabled) return st;
    const k = this.keys;
    const has = (list) => list.some((c) => k.has(c));
    for (const id of NOTE_IDS) if (has(KEYMAP[id])) st.notes[id] = true;
    if (has(KEYMAP.sharp)) st.sharp = true;
    if (has(KEYMAP.flat)) st.flat = true;
    const tb = (has(KEYMAP.up) ? 1 : 0) - (has(KEYMAP.down) ? 1 : 0);
    this.kb.bend = approach(this.kb.bend, tb, dt / 0.16);
    this.kb.vib = approach(this.kb.vib, has(KEYMAP.vib) ? 1 : 0, dt / 0.4);
    st.bendY = this.kb.bend; st.vibX = this.kb.vib;

    const t = this.touch;
    for (const id of NOTE_IDS) if (t.notes[id]) st.notes[id] = true;
    if (t.sharp) st.sharp = true;
    if (t.flat) st.flat = true;
    if (Math.abs(t.bendY) > Math.abs(st.bendY)) st.bendY = t.bendY;
    if (Math.abs(t.vibX) > Math.abs(st.vibX)) st.vibX = t.vibX;

    let anyPress = false;
    for (const p of this.pads()) {
      const map = this.mapFor(p);
      if (!map) { if (p.buttons.some((x) => x.pressed)) anyPress = true; continue; }
      for (const id of [...NOTE_IDS, 'sharp', 'flat']) {
        const list = map[id];
        if (list && list.some((bd) => this.readBinding(p, bd))) {
          if (id === 'sharp' || id === 'flat') st[id] = true; else st.notes[id] = true;
          anyPress = true;
        }
      }
      const by = this.readAxis(p, map.bendY);
      const vx = this.readAxis(p, map.vibX);
      if (Math.abs(by) > Math.abs(st.bendY)) st.bendY = by;
      if (Math.abs(vx) > Math.abs(st.vibX)) st.vibX = vx;
      if (p.buttons.some((x) => x.pressed)) anyPress = true;
    }
    if (anyPress && !this.lastPadPress && this.onActivity) this.onActivity('pad');
    this.lastPadPress = anyPress;
    return st;
  }

  rumble(ms = 120, strength = 0.5) {
    for (const p of this.pads()) {
      const a = p.vibrationActuator;
      if (a && a.playEffect) a.playEffect('dual-rumble', { duration: ms, strongMagnitude: strength, weakMagnitude: strength }).catch(() => {});
    }
  }
}

function isTyping(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

import { settings as S, save, resetSettings } from './storage.js';
import * as M from './music.js';
import { OcarinaSynth } from './audio.js';
import { Input, SCHEMES, KEY_HELP, detectStyle, looksN64 } from './input.js';
import { Engine } from './engine.js';
import * as G from './graphics.js';
import * as P2 from './pads2d.js';
import { GAME_SONGS, CLASSIC_SONGS, EXERCISES } from './songs.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const now = () => performance.now() / 1000;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const synth = new OcarinaSynth(S);
const input = new Input(S);
const engine = new Engine(synth, input, S);

// ------------------------------------------------------------------ helpers
function labelStyle() {
  if (S.labelStyle !== 'auto') return S.labelStyle;
  const p = input.pads().find((x) => x.mapping === 'standard');
  return p ? detectStyle(p.id) : 'nintendo';
}
let STY = labelStyle();
const icon = (id, o) => G.noteIcon(id, S.scheme, STY, o);
const combo = (c, cls) => G.comboHTML(c, S.scheme, STY, cls);
const namePref = () => (S.noteNames === 'flat' ? 'flat' : 'sharp');
const label = (midi) => M.noteLabel(midi, S.noteNames);

let toastT;
function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), ms);
}

let modalClose = null;
function openModal(html, onClose) {
  $('#modalBody').innerHTML = html;
  $('#modal').hidden = false;
  modalClose = onClose || null;
  return $('#modalBody');
}
function closeModal() {
  if ($('#modal').hidden) return;
  $('#modal').hidden = true;
  $('#modalBody').innerHTML = '';
  const cb = modalClose; modalClose = null;
  cb && cb();
}
$('#modalX').addEventListener('click', closeModal);
$('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') closeModal(); });

function ensureAudio() { synth.init(); synth.resume(); }

function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ------------------------------------------------------------------ start
const startEl = $('#start');
function begin() {
  ensureAudio();
  if (!startEl.classList.contains('gone')) {
    startEl.classList.add('gone');
    setTimeout(() => startEl.remove(), 600);
  }
}
$('#startBtn').addEventListener('click', begin);
startEl.addEventListener('pointerdown', begin);
window.addEventListener('pointerdown', ensureAudio, { capture: true });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!$('#modal').hidden) { closeModal(); return; }
    const ex = $('.card.expanded'); if (ex) { toggleExpand(ex); return; }
  }
  if (startEl.isConnected) begin(); else ensureAudio();
}, { capture: true });
input.onActivity = (kind) => {
  if (kind === 'pad' && startEl.isConnected) {
    begin();
    if (!synth.ctx || synth.ctx.state !== 'running') toast('Controller found! Click anywhere once to switch the sound on.', 4000);
  }
};

// ------------------------------------------------------------------ router
const PAGES = ['play', 'songs', 'notes', 'controls', 'tips'];
let page = 'play';
const fresh = {};
const renderers = { play: renderPlayStatic, songs: renderSongs, notes: renderNotes, controls: renderControls, tips: renderTips };

function route() {
  let p = (location.hash.replace(/^#\/?/, '') || 'play').split(/[/?]/)[0];
  if (!PAGES.includes(p)) p = 'play';
  const changed = p !== page;
  page = p;
  $$('.page').forEach((el) => el.classList.toggle('on', el.dataset.page === p));
  $$('.tabs a').forEach((a) => a.classList.toggle('on', a.dataset.page === p));
  if (!fresh[p]) { renderers[p](); fresh[p] = true; }
  if (changed) window.scrollTo({ top: 0 });
  updateMini(true);
}
window.addEventListener('hashchange', route);

function invalidate(...pages) {
  const list = pages.length ? pages : PAGES;
  for (const p of list) fresh[p] = false;
  if (!fresh[page]) { renderers[page](); fresh[page] = true; }
}

function refreshStyle(force) {
  const st = labelStyle();
  if (st !== STY || force) { STY = st; invalidate(); }
}

function setScheme(id) {
  if (S.scheme === id) return;
  S.scheme = id; save();
  invalidate();
  toast(`Controls: ${SCHEMES[id].name}`);
}

// ------------------------------------------------------------------ PLAY page
const el = {
  big: $('#bigNote'), letter: $('#bnLetter'), acc: $('#bnAcc'), oct: $('#bnOct'), alt: $('#bnAlt'), hz: $('#bnHz'),
  bendVal: $('#bendVal'), bendFill: $('#bendFill'), bendDot: $('#bendDot'),
  centVal: $('#centVal'), centNeedle: $('#centNeedle'), vibVal: $('#vibVal'), vibFill: $('#vibFill'),
  live: $('#liveCombo'), staff: $('#staffWrap'), banner: $('#songBanner'), practice: $('#practiceBar'),
  stage: $('#visualStage'), oc: $('#ocarinaView'), pad: $('#padView'), touch: $('#touchpad'), rec: $('#recorder'),
};

function renderPlayStatic() {
  $$('#schemeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.scheme === S.scheme));
  $$('#visualSeg button').forEach((b) => b.classList.toggle('on', b.dataset.visual === S.visual));
  el.stage.className = `visual-stage mode-${S.visual}`;
  const sc = SCHEMES[S.scheme];
  $('#playHint').innerHTML = `<b>${sc.name}:</b> ${esc(sc.blurb)} <span class="kbd">Keyboard</span> Space ↓ → ← ↑ for notes, <span class="kbd">R</span>/<span class="kbd">Z</span> for half steps, <span class="kbd">W</span>/<span class="kbd">S</span> to bend, <span class="kbd">A</span>/<span class="kbd">D</span> for vibrato.`;
  buildViews();
  renderTouch();
  renderStaff(false);
  renderPractice();
  renderRecorder();
  for (const card of $$('.card[data-card]')) card.classList.toggle('collapsed', !!S.panels[card.dataset.card]);
  lastNoteKey = ''; lastComboKey = '';
}

$('#schemeSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setScheme(b.dataset.scheme); });
$('#visualSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  S.visual = b.dataset.visual; save();
  $$('#visualSeg button').forEach((x) => x.classList.toggle('on', x === b));
  el.stage.className = `visual-stage mode-${S.visual}`;
});

function toggleExpand(card) {
  const on = !card.classList.contains('expanded');
  $$('.card.expanded').forEach((c) => c.classList.remove('expanded'));
  card.classList.toggle('expanded', on);
  document.body.classList.toggle('has-expanded', on);
  const btn = $('[data-act="expand"]', card);
  if (btn) { btn.textContent = on ? '✕' : '⤢'; btn.title = on ? 'Close' : 'Expand'; }
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const card = b.closest('.card'); if (!card) return;
  if (b.dataset.act === 'expand') toggleExpand(card);
  if (b.dataset.act === 'collapse') {
    card.classList.toggle('collapsed');
    S.panels[card.dataset.card] = card.classList.contains('collapsed'); save();
  }
});

// ---- Now Playing card
let lastNoteKey = '', lastComboKey = '';
function updateNote(f) {
  const sounding = f.active != null;
  const midi = sounding ? f.midi : engine.lastMidi;
  el.big.classList.toggle('sounding', sounding);
  el.big.classList.toggle('idle', !sounding);
  if (midi != null) {
    const r = Math.round(midi);
    const key = `${r}|${S.noteNames}|${S.octave}`;
    if (key !== lastNoteKey) {
      lastNoteKey = key;
      const p = M.noteParts(r, namePref());
      el.letter.textContent = p.letter;
      el.acc.textContent = p.acc;
      el.oct.textContent = p.octave;
      el.alt.textContent = p.altLabel || '';
      el.hz.textContent = `${M.midiToFreq(r + 12 * S.octave).toFixed(1)} Hz`;
      if (sounding) { el.big.classList.remove('hit'); void el.big.offsetWidth; el.big.classList.add('hit'); }
    }
    const cents = (midi - r) * 100;
    el.centNeedle.style.left = `${50 + cents}%`;
    el.centNeedle.classList.toggle('off', Math.abs(cents) > 10);
    el.centVal.textContent = `${cents >= 0 ? '+' : '−'}${Math.abs(Math.round(cents))}¢`;
  }
  const bend = sounding ? f.bend : 0;
  const bp = (bend / M.BEND_RANGE) * 50;
  el.bendDot.style.left = `${50 + bp}%`;
  el.bendFill.style.left = `${Math.min(50, 50 + bp)}%`;
  el.bendFill.style.width = `${Math.abs(bp)}%`;
  el.bendVal.textContent = `${bend >= 0 ? '+' : '−'}${Math.abs(bend).toFixed(2)}`;
  el.vibFill.style.width = `${(sounding ? f.vib : 0) * 100}%`;
  el.vibVal.textContent = sounding && f.vib > 0.02 ? `${Math.round(f.vib * 100)}%` : 'off';

  const bk = Math.abs(bend) < 0.25 ? 0 : Math.abs(bend) > 1.5 ? 2 * Math.sign(bend) : Math.sign(bend);
  const ck = sounding ? `${f.active}|${f.half}|${bk}|${f.vib > 0.05}|${S.scheme}|${STY}` : 'idle';
  if (ck !== lastComboKey) {
    lastComboKey = ck;
    if (!sounding) {
      el.live.innerHTML = '<span class="combo-t">Waiting for a note…</span>';
    } else {
      let h = combo({ id: f.active, half: f.half, bend: bk });
      if (f.vib > 0.05) h += `<i class="plus" style="font-size:22px">+</i><span class="combo">${G.vibIcon()}</span>`;
      el.live.innerHTML = h;
    }
  }
}

// ---- Instrument visuals (flat 2D drawings)
const vis = {};
function buildViews() {
  const icons = Object.fromEntries(M.NOTE_IDS.map((id) => [id, icon(id)]));
  icons.sharp = G.modIcon('sharp', S.scheme); icons.flat = G.modIcon('flat', S.scheme);
  el.oc.innerHTML = P2.ocarinaSVG(icons);
  const F = G.FACE[STY];
  el.pad.innerHTML = S.scheme === 'n64' ? P2.n64SVG() : P2.proSVG({ ...F, south: { nintendo: 'B', xbox: 'A', ps: '✕' }[STY] });
  vis.ocSvg = $('svg', el.oc); vis.rig = $('.oc-rig', el.oc);
  vis.ocParts = $$('[data-k]', el.oc); vis.ocLabels = $$('[data-l]', el.oc);
  vis.padParts = $$('[data-k]', el.pad);
  vis.stick = $('.stick', el.pad);
  vis.stickR = S.scheme === 'n64' ? 34 : 44;
}

let wobbleT = 0;
function updateVisuals(f) {
  const s = f.s;
  const isOn = (k) => (k === 'sharp' ? s.sharp : k === 'flat' ? s.flat : null);
  if (vis.ocParts) {
    for (const h of vis.ocParts) { const k = h.dataset.k; const m = isOn(k); h.classList.toggle('on', m === null ? k === f.active : !!m); }
    for (const l of vis.ocLabels) { const k = l.dataset.l; const m = isOn(k); l.classList.toggle('on', m === null ? k === f.active : !!m); }
    wobbleT += f.dt;
    const wob = f.active ? Math.sin(wobbleT * Math.PI * 2 * S.vibratoRate) * f.vib * 1.6 : 0;
    const tilt = f.active ? -f.bend * 2 : 0;
    vis.rig.setAttribute('transform', `rotate(${(tilt + wob).toFixed(2)} 560 250)`);
    vis.ocSvg.classList.toggle('sounding', !!f.active);
  }
  if (vis.padParts) {
    for (const b of vis.padParts) { const k = b.dataset.k; const m = isOn(k); b.classList.toggle('on', m === null ? !!s.notes[k] : !!m); }
    if (vis.stick) {
      vis.stick.setAttribute('transform', `translate(${(s.vibX * vis.stickR).toFixed(1)} ${(-s.bendY * vis.stickR).toFixed(1)})`);
      vis.stick.classList.toggle('on', Math.abs(s.bendY) > 0.05 || Math.abs(s.vibX) > 0.05);
    }
  }
}

let floatCount = 0;
function spawnFloaty() {
  if (floatCount > 10 || !el.oc.offsetWidth || page !== 'play') return;
  const n = document.createElement('span');
  n.className = 'floaty';
  n.textContent = ['♪', '♫', '♩', '♬'][Math.floor(Math.random() * 4)];
  n.style.left = `${el.oc.offsetLeft + el.oc.offsetWidth * 0.12}px`;
  n.style.top = `${el.oc.offsetTop + el.oc.offsetHeight * 0.8}px`;
  n.style.setProperty('--dx', `${-40 - Math.random() * 60}px`);
  n.style.setProperty('--rot', `${(Math.random() - 0.5) * 50}deg`);
  el.stage.appendChild(n);
  floatCount++;
  setTimeout(() => { n.remove(); floatCount--; }, 1700);
}

// ---- Staff & song recognition
const staff = { items: [], locked: false, replaying: false };
function renderStaff(pop) { el.staff.innerHTML = G.staffSVG(staff.items, S.scheme, STY, { popLast: pop }); }
$('#clearStaff').addEventListener('click', () => { staff.items = []; staff.locked = false; renderStaff(false); });

function pushStaff(e) {
  if (staff.locked && !e.auto) return;
  if (staff.locked && e.auto && !staff.replaying) return;
  staff.items.push({ id: e.id, half: e.half, bend: e.bend });
  if (staff.items.length > G.STAFF_SLOTS) staff.items.shift();
  renderStaff(true);
  if (!e.auto && !practice) checkSongs();
}

function songList() {
  const list = [...GAME_SONGS];
  if (S.scarecrow && S.scarecrow.length === 8) {
    list.push({ id: 'scarecrow', title: "Scarecrow's Song", seq: S.scarecrow, beats: S.scarecrow.map(() => 0.5), bpm: 120 });
  }
  return list;
}

function checkSongs() {
  for (const song of songList()) {
    const n = song.seq.length;
    if (staff.items.length < n) continue;
    const tail = staff.items.slice(-n);
    if (!tail.every((it, i) => it.id === song.seq[i])) continue;
    if (S.recognition === 'strict' && !tail.every((it) => !it.half && Math.abs(it.bend) < 0.5)) continue;
    recognized(song, n);
    return;
  }
}

let bannerT;
function banner(title, sub, ms = 0) {
  el.banner.innerHTML = `${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}`;
  el.banner.classList.add('show');
  clearTimeout(bannerT);
  if (ms) bannerT = setTimeout(() => el.banner.classList.remove('show'), ms);
}

function recognized(song, n) {
  staff.locked = true;
  staff.items.forEach((it, i) => { it.cls = i >= staff.items.length - n ? 'win' : 'done'; });
  renderStaff(false);
  banner(`You played ${song.title}!`, song.desc || '');
  synth.chime();
  if (S.rumble) input.rumble(250, 0.6);
  const finish = () => {
    staff.items = []; staff.locked = false; staff.replaying = false;
    renderStaff(false);
    bannerT = setTimeout(() => el.banner.classList.remove('show'), 1600);
  };
  setTimeout(() => {
    if (!staff.locked) return;
    if (S.replaySong) {
      staff.items = []; staff.replaying = true; renderStaff(false);
      engine.autoplay(songEvents(song), song.bpm, finish);
      replayFinish = finish;
    } else finish();
  }, 1000);
}
let replayFinish = null;
engine.on('autoStop', (d) => {
  if (replayFinish && !d.done) { const f = replayFinish; replayFinish = null; f(); }
  if (d.done) replayFinish = null;
  listening = null;
  $$('.m-note.cur, .pb-step.demo').forEach((x) => x.classList.remove('cur', 'demo'));
  renderPractice();
});

// ---- Songs → playable events
const PARSED = new Map();
function parsedNotes(song) {
  if (!PARSED.has(song.text)) PARSED.set(song.text, M.parseSong(song.text));
  return PARSED.get(song.text);
}
function transposeFor(song) {
  if (song.seq) return 0;
  const v = S.transpose[song.id];
  if (typeof v === 'number') return v;
  if (song.fixed) return 0;
  return M.autoTranspose(parsedNotes(song)).t;
}
function tempoFor(song) { return S.tempo[song.id] || song.bpm || 100; }
function songEvents(song) {
  if (song.seq) return song.seq.map((id, i) => ({ combo: { id, half: 0, bend: 0 }, midi: M.BASE_MIDI[id], beats: (song.beats && song.beats[i]) || 1 }));
  const t = transposeFor(song);
  return parsedNotes(song).map((n) => {
    if (n.midi == null) return { combo: null, midi: null, beats: n.beats, rest: true };
    const m = n.midi + t;
    const inRange = m >= M.LOWEST && m <= M.HIGHEST;
    return { combo: inRange ? M.bestCombo(m) : null, midi: m, beats: n.beats, out: !inRange };
  });
}
function songDifficulty(song) {
  if (song.seq) return { tag: 'easy', text: 'Naturals only' };
  try {
    const ev = songEvents(song).filter((e) => e.midi != null);
    if (ev.some((e) => e.out)) return { tag: 'hard', text: 'Out of range' };
    const avg = ev.reduce((a, e) => a + e.combo.cost, 0) / Math.max(1, ev.length);
    if (avg < 0.35) return { tag: 'easy', text: 'Easy' };
    if (avg < 0.9) return { tag: '', text: 'Medium' };
    return { tag: 'hard', text: 'Tricky' };
  } catch (e) { return { tag: 'hard', text: 'Error' }; }
}

let listening = null;
function listen(song, onStep) {
  ensureAudio();
  if (replayFinish) { const f = replayFinish; replayFinish = null; engine.stopAuto(true); f(); }
  if (!staff.locked) { staff.items = []; renderStaff(false); }
  listening = song.id;
  engine.autoplay(songEvents(song), tempoFor(song), null, onStep);
  renderPractice();
}

// ---- Practice / lessons
let practice = null;
function startPractice(song) {
  engine.stopAuto();
  closeModal();
  const events = songEvents(song);
  const steps = events.map((e, i) => ({ ...e, ei: i })).filter((e) => e.combo);
  practice = { song, kind: song.seq ? 'game' : 'pitch', steps, i: 0, fresh: false, hitT: 0, done: false };
  staff.items = []; staff.locked = false; renderStaff(false);
  if (location.hash !== '#/play') location.hash = '#/play';
  renderPractice();
  banner(`Lesson: ${song.title}`, 'Play the highlighted notes in order. Press Listen to hear it first.', 3500);
}
function startTeach() {
  engine.stopAuto();
  practice = { kind: 'teach', ids: [], song: { title: "Scarecrow's Song" } };
  staff.items = []; staff.locked = false; renderStaff(false);
  if (location.hash !== '#/play') location.hash = '#/play';
  renderPractice();
}
function endPractice() { practice = null; renderPractice(); el.banner.classList.remove('show'); }

function renderPractice() {
  const p = practice;
  const box = el.practice;
  if (!p) { box.hidden = true; box.innerHTML = ''; $('#staffTitle').textContent = 'Staff'; return; }
  box.hidden = false;
  $('#staffTitle').textContent = p.kind === 'teach' ? 'Teach a song' : 'Lesson';
  if (p.kind === 'teach') {
    box.innerHTML = `<div class="pb-top"><div class="pb-title">Scarecrow's Song<small>Play any 8 notes. They become your own song, and the game-style staff will recognize it from then on.</small></div>
      <div class="pb-actions"><button class="btn btn-sm" data-p="exit">Cancel</button></div></div>
      <div class="pb-seq">${Array.from({ length: 8 }, (_, i) => `<div class="pb-step ${i < p.ids.length ? 'done' : i === p.ids.length ? 'cur' : ''}">${p.ids[i] ? combo({ id: p.ids[i], half: 0, bend: 0 }) : '<span class="combo" style="opacity:.3">?</span>'}<span class="pn">${i + 1}</span></div>`).join('')}</div>
      <div class="pb-progress"><i style="width:${(p.ids.length / 8) * 100}%"></i></div>`;
    return;
  }
  const total = p.steps.length;
  const playing = listening === p.song.id;
  box.innerHTML = `<div class="pb-top"><div class="pb-title">${esc(p.song.title)}<small>${p.done ? 'Lesson complete! Play it again, or try another song.' : `Note ${Math.min(p.i + 1, total)} of ${total}${p.kind === 'pitch' ? '. Get the pitch in tune and hold it briefly.' : ''}`}</small></div>
    <div class="pb-actions">${playing ? '<button class="btn btn-sm" data-p="stop">■ Stop</button>' : '<button class="btn btn-sm" data-p="listen">▶ Listen</button>'}<button class="btn btn-sm" data-p="restart">⟲ Restart</button><button class="btn btn-sm btn-ghost" data-p="exit">Exit</button></div></div>
    <div class="pb-seq" id="pbSeq">${p.steps.map((s, i) => `<div class="pb-step ${i < p.i ? 'done' : i === p.i && !p.done ? 'cur' : ''}" data-i="${i}">${combo(s.combo)}<span class="pn">${p.kind === 'game' ? G.buttonName(s.combo.id, S.scheme, STY) : label(s.midi)}</span></div>`).join('')}</div>
    <div class="pb-progress"><i style="width:${((p.done ? total : p.i) / total) * 100}%"></i></div>`;
  const seq = $('#pbSeq');
  const cur = $('.pb-step.cur', seq);
  if (cur) seq.scrollLeft = cur.offsetLeft - seq.offsetLeft - seq.clientWidth / 2 + cur.offsetWidth / 2;
}
el.practice.addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]'); if (!b || !practice) return;
  const a = b.dataset.p;
  if (a === 'exit') { engine.stopAuto(); endPractice(); }
  if (a === 'restart') { engine.stopAuto(); practice.i = 0; practice.done = false; renderPractice(); }
  if (a === 'stop') engine.stopAuto();
  if (a === 'listen') {
    const p = practice;
    listen(p.song, (ei) => {
      $$('.pb-step.demo').forEach((x) => x.classList.remove('demo', 'cur'));
      const si = p.steps.findIndex((s) => s.ei === ei);
      const st = $(`.pb-step[data-i="${si}"]`);
      if (st) { st.classList.add('demo', 'cur'); const seq = $('#pbSeq'); seq.scrollLeft = st.offsetLeft - seq.offsetLeft - seq.clientWidth / 2; }
    });
  }
});

function practiceAdvance() {
  const p = practice;
  p.i++;
  p.fresh = false;
  if (p.i >= p.steps.length) {
    p.done = true;
    synth.chime();
    if (S.rumble) input.rumble(200, 0.5);
    banner('Well played!', `${p.song.title}: lesson complete`, 3500);
  }
  renderPractice();
}
function practiceMiss() {
  synth.buzz();
  const st = $('.pb-step.cur', el.practice);
  if (st) { st.classList.remove('miss'); void st.offsetWidth; st.classList.add('miss'); }
}

engine.on('noteStart', (e) => {
  pushStaff(e);
  spawnFloaty();
  if (e.auto) return;
  if (rec.on) recStart();
  const p = practice;
  if (!p) return;
  if (p.kind === 'teach') {
    p.ids.push(e.id);
    if (p.ids.length >= 8) {
      S.scarecrow = p.ids.slice(0, 8); save();
      synth.chime();
      practice = null;
      banner("Scarecrow's Song saved!", 'Play those 8 notes any time and the staff will recognize them.', 4000);
      invalidate('songs');
    }
    renderPractice();
    return;
  }
  if (p.done) return;
  if (p.kind === 'game') {
    const target = p.steps[p.i].combo.id;
    if (e.id === target) practiceAdvance();
    else {
      practiceMiss();
      p.i = e.id === p.steps[0].combo.id ? 1 : 0;
      renderPractice();
    }
  } else {
    p.fresh = true; p.hitT = 0; p.heard = false;
  }
});

engine.on('noteEnd', (e) => {
  if (e.auto) return;
  if (rec.on) recEnd();
  const p = practice;
  if (p && p.kind === 'pitch' && !p.done && p.fresh) { p.fresh = false; practiceMiss(); }
});

function practiceFrame(f) {
  const p = practice;
  if (!p || p.kind !== 'pitch' || p.done || !p.fresh || f.auto || f.active == null) return;
  const target = p.steps[p.i].midi;
  if (Math.abs(f.midi - target) < 0.35) {
    p.hitT += f.dt;
    if (p.hitT >= 0.06) practiceAdvance();
  } else p.hitT = 0;
}

// ---- Recorder
const rec = { on: false, notes: [], cur: null, bpm: 100 };
function recStart() { recEnd(); rec.cur = { start: now(), hist: {} }; }
function recEnd() {
  const c = rec.cur; if (!c) return;
  rec.cur = null;
  let best = null, bt = -1;
  for (const [m, t] of Object.entries(c.hist)) if (t > bt) { bt = t; best = +m; }
  if (best != null) rec.notes.push({ midi: best, start: c.start, end: now() });
  renderRecorder();
}
function recFrame(f) {
  if (!rec.on || !rec.cur || f.auto || f.active == null) return;
  const m = Math.round(f.midi);
  rec.cur.hist[m] = (rec.cur.hist[m] || 0) + f.dt;
}
function recToText() {
  const q = (v) => Math.max(0.25, Math.round(v * 4) / 4);
  const bps = rec.bpm / 60;
  const out = [];
  rec.notes.forEach((n, i) => {
    out.push({ midi: n.midi, beats: q((n.end - n.start) * bps) });
    const nx = rec.notes[i + 1];
    if (nx) { const gap = (nx.start - n.end) * bps; if (gap >= 0.375) out.push({ midi: null, beats: q(gap) }); }
  });
  return M.songToText(out);
}
function renderRecorder() {
  const n = rec.notes.length + (rec.cur ? 1 : 0);
  el.rec.innerHTML = `<div class="rec-row ${rec.on ? 'rec-on' : ''}">
      <span class="rec-dot"></span>
      ${rec.on ? '<button class="btn btn-sm" data-r="stop">■ Stop &amp; save</button><button class="btn btn-sm btn-ghost" data-r="cancel">Discard</button>' : '<button class="btn btn-sm btn-gold" data-r="start">● Record</button>'}
      <span class="rec-info">${rec.on ? `Recording… ${n} note${n === 1 ? '' : 's'}` : 'Record what you play and save it as a song.'}</span>
      <label class="rec-tempo">Tempo <input type="number" min="40" max="240" value="${rec.bpm}" data-r="bpm"> BPM</label>
    </div>`;
}
el.rec.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-r]'); if (!b) return;
  const a = b.dataset.r;
  if (a === 'start') { rec.on = true; rec.notes = []; rec.cur = null; ensureAudio(); }
  if (a === 'cancel') { rec.on = false; rec.notes = []; rec.cur = null; }
  if (a === 'stop') {
    recEnd(); rec.on = false;
    if (rec.notes.length) openEditor(null, { title: 'My recording', bpm: rec.bpm, text: recToText() });
    else toast('Nothing recorded yet. Play some notes first.');
    rec.notes = [];
  }
  renderRecorder();
});
el.rec.addEventListener('change', (e) => { if (e.target.dataset.r === 'bpm') rec.bpm = Math.max(40, Math.min(240, +e.target.value || 100)); });

// ---- Touch pad
function renderTouch() {
  const n64 = S.scheme === 'n64';
  const pos = n64
    ? { cu: [130, 0], cl: [78, 60], cr: [182, 60], cd: [130, 120], a: [0, 120] }
    : { a: [0, 0], cd: [186, 0], cu: [116, 50], cl: [56, 108], cr: [176, 108] };
  const notes = M.NOTE_IDS.map((id) => `<button class="tp-btn tp-note" data-n="${id}" style="left:${pos[id][0]}px;top:${pos[id][1]}px" aria-label="${G.buttonName(id, S.scheme, STY)}">${icon(id)}${S.showKeys ? `<small>${esc(KEY_HELP[id].split(' / ')[0])}</small>` : ''}</button>`).join('');
  el.touch.innerHTML = `
    <div class="tp-stick" id="tpStick" aria-label="Virtual stick"><div class="tp-knob" id="tpKnob"></div></div>
    <div class="tp-mods">
      <button class="tp-btn tp-mod" data-m="sharp" aria-label="Sharp">${G.modIcon('sharp', S.scheme)}</button>
      <button class="tp-btn tp-mod" data-m="flat" aria-label="Flat">${G.modIcon('flat', S.scheme)}</button>
    </div>
    <div class="tp-notes" style="height:${n64 ? 200 : 186}px;width:262px">${notes}</div>
    <p class="tp-help">Tap or click the buttons. Drag the stick up and down to bend, and side to side for vibrato. Multi-touch works.</p>`;
  const T = input.touch;
  $$('.tp-note', el.touch).forEach((b) => hold(b, () => { T.notes[b.dataset.n] = true; }, () => { T.notes[b.dataset.n] = false; }));
  $$('.tp-mod', el.touch).forEach((b) => hold(b, () => { T[b.dataset.m] = true; }, () => { T[b.dataset.m] = false; }));
  const stick = $('#tpStick'), knob = $('#tpKnob');
  let sid = null;
  const move = (e) => {
    const r = stick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const R = r.width / 2 - 26, d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    T.vibX = dx / R; T.bendY = -dy / R;
  };
  stick.addEventListener('pointerdown', (e) => { ensureAudio(); sid = e.pointerId; stick.setPointerCapture(sid); move(e); });
  stick.addEventListener('pointermove', (e) => { if (e.pointerId === sid) move(e); });
  const up = (e) => { if (e.pointerId !== sid) return; sid = null; knob.style.transform = ''; T.vibX = 0; T.bendY = 0; };
  stick.addEventListener('pointerup', up); stick.addEventListener('pointercancel', up);
}
function hold(btn, on, off) {
  let pid = null;
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault(); ensureAudio();
    pid = e.pointerId; btn.setPointerCapture(pid); btn.classList.add('on'); on();
  });
  const up = (e) => { if (pid === null || e.pointerId !== pid) return; pid = null; btn.classList.remove('on'); off(); };
  btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('lostpointercapture', up);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ------------------------------------------------------------------ SONGS page
function customSongs() { return S.customSongs.map((s) => ({ ...s, kind: 'custom' })); }
function allSongs() {
  return [
    ...songList().map((s) => ({ ...s, kind: 'game' })),
    ...CLASSIC_SONGS.map((s) => ({ ...s, kind: 'classic' })),
    ...EXERCISES.map((s) => ({ ...s, kind: 'exercise' })),
    ...customSongs(),
  ];
}
const songCache = new Map();
function getSong(id) {
  const base = allSongs().find((s) => s.id === id);
  if (!base) return null;
  const c = songCache.get(id);
  if (c && c.text === base.text && c.title === base.title && String(c.seq) === String(base.seq)) return c;
  songCache.set(id, base);
  return base;
}

function seqPreview(song, max = 12) {
  if (song.seq) return `<div class="sc-seq">${song.seq.map((id) => icon(id)).join('')}</div>`;
  try {
    const ev = songEvents(song).filter((e) => e.combo);
    return `<div class="sc-seq small">${ev.slice(0, max).map((e) => combo(e.combo)).join('')}${ev.length > max ? `<span class="more">+${ev.length - max} more</span>` : ''}</div>`;
  } catch (e) { return `<p class="sc-desc" style="color:var(--bad)">${esc(e.message)}</p>`; }
}

function songCard(song) {
  const d = songDifficulty(song);
  const tag = song.kind === 'game' ? `<span class="tag ${song.group === 'Warp' ? 'warp' : ''}">${song.id === 'scarecrow' ? 'Yours' : song.group}</span>` : `<span class="tag ${d.tag}">${d.text}</span>`;
  let by = song.by || '';
  if (!song.seq) {
    const t = transposeFor(song);
    if (t) by += `${by ? ' · ' : ''}transposed ${t > 0 ? '+' : '−'}${Math.abs(t)}`;
  }
  return `<article class="card song-card" data-open="${song.id}" tabindex="0">
    <div class="sc-top"><div><h3>${esc(song.title)}</h3>${by ? `<div class="sc-by">${esc(by)}</div>` : ''}</div>${tag}</div>
    ${seqPreview(song)}
    ${song.desc ? `<p class="sc-desc">${esc(song.desc)}</p>` : ''}
    <div class="sc-actions">
      <button class="btn btn-sm" data-listen="${song.id}">▶ Listen</button>
      <button class="btn btn-sm btn-gold" data-practice="${song.id}">Practice</button>
      ${song.kind === 'custom' ? `<button class="btn btn-sm btn-ghost" data-edit="${song.id}">Edit</button>` : ''}
      ${song.id === 'scarecrow' ? '<button class="btn btn-sm btn-ghost" data-teach="1">Re-teach</button>' : ''}
    </div>
  </article>`;
}

function renderSongs() {
  const pg = $('#page-songs');
  const melodies = allSongs().filter((s) => s.kind === 'game' && s.group !== 'Warp');
  const warps = allSongs().filter((s) => s.kind === 'game' && s.group === 'Warp');
  const mine = customSongs();
  const scare = S.scarecrow ? '' : `<article class="card song-card" data-teach="1"><div class="sc-top"><div><h3>Scarecrow's Song</h3><div class="sc-by">Make up your own</div></div><span class="tag">Custom</span></div><div class="sc-seq">${'<span class="combo" style="opacity:.35">?</span>'.repeat(8)}</div><p class="sc-desc">Play any 8 notes to teach it. After that the staff recognizes it like the others.</p><div class="sc-actions"><button class="btn btn-sm btn-gold" data-teach="1">Teach it</button></div></article>`;
  pg.innerHTML = `
    <div class="page-head"><div><h1>Songs</h1><p>Press <b>Listen</b> to hear a song and watch the fingering, or <b>Practice</b> to play along note by note. In free play the staff recognizes the ocarina melodies whenever you play them. The classics are public-domain tunes, transposed automatically so they're as easy as possible to play.</p></div>
      <div class="songs-tools"><button class="btn btn-gold" data-new="1">+ New song</button><button class="btn" data-import="1">Import</button><button class="btn" data-exportall="1" ${mine.length ? '' : 'disabled'}>Export mine</button><input type="file" id="importFile" accept=".json,application/json" hidden></div></div>
    <div class="section-t">Ocarina melodies</div>
    <div class="song-grid">${melodies.map(songCard).join('')}${scare}</div>
    <div class="section-t">Warp songs</div>
    <div class="song-grid">${warps.map(songCard).join('')}</div>
    <div class="section-t">My songs</div>
    ${mine.length ? `<div class="song-grid">${mine.map(songCard).join('')}</div>` : `<div class="card" style="padding:18px 20px"><p class="sc-desc" style="font-size:15px">You haven't added any songs yet. Use <b>+ New song</b> to type in a melody, for example a longer theme you know by ear, or use the <b>Recorder</b> on the Play page to capture what you play. Songs are saved in this browser, and you can export them to share.</p></div>`}
    <div class="section-t">Classics</div>
    <div class="song-grid">${CLASSIC_SONGS.map((s) => songCard(getSong(s.id))).join('')}</div>
    <div class="section-t">Exercises</div>
    <div class="song-grid">${EXERCISES.map((s) => songCard(getSong(s.id))).join('')}</div>`;
}

$('#page-songs').addEventListener('click', (e) => {
  const t = e.target.closest('[data-listen],[data-practice],[data-edit],[data-new],[data-import],[data-exportall],[data-teach],[data-open]');
  if (!t) return;
  const d = t.dataset;
  if (d.listen) { const s = getSong(d.listen); listen(s); toast(`Listening: ${s.title}`); }
  else if (d.practice) startPractice(getSong(d.practice));
  else if (d.edit) openEditor(getSong(d.edit));
  else if (d.new) openEditor(null);
  else if (d.teach) startTeach();
  else if (d.import) $('#importFile').click();
  else if (d.exportall) download('ocarina-songs.json', { format: 'ocarina-studio-songs', version: 1, songs: S.customSongs.map(({ title, bpm, text }) => ({ title, bpm, text })) });
  else if (d.open) openSong(getSong(d.open));
});
$('#page-songs').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('.song-card[data-open]')) openSong(getSong(e.target.dataset.open));
});
$('#page-songs').addEventListener('change', async (e) => {
  if (e.target.id !== 'importFile') return;
  const file = e.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const list = Array.isArray(data) ? data : Array.isArray(data.songs) ? data.songs : [data];
    let n = 0;
    for (const s of list) {
      if (!s || typeof s.text !== 'string') continue;
      M.parseSong(s.text);
      S.customSongs.push({ id: `my-${Date.now().toString(36)}${n}`, title: String(s.title || 'Imported song').slice(0, 80), bpm: Math.max(30, Math.min(260, +s.bpm || 100)), text: s.text });
      n++;
    }
    save(); invalidate('songs');
    toast(n ? `Imported ${n} song${n > 1 ? 's' : ''}.` : 'No songs found in that file.');
  } catch (err) { toast(`Couldn't import: ${err.message}`, 4000); }
  e.target.value = '';
});

function noteCells(song) {
  return songEvents(song).map((ev, i) => {
    if (ev.rest) return `<div class="m-note rest" data-ei="${i}">rest<small>${ev.beats} beat${ev.beats === 1 ? '' : 's'}</small></div>`;
    if (ev.out) return `<div class="m-note" data-ei="${i}" style="border-color:var(--bad)"><b>${label(ev.midi)}</b><small style="color:var(--bad)">out of range</small></div>`;
    return `<div class="m-note" data-ei="${i}">${combo(ev.combo)}<b>${song.seq ? G.buttonName(ev.combo.id, S.scheme, STY) : label(ev.midi)}</b><small>${ev.beats} beat${ev.beats === 1 ? '' : 's'}</small></div>`;
  }).join('');
}

function openSong(song) {
  if (!song) return;
  const chromatic = !song.seq;
  const render = () => {
    const t = transposeFor(song);
    const isAuto = typeof S.transpose[song.id] !== 'number' && !song.fixed;
    const box = openModal(`
      <h2>${esc(song.title)}</h2>
      <p class="m-sub">${esc([song.by, song.desc].filter(Boolean).join(' · '))}${song.seq ? ' The rhythm here is approximate.' : ''}</p>
      <div class="m-controls">
        <button class="btn btn-sm" data-m="listen">▶ Listen</button>
        <button class="btn btn-sm" data-m="stop">■ Stop</button>
        <button class="btn btn-sm btn-gold" data-m="practice">Practice</button>
        ${song.kind === 'custom' ? '<button class="btn btn-sm btn-ghost" data-m="edit">Edit</button><button class="btn btn-sm btn-ghost" data-m="export">Export</button>' : ''}
        ${chromatic ? `<label>Transpose <button class="btn btn-sm" data-m="t-">−</button><span class="val">${t > 0 ? '+' : ''}${t}</span><button class="btn btn-sm" data-m="t+">+</button><button class="btn btn-sm ${isAuto ? 'btn-gold' : ''}" data-m="auto">Auto</button></label>` : ''}
        <label>Tempo <input type="range" min="40" max="220" value="${tempoFor(song)}" data-m="tempo" style="width:120px"><span class="val" id="mTempo">${tempoFor(song)}</span></label>
      </div>
      <div class="m-notes" id="mNotes">${noteCells(song)}</div>`, () => { if (listening === song.id) engine.stopAuto(); });
    box.onclick = (e) => {
      const b = e.target.closest('[data-m]'); if (!b) return;
      const a = b.dataset.m;
      if (a === 'listen') listen(song, (ei) => {
        $$('.m-note.cur').forEach((x) => x.classList.remove('cur'));
        const c = $(`.m-note[data-ei="${ei}"]`); if (c) { c.classList.add('cur'); c.scrollIntoView({ block: 'nearest' }); }
      });
      if (a === 'stop') engine.stopAuto();
      if (a === 'practice') startPractice(song);
      if (a === 'edit') { closeModal(); openEditor(song); }
      if (a === 'export') download(`${song.title.replace(/[^\w-]+/g, '-').toLowerCase()}.json`, { format: 'ocarina-studio-songs', version: 1, songs: [{ title: song.title, bpm: song.bpm, text: song.text }] });
      if (a === 't-' || a === 't+') {
        const notes = parsedNotes(song);
        let v = transposeFor(song);
        for (let k = 0; k < 24; k++) { v += a === 't+' ? 1 : -1; if (M.songCost(notes, v) < Infinity || Math.abs(v) > 24) break; }
        if (Math.abs(v) > 24) return;
        S.transpose[song.id] = v; save(); invalidate('songs'); engine.stopAuto(); render();
      }
      if (a === 'auto') { delete S.transpose[song.id]; save(); invalidate('songs'); engine.stopAuto(); render(); }
    };
    box.oninput = (e) => {
      if (e.target.dataset.m !== 'tempo') return;
      S.tempo[song.id] = +e.target.value; $('#mTempo').textContent = e.target.value;
    };
    box.onchange = (e) => { if (e.target.dataset.m === 'tempo') save(); };
  };
  render();
}

function openEditor(song, prefill) {
  const isNew = !song;
  const src = song || { title: '', bpm: 100, text: '', ...(prefill || {}) };
  const box = openModal(`
    <h2>${isNew ? 'New song' : 'Edit song'}</h2>
    <p class="m-sub">Type notes separated by spaces, like <code>D4 F#4 G4:2 r Bb3:0.5</code>. A number after the colon is the length in beats (default 1), <code>r</code> is a rest, and <code>|</code> bar lines are ignored. The ocarina plays from B3 to F5; songs outside that range are shifted automatically.</p>
    <div class="form-grid">
      <div class="form-row"><label for="edTitle">Title</label><input type="text" id="edTitle" maxlength="80" value="${esc(src.title)}" placeholder="My song"></div>
      <div class="form-row"><label for="edBpm">Tempo (BPM)</label><input type="number" id="edBpm" min="30" max="260" value="${src.bpm || 100}"></div>
    </div>
    <div class="form-row"><label for="edText">Notes</label><textarea id="edText" spellcheck="false" placeholder="D4 F4 A4:2 | B4 A4 F4:2">${esc((src.text || '').trim())}</textarea></div>
    <div class="m-err" id="edErr"></div>
    <div class="m-controls">
      <button class="btn btn-gold" data-e="save">Save</button>
      <button class="btn" data-e="listen">▶ Preview</button>
      <button class="btn" data-e="stop">■ Stop</button>
      ${isNew ? '' : '<button class="btn btn-danger" data-e="delete">Delete</button>'}
    </div>
    <div class="m-notes" id="edPrev"></div>`, () => engine.stopAuto());
  const draft = () => ({ id: song ? song.id : '__draft', title: $('#edTitle').value.trim() || 'Untitled', bpm: Math.max(30, Math.min(260, +$('#edBpm').value || 100)), text: $('#edText').value, kind: 'custom' });
  const preview = () => {
    const d = draft();
    try { M.parseSong(d.text); $('#edErr').textContent = ''; $('#edPrev').innerHTML = d.text.trim() ? noteCells(d) : ''; return d; }
    catch (err) { $('#edErr').textContent = err.message; return null; }
  };
  preview();
  $('#edText').addEventListener('input', preview);
  box.onclick = (e) => {
    const b = e.target.closest('[data-e]'); if (!b) return;
    const a = b.dataset.e;
    if (a === 'stop') engine.stopAuto();
    if (a === 'listen') {
      const d = preview(); if (!d || !d.text.trim()) return;
      ensureAudio();
      engine.autoplay(songEvents(d), d.bpm, null, (ei) => {
        $$('#edPrev .m-note.cur').forEach((x) => x.classList.remove('cur'));
        const c = $(`#edPrev .m-note[data-ei="${ei}"]`); if (c) c.classList.add('cur');
      });
    }
    if (a === 'save') {
      const d = preview(); if (!d) return;
      if (!d.text.trim()) { $('#edErr').textContent = 'Add at least one note.'; return; }
      if (isNew) S.customSongs.push({ id: `my-${Date.now().toString(36)}`, title: d.title, bpm: d.bpm, text: d.text });
      else Object.assign(S.customSongs.find((s) => s.id === song.id), { title: d.title, bpm: d.bpm, text: d.text });
      save(); closeModal(); invalidate('songs'); toast(`Saved “${d.title}”`);
      if (page !== 'songs') location.hash = '#/songs';
    }
    if (a === 'delete') {
      if (!confirm(`Delete “${song.title}”?`)) return;
      S.customSongs = S.customSongs.filter((s) => s.id !== song.id);
      save(); closeModal(); invalidate('songs'); toast('Song deleted');
    }
  };
}

// ------------------------------------------------------------------ NOTE CHART page
function renderNotes() {
  const pg = $('#page-notes');
  const naturals = new Map(Object.entries(M.BASE_MIDI).map(([id, m]) => [m, id]));
  const keys = [];
  for (let m = M.LOWEST; m <= M.HIGHEST; m++) {
    const p = M.noteParts(m, namePref());
    keys.push(`<button class="key ${p.accidental ? 'blk' : ''}" data-key="${m}" title="${label(m)}">${naturals.has(m) ? icon(naturals.get(m)) : ''}${p.name}<small>${p.octave}</small></button>`);
  }
  const rows = [];
  for (let m = M.LOWEST; m <= M.HIGHEST; m++) {
    const p = M.noteParts(m, namePref());
    const list = M.combosFor(m, S.partial);
    const chips = list.map((c, i) => `<button class="chip ${i === 0 ? 'best' : ''}" data-c="${c.id},${c.half},${c.bend}" title="${esc(G.comboText(c, S.scheme, STY))}">${combo(c)}<span class="diff">${i === 0 ? 'easiest · ' : ''}${M.difficultyLabel(c.cost)}</span></button>`).join('');
    rows.push(`<div class="card nrow ${naturals.has(m) ? 'natural' : ''}" data-midi="${m}">
      <div class="nname"><b>${p.name}</b><span class="o">${p.octave}</span>${p.altLabel ? `<span class="enh">= ${p.altLabel}</span>` : ''}</div>
      <div class="nhz">${M.midiToFreq(m + 12 * S.octave).toFixed(2)} Hz</div>
      <div class="ncombos">${chips || '<span class="sc-desc">Needs a half tilt. Turn on half-tilt fingerings above.</span>'}</div></div>`);
  }
  pg.innerHTML = `
    <div class="page-head"><div><h1>Note Chart</h1><p>The ocarina reaches 19 pitches, from B3 to F5. Five come straight from the buttons. The rest use the half-step modifier, the stick, or both, and most can be fingered more than one way. The easiest fingering is listed first. Click any fingering to hear it and see it on the instrument. The page lights up whatever you're playing.</p></div>
      <label class="switch"><input type="checkbox" id="partialToggle" ${S.partial ? 'checked' : ''}> Show half-tilt fingerings</label></div>
    <div class="card keystrip">${keys.join('')}</div>
    <div class="card legend">
      <span><span class="combo">${icon('a')}</span> note button</span>
      <span><span class="combo">${G.modIcon('sharp', S.scheme)}</span> half step up</span>
      <span><span class="combo">${G.modIcon('flat', S.scheme)}</span> half step down</span>
      <span><span class="combo">${G.stickIcon(2)}</span> stick fully up (+1 whole step)</span>
      <span><span class="combo">${G.stickIcon(-1)}</span> stick halfway down (−1 half step)</span>
    </div>
    <div class="note-table" style="margin-top:14px">${rows.reverse().join('')}</div>`;
  notesLive = null;
}
let notesLive = null;
$('#page-notes').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-c]');
  if (chip) {
    const [id, half, bend] = chip.dataset.c.split(',');
    ensureAudio();
    engine.autoplay([{ combo: { id, half: +half, bend: +bend }, beats: 1.6 }], 60);
    return;
  }
  const key = e.target.closest('[data-key]');
  if (key) { ensureAudio(); engine.autoplay([{ combo: M.bestCombo(+key.dataset.key), beats: 1.4 }], 60); }
});
$('#page-notes').addEventListener('change', (e) => {
  if (e.target.id === 'partialToggle') { S.partial = e.target.checked; save(); renderNotes(); }
});
function updateNotesLive(f) {
  if (page !== 'notes') return;
  const m = f.active != null ? Math.round(f.midi) : null;
  if (m === notesLive) return;
  notesLive = m;
  $$('#page-notes .live').forEach((x) => x.classList.remove('live'));
  if (m != null) $$(`#page-notes [data-midi="${m}"], #page-notes [data-key="${m}"]`).forEach((x) => x.classList.add('live'));
}

// ------------------------------------------------------------------ CONTROLS page
function mapRows(schemeId) {
  const st = schemeId === 'n64' ? 'n64' : STY;
  const note = (id) => `<tr><td><b>${M.noteParts(M.BASE_MIDI[id]).label}</b></td><td><span class="combo">${G.noteIcon(id, schemeId, STY)}</span> ${G.buttonName(id, schemeId, STY)}</td><td><span class="kbd">${KEY_HELP[id]}</span></td></tr>`;
  const n64 = schemeId === 'n64';
  return `<table class="map-table"><thead><tr><th>Does</th><th>Controller</th><th>Keyboard</th></tr></thead><tbody>
    ${M.NOTE_IDS.map(note).join('')}
    <tr><td>Half step up</td><td><span class="combo">${G.modIcon('sharp', schemeId)}</span> ${n64 ? 'R (hold)' : 'D-pad up (hold)'}</td><td><span class="kbd">${KEY_HELP.sharp}</span></td></tr>
    <tr><td>Half step down</td><td><span class="combo">${G.modIcon('flat', schemeId)}</span> ${n64 ? 'Z (hold)' : 'D-pad down (hold)'}</td><td><span class="kbd">${KEY_HELP.flat}</span></td></tr>
    <tr><td>Bend ±1 step</td><td><span class="combo">${G.stickIcon(2)}</span> ${n64 ? 'Control Stick' : 'Left stick'} up/down</td><td><span class="kbd">W</span> <span class="kbd">S</span></td></tr>
    <tr><td>Vibrato</td><td><span class="combo">${G.vibIcon()}</span> stick left/right</td><td><span class="kbd">${KEY_HELP.vib}</span></td></tr>
  </tbody></table>${n64 && st === 'n64' ? '<p class="sd" style="color:var(--dim);font-size:12px;margin-bottom:0">On a modern controller, N64 mode puts A on the bottom or right face button, the C-buttons on the right stick or D-pad, R on RB/R or RT/ZR, and Z on LT/ZL or LB/L.</p>' : ''}`;
}

function setRow(o) {
  const v = S[o.key];
  let ctl = '';
  if (o.type === 'range') ctl = `<div class="rv"><input type="range" data-set="${o.key}" min="${o.min}" max="${o.max}" step="${o.step}" value="${v}"><output>${o.fmt ? o.fmt(v) : v}</output></div>`;
  if (o.type === 'select') ctl = `<select data-set="${o.key}">${o.options.map(([val, txt]) => `<option value="${val}" ${String(v) === String(val) ? 'selected' : ''}>${txt}</option>`).join('')}</select>`;
  if (o.type === 'toggle') ctl = `<label class="switch"><input type="checkbox" data-set="${o.key}" ${v ? 'checked' : ''}> ${v ? 'On' : 'Off'}</label>`;
  return `<div class="set-row"><div><span class="sl">${o.label}</span>${o.desc ? `<span class="sd">${o.desc}</span>` : ''}</div>${ctl}</div>`;
}
const SETTINGS = {
  feel: [
    { key: 'bendMode', type: 'select', label: 'Stick bend', desc: 'Smooth is fully analog. Snap locks the bend to exact half and whole steps.', options: [['smooth', 'Smooth (analog)'], ['snap', 'Snap to semitones']] },
    { key: 'deadzone', type: 'range', label: 'Stick dead zone', desc: 'Raise this if a worn stick drifts.', min: 0, max: 0.4, step: 0.01, num: true, fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'vibratoDepth', type: 'range', label: 'Vibrato depth', desc: 'Pitch wobble at full sideways tilt.', min: 0, max: 120, step: 1, num: true, fmt: (v) => `${v}¢` },
    { key: 'vibratoRate', type: 'range', label: 'Vibrato speed', min: 3, max: 9, step: 0.1, num: true, fmt: (v) => `${(+v).toFixed(1)} Hz` },
    { key: 'rumble', type: 'toggle', label: 'Rumble', desc: 'Buzz the controller when a song is recognized.' },
  ],
  sound: [
    { key: 'volume', type: 'range', label: 'Volume', min: 0, max: 1, step: 0.01, num: true, fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'reverb', type: 'range', label: 'Reverb', desc: 'How much room the sound has.', min: 0, max: 1, step: 0.01, num: true, fmt: (v) => `${Math.round(v * 100)}%` },
    { key: 'timbre', type: 'select', label: 'Tone', options: [['glaze', 'Glazed ceramic'], ['clay', 'Breathy clay'], ['pure', 'Pure / crystal']] },
    { key: 'octave', type: 'select', label: 'Register', desc: 'Note names follow the usual game charts (D4 to D5). This setting only moves the sound.', num: true, options: [[0, 'As written'], [1, 'One octave up'], [-1, 'One octave down']] },
  ],
  display: [
    { key: 'labelStyle', type: 'select', label: 'Button labels', desc: 'Auto picks labels to match the controller you connect.', options: [['auto', 'Auto-detect'], ['nintendo', 'Nintendo (L R A Y X)'], ['xbox', 'Xbox (LB RB B X Y)'], ['ps', 'PlayStation (L1 R1 ○ □ △)']] },
    { key: 'noteNames', type: 'select', label: 'Note names', options: [['sharp', 'Sharps (C♯)'], ['flat', 'Flats (D♭)'], ['both', 'Both']] },
    { key: 'showKeys', type: 'toggle', label: 'Keyboard hints', desc: 'Show key labels on the touch pad.' },
  ],
  songs: [
    { key: 'recognition', type: 'select', label: 'Song recognition', desc: 'Strict matches only notes played with no modifier or bend, as the remake does.', options: [['buttons', 'Any fingering'], ['strict', 'Natural notes only']] },
    { key: 'replaySong', type: 'toggle', label: 'Replay recognized songs', desc: 'After you play an ocarina melody, it plays back for you.' },
  ],
};

function padListHTML() {
  const pads = input.pads();
  if (!pads.length) return `<p class="pad-empty">No controller detected yet. Connect one over USB or Bluetooth, then <b>press any button on it</b>. Browsers only show controllers after a button press.<br>Works with Xbox, PlayStation, Switch Pro, 8BitDo and similar pads. For an original N64 controller, use a USB adapter (raphnet, Mayflash, and similar), or use the Nintendo Switch Online N64 controller, then run the mapping wizard.</p>`;
  return pads.map((p) => {
    const custom = !!S.bindings[`${S.scheme}|${p.id}`];
    const n64 = looksN64(p);
    return `<div class="pad-item"><div><b>${esc(p.id)}</b>
      <small>${p.mapping === 'standard' ? `Standard layout · ${detectStyle(p.id)} labels` : '<span class="warn">Non-standard layout. Run the wizard to map it.</span>'}${custom ? ' · <span style="color:var(--ok)">custom mapping</span>' : ''}${n64 && p.mapping === 'standard' ? ' · N64-style' : ''}</small>
      <div class="tester" data-tester="${p.index}"></div></div>
      <div style="display:flex;flex-direction:column;gap:6px"><button class="btn btn-sm btn-gold" data-wiz="${p.index}">Map buttons</button>${custom ? `<button class="btn btn-sm btn-ghost" data-unmap="${p.index}">Reset</button>` : ''}</div></div>`;
  }).join('');
}

function renderControls() {
  const pg = $('#page-controls');
  const sc = (id) => `<article class="card scheme-card ${S.scheme === id ? 'on' : ''}" data-scheme-card="${id}">
      <h3>${SCHEMES[id].name}${S.scheme === id ? '<span class="tag">Active</span>' : '<button class="btn btn-sm">Use this</button>'}</h3>
      <p>${esc(SCHEMES[id].blurb)}</p>${mapRows(id)}</article>`;
  pg.innerHTML = `
    <div class="page-head"><div><h1>Controls &amp; Settings</h1><p>Pick the layout you learned on. <b>N64 Original</b> matches the 1998 game, and it works with a real N64 controller through an adapter as well as with any modern pad. <b>Switch 2 Remake</b> matches the 2026 remake: notes on L, R, A, Y and X, half steps on the D-pad, and bends on the left stick.</p></div>
      <button class="btn btn-ghost" data-reset="1">Reset settings</button></div>
    <div class="ctrl-grid">${sc('n64')}${sc('remake')}</div>
    <div class="section-t">Controllers</div>
    <div class="card set-card"><div class="pad-list" id="padList">${padListHTML()}</div></div>
    <div class="section-t">Settings</div>
    <div class="ctrl-grid">
      <div class="card set-card"><h3>Feel</h3>${SETTINGS.feel.map(setRow).join('')}</div>
      <div class="card set-card"><h3>Sound</h3>${SETTINGS.sound.map(setRow).join('')}</div>
      <div class="card set-card"><h3>Display</h3>${SETTINGS.display.map(setRow).join('')}</div>
      <div class="card set-card"><h3>Songs</h3>${SETTINGS.songs.map(setRow).join('')}</div>
    </div>`;
}
function refreshPadList() { const pl = $('#padList'); if (pl) pl.innerHTML = padListHTML(); }

$('#page-controls').addEventListener('click', (e) => {
  const card = e.target.closest('[data-scheme-card]');
  if (card) { setScheme(card.dataset.schemeCard); return; }
  const w = e.target.closest('[data-wiz]');
  if (w) { startWizard(+w.dataset.wiz); return; }
  const u = e.target.closest('[data-unmap]');
  if (u) {
    const p = input.pads().find((x) => x.index === +u.dataset.unmap);
    if (p) { delete S.bindings[`${S.scheme}|${p.id}`]; save(); refreshPadList(); toast('Mapping reset to defaults'); }
    return;
  }
  if (e.target.closest('[data-reset]')) {
    if (!confirm('Reset all settings? Your songs and controller mappings are kept.')) return;
    resetSettings(); synth.setVolume(S.volume); synth.setReverb(S.reverb); synth.setVibratoRate(S.vibratoRate); synth.applyTimbre();
    refreshStyle(true); toast('Settings reset');
  }
});
$('#page-controls').addEventListener('input', (e) => {
  const k = e.target.dataset.set; if (!k) return;
  const def = Object.values(SETTINGS).flat().find((o) => o.key === k);
  let v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (def && def.num) v = +v;
  S[k] = v;
  if (def && def.type === 'range') { const out = e.target.parentElement.querySelector('output'); if (out) out.textContent = def.fmt ? def.fmt(v) : v; }
  if (def && def.type === 'toggle') e.target.parentElement.lastChild.textContent = v ? ' On' : ' Off';
  if (k === 'volume') synth.setVolume(v);
  if (k === 'reverb') synth.setReverb(v);
  if (k === 'vibratoRate') synth.setVibratoRate(v);
  if (k === 'vibratoDepth') synth.lastVib = -1;
  if (k === 'timbre') synth.applyTimbre();
});
$('#page-controls').addEventListener('change', (e) => {
  const k = e.target.dataset.set; if (!k) return;
  save();
  if (k === 'labelStyle') refreshStyle(true);
  else if (['skin', 'showKeys', 'noteNames', 'octave'].includes(k)) { fresh.play = false; fresh.notes = false; fresh.songs = false; if (k !== 'skin') lastNoteKey = ''; }
  if (k === 'octave' && synth.sounding) synth.noteOff();
});

let testerTick = 0;
function updateTester() {
  if (page !== 'controls' || wizard) return;
  if (++testerTick % 4) return;
  for (const t of $$('[data-tester]')) {
    const p = navigator.getGamepads()[+t.dataset.tester];
    if (!p) continue;
    t.innerHTML = p.buttons.map((b, i) => `<i class="${b.pressed || b.value > 0.5 ? 'on' : ''}">b${i}</i>`).join('') + p.axes.map((a, i) => `<i class="${Math.abs(a) > 0.5 ? 'on' : ''}">a${i} ${a >= 0 ? '+' : ''}${a.toFixed(2)}</i>`).join('');
  }
}

// ---- Mapping wizard
let wizard = null;
function wizSteps() {
  const n64 = S.scheme === 'n64';
  const nm = (id) => G.buttonName(id, S.scheme, STY);
  return [
    ...['a', 'cu', 'cd', 'cl', 'cr'].map((k) => ({ key: k, kind: 'button', prompt: `Press ${n64 ? nm(k) : `the button you want for ${M.noteParts(M.BASE_MIDI[k]).label} (${nm(k)})`}`, art: icon(k) })),
    { key: 'sharp', kind: 'button', prompt: n64 ? 'Press R (sharp)' : 'Press D-pad up (sharp)', art: G.modIcon('sharp', S.scheme) },
    { key: 'flat', kind: 'button', prompt: n64 ? 'Press Z (flat)' : 'Press D-pad down (flat)', art: G.modIcon('flat', S.scheme) },
    { key: 'bendY', kind: 'axis', prompt: `Push the ${n64 ? 'Control Stick' : 'left stick'} all the way UP`, art: G.stickIcon(2) },
    { key: 'vibX', kind: 'axis', prompt: `Push the ${n64 ? 'Control Stick' : 'left stick'} all the way RIGHT`, art: G.vibIcon() },
  ];
}
function snapshot(p) { return { b: p.buttons.map((x) => x.pressed || x.value > 0.5), a: [...p.axes] }; }
function startWizard(index) {
  const p = navigator.getGamepads()[index];
  if (!p) return;
  engine.stopAuto();
  input.enabled = false;
  wizard = { index, id: p.id, i: 0, map: {}, base: null, wait: true, steps: wizSteps() };
  renderWizard();
  modalClose = () => { wizard = null; input.enabled = true; };
}
function renderWizard() {
  const w = wizard;
  const s = w.steps[w.i];
  openModal(`<h2>Map your controller</h2><p class="m-sub">${esc(w.id)}</p>
    <div class="wiz-step"><div class="wiz-icon"><span class="combo" style="font-size:110px">${s.art}</span></div><div class="wiz-prompt">${esc(s.prompt)}</div>
    <p class="m-sub">${w.wait ? 'Let go of everything first…' : 'Waiting for input…'}</p>
    <div class="m-controls" style="justify-content:center"><button class="btn btn-sm" data-wz="skip">Skip (keep default)</button><button class="btn btn-sm btn-ghost" data-wz="cancel">Cancel</button></div>
    <div class="wiz-list">${w.steps.map((x, i) => `<span class="${i < w.i ? 'done' : i === w.i ? 'cur' : ''}">${esc(x.prompt.replace(/^Press |^Push the /, ''))}</span>`).join('')}</div></div>`, () => { wizard = null; input.enabled = true; });
  $('#modalBody').onclick = (e) => {
    const b = e.target.closest('[data-wz]'); if (!b) return;
    if (b.dataset.wz === 'cancel') closeModal();
    if (b.dataset.wz === 'skip') wizNext(null);
  };
}
function wizNext(binding) {
  const w = wizard;
  const s = w.steps[w.i];
  const def = SCHEMES[S.scheme].std[s.key];
  w.map[s.key] = binding ? (s.kind === 'button' ? [binding] : binding) : def;
  w.i++; w.wait = true; w.base = null;
  if (w.i >= w.steps.length) {
    S.bindings[`${S.scheme}|${w.id}`] = w.map; save();
    closeModal(); refreshPadList(); toast('Controller mapped! Go play.');
    return;
  }
  renderWizard();
}
function wizardFrame() {
  const w = wizard; if (!w) return;
  const p = navigator.getGamepads()[w.index];
  if (!p) return;
  const snap = snapshot(p);
  if (w.wait) {
    const quiet = !snap.b.some(Boolean) && (!w.rest || snap.a.every((v, i) => Math.abs(v - w.rest[i]) < 0.3));
    const t = performance.now();
    if (!quiet) w.quietSince = 0;
    else if (!w.quietSince) w.quietSince = t;
    else if (t - w.quietSince > 150) { w.wait = false; w.quietSince = 0; w.base = snap; w.rest = w.rest || snap.a; renderWizard(); }
    return;
  }
  const s = w.steps[w.i];
  if (s.kind === 'button') {
    const bi = snap.b.findIndex((v, i) => v && !w.base.b[i]);
    if (bi >= 0) return wizNext({ t: 'b', i: bi });
  }
  let best = -1, bd = 0;
  snap.a.forEach((v, i) => { const d = v - w.base.a[i]; if (Math.abs(d) > 0.6 && Math.abs(d) > Math.abs(bd)) { bd = d; best = i; } });
  if (best >= 0) {
    if (s.kind === 'button') return wizNext({ t: 'a', i: best, s: Math.sign(bd) });
    return wizNext({ i: best, inv: bd < 0 });
  }
}

// ------------------------------------------------------------------ TIPS page
function renderTips() {
  const c = (id, half = 0, bend = 0) => combo({ id, half, bend });
  const n64 = S.scheme === 'n64';
  const R = n64 ? 'R' : 'D-pad up', Z = n64 ? 'Z' : 'D-pad down', stick = n64 ? 'Control Stick' : 'left stick';
  $('#page-tips').innerHTML = `
  <div class="page-head"><div><h1>Tips &amp; Tricks</h1><p>How to get real music out of five buttons. Fingerings below use your current layout (${SCHEMES[S.scheme].name}).</p></div></div>
  <div class="tips-grid">
    <article class="card tip"><h3><span class="n">1</span>Learn the five naturals first</h3>
      <p>${c('a')} D · ${c('cd')} F · ${c('cr')} A · ${c('cl')} B · ${c('cu')} high D</p>
      <p>Every game melody uses only these. Play them up and down until your thumb finds each one without looking. The <b>Five natural notes</b> exercise on the Songs page drills exactly this.</p></article>
    <article class="card tip"><h3><span class="n">2</span>Prefer the modifier for half steps</h3>
      <p>For a sharp or flat, hold <b>${R}</b> or <b>${Z}</b> rather than nudging the stick. The modifier is exactly in tune every time, while a half tilt takes a lot of precision.</p>
      <p>F♯ = ${c('cd', 1)} &nbsp; E = ${c('cd', -1)} &nbsp; C = ${c('cl', 1)}</p></article>
    <article class="card tip"><h3><span class="n">3</span>The G problem</h3>
      <p>G sits right between F and A, so it's the one note in the middle of the range that <b>needs the stick</b>. Either push F fully up or pull A fully down:</p>
      <p>${c('cd', 0, 2)} &nbsp;or&nbsp; ${c('cr', 0, -2)}</p>
      <p>Pick whichever is closer to the note before it. Going F → G → A? Hold F, tilt up for G, then switch to A with the stick centered.</p></article>
    <article class="card tip"><h3><span class="n">4</span>Hold the bend before you press</h3>
      <p>Tilt the ${stick} <i>first</i>, then press the note. The note starts at the right pitch and you skip the audible "scoop". The Tuning meter on the Play page shows whether you've landed. Green means in tune.</p>
      <p>Turn on <b>Snap to semitones</b> in Controls if you want every full tilt to land exactly.</p></article>
    <article class="card tip"><h3><span class="n">5</span>Modifiers re-articulate</h3>
      <p>As in the N64 game, pressing or releasing ${R}/${Z} while a note is held starts a <i>new</i> note. You can use this for quick trills: hold ${icon('cr')} and tap ${R} to alternate A and A♯ without re-pressing the note.</p></article>
    <article class="card tip"><h3><span class="n">6</span>Vibrato like a singer</h3>
      <p>Tilt the stick sideways ${G.vibIcon({ cls: '' }).replace('class="si', 'style="width:24px;height:24px;vertical-align:middle" class="si')} only on <b>long</b> notes, and let it bloom in after the note has started. Shallow vibrato on held notes sounds expressive. Constant deep vibrato sounds seasick. Depth and speed are adjustable in Controls.</p></article>
    <article class="card tip"><h3><span class="n">7</span>Repeated notes need a re-press</h3>
      <p>Two of the same note in a row (A, A in the Serenade) means letting go and pressing again. Leave a tiny gap so each note is distinct, and keep it short so the melody doesn't sound choppy.</p></article>
    <article class="card tip"><h3><span class="n">8</span>Slides and bends for expression</h3>
      <p>Start a note a half step low with the stick slightly down, then roll it to center for a bluesy scoop into the pitch. Or end a long note by easing the stick down for a falling sigh. These are the small touches that make players sound fluent.</p></article>
    <article class="card tip"><h3><span class="n">9</span>Pick an easy key</h3>
      <p>With the naturals D F A B D plus one modifier you get almost everything. The <b>Auto</b> transpose on each classic tries every key and keeps the one with the fewest stick moves. When you write your own songs, try a few keys with the − / + buttons and see which feels best.</p></article>
    <article class="card tip"><h3><span class="n">10</span>Range limits</h3>
      <p>The lowest note is B3 (${c('a', -1, -2)}) and the highest is F5 (${c('cu', 1, 2)}). Anything outside that has to be transposed. If a melody spans more than about an octave and a half, it won't fit in any key.</p></article>
    <article class="card tip"><h3><span class="n">11</span>Real N64 controllers</h3>
      <ul><li>Use a USB adapter (raphnet, Mayflash) or the Nintendo Switch Online N64 controller.</li>
      <li>Run <b>Map buttons</b> in Controls. The wizard handles adapters that report the C-buttons as an axis.</li>
      <li>Old sticks rarely reach full range. The app auto-calibrates, so wiggle the stick to its edges once.</li>
      <li>If a worn stick drifts and adds unwanted bend, raise the <b>dead zone</b>.</li></ul></article>
    <article class="card tip"><h3><span class="n">12</span>Cut the latency</h3>
      <ul><li>Wired controllers and wired headphones respond fastest. Bluetooth audio can add 150 ms or more.</li>
      <li>Chrome and Edge have the best controller support.</li>
      <li>Keep the tab in the foreground, because browsers pause controller input in background tabs.</li></ul></article>
    <article class="card tip wide"><h3><span class="n">✦</span>A practice routine that works</h3>
      <p><b>1.</b> Press <b>Listen</b> on a song and watch the instrument view to see which buttons move. <b>2.</b> Press <b>Practice</b> and play it slowly, using the tempo slider in the song's details. <b>3.</b> Speed back up. <b>4.</b> Use the <b>Recorder</b> to capture your take and compare. Then make something of your own with <b>+ New song</b>, or teach the <b>Scarecrow's Song</b>.</p></article>
  </div>`;
}

// ------------------------------------------------------------------ pad status / mini
function padName(id) { return id.replace(/\s*\((?:STANDARD GAMEPAD|Vendor|.*Vendor:).*\)\s*$/i, '').replace(/^[0-9a-f]{4}-[0-9a-f]{4}-/i, '') || id; }
let padSig = '';
function updatePadStatus() {
  const pads = input.pads();
  const sig = pads.map((p) => p.index + p.id).join('|') + S.scheme;
  if (sig === padSig) return;
  padSig = sig;
  const b = $('#padStatus');
  if (!pads.length) { b.className = 'pad-status'; b.innerHTML = '<i class="dot"></i><span>Keyboard ready. Connect a controller.</span>'; }
  else {
    const p = pads[0];
    const warn = p.mapping !== 'standard' && !S.bindings[`${S.scheme}|${p.id}`];
    b.className = `pad-status ${warn ? 'warn' : 'on'}`;
    b.innerHTML = `<i class="dot"></i><span>${esc(padName(p.id))}${pads.length > 1 ? ` +${pads.length - 1}` : ''}${warn ? ' (needs mapping)' : ''}</span>`;
    if (warn) toast('That controller uses a non-standard layout. Open Controls and press "Map buttons".', 5000);
  }
  refreshStyle(false);
  if (page === 'controls') refreshPadList();
}
$('#padStatus').addEventListener('click', () => { location.hash = '#/controls'; });
window.addEventListener('gamepadconnected', updatePadStatus);
window.addEventListener('gamepaddisconnected', updatePadStatus);

const mini = $('#miniNow');
let miniKey = '';
function updateMini(force, f) {
  const show = page !== 'play' && engine.lastMidi != null;
  mini.hidden = !show;
  if (!show) return;
  const fr = f || { active: engine.active, half: engine.half, bend: engine.bend, midi: engine.midi };
  const sounding = fr.active != null;
  const key = sounding ? `${fr.active}|${fr.half}|${Math.round(fr.bend)}|${Math.round(fr.midi)}` : 'idle';
  if (key === miniKey && !force) return;
  miniKey = key;
  mini.classList.toggle('idle', !sounding);
  if (sounding) {
    const b = Math.abs(fr.bend) < 0.25 ? 0 : Math.abs(fr.bend) > 1.5 ? 2 * Math.sign(fr.bend) : Math.sign(fr.bend);
    mini.innerHTML = `${combo({ id: fr.active, half: fr.half, bend: b })}<b>${M.noteParts(fr.midi, namePref()).label}</b>`;
  }
}
mini.addEventListener('click', () => { location.hash = '#/play'; });

// ------------------------------------------------------------------ background motes
function motes() {
  const cv = $('#motes'), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, dpr;
  const ps = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, s: 0.004 + Math.random() * 0.012, p: Math.random() * 6.28, h: Math.random() < 0.7 ? '244,226,168' : '134,227,185' }));
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
  size(); addEventListener('resize', size);
  let boost = 0;
  engine.on('noteStart', () => { boost = 1; });
  let last = performance.now();
  const draw = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    boost = Math.max(0, boost - dt * 1.2);
    ctx.clearRect(0, 0, W, H);
    for (const m of ps) {
      if (!reduce) { m.y -= m.s * dt * (1 + boost * 3); m.x += Math.sin(t / 1800 + m.p) * 0.00012; if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); } }
      const a = 0.25 + 0.35 * Math.sin(t / 700 + m.p) ** 2 + boost * 0.3;
      const g = ctx.createRadialGradient(m.x * W, m.y * H, 0, m.x * W, m.y * H, m.r * 5 * dpr);
      g.addColorStop(0, `rgba(${m.h},${a})`); g.addColorStop(1, `rgba(${m.h},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x * W, m.y * H, m.r * 5 * dpr, 0, 6.283); ctx.fill();
    }
    if (!reduce || boost > 0) requestAnimationFrame(draw);
    else setTimeout(() => requestAnimationFrame(draw), 500);
  };
  requestAnimationFrame(draw);
}

// ------------------------------------------------------------------ main loop
engine.on('frame', (f) => {
  if (page === 'play') { updateNote(f); updateVisuals(f); }
  practiceFrame(f);
  recFrame(f);
  updateNotesLive(f);
  updateMini(false, f);
  updateTester();
});

let lastT = performance.now();
let padCheck = 0;
function loop(t) {
  const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000));
  lastT = t;
  if (wizard) wizardFrame();
  engine.tick(dt);
  if ((padCheck += dt) > 1) { padCheck = 0; updatePadStatus(); }
  requestAnimationFrame(loop);
}

updatePadStatus();
route();
motes();
requestAnimationFrame(loop);

// Debug/automation hook
window.ocarina = { engine, input, synth, settings: S, M, get wizard() { return wizard; } };

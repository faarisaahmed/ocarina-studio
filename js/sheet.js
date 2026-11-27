// Sheet music rendering (VexFlow, loaded on demand) with ocarina tab under each note.

let vexPromise = null;
function loadVex() {
  if (window.Vex) return Promise.resolve(window.Vex);
  vexPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'assets/vendor/vexflow-bravura.js';
    s.onload = () => resolve(window.Vex);
    s.onerror = () => { vexPromise = null; reject(new Error('Could not load the music engraver.')); };
    document.head.appendChild(s);
  });
  return vexPromise;
}

const DURS = [[4, 'w', 0], [3, 'h', 1], [2, 'h', 0], [1.5, 'q', 1], [1, 'q', 0], [0.75, '8', 1], [0.5, '8', 0], [0.375, '16', 1], [0.25, '16', 0], [0.125, '32', 0]];
function splitDur(len) {
  const out = [];
  let left = len;
  while (left > 1e-6) {
    const d = DURS.find(([b]) => b <= left + 1e-6) || DURS[DURS.length - 1];
    out.push({ code: d[1], dots: d[2] });
    left -= d[0];
  }
  return out;
}

// ---- Key signature choice and note spelling
const SHARP_N = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const FLAT_N = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];
const KEYS = [
  ['C', 0, 0], ['G', 7, 1], ['D', 2, 1], ['A', 9, 1], ['E', 4, 1], ['B', 11, 1],
  ['F', 5, -1], ['Bb', 10, -1], ['Eb', 3, -1], ['Ab', 8, -1], ['Db', 1, -1],
];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

function keyInfo([name, tonic, dir]) {
  const names = dir < 0 ? FLAT_N : SHARP_N;
  const scale = new Map(MAJOR.map((o) => { const pc = (tonic + o) % 12; return [pc, names[pc]]; }));
  const sig = {};
  for (const n of scale.values()) if (n.length > 1) sig[n[0]] = n[1];
  return { name, dir, scale, sig, count: Object.keys(sig).length };
}

function chooseKey(midis) {
  let best = null, bestScore = Infinity;
  for (const k of KEYS.map(keyInfo)) {
    const outside = midis.filter((m) => !k.scale.has(((m % 12) + 12) % 12)).length;
    const score = outside * 10 + k.count;
    if (score < bestScore) { bestScore = score; best = k; }
  }
  return best;
}

function spell(midi, key) {
  const pc = ((midi % 12) + 12) % 12;
  const name = key.scale.get(pc) || (key.dir < 0 ? FLAT_N : SHARP_N)[pc];
  let octave = Math.floor(midi / 12) - 1;
  return { letter: name[0], acc: name.length > 1 ? name[1] : 'n', octave };
}

/** Group events into measures, using the song's bar lines when it has them. */
function buildMeasures(events, meter) {
  const [num, den] = meter.split('/').map(Number);
  const cap = (num * 4) / den;
  const hasBars = events.some((e) => e.barAfter);
  const measures = [];
  let cur = [], acc = 0;
  events.forEach((e, i) => {
    if (hasBars) {
      cur.push({ ...e, i, len: e.beats });
      if (e.barAfter) { measures.push(cur); cur = []; }
      return;
    }
    let left = e.beats, first = true;
    while (left > 1e-6) {
      const take = Math.min(left, cap - acc);
      left -= take; acc += take;
      cur.push({ ...e, i, len: take, cont: !first, tieOn: left > 1e-6 });
      first = false;
      if (cap - acc < 1e-6) { measures.push(cur); cur = []; acc = 0; }
    }
  });
  if (cur.length) measures.push(cur);
  return measures;
}

/**
 * Render a song as sheet music.
 * opts.tabOf(event) -> short fingering text printed under the note
 * Returns { highlight(eventIndex) }.
 */
export async function renderSheet(el, events, opts) {
  const Vex = await loadVex();
  const VF = Vex.Flow;
  const meter = opts.meter || '4/4';
  const [num, den] = meter.split('/').map(Number);
  el.innerHTML = '';
  el.classList.remove('sheet-short');
  const width = Math.max(300, el.clientWidth - 16);
  const measures = buildMeasures(events, meter);
  const key = chooseKey(events.filter((e) => e.midi != null && !e.out).map((e) => e.midi));

  // Lay out lines so every note gets enough room for its fingering label.
  const NOTE_W = 34;
  const weight = (m) => m.reduce((a, p) => a + (p.midi == null || p.cont ? 0.8 : Math.max(1.1, (opts.tabOf(p) || '').length * 0.32)), 0) + 1.2;
  const layout = [];
  let line = [], used = 0;
  measures.forEach((m, mi) => {
    const lead = (line.length === 0 ? 1.6 : 0) + (mi === 0 ? 0.9 + key.count * 0.35 : line.length === 0 ? key.count * 0.35 : 0);
    const w = weight(m) + lead;
    if (line.length && (used + w) * NOTE_W > width) { layout.push(line); line = []; used = 0; }
    const lead2 = (line.length === 0 ? 1.6 : 0) + (mi === 0 ? 0.9 + key.count * 0.35 : line.length === 0 ? key.count * 0.35 : 0);
    line.push({ mi, w: weight(m) + lead2, lead: lead2 });
    used += weight(m) + lead2;
  });
  if (line.length) layout.push(line);
  const lineH = 140;
  const renderer = new VF.Renderer(el, VF.Renderer.Backends.SVG);
  renderer.resize(width, layout.length * lineH + 16);
  const ctx = renderer.getContext();
  const byEvent = [];
  const ties = [];
  let pendingTie = null;
  const groups = VF.Beam.getDefaultBeamGroups(meter);

  const placement = [];
  layout.forEach((ln, li) => {
    const total = ln.reduce((a, c) => a + c.w, 0);
    const last = li === layout.length - 1;
    // the last line doesn't stretch to full width when it's short
    const scale = last && total * NOTE_W < width * 0.7 ? NOTE_W * 1.15 : (width - 4) / total;
    let x = 2;
    for (const c of ln) { placement[c.mi] = { x, w: c.w * scale, line: li, first: c === ln[0], lead: c.lead * NOTE_W }; x += c.w * scale; }
    if (layout.length === 1) { renderer.resize(Math.ceil(x + 4), lineH + 16); el.classList.add('sheet-short'); }
  });

  measures.forEach((m, mi) => {
    const P = placement[mi];
    const baseW = P.w;
    const lead = P.lead;
    const stave = new VF.Stave(P.x, 6 + P.line * lineH, baseW);
    if (P.first) { stave.addClef('treble'); if (key.count) stave.addKeySignature(key.name); }
    if (mi === 0) stave.addTimeSignature(meter);
    if (mi === measures.length - 1) stave.setEndBarType(VF.Barline.type.END);
    stave.setContext(ctx).draw();

    const notes = [];
    const state = {};
    for (const part of m) {
      const rest = part.midi == null || part.out;
      const sp = rest ? null : spell(part.midi, key);
      const vkey = rest ? 'b/4' : `${sp.letter}${sp.acc === 'n' ? '' : sp.acc}/${sp.octave}`;
      const pieces = splitDur(part.len);
      pieces.forEach((pc, pi) => {
        const sn = new VF.StaveNote({ keys: [vkey], duration: pc.code + (rest ? 'r' : ''), dots: pc.dots, stem_direction: VF.Stem.UP });
        if (pc.dots) VF.Dot.buildAndAttach([sn], { all: true });
        if (!rest && pi === 0) {
          const slot = sp.letter + sp.octave;
          const current = state[slot] || key.sig[sp.letter] || 'n';
          if (current !== sp.acc && !part.cont) sn.addModifier(new VF.Accidental(sp.acc), 0);
          state[slot] = sp.acc;
        }
        if (!rest && pi === 0 && !part.cont) {
          const t = opts.tabOf(part);
          if (t) {
            const ann = new VF.Annotation(t);
            ann.setFont('Inter, Arial, sans-serif', 11, 'normal');
            ann.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
            sn.addModifier(ann, 0);
          }
        }
        if (!rest && pendingTie) ties.push([pendingTie, sn]);
        pendingTie = !rest && (pi < pieces.length - 1 || part.tieOn) ? sn : null;
        notes.push(sn);
        (byEvent[part.i] ||= []).push(sn);
      });
    }
    const voice = new VF.Voice({ num_beats: num, beat_value: den }).setMode(VF.Voice.Mode.SOFT);
    voice.addTickables(notes);
    new VF.Formatter().joinVoices([voice]).format([voice], Math.max(40, baseW - lead - 28));
    voice.draw(ctx, stave);
    VF.Beam.generateBeams(notes, { groups, stem_direction: VF.Stem.UP }).forEach((b) => b.setContext(ctx).draw());
  });
  for (const [a, b] of ties) {
    new VF.StaveTie({ first_note: a, last_note: b, first_indices: [0], last_indices: [0] }).setContext(ctx).draw();
  }

  let lit = [];
  return {
    highlight(i) {
      lit.forEach((n) => n.classList.remove('sheet-cur'));
      lit = (byEvent[i] || []).map((n) => n.getSVGElement()).filter(Boolean);
      lit.forEach((n) => n.classList.add('sheet-cur'));
      if (lit[0] && opts.scroll !== false) lit[0].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    },
    clear() { lit.forEach((n) => n.classList.remove('sheet-cur')); lit = []; },
  };
}

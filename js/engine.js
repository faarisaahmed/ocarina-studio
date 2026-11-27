// Turns the merged input state into ocarina behaviour, like the game:
//  - monophonic, the most recently pressed note button wins
//  - the sharp/flat modifier re-articulates (starts a new note)
//  - the stick bends continuously (or snaps), sideways tilt = vibrato
// Also runs an "autoplay" performer used for demos, which drives the exact
// same virtual buttons so the visuals show the fingering.
import { NOTE_IDS, BASE_MIDI, BEND_RANGE } from './music.js';

const blank = () => ({ notes: { a: false, cd: false, cr: false, cl: false, cu: false }, sharp: false, flat: false, bendY: 0, vibX: 0 });

function stateFor(c) {
  const s = blank();
  s.notes[c.id] = true;
  s.sharp = c.half > 0;
  s.flat = c.half < 0;
  s.bendY = c.bend / BEND_RANGE;
  return s;
}

function snap(y) {
  const a = Math.abs(y);
  return Math.sign(y) * (a > 0.8 ? 2 : a > 0.3 ? 1 : 0);
}

export class Engine {
  constructor(synth, input, settings) {
    this.synth = synth;
    this.input = input;
    this.s = settings;
    this.order = [];
    this.prevNotes = {};
    this.active = null;
    this.half = 0;
    this.bend = 0;
    this.vib = 0;
    this.midi = null;
    this.lastMidi = null;
    this.auto = null;
    this.handlers = {};
    this.state = blank();
  }

  on(evt, fn) { (this.handlers[evt] ||= []).push(fn); }
  emit(evt, data) { (this.handlers[evt] || []).forEach((fn) => fn(data)); }

  tick(dt) {
    let s = this.input.poll(dt);
    if (this.auto) {
      const manual = NOTE_IDS.some((id) => s.notes[id]);
      if (manual && !this.prevManual) this.stopAuto();
      else { this.stepAuto(dt); if (this.auto) s = this.auto.state; }
      this.prevManual = manual;
    } else {
      this.prevManual = NOTE_IDS.some((id) => s.notes[id]);
    }
    this.state = s;

    const pressed = [];
    for (const id of NOTE_IDS) {
      const now = !!s.notes[id], was = !!this.prevNotes[id];
      if (now && !was) { this.order = this.order.filter((x) => x !== id); this.order.push(id); pressed.push(id); }
      else if (!now && was) this.order = this.order.filter((x) => x !== id);
      this.prevNotes[id] = now;
    }

    const half = (s.sharp ? 1 : 0) - (s.flat ? 1 : 0);
    const bend = this.s.bendMode === 'snap' ? snap(s.bendY) : s.bendY * BEND_RANGE;
    const vib = Math.min(1, Math.abs(s.vibX));
    const active = this.order.length ? this.order[this.order.length - 1] : null;
    const midi = active ? BASE_MIDI[active] + half + bend : null;
    const oct = 12 * (this.s.octave || 0);
    const auto = !!this.auto;

    if (this.active && this.active !== active) this.emit('noteEnd', { id: this.active, auto });

    if (active) {
      const fresh = pressed.includes(active);
      if (this.active !== active || fresh) {
        this.synth.noteOn(midi + oct, this.active != null);
        if (fresh) this.emit('noteStart', { id: active, half, bend, midi, auto });
      } else if (half !== this.half) {
        this.synth.noteOn(midi + oct, true); // modifier change = new note, like the N64 game
      } else {
        this.synth.setPitch(midi + oct);
      }
      this.lastMidi = midi;
    } else if (this.active) {
      this.synth.noteOff();
    }
    this.synth.setVibrato(active ? vib : 0);

    this.active = active; this.half = half; this.bend = bend; this.vib = vib; this.midi = midi;
    this.emit('frame', { active, half, bend, vib, midi, s, auto, dt });
  }

  /** events: [{ combo:{id,half,bend}|null, beats }] */
  autoplay(events, bpm, onDone, onStep) {
    this.stopAuto(true);
    this.auto = { events, i: -1, phase: 'gap', t: 0.06, spb: 60 / bpm, onDone, onStep, state: blank(), onDur: 0, onLeft: 0 };
    this.emit('autoStart', {});
  }

  stopAuto(silent) {
    if (!this.auto) return;
    this.auto = null;
    if (!silent) this.emit('autoStop', {});
  }

  stepAuto(dt) {
    const a = this.auto;
    a.t -= dt;
    if (a.phase === 'on') {
      const prog = 1 - Math.max(0, a.t) / a.onDur;
      // Expressive touch: long notes get vibrato that blooms in.
      a.state.vibX = a.onDur > 0.75 && prog > 0.4 ? Math.min(0.55, (prog - 0.4) * 1.4) : 0;
    }
    if (a.t > 0) return;
    if (a.phase === 'on') {
      const e = a.events[a.i];
      a.state = blank();
      a.phase = 'gap';
      a.t += Math.max(0.04, e.beats * a.spb * 0.1);
      return;
    }
    a.i++;
    if (a.i >= a.events.length) {
      const cb = a.onDone;
      this.auto = null;
      this.emit('autoStop', { done: true });
      cb && cb();
      return;
    }
    const e = a.events[a.i];
    const dur = e.beats * a.spb;
    if (!e.combo) { a.state = blank(); a.phase = 'gap'; a.t += dur; }
    else {
      a.state = stateFor(e.combo);
      a.phase = 'on';
      a.onDur = Math.max(0.05, dur - Math.max(0.04, dur * 0.1));
      a.t += a.onDur;
    }
    a.onStep && a.onStep(a.i);
  }
}

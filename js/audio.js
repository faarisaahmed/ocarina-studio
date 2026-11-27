// A small Web Audio ocarina synth: near-sine tone, a little breath noise,
// a "chiff" on each attack, LFO vibrato, and a generated reverb.
import { midiToFreq } from './music.js';

const TIMBRES = {
  glaze: { h: [1, 0.07, 0.03, 0.01], breath: 0.035, chiff: 0.2, lp: 3400 },
  clay: { h: [1, 0.14, 0.06, 0.025], breath: 0.075, chiff: 0.3, lp: 2600 },
  pure: { h: [1, 0.015, 0.004, 0], breath: 0.012, chiff: 0.1, lp: 5000 },
};

function hold(p, t) {
  if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);
  else { const v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); }
}

export class OcarinaSynth {
  constructor(settings) {
    this.s = settings;
    this.ctx = null;
    this.sounding = false;
    this.lastMidi = null;
    this.lastVib = -1;
  }

  get ready() { return !!this.ctx; }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC({ latencyHint: 'interactive' }));

    this.master = ctx.createGain();
    this.master.gain.value = this.s.volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.003; comp.release.value = 0.25;
    this.master.connect(comp); comp.connect(ctx.destination);

    this.dry = ctx.createGain(); this.dry.connect(this.master);
    this.wet = ctx.createGain(); this.wet.gain.value = this.s.reverb;
    this.conv = ctx.createConvolver(); this.conv.buffer = this.impulse(2.8, 3.2);
    this.wet.connect(this.conv); this.conv.connect(this.master);

    this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.Q.value = 0.4;
    this.trem = ctx.createGain(); this.trem.gain.value = 1;
    this.env = ctx.createGain(); this.env.gain.value = 0;
    this.env.connect(this.trem); this.trem.connect(this.lp);
    this.lp.connect(this.dry); this.lp.connect(this.wet);

    // Vibrato LFO: pitch (cents on detune) + a touch of amplitude.
    this.lfo = ctx.createOscillator(); this.lfo.frequency.value = this.s.vibratoRate;
    this.lfoCents = ctx.createGain(); this.lfoCents.gain.value = 0;
    this.lfoAmp = ctx.createGain(); this.lfoAmp.gain.value = 0;
    this.lfo.connect(this.lfoCents); this.lfo.connect(this.lfoAmp); this.lfoAmp.connect(this.trem.gain);

    this.oscs = []; this.hg = [];
    for (let i = 0; i < 4; i++) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 440 * (i + 1);
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(g); g.connect(this.env); this.lfoCents.connect(o.detune);
      o.start(); this.oscs.push(o); this.hg.push(g);
    }

    const len = ctx.sampleRate * 2;
    const nb = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = ctx.createBufferSource(); this.noise.buffer = nb; this.noise.loop = true;

    this.nbp = ctx.createBiquadFilter(); this.nbp.type = 'bandpass'; this.nbp.Q.value = 3; this.nbp.frequency.value = 900;
    this.breath = ctx.createGain();
    this.noise.connect(this.nbp); this.nbp.connect(this.breath); this.breath.connect(this.env);

    this.chiffF = ctx.createBiquadFilter(); this.chiffF.type = 'bandpass'; this.chiffF.Q.value = 0.9;
    this.chiff = ctx.createGain(); this.chiff.gain.value = 0;
    this.noise.connect(this.chiffF); this.chiffF.connect(this.chiff);
    this.chiff.connect(this.dry); this.chiff.connect(this.wet);

    this.noise.start(); this.lfo.start();
    this.applyTimbre();
  }

  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); }

  impulse(seconds, decay) {
    const ctx = this.ctx, rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (i < rate * 0.01 ? i / (rate * 0.01) : 1);
      }
    }
    return buf;
  }

  get timbre() { return TIMBRES[this.s.timbre] || TIMBRES.glaze; }

  applyTimbre() {
    if (!this.ctx) return;
    const T = this.timbre, t = this.ctx.currentTime;
    this.hg.forEach((g, i) => g.gain.setTargetAtTime((T.h[i] || 0) * 0.55, t, 0.02));
    this.breath.gain.setTargetAtTime(T.breath, t, 0.02);
    this.lp.frequency.setTargetAtTime(T.lp, t, 0.02);
  }

  setVolume(v) { if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03); }
  setReverb(v) { if (this.ctx) this.wet.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03); }
  setVibratoRate(r) { if (this.ctx) this.lfo.frequency.setTargetAtTime(r, this.ctx.currentTime, 0.05); }

  setFreqs(midi, t, mode) {
    const f = midiToFreq(midi);
    this.oscs.forEach((o, i) => {
      const p = o.frequency;
      hold(p, t);
      if (mode === 'jump') p.setValueAtTime(f * (i + 1), t);
      else p.setTargetAtTime(f * (i + 1), t, mode === 'fast' ? 0.006 : 0.014);
    });
    this.nbp.frequency.setTargetAtTime(Math.min(9000, f * 2), t, 0.01);
    this.lastMidi = midi;
  }

  noteOn(midi, legato = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, T = this.timbre;
    const slur = legato && this.sounding;
    this.setFreqs(midi, t, slur ? 'fast' : 'jump');
    const g = this.env.gain;
    hold(g, t);
    const peak = 0.5;
    if (slur) {
      g.linearRampToValueAtTime(Math.max(0.12, g.value * 0.45), t + 0.014);
      g.setTargetAtTime(peak, t + 0.016, 0.02);
    } else {
      g.setTargetAtTime(peak, t, 0.013);
    }
    const c = this.chiff.gain;
    hold(c, t);
    c.linearRampToValueAtTime(T.chiff * (slur ? 0.5 : 1), t + 0.008);
    c.setTargetAtTime(0, t + 0.012, 0.022);
    this.chiffF.frequency.setValueAtTime(Math.min(9000, midiToFreq(midi) * 4), t);
    this.sounding = true;
  }

  setPitch(midi) {
    if (!this.ctx || !this.sounding) return;
    if (this.lastMidi != null && Math.abs(midi - this.lastMidi) < 0.002) return;
    this.setFreqs(midi, this.ctx.currentTime, 'glide');
  }

  noteOff() {
    if (!this.ctx || !this.sounding) return;
    const t = this.ctx.currentTime, g = this.env.gain;
    hold(g, t);
    g.setTargetAtTime(0, t, 0.045);
    this.sounding = false;
  }

  setVibrato(amount) {
    if (!this.ctx) return;
    const a = Math.round(amount * 100) / 100;
    if (a === this.lastVib) return;
    this.lastVib = a;
    const t = this.ctx.currentTime;
    this.lfoCents.gain.setTargetAtTime(a * this.s.vibratoDepth, t, 0.05);
    this.lfoAmp.gain.setTargetAtTime(a * 0.12, t, 0.05);
  }

  /** A short sparkle used when a song is recognized or a lesson completed. */
  chime() {
    if (!this.ctx) return;
    const ctx = this.ctx, t0 = ctx.currentTime + 0.02;
    const notes = [86, 90, 93, 98, 102, 105];
    notes.forEach((m, i) => {
      const t = t0 + i * 0.07;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = midiToFreq(m);
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = midiToFreq(m) * 2.76;
      const g = ctx.createGain(); g.gain.value = 0;
      const g2 = ctx.createGain(); g2.gain.value = 0.25;
      o.connect(g); o2.connect(g2); g2.connect(g);
      g.connect(this.dry); g.connect(this.wet);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.9);
      o.start(t); o2.start(t); o.stop(t + 1); o2.stop(t + 1);
    });
  }

  /** Soft low "nope" for a wrong note during a lesson. */
  buzz() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + 0.01;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 150;
    o.frequency.linearRampToValueAtTime(110, t + 0.2);
    const g = ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.08, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.25);
    o.connect(g); g.connect(this.dry); o.start(t); o.stop(t + 0.3);
  }
}

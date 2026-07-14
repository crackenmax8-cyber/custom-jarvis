/*
 * audio.js — DJDeck: a self-contained Web Audio house-groove engine.
 *
 * Synthesizes a live house beat — no samples, no network. A lookahead
 * scheduler walks a 16-step pattern and fires small synth voices:
 *   kick   — sine with a fast pitch drop (909-ish thump)
 *   hat    — high-passed noise burst (closed + open)
 *   clap   — three quick band-passed noise bursts
 *   bass   — sawtooth through a resonant low-pass (acid preset sweeps it)
 *   chord  — detuned saw stack for stabs and pads
 *
 * Four presets voice the main strains of house. Everything degrades
 * gracefully: if Web Audio is unavailable, isSupported() returns false.
 */

class DJDeck {
  constructor(onStateChange) {
    this.ctx = null;
    this.master = null;
    this.playing = false;
    this.bpm = 124;
    this.preset = 'classic';
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.onStateChange = onStateChange || (() => {});
    this.noiseBuf = null;
  }

  static get PRESETS() {
    // note values in Hz; patterns are 16-step (one bar of 4/4)
    const A1 = 55, C2 = 65.41, D2 = 73.42, E2 = 82.41, F2 = 87.31, G2 = 98, A2 = 110;
    return {
      classic: { // jacking Chicago: piano-ish stabs, offbeat hats
        label: 'Chicago', bpm: 124,
        kick: [0, 4, 8, 12], clap: [4, 12], openHat: [2, 6, 10, 14], closedHat: [],
        bass: [{ s: 0, f: A1 }, { s: 3, f: A1 }, { s: 7, f: C2 }, { s: 10, f: A1 }, { s: 14, f: G2 / 2 }],
        chords: [{ s: 4, len: 0.18, notes: [220, 261.63, 329.63] }, { s: 12, len: 0.18, notes: [220, 261.63, 329.63] }],
        filter: { base: 900, peak: 1600, q: 2 },
      },
      deep: { // warm, subby, patient
        label: 'Deep', bpm: 121,
        kick: [0, 4, 8, 12], clap: [4, 12], openHat: [2, 10], closedHat: [6, 14],
        bass: [{ s: 0, f: D2 }, { s: 6, f: D2 }, { s: 8, f: F2 }, { s: 14, f: A1 }],
        chords: [{ s: 0, len: 1.4, notes: [146.83, 174.61, 220, 261.63] }],
        filter: { base: 420, peak: 700, q: 1 },
      },
      tech: { // rolling, driving, 16th hats
        label: 'Tech', bpm: 127,
        kick: [0, 4, 8, 12], clap: [4, 12], openHat: [2, 6, 10, 14], closedHat: [1, 3, 5, 7, 9, 11, 13, 15],
        bass: [{ s: 2, f: E2 }, { s: 5, f: E2 }, { s: 7, f: E2 }, { s: 10, f: G2 }, { s: 13, f: E2 }, { s: 15, f: D2 }],
        chords: [{ s: 8, len: 0.1, notes: [329.63, 415.3] }],
        filter: { base: 700, peak: 1200, q: 4 },
      },
      acid: { // 303 worship: one riff, big resonance sweep
        label: 'Acid', bpm: 126,
        kick: [0, 4, 8, 12], clap: [4, 12], openHat: [2, 6, 10, 14], closedHat: [1, 5, 9, 13],
        bass: [
          { s: 0, f: A1, a: 1 }, { s: 2, f: A1 }, { s: 3, f: A2, a: 1 }, { s: 6, f: C2 },
          { s: 8, f: A1, a: 1 }, { s: 10, f: G2 / 2 }, { s: 11, f: A2 }, { s: 14, f: C2 * 2, a: 1 },
        ],
        chords: [],
        filter: { base: 300, peak: 3200, q: 14, sweep: true },
      },
    };
  }

  isSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  ensureCtx() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 6;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      // shared noise buffer for hats/claps
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) {
      this.ctx = null;
      return false;
    }
  }

  setPreset(name) {
    if (DJDeck.PRESETS[name]) {
      this.preset = name;
      this.bpm = DJDeck.PRESETS[name].bpm;
      this.onStateChange();
    }
  }

  setBpm(v) {
    this.bpm = Math.min(135, Math.max(112, Math.round(v)));
    this.onStateChange();
  }

  start() {
    if (this.playing) return true;
    if (!this.ensureCtx()) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.playing = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.schedule(), 25);
    this.onStateChange();
    return true;
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    this.onStateChange();
  }

  toggle() { this.playing ? this.stop() : this.start(); }

  // lookahead scheduler: keep ~0.12s of audio queued
  schedule() {
    if (!this.playing) return;
    const stepDur = 60 / this.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this.playStep(this.step % 16, this.nextTime);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  playStep(s, t) {
    const p = DJDeck.PRESETS[this.preset];
    if (p.kick.includes(s)) this.kick(t);
    if (p.clap.includes(s)) this.clap(t);
    if (p.openHat.includes(s)) this.hat(t, true);
    if (p.closedHat.includes(s)) this.hat(t, false);
    const b = p.bass.find(n => n.s === s);
    if (b) this.bass(t, b.f, !!b.a, p.filter);
    for (const c of p.chords) if (c.s === s) this.chord(t, c.notes, c.len);
  }

  kick(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(44, t + 0.11);
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.connect(gain); gain.connect(this.master);
    osc.start(t); osc.stop(t + 0.26);
  }

  hat(t, open) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 8200;
    const gain = this.ctx.createGain();
    const dur = open ? 0.14 : 0.045;
    gain.gain.setValueAtTime(open ? 0.24 : 0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp); hp.connect(gain); gain.connect(this.master);
    src.start(t, Math.random()); src.stop(t + dur + 0.02);
  }

  clap(t) {
    for (let i = 0; i < 3; i++) {
      const at = t + i * 0.012;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 1.4;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(i === 2 ? 0.35 : 0.2, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + (i === 2 ? 0.18 : 0.03));
      src.connect(bp); bp.connect(gain); gain.connect(this.master);
      src.start(at, Math.random()); src.stop(at + 0.22);
    }
  }

  bass(t, freq, accent, f) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = f.q;
    // acid sweep: filter opens over the bar, per-note accents bite harder
    let peak = f.peak;
    if (f.sweep) {
      const barPos = (this.step % 32) / 32; // two-bar sweep cycle
      peak = f.base + (f.peak - f.base) * (0.25 + 0.75 * Math.abs(Math.sin(barPos * Math.PI)));
    }
    lp.frequency.setValueAtTime(accent ? peak * 1.35 : peak, t);
    lp.frequency.exponentialRampToValueAtTime(f.base, t + 0.16);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(accent ? 0.5 : 0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(lp); lp.connect(gain); gain.connect(this.master);
    osc.start(t); osc.stop(t + 0.22);
  }

  chord(t, notes, len) {
    for (const f of notes) {
      for (const detune of [-6, 6]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        osc.detune.value = detune;
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 1800;
        const gain = this.ctx.createGain();
        const v = 0.055 / notes.length * 3;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(v, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + len);
        osc.connect(lp); lp.connect(gain); gain.connect(this.master);
        osc.start(t); osc.stop(t + len + 0.05);
      }
    }
  }
}

window.DJDeck = DJDeck;

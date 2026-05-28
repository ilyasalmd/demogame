"use client";

// ---------------------------------------------------------------------------
// Office Soundscape — Web Audio API synthesis only, zero external files
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;
let masterAmbienceGain: GainNode | null = null;
let ambientStarted = false;

// Timeout handles for random event schedulers — kept so we could clear them
// if we ever add a stopAmbience() export in the future.
const _schedulerHandles: ReturnType<typeof setTimeout>[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** Returns the master ambience gain, creating it and connecting it to the
 *  destination if it doesn't exist yet. */
function getMasterGain(): GainNode {
  const ctx = getCtx();
  if (!masterAmbienceGain) {
    masterAmbienceGain = ctx.createGain();
    masterAmbienceGain.gain.value = 1.0;
    masterAmbienceGain.connect(ctx.destination);
  }
  return masterAmbienceGain;
}

/** Generate a looping white-noise BufferSource (2-second buffer, looping). */
function createNoiseSource(ctx: AudioContext): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

/** Schedule a callback after a random delay between [minMs, maxMs]. */
function scheduleRandom(
  callback: () => void,
  minMs: number,
  maxMs: number
): void {
  const delay = minMs + Math.random() * (maxMs - minMs);
  const handle = setTimeout(() => {
    callback();
    scheduleRandom(callback, minMs, maxMs); // reschedule
  }, delay);
  _schedulerHandles.push(handle);
}

// ---------------------------------------------------------------------------
// startAmbience — rich layered office soundscape
// ---------------------------------------------------------------------------

export function startAmbience(): void {
  if (ambientStarted || typeof window === "undefined") return;
  ambientStarted = true;

  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();

  const master = getMasterGain();

  // ── 1. HVAC / air-conditioning low hum ──────────────────────────────────
  // Filtered noise at 80–120 Hz, very low gain, constant drone.
  {
    const noise = createNoiseSource(ctx);

    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 120;
    lpf.Q.value = 2;

    const hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = 70;

    const g = ctx.createGain();
    g.gain.value = 0.022;

    noise.connect(hpf);
    hpf.connect(lpf);
    lpf.connect(g);
    g.connect(master);
    noise.start();

    // Very slight pitch waver to emulate real HVAC
    const hvacTone = ctx.createOscillator();
    hvacTone.type = "sine";
    hvacTone.frequency.value = 92;
    const hvacToneGain = ctx.createGain();
    hvacToneGain.gain.value = 0.006;
    hvacTone.connect(hvacToneGain);
    hvacToneGain.connect(master);
    hvacTone.start();
  }

  // ── 2. Office murmur — distant crowd of voices ──────────────────────────
  // 5 sine oscillators in 200–400 Hz range, each amplitude-modulated by a
  // slow independent LFO, creating the impression of distant chatter.
  {
    const murmurFreqs = [210, 255, 300, 340, 390];
    const lfoFreqs = [0.11, 0.17, 0.13, 0.09, 0.21]; // very slow, Hz

    murmurFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      // Carrier gain
      const carrierGain = ctx.createGain();
      carrierGain.gain.value = 0; // LFO drives actual level

      // LFO
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = lfoFreqs[i];

      const lfoGain = ctx.createGain();
      // offset + depth: keeps gain positive; range 0.003–0.011
      lfoGain.gain.value = 0.004;

      // DC offset so gain doesn't go negative
      const dcOffset = ctx.createConstantSource();
      dcOffset.offset.value = 0.006;

      lfo.connect(lfoGain);
      lfoGain.connect(carrierGain.gain);
      dcOffset.connect(carrierGain.gain);

      osc.connect(carrierGain);
      carrierGain.connect(master);

      osc.start();
      lfo.start();
      dcOffset.start();
    });

    // Add a second harmonic murmur layer slightly detuned for richness
    const murmurFreqs2 = [225, 270, 315, 360, 410];
    murmurFreqs2.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle"; // softer than sine
      osc.frequency.value = freq;

      const carrierGain = ctx.createGain();
      carrierGain.gain.value = 0;

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.07 + i * 0.03;

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.003;

      const dcOffset = ctx.createConstantSource();
      dcOffset.offset.value = 0.004;

      lfo.connect(lfoGain);
      lfoGain.connect(carrierGain.gain);
      dcOffset.connect(carrierGain.gain);

      osc.connect(carrierGain);
      carrierGain.connect(master);

      osc.start();
      lfo.start();
      dcOffset.start();
    });
  }

  // ── 3. Random keyboard typing bursts ────────────────────────────────────
  // Very short (40–80ms) filtered-noise burst at 2–4 kHz.
  {
    const playKeyCluster = (): void => {
      try {
        const now = ctx.currentTime;
        // 2–5 individual keystrokes in quick succession
        const count = 2 + Math.floor(Math.random() * 4);
        for (let k = 0; k < count; k++) {
          const offset = k * (0.04 + Math.random() * 0.06);
          const bufSize = Math.floor(ctx.sampleRate * (0.03 + Math.random() * 0.04));
          const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);

          const src = ctx.createBufferSource();
          src.buffer = buf;

          const bpf = ctx.createBiquadFilter();
          bpf.type = "bandpass";
          bpf.frequency.value = 2200 + Math.random() * 1800;
          bpf.Q.value = 1.5;

          const g = ctx.createGain();
          g.gain.value = 0.018 + Math.random() * 0.014;

          src.connect(bpf);
          bpf.connect(g);
          g.connect(master);
          src.start(now + offset);
        }
      } catch {}
    };
    scheduleRandom(playKeyCluster, 2000, 8000);
  }

  // ── 4. Printer / fax mechanical whir ────────────────────────────────────
  // Sawtooth at ~60 Hz + slight filter, 0.8–1.5s duration. Very occasional.
  {
    const playPrinter = (): void => {
      try {
        const ctx2 = getCtx();
        const duration = 0.8 + Math.random() * 0.7;
        const now = ctx2.currentTime;

        const osc = ctx2.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = 58 + Math.random() * 10;

        // subtle pitch drift mimicking a motor
        osc.frequency.setValueAtTime(osc.frequency.value, now);
        osc.frequency.linearRampToValueAtTime(
          osc.frequency.value * 1.04,
          now + duration * 0.5
        );
        osc.frequency.linearRampToValueAtTime(
          osc.frequency.value,
          now + duration
        );

        const lpf = ctx2.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = 600;

        const g = ctx2.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.018, now + 0.05);
        g.gain.setValueAtTime(0.018, now + duration - 0.1);
        g.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      } catch {}
    };
    scheduleRandom(playPrinter, 15000, 40000);
  }

  // ── 5. Coffee machine / water cooler bubble ──────────────────────────────
  // Band-pass filtered noise at ~800 Hz, 0.5–1s.
  {
    const playCoffeeMachine = (): void => {
      try {
        const ctx2 = getCtx();
        const duration = 0.5 + Math.random() * 0.5;
        const now = ctx2.currentTime;

        const noise = createNoiseSource(ctx2);

        const bpf = ctx2.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.value = 750 + Math.random() * 150;
        bpf.Q.value = 2;

        const g = ctx2.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.014, now + 0.05);
        // slight bubbling modulation
        g.gain.setValueAtTime(0.014, now + duration - 0.08);
        g.gain.linearRampToValueAtTime(0, now + duration);

        noise.connect(bpf);
        bpf.connect(g);
        g.connect(master);
        noise.start(now);
        noise.stop(now + duration + 0.05);
      } catch {}
    };
    scheduleRandom(playCoffeeMachine, 20000, 60000);
  }

  // ── 6. Phone notification ding ───────────────────────────────────────────
  // Soft sine at 880 Hz, short attack, 0.3s decay. Rare.
  {
    const playPhonePing = (): void => {
      try {
        const ctx2 = getCtx();
        const now = ctx2.currentTime;

        const osc = ctx2.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 880;

        const g = ctx2.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.06, now + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + 0.38);
      } catch {}
    };
    scheduleRandom(playPhonePing, 45000, 90000);
  }

  // ── 7. Distant background footsteps ─────────────────────────────────────
  // Very low gain thump, every 3–8 seconds.
  {
    const playDistantStep = (): void => {
      try {
        const ctx2 = getCtx();
        const now = ctx2.currentTime;
        const bufSize = Math.floor(ctx2.sampleRate * 0.05);
        const buf = ctx2.createBuffer(1, bufSize, ctx2.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++)
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);

        const src = ctx2.createBufferSource();
        src.buffer = buf;

        const lpf = ctx2.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = 350;

        const g = ctx2.createGain();
        g.gain.value = 0.012;

        src.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        src.start(now);
      } catch {}
    };
    scheduleRandom(playDistantStep, 3000, 8000);
  }
}

// ---------------------------------------------------------------------------
// Ducking — for NPC conversations
// ---------------------------------------------------------------------------

export function duckAmbience(): void {
  if (typeof window === "undefined") return;
  const g = getMasterGain();
  const ctx = getCtx();
  const now = ctx.currentTime;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(g.gain.value, now);
  g.gain.linearRampToValueAtTime(0.15, now + 0.5);
}

export function unduckAmbience(): void {
  if (typeof window === "undefined") return;
  const g = getMasterGain();
  const ctx = getCtx();
  const now = ctx.currentTime;
  g.gain.cancelScheduledValues(now);
  g.gain.setValueAtTime(g.gain.value, now);
  g.gain.linearRampToValueAtTime(1.0, now + 0.8);
}

// ---------------------------------------------------------------------------
// Interact / Decision / Tension — one-shot UI sounds (unchanged API)
// ---------------------------------------------------------------------------

export function playInteractSound(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {}
}

export function playDecisionSound(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [440, 550, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.07, now + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.2);
    });
  } catch {}
}

export function playTensionStinger(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.85);
  } catch {}
}

// ---------------------------------------------------------------------------
// Footstep — leather oxford on hard office floor
// Two-layer synthesis: low "thud" (sole body) + high "click" (heel tip)
// Bypasses master ambience gain so it's always clearly audible.
// ---------------------------------------------------------------------------

export function playFootstep(sprint = false): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const vol = sprint ? 0.068 : 0.050;
    // Slight pitch variation so no two steps sound identical
    const pitchVar = 0.88 + Math.random() * 0.24;

    // ── Layer 1: body thud — low-frequency sole impact ──────────────────────
    const lowSize = Math.floor(ctx.sampleRate * 0.038);
    const lowBuf = ctx.createBuffer(1, lowSize, ctx.sampleRate);
    const lowData = lowBuf.getChannelData(0);
    for (let i = 0; i < lowSize; i++)
      lowData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / lowSize, 1.6);

    const srcLow = ctx.createBufferSource();
    srcLow.buffer = lowBuf;
    srcLow.playbackRate.value = pitchVar;

    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 220;
    lpf.Q.value = 1.2;

    const gLow = ctx.createGain();
    gLow.gain.setValueAtTime(vol * 0.7, now);
    gLow.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

    srcLow.connect(lpf);
    lpf.connect(gLow);
    gLow.connect(ctx.destination);
    srcLow.start(now);

    // ── Layer 2: heel click — crisp high-frequency tap on hard floor ────────
    const hiSize = Math.floor(ctx.sampleRate * 0.016);
    const hiBuf = ctx.createBuffer(1, hiSize, ctx.sampleRate);
    const hiData = hiBuf.getChannelData(0);
    for (let i = 0; i < hiSize; i++)
      hiData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hiSize, 4.5);

    const srcHi = ctx.createBufferSource();
    srcHi.buffer = hiBuf;
    srcHi.playbackRate.value = pitchVar;

    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.value = 2600 + Math.random() * 600;
    bpf.Q.value = 2.8;

    const gHi = ctx.createGain();
    gHi.gain.setValueAtTime(vol * 0.52, now + 0.006);
    gHi.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    srcHi.connect(bpf);
    bpf.connect(gHi);
    gHi.connect(ctx.destination); // direct — not ducked
    srcHi.start(now + 0.006); // heel tap lands just after sole impact
  } catch {}
}

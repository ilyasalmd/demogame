"use client";

let audioCtx: AudioContext | null = null;
let ambientGain: GainNode | null = null;
let ambientStarted = false;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function startAmbience() {
  if (ambientStarted || typeof window === "undefined") return;
  ambientStarted = true;
  const ctx = getCtx();

  // HVAC low hum
  const hvac = ctx.createOscillator();
  hvac.type = "sine";
  hvac.frequency.value = 58;
  const hvacGain = ctx.createGain();
  hvacGain.gain.value = 0.018;
  hvac.connect(hvacGain);
  hvacGain.connect(ctx.destination);
  hvac.start();

  // Office noise (filtered white noise = keyboard/murmur)
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const bpf = ctx.createBiquadFilter();
  bpf.type = "bandpass";
  bpf.frequency.value = 1200;
  bpf.Q.value = 0.4;

  const lpf = ctx.createBiquadFilter();
  lpf.type = "lowpass";
  lpf.frequency.value = 2400;

  ambientGain = ctx.createGain();
  ambientGain.gain.value = 0.012;

  noiseSource.connect(bpf);
  bpf.connect(lpf);
  lpf.connect(ambientGain);
  ambientGain.connect(ctx.destination);
  noiseSource.start();

  // Subtle room reverb hum
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.value = 120;
  const g2 = ctx.createGain();
  g2.gain.value = 0.006;
  osc2.connect(g2);
  g2.connect(ctx.destination);
  osc2.start();
}

export function playInteractSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export function playDecisionSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getCtx();
    [440, 550, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.2);
    });
  } catch {}
}

export function playTensionStinger() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {}
}

export function playFootstep() {
  if (typeof window === "undefined") return;
  try {
    const ctx = getCtx();
    const bufSize = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 800;
    const g = ctx.createGain();
    g.gain.value = 0.04;
    src.connect(lpf);
    lpf.connect(g);
    g.connect(ctx.destination);
    src.start();
  } catch {}
}

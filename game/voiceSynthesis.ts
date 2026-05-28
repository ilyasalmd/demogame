"use client";

export interface VoiceConfig {
  lang: string;
  pitch: number;
  rate: number;
  volume: number;
  preferredNames: string[];
}

export const CHARACTER_VOICE_CONFIG: Record<string, VoiceConfig> = {
  // ── Receptionist (Charlotte) ────────────────────────────────────────────────
  // Target: natural, clear 30-something London professional woman.
  // Microsoft Libby (Natural) is a neural voice — sounds human, not AI.
  // pitch/rate left at 1.0 so the neural prosody is untouched.
  receptionist: {
    lang: "en-GB",
    pitch: 1.0,
    rate:  0.88,  // unhurried, confident — London corporate, not clipped
    volume: 1,
    preferredNames: [
      "Microsoft Libby Online (Natural) - English (United Kingdom)",
      "Microsoft Sonia Online (Natural) - English (United Kingdom)",
      "Microsoft Amy Online (Natural) - English (United Kingdom)",
      "Microsoft Maisie Online (Natural) - English (United Kingdom)",
      "Microsoft Libby",
      "Microsoft Sonia",
      "Microsoft Amy",
      "Google UK English Female",
      "Microsoft Hazel",
      "Hazel",
    ],
  },

  maya: {
    lang: "en-GB",
    pitch: 1.08,
    rate: 1.18,
    volume: 1,
    preferredNames: ["Google UK English Female", "Microsoft Hazel", "Hazel", "Daniel"],
  },
  theo: {
    lang: "en-GB",
    pitch: 0.82,
    rate: 1.12,
    volume: 1,
    preferredNames: ["Google UK English Male", "Microsoft George", "Daniel"],
  },
  oliver: {
    lang: "en-GB",
    pitch: 0.92,
    rate: 1.22,
    volume: 1,
    preferredNames: ["Google UK English Male", "Daniel", "Microsoft George"],
  },
  priya: {
    lang: "en-GB",
    pitch: 1.05,
    rate: 1.15,
    volume: 1,
    preferredNames: ["Google UK English Female", "Microsoft Hazel", "Hazel", "Daniel"],
  },
  amara: {
    lang: "en-GB",
    pitch: 0.96,
    rate: 1.20,
    volume: 1,
    preferredNames: ["Google UK English Female", "Microsoft Hazel", "Hazel", "Daniel"],
  },
  system: {
    lang: "en-US",
    pitch: 0.75,
    rate: 1.15,
    volume: 0.85,
    preferredNames: ["Google US English", "Alex", "Karen"],
  },
  dashboard: {
    lang: "en-US",
    pitch: 0.65,
    rate: 1.10,
    volume: 0.8,
    preferredNames: ["Google US English", "Alex"],
  },
};

// ── Voice cache ───────────────────────────────────────────────────────────────
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (cachedVoices.length > 0) return Promise.resolve(cachedVoices);
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    const immediate = window.speechSynthesis.getVoices();
    if (immediate.length > 0) {
      cachedVoices = immediate;
      voicesPromise = null;
      resolve(immediate);
      return;
    }
    const handler = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        cachedVoices = v;
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
        voicesPromise = null;
        resolve(v);
      }
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    setTimeout(() => {
      const v = window.speechSynthesis.getVoices();
      cachedVoices = v;
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      voicesPromise = null;
      resolve(v);
    }, 3000);
  });

  return voicesPromise;
}

function pickVoice(config: VoiceConfig, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const name of config.preferredNames) {
    const found = voices.find((v) => v.name === name);
    if (found) return found;
  }
  for (const name of config.preferredNames) {
    const found = voices.find((v) => v.name.includes(name));
    if (found) return found;
  }
  const langMatch = voices.find((v) => v.lang.startsWith(config.lang));
  if (langMatch) return langMatch;
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

// Emotion modifiers give a tiny prosody bump to older, non-neural voices.
// Neural "(Natural)" voices already handle prosody — we skip these for them.
function getEmotionModifiers(text: string): { rateMod: number; pitchMod: number; volMod: number } {
  let rateMod = 1.0, pitchMod = 1.0, volMod = 1.0;
  const excl = (text.match(/!/g) ?? []).length;
  rateMod  += excl * 0.07;
  pitchMod += excl * 0.04;
  volMod    = Math.min(1, volMod + excl * 0.08);
  if (text.includes("...") || text.includes("…")) { rateMod -= 0.12; volMod -= 0.04; }
  if (text.includes("?"))  { pitchMod += 0.06; rateMod -= 0.04; }
  const capsWords = (text.match(/\b[A-Z]{2,}\b/g) ?? []).length;
  if (capsWords > 0) { rateMod -= 0.05; volMod = Math.min(1, volMod + capsWords * 0.06); pitchMod += 0.04; }
  if (/\b(urgent|critical|immediately|serious|mistake|wrong|risk|flag|warning|deadline)\b/i.test(text)) { rateMod += 0.05; pitchMod += 0.03; }
  if (/\b(coffee|brilliant|great|nice|honestly|mate|yeah|right|haha)\b/i.test(text)) { rateMod += 0.03; }
  return {
    rateMod:  Math.max(0.82, Math.min(1.35, rateMod)),
    pitchMod: Math.max(0.82, Math.min(1.28, pitchMod)),
    volMod:   Math.max(0.72, Math.min(1,    volMod)),
  };
}

// ── Chrome speechSynthesis keepalive ─────────────────────────────────────────
// Chrome has a bug where it silently stops speechSynthesis after ~15 seconds
// if the page hasn't received an interaction.  Calling pause()+resume() every
// 10 s prevents the cutoff without any audible glitch.
let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

function startKeepAlive() {
  stopKeepAlive();
  keepAliveTimer = setInterval(() => {
    if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    } else {
      stopKeepAlive();
    }
  }, 10_000);
}

function stopKeepAlive() {
  if (keepAliveTimer !== null) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// ── Gesture-gate (fallback when loading-screen click is missed) ───────────────
let awaitingGesture = false;

export function isSpeechBlocked(): boolean {
  return awaitingGesture;
}

function queueOnGesture(
  text: string,
  characterId: string,
  rateOverride?: number,
  onStart?: () => void,
  onEnd?: () => void,
) {
  if (awaitingGesture) return;
  awaitingGesture = true;

  const handler = () => {
    document.removeEventListener("pointerdown", handler, true);
    document.removeEventListener("keydown",     handler, true);
    // Clear synchronously so isSpeechBlocked() returns false in the same event
    // handler chain — lets skipOrAdvance fire on the same keypress that unblocks.
    awaitingGesture = false;
    window.speechSynthesis.cancel();
    _doSpeak(text, characterId, rateOverride, onStart, onEnd);
  };

  document.addEventListener("pointerdown", handler, true);
  document.addEventListener("keydown",     handler, true);
}

// ── Core utterance builder ────────────────────────────────────────────────────
function _doSpeak(
  text: string,
  characterId: string,
  rateOverride?: number,
  onStart?: () => void,
  onEnd?: () => void,
) {
  const config = CHARACTER_VOICE_CONFIG[characterId] ?? CHARACTER_VOICE_CONFIG.system;
  const voice  = cachedVoices.length > 0 ? pickVoice(config, cachedVoices) : null;

  // Neural "(Natural)" voices handle their own prosody perfectly — applying our
  // rate/pitch modifiers makes them sound LESS natural, so we skip them.
  const isNatural = voice?.name.includes("(Natural)") ?? false;
  const { rateMod, pitchMod, volMod } = isNatural
    ? { rateMod: 1.0, pitchMod: 1.0, volMod: 1.0 }
    : getEmotionModifiers(text);

  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;
  utterance.pitch  = Math.max(0.5, Math.min(2, config.pitch * pitchMod));
  utterance.rate   = Math.max(0.5, Math.min(2, config.rate  * rateMod  * (rateOverride ?? 1.0)));
  utterance.volume = config.volume * volMod;
  utterance.lang   = config.lang;

  let started = false;
  utterance.onstart = () => { started = true; startKeepAlive(); onStart?.(); };
  utterance.onend   = () => { stopKeepAlive(); onEnd?.(); };
  utterance.onerror = (e) => {
    stopKeepAlive();
    if ((e as SpeechSynthesisErrorEvent).error === "not-allowed") {
      queueOnGesture(text, characterId, rateOverride, onStart, onEnd);
      return;
    }
    onEnd?.();
  };

  window.speechSynthesis.resume();
  window.speechSynthesis.speak(utterance);

  // Fallback: Chrome sometimes silently swallows speak() without firing onerror.
  // Use a generous 2 000 ms window — Microsoft Neural voices (Libby Online, etc.)
  // need a network round-trip to MS servers and routinely take 300–800 ms to start.
  // Using 350 ms caused the fallback to fire before the neural voice was ready,
  // which set awaitingGesture = true and blocked the Space-to-advance path.
  setTimeout(() => {
    if (!started && !awaitingGesture) {
      window.speechSynthesis.cancel();
      queueOnGesture(text, characterId, rateOverride, onStart, onEnd);
    }
  }, 2000);
}

// ── Public API ────────────────────────────────────────────────────────────────

// Monotonically-increasing counter.  Each speakLine() call gets a unique ID.
// Any pending async callback whose ID no longer matches currentSpeakId is a
// stale/superseded call (e.g. React StrictMode double-invoke) and is dropped.
let currentSpeakId = 0;

export function speakLine(
  text: string,
  characterId: string,
  rateOverride?: number,
  onStart?: () => void,
  onEnd?: () => void,
): void {
  if (characterId === "system" || characterId === "dashboard") return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  stopKeepAlive();
  window.speechSynthesis.cancel();

  const myId = ++currentSpeakId;

  // Always defer via setTimeout(0) — even when voices are already cached.
  // This lets React StrictMode's double-invoke land both calls synchronously,
  // then only the last one's timer fires (_doSpeak called exactly once).
  const invoke = () => {
    if (currentSpeakId !== myId) return; // superseded by a newer speakLine call
    if (cachedVoices.length > 0) {
      _doSpeak(text, characterId, rateOverride, onStart, onEnd);
    } else {
      getVoices().then(() => {
        if (currentSpeakId !== myId) return; // check again after async voice load
        _doSpeak(text, characterId, rateOverride, onStart, onEnd);
      });
    }
  };

  setTimeout(invoke, 0);
}

export function stopSpeech() {
  stopKeepAlive();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export async function initVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  await getVoices();
}

export function isAudioPlaying(): boolean {
  if (typeof window === "undefined") return false;
  return window.speechSynthesis?.speaking ?? false;
}

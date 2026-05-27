"use client";

export interface VoiceConfig {
  lang: string;
  pitch: number;
  rate: number;
  volume: number;
  preferredNames: string[];
}

export const CHARACTER_VOICE_CONFIG: Record<string, VoiceConfig> = {
  maya: {
    lang: "en-GB",
    pitch: 1.12,
    rate: 1.25,
    volume: 1,
    preferredNames: ["Google UK English Female", "Microsoft Hazel", "en-GB female", "Samantha"],
  },
  theo: {
    lang: "en-GB",
    pitch: 0.85,
    rate: 1.20,
    volume: 1,
    preferredNames: ["Google UK English Male", "Microsoft George", "Daniel", "en-GB male"],
  },
  oliver: {
    lang: "en-GB",
    pitch: 0.88,
    rate: 1.30,
    volume: 1,
    preferredNames: ["Google UK English Male", "Daniel", "Microsoft George"],
  },
  priya: {
    lang: "en-IN",
    pitch: 1.08,
    rate: 1.22,
    volume: 1,
    preferredNames: ["Google हिन्दी", "en-IN", "Veena", "Google UK English Female", "Rishi"],
  },
  amara: {
    lang: "en-GB",
    pitch: 0.95,
    rate: 1.28,
    volume: 1,
    preferredNames: ["Google UK English Female", "Microsoft Hazel", "Fiona"],
  },
  receptionist: {
    lang: "en-GB",
    pitch: 1.15,
    rate: 1.20,
    volume: 1,
    preferredNames: ["Google UK English Female", "Microsoft Hazel"],
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

let cachedVoices: SpeechSynthesisVoice[] = [];

function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
  });
}

function pickVoice(config: VoiceConfig, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Try preferred name exact match
  for (const name of config.preferredNames) {
    const found = voices.find((v) => v.name === name);
    if (found) return found;
  }
  // Try preferred name partial match
  for (const name of config.preferredNames) {
    const found = voices.find((v) => v.name.includes(name));
    if (found) return found;
  }
  // Try lang match
  const langMatch = voices.find((v) => v.lang.startsWith(config.lang));
  if (langMatch) return langMatch;
  // Fallback to any English voice
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

function getEmotionModifiers(text: string): { rateMod: number; pitchMod: number; volMod: number } {
  let rateMod = 1.0, pitchMod = 1.0, volMod = 1.0;
  const excl = (text.match(/!/g) ?? []).length;
  rateMod += excl * 0.07;
  pitchMod += excl * 0.04;
  volMod = Math.min(1, volMod + excl * 0.08);
  if (text.includes("...") || text.includes("…")) { rateMod -= 0.12; volMod -= 0.04; }
  if (text.includes("?")) { pitchMod += 0.06; rateMod -= 0.04; }
  const capsWords = (text.match(/\b[A-Z]{2,}\b/g) ?? []).length;
  if (capsWords > 0) { rateMod -= 0.05; volMod = Math.min(1, volMod + capsWords * 0.06); pitchMod += 0.04; }
  if (/\b(urgent|critical|immediately|serious|mistake|wrong|risk|flag|warning|deadline)\b/i.test(text)) { rateMod += 0.05; pitchMod += 0.03; }
  if (/\b(coffee|brilliant|great|nice|honestly|mate|yeah|right|haha)\b/i.test(text)) { rateMod += 0.03; }
  return {
    rateMod: Math.max(0.82, Math.min(1.35, rateMod)),
    pitchMod: Math.max(0.82, Math.min(1.28, pitchMod)),
    volMod: Math.max(0.72, Math.min(1, volMod)),
  };
}

export async function speakLine(
  text: string,
  characterId: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  if (characterId === "system" || characterId === "dashboard") return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const config = CHARACTER_VOICE_CONFIG[characterId] ?? CHARACTER_VOICE_CONFIG.system;
  const voices = cachedVoices.length > 0 ? cachedVoices : await getVoices();
  const voice = pickVoice(config, voices);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  const { rateMod, pitchMod, volMod } = getEmotionModifiers(text);
  utterance.pitch = Math.max(0.5, Math.min(2, config.pitch * pitchMod));
  utterance.rate = Math.max(0.5, Math.min(2, config.rate * rateMod));
  utterance.volume = config.volume * volMod;
  utterance.lang = config.lang;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Preload voices on user gesture
export async function initVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  await getVoices();
}

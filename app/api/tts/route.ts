/**
 * /api/tts — Server-side TTS via Windows SAPI (PowerShell).
 *
 * Returns a WAV audio buffer for the given text+character.
 * Only runs on Windows (localhost dev).  All other platforms return 501 so the
 * client falls back gracefully to Web Speech API.
 *
 * Responses are cached in-process so repeated requests for the same line are
 * served instantly from memory.
 */
import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

// In-process cache: key = "character:text", value = WAV buffer
const audioCache = new Map<string, Buffer>();

// Preferred SAPI voice names per character, tried in order
const VOICE_PREFS: Record<string, string[]> = {
  receptionist: [
    "Microsoft Libby Online (Natural) - English (United Kingdom)",
    "Microsoft Sonia Online (Natural) - English (United Kingdom)",
    "Microsoft Amy Online (Natural) - English (United Kingdom)",
    "Microsoft Libby",
    "Microsoft Sonia",
    "Microsoft Amy",
    "Microsoft Hazel",
  ],
  maya:   ["Microsoft Libby Online (Natural) - English (United Kingdom)", "Microsoft Hazel"],
  theo:   ["Microsoft George Online (Natural) - English (United Kingdom)", "Microsoft George"],
  oliver: ["Microsoft Ryan Online (Natural) - English (United Kingdom)", "Microsoft Ryan"],
  priya:  ["Microsoft Libby Online (Natural) - English (United Kingdom)", "Microsoft Hazel"],
  amara:  ["Microsoft Libby Online (Natural) - English (United Kingdom)", "Microsoft Hazel"],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text      = searchParams.get("text")      ?? "";
  const character = searchParams.get("character") ?? "receptionist";

  if (!text) return new NextResponse("Missing text", { status: 400 });

  // ── Cache hit ──────────────────────────────────────────────────────────────
  const cacheKey = `${character}:${text}`;
  if (audioCache.has(cacheKey)) {
    const buf = audioCache.get(cacheKey)!;
    return new NextResponse(buf, {
      headers: { "Content-Type": "audio/wav", "Content-Length": String(buf.length) },
    });
  }

  // ── Only supported on Windows ──────────────────────────────────────────────
  if (process.platform !== "win32") {
    return new NextResponse("Platform not supported", { status: 501 });
  }

  const id      = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const wavPath = path.join(os.tmpdir(), `inc_tts_${id}.wav`);
  const ps1Path = path.join(os.tmpdir(), `inc_tts_${id}.ps1`);

  // Build voice-selection block (falls through to system default if none found)
  const voices      = VOICE_PREFS[character] ?? VOICE_PREFS.receptionist;
  const voiceArray  = voices.map(v => `'${v.replace(/'/g, "''")}'`).join(", ");

  // Use a PowerShell here-string (@'...'@) for the text so apostrophes / quotes
  // inside the dialogue never break the script.
  // IMPORTANT: the closing '@  must be at column-0 with no leading whitespace.
  const ps1 = `Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$preferred = @(${voiceArray})
$installed = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
foreach ($v in $preferred) { if ($installed -contains $v) { $synth.SelectVoice($v); break } }
$synth.Rate   = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile('${wavPath.replace(/\\/g, "\\\\").replace(/'/g, "''")}')
$synth.Speak(@'
${text}
'@)
$synth.Dispose()
`;

  try {
    fs.writeFileSync(ps1Path, ps1, "utf8");
    execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${ps1Path}"`,
      { timeout: 15_000 },
    );
  } catch (err) {
    console.error("[TTS] PowerShell error:", err);
    return new NextResponse("TTS generation failed", { status: 500 });
  } finally {
    try { fs.unlinkSync(ps1Path); } catch {}
  }

  if (!fs.existsSync(wavPath)) {
    return new NextResponse("WAV not created", { status: 500 });
  }

  const audioData = fs.readFileSync(wavPath);
  try { fs.unlinkSync(wavPath); } catch {}

  audioCache.set(cacheKey, audioData);

  return new NextResponse(audioData, {
    headers: {
      "Content-Type":   "audio/wav",
      "Content-Length": String(audioData.length),
      "Cache-Control":  "public, max-age=86400",
    },
  });
}

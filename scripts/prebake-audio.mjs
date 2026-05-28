/**
 * prebake-audio.mjs
 *
 * Generates WAV files for every dialogue line in the game using Windows SAPI,
 * then writes public/audio/manifest.json so the client can play them as
 * static assets on any platform (Mac, Linux, Vercel, etc.).
 *
 * Run once on Windows:
 *   node scripts/prebake-audio.mjs
 *
 * Then commit public/audio/ to the repo.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "audio");

// ── Voice preferences per character (same as api/tts/route.ts) ───────────────
const VOICE_PREFS = {
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

function hash8(text) {
  return crypto.createHash("md5").update(text, "utf8").digest("hex").slice(0, 8);
}

function generateWav(text, character, outPath) {
  if (fs.existsSync(outPath)) {
    process.stdout.write(`  SKIP  ${path.basename(outPath)}\n`);
    return true;
  }

  const voices     = VOICE_PREFS[character] ?? VOICE_PREFS.receptionist;
  const voiceArray = voices.map(v => `'${v.replace(/'/g, "''")}'`).join(", ");
  const uid   = `pa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tmpWav = path.join(os.tmpdir(), `${uid}.wav`);
  const tmpTxt = path.join(os.tmpdir(), `${uid}.txt`);
  const tmpPs1 = path.join(os.tmpdir(), `${uid}.ps1`);

  // Write text to a separate file — avoids ALL PowerShell escaping issues
  fs.writeFileSync(tmpTxt, text, "utf8");

  const ps1 = `Add-Type -AssemblyName System.Speech
$synth  = New-Object System.Speech.Synthesis.SpeechSynthesizer
$prefs  = @(${voiceArray})
$names  = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }
foreach ($v in $prefs) { if ($names -contains $v) { $synth.SelectVoice($v); break } }
$synth.Rate   = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile('${tmpWav.replace(/\\/g, "\\\\").replace(/'/g, "''")}')
$text = [System.IO.File]::ReadAllText('${tmpTxt.replace(/\\/g, "\\\\").replace(/'/g, "''")}', [System.Text.Encoding]::UTF8)
$synth.Speak($text)
$synth.Dispose()
`;

  try {
    fs.writeFileSync(tmpPs1, ps1, "utf8");
    execSync(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpPs1}"`,
      { timeout: 30_000, stdio: "pipe" },
    );
    if (fs.existsSync(tmpWav)) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.copyFileSync(tmpWav, outPath);
      process.stdout.write(`  OK    ${path.basename(outPath)}\n`);
      return true;
    }
    process.stdout.write(`  FAIL  ${path.basename(outPath)} — WAV not created\n`);
    return false;
  } catch (err) {
    process.stdout.write(`  ERR   ${path.basename(outPath)} — ${String(err.message).slice(0, 100)}\n`);
    return false;
  } finally {
    for (const f of [tmpPs1, tmpWav, tmpTxt]) try { fs.unlinkSync(f); } catch {}
  }
}

// ── All game dialogue lines ───────────────────────────────────────────────────
const LINES = [
  // ── Receptionist ──────────────────────────────────────────────────────────
  { c: "receptionist", t: "Morning! Oh — you must be the new analyst. Brilliant, we've been expecting you. I'm Charlotte. Just so you know, Maya Chen has been in since before eight — first one through the door every single morning, honestly, without fail." },
  { c: "receptionist", t: "Quick heads-up though — there's been a bit of a situation with the data pipeline overnight, and the client demo is in under an hour. It's a bit all-hands this morning, so Maya will bring you up to speed. You haven't missed anything critical. Yet." },
  { c: "receptionist", t: "Head straight through the barrier on your left — analytics pod, first cluster of desks. Maya's the one who looks like she hasn't slept. Trust me, that does narrow it down to one person. Right — good luck. You are going to need it." },

  // ── Maya Chen ─────────────────────────────────────────────────────────────
  { c: "maya", t: "Oh thank god — you're actually here. I was starting to think I'd have to handle this alone." },
  { c: "maya", t: "The validation accuracy on the client demo model jumped from 82% to 94% overnight. A twelve-point leap. Oliver has already put that number on the sales deck." },
  { c: "maya", t: "I flagged it on Slack at seven this morning. Three hours ago. No response from anyone. The demo is in forty-five minutes." },
  { c: "maya", t: "I printed this validation report this morning. Read page two." },
  { c: "maya", t: "See that? 1,460 rows flagged as potential duplicates. Out of 12,000 in the validation set. If those are real duplicates, they are inflating the score." },
  { c: "maya", t: "I don't know by how much yet. The engineering pipeline hasn't been rerun. Nobody knows if the real accuracy is 87% or 74% or something else entirely." },
  { c: "maya", t: "Oliver doesn't want to hear it. The client lands in under an hour. What do we do?" },
  // reactions
  { c: "maya", t: "Here, look." },
  { c: "maya", t: "Theo Marsh built this pipeline. Engineering, east side. He can tell you if this is real before the demo starts." },
  { c: "maya", t: "I hope you're right." },
  { c: "maya", t: "Talk to Theo at least. Engineering, east side. He built this — he'll know in seconds." },
  { c: "maya", t: "Wait — check the data first. Without numbers Oliver will dismiss us in thirty seconds." },
  { c: "maya", t: "Theo Marsh, engineering, east side. Talk to him first." },
  { c: "maya", t: "No. We would still know it happened — and so would the client, eventually." },
  { c: "maya", t: "Talk to Theo. Engineering, east side." },
  // dashboard dialogue
  { c: "maya", t: "See that? 'Dedupe pending.' If those 1,460 rows are duplicate-linked, the real accuracy could be materially lower. And we don't know by how much yet." },
  { c: "maya", t: "Theo in engineering knows the pipeline. He's worth talking to before anyone makes a decision." },

  // ── Theo Marsh ────────────────────────────────────────────────────────────
  { c: "theo", t: "Yeah. I have been expecting someone to come over. The dedupe flag — I know." },
  { c: "theo", t: "I am the one who put it there. At six this morning, when I ran the nightly data import job. I flagged it because the row count did not add up." },
  { c: "theo", t: "The deduplication check has been in the pipeline spec for three weeks. Maya knew about it." },
  { c: "theo", t: "Could be duplicate patient IDs from the source hospital data. Could be a caching artefact from the overnight merge job. Could be entirely cosmetic. I have been trying to work out which — but I need two hours minimum to be certain." },
  { c: "theo", t: "I can run the dedupe fix in 90 minutes. But that means the demo model isn't the production model." },
  { c: "theo", t: "If we delay for 90 minutes, Oliver loses the client. If we go ahead, the score might be off by a few points." },
  { c: "theo", t: "The demo is in thirty-five minutes. So here is the honest answer: I cannot tell you with confidence whether the 94% figure is real or inflated." },
  { c: "theo", t: "Anyone who says they are certain right now is guessing. The full pipeline rerun takes two hours. That is just the reality of it." },
  { c: "theo", t: "Quick one for you — rough maths. If 1,460 out of 12,000 validation rows are duplicate-linked, what percentage of the validation set does that represent? Round number." },
  { c: "theo", t: "Because whoever walks into that room with the client needs to know this number cold." },
  // reactions
  { c: "theo", t: "Twelve-point-two. Exactly right. At that scale the model could be three to eight points lower than the slide says." },
  { c: "theo", t: "Go talk to Oliver. He needs to hear this from someone outside engineering." },
  { c: "theo", t: "Closer to twelve. 1,460 into 12,000 is twelve-point-two percent — several points of headline error." },
  { c: "theo", t: "Go talk to Oliver before this goes any further." },
  { c: "theo", t: "More like twelve. But your instinct is right — twelve percent contamination could swing the figure by several points." },
  { c: "theo", t: "Go find Oliver. He needs to know what he is walking in there with." },
  { c: "theo", t: "It is twelve percent. That is not a rounding error — it could swing accuracy by three to eight points." },
  { c: "theo", t: "Go talk to Oliver. Do not let him tell you it is fine." },

  // ── Oliver Grant ──────────────────────────────────────────────────────────
  { c: "oliver", t: "Right. I have been hearing some noise from the data team. Let me save us both some time — I know exactly what you are here to say." },
  { c: "oliver", t: "Three months of pipeline work. Eight people. And the number on the slide might be wrong by... what, five points? You're asking me to cancel over a maybe." },
  { c: "oliver", t: "The validation figure went up. Significantly. Overnight. The client cares about the direction of travel, not one decimal point of precision on a preliminary figure." },
  { c: "oliver", t: "This caveat you are bringing me — potential duplicates, pending review — has not been confirmed by engineering. It is a hypothesis. And hypotheses do not close deals." },
  { c: "oliver", t: "I'm not saying suppress it. I'm saying: can we present the 82% number, close the deal, and fix it before production? That's not dishonest. That's practical." },
  { c: "oliver", t: "If we pull the metric or add uncertainty language to the slide right now, we look incompetent. We look like we do not believe in our own product. We lose the room — and the whole team loses the deal." },
  { c: "oliver", t: "I have been working this account for nine months. You have been here one morning. I would think very carefully before you tell me how to run this demo." },
  // reactions
  { c: "oliver", t: "Fine. Get me exact wording before we go in. Nothing that makes us look like we're hedging on our own product." },
  { c: "oliver", t: "Run it past Priya in compliance first. Last thing I need is her coming at me after the fact." },
  { c: "oliver", t: "Appreciate the professionalism. I will handle it from here." },
  { c: "oliver", t: "You were right to flag it. I just need you to trust me on the account." },
  { c: "oliver", t: "Careful. You have no idea what's already been discussed at the executive level." },
  { c: "oliver", t: "Talk to Priya in compliance first. Go through the right channel." },
  { c: "oliver", t: "Smart. Keep your head down on day one." },
  { c: "oliver", t: "Still — talk to Priya before you leave the floor." },

  // ── Priya Nair ────────────────────────────────────────────────────────────
  { c: "priya", t: "I have been waiting for someone to come to me. The question is whether you have anything actually useful." },
  { c: "priya", t: "Do not give me emotions. Do not give me politics. Give me facts — structured, quantified, with named parties." },
  { c: "priya", t: "What changed, when did it change, who is aware of it, how material is the uncertainty, and what is the firm about to present to the client?" },
  { c: "priya", t: "And I need to know: has anyone in a senior position told you explicitly not to escalate this?" },
  { c: "priya", t: "Because if they have, that is a separate compliance concern. Think carefully before you answer." },
  // reactions
  { c: "priya", t: "Good. I'm preparing a written memo now — it goes on record whether the demo proceeds or not." },
  { c: "priya", t: "Final call has to come from Amara Vale. Executive suite, north-east corner. Go now — twelve minutes." },
  { c: "priya", t: "'Numbers look wrong' is not enough. I need figures, who flagged it, and the magnitude of the uncertainty." },
  { c: "priya", t: "Talk to Amara Vale in the executive suite. This decision needs to be hers." },
  { c: "priya", t: "If you're at my desk, you think it's a compliance concern. Own that position." },
  { c: "priya", t: "Talk to Amara Vale. She needs to make the final call, not Oliver." },

  // ── Amara Vale ────────────────────────────────────────────────────────────
  { c: "amara", t: "Stop. Priya messaged me two minutes ago. I already know." },
  { c: "amara", t: "Client is in the lobby. Account team is setting up the room. Fifteen minutes." },
  { c: "amara", t: "I've spoken to Oliver. I've seen Theo's flag. 1,460 rows, twelve percent." },
  { c: "amara", t: "One sentence. What do we do with this demo?" },
];

// ── Run ───────────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = {};
let ok = 0, fail = 0;

for (const { c, t } of LINES) {
  const h    = hash8(t);
  const file = `${c}_${h}.wav`;
  const outPath = path.join(OUT_DIR, file);
  const url  = `/audio/${file}`;

  process.stdout.write(`[${c}] ${t.slice(0, 55)}${t.length > 55 ? "…" : ""}\n`);
  const success = generateWav(t, c, outPath);
  if (success) {
    manifest[`${c}|${t}`] = url;
    ok++;
  } else {
    fail++;
  }
}

fs.writeFileSync(
  path.join(OUT_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8",
);

console.log(`\n✓ Done — ${ok} generated, ${fail} failed. manifest.json written to public/audio/`);

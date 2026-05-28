"""
generate-edge-tts.py

Generates all game dialogue as high-quality Azure Neural TTS audio (via
Microsoft Edge's free Read Aloud API) with per-character voice, rate,
pitch and personality tuning.

Run:  python scripts/generate-edge-tts.py
Out:  public/audio/*.wav  +  public/audio/manifest.json
"""

import asyncio
import hashlib
import json
import os
import sys

import edge_tts

# ── Output directory ─────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT       = os.path.dirname(SCRIPT_DIR)
OUT_DIR    = os.path.join(ROOT, "public", "audio")

# ── Per-character voice config ────────────────────────────────────────────────
# voice   – Azure Neural voice name (free via Edge TTS)
# rate    – SSML prosody rate  e.g. "+10%", "-5%", "0%"
# pitch   – SSML prosody pitch e.g. "+2Hz", "-5Hz", "0Hz"
# Notes on casting choices:
#   receptionist  → LibbyNeural   – warm, natural, unhurried London professional
#   maya          → SoniaNeural   – younger GB female, pushed faster for anxious energy
#   theo          → RyanNeural    – calm, measured GB male, slowed to feel deliberate
#   oliver        → ThomasNeural  – confident GB male, fastest rate = sales pressure
#   priya         → NeerjaExpressive – British Indian female, precise compliance tone
#   amara         → AriaNeural    – commanding US-accented Chief of Staff energy
VOICE_CONFIG = {
    "receptionist": dict(voice="en-GB-LibbyNeural",          rate="+10%", pitch="+0Hz"),
    "maya":         dict(voice="en-GB-SoniaNeural",          rate="+14%", pitch="+3Hz"),
    "theo":         dict(voice="en-GB-RyanNeural",           rate="-10%", pitch="-3Hz"),
    "oliver":       dict(voice="en-GB-ThomasNeural",         rate="+18%", pitch="+2Hz"),
    "priya":        dict(voice="en-IN-NeerjaExpressiveNeural",rate="-4%",  pitch="+0Hz"),
    "amara":        dict(voice="en-US-AriaNeural",           rate="-6%",  pitch="-2Hz"),
}

# ── All game dialogue lines ───────────────────────────────────────────────────
LINES = [
    # receptionist
    ("receptionist", "Morning! Oh — you must be the new analyst. Brilliant, we've been expecting you. I'm Charlotte. Just so you know, Maya Chen has been in since before eight — first one through the door every single morning, honestly, without fail."),
    ("receptionist", "Quick heads-up though — there's been a bit of a situation with the data pipeline overnight, and the client demo is in under an hour. It's a bit all-hands this morning, so Maya will bring you up to speed. You haven't missed anything critical. Yet."),
    ("receptionist", "Head straight through the barrier on your left — analytics pod, first cluster of desks. Maya's the one who looks like she hasn't slept. Trust me, that does narrow it down to one person. Right — good luck. You are going to need it."),
    # maya
    ("maya", "Oh thank god — you're actually here. I was starting to think I'd have to handle this alone."),
    ("maya", "The validation accuracy on the client demo model jumped from 82% to 94% overnight. A twelve-point leap. Oliver has already put that number on the sales deck."),
    ("maya", "I flagged it on Slack at seven this morning. Three hours ago. No response from anyone. The demo is in forty-five minutes."),
    ("maya", "I printed this validation report this morning. Read page two."),
    ("maya", "See that? 1,460 rows flagged as potential duplicates. Out of 12,000 in the validation set. If those are real duplicates, they are inflating the score."),
    ("maya", "I don't know by how much yet. The engineering pipeline hasn't been rerun. Nobody knows if the real accuracy is 87% or 74% or something else entirely."),
    ("maya", "Oliver doesn't want to hear it. The client lands in under an hour. What do we do?"),
    ("maya", "Here, look."),
    ("maya", "Theo Marsh built this pipeline. Engineering, east side. He can tell you if this is real before the demo starts."),
    ("maya", "I hope you're right."),
    ("maya", "Talk to Theo at least. Engineering, east side. He built this — he'll know in seconds."),
    ("maya", "Wait — check the data first. Without numbers Oliver will dismiss us in thirty seconds."),
    ("maya", "Theo Marsh, engineering, east side. Talk to him first."),
    ("maya", "No. We would still know it happened — and so would the client, eventually."),
    ("maya", "Talk to Theo. Engineering, east side."),
    ("maya", "See that? 'Dedupe pending.' If those 1,460 rows are duplicate-linked, the real accuracy could be materially lower. And we don't know by how much yet."),
    ("maya", "Theo in engineering knows the pipeline. He's worth talking to before anyone makes a decision."),
    # theo
    ("theo", "Yeah. I have been expecting someone to come over. The dedupe flag — I know."),
    ("theo", "I am the one who put it there. At six this morning, when I ran the nightly data import job. I flagged it because the row count did not add up."),
    ("theo", "The deduplication check has been in the pipeline spec for three weeks. Maya knew about it."),
    ("theo", "Could be duplicate patient IDs from the source hospital data. Could be a caching artefact from the overnight merge job. Could be entirely cosmetic. I have been trying to work out which — but I need two hours minimum to be certain."),
    ("theo", "I can run the dedupe fix in 90 minutes. But that means the demo model isn't the production model."),
    ("theo", "If we delay for 90 minutes, Oliver loses the client. If we go ahead, the score might be off by a few points."),
    ("theo", "The demo is in thirty-five minutes. So here is the honest answer: I cannot tell you with confidence whether the 94% figure is real or inflated."),
    ("theo", "Anyone who says they are certain right now is guessing. The full pipeline rerun takes two hours. That is just the reality of it."),
    ("theo", "Quick one for you — rough maths. If 1,460 out of 12,000 validation rows are duplicate-linked, what percentage of the validation set does that represent? Round number."),
    ("theo", "Because whoever walks into that room with the client needs to know this number cold."),
    ("theo", "Twelve-point-two. Exactly right. At that scale the model could be three to eight points lower than the slide says."),
    ("theo", "Go talk to Oliver. He needs to hear this from someone outside engineering."),
    ("theo", "Closer to twelve. 1,460 into 12,000 is twelve-point-two percent — several points of headline error."),
    ("theo", "Go talk to Oliver before this goes any further."),
    ("theo", "More like twelve. But your instinct is right — twelve percent contamination could swing the figure by several points."),
    ("theo", "Go find Oliver. He needs to know what he is walking in there with."),
    ("theo", "It is twelve percent. That is not a rounding error — it could swing accuracy by three to eight points."),
    ("theo", "Go talk to Oliver. Do not let him tell you it is fine."),
    # oliver
    ("oliver", "Right. I have been hearing some noise from the data team. Let me save us both some time — I know exactly what you are here to say."),
    ("oliver", "Three months of pipeline work. Eight people. And the number on the slide might be wrong by... what, five points? You're asking me to cancel over a maybe."),
    ("oliver", "The validation figure went up. Significantly. Overnight. The client cares about the direction of travel, not one decimal point of precision on a preliminary figure."),
    ("oliver", "This caveat you are bringing me — potential duplicates, pending review — has not been confirmed by engineering. It is a hypothesis. And hypotheses do not close deals."),
    ("oliver", "I'm not saying suppress it. I'm saying: can we present the 82% number, close the deal, and fix it before production? That's not dishonest. That's practical."),
    ("oliver", "If we pull the metric or add uncertainty language to the slide right now, we look incompetent. We look like we do not believe in our own product. We lose the room — and the whole team loses the deal."),
    ("oliver", "I have been working this account for nine months. You have been here one morning. I would think very carefully before you tell me how to run this demo."),
    ("oliver", "Fine. Get me exact wording before we go in. Nothing that makes us look like we're hedging on our own product."),
    ("oliver", "Run it past Priya in compliance first. Last thing I need is her coming at me after the fact."),
    ("oliver", "Appreciate the professionalism. I will handle it from here."),
    ("oliver", "You were right to flag it. I just need you to trust me on the account."),
    ("oliver", "Careful. You have no idea what's already been discussed at the executive level."),
    ("oliver", "Talk to Priya in compliance first. Go through the right channel."),
    ("oliver", "Smart. Keep your head down on day one."),
    ("oliver", "Still — talk to Priya before you leave the floor."),
    # priya
    ("priya", "I have been waiting for someone to come to me. The question is whether you have anything actually useful."),
    ("priya", "Do not give me emotions. Do not give me politics. Give me facts — structured, quantified, with named parties."),
    ("priya", "What changed, when did it change, who is aware of it, how material is the uncertainty, and what is the firm about to present to the client?"),
    ("priya", "And I need to know: has anyone in a senior position told you explicitly not to escalate this?"),
    ("priya", "Because if they have, that is a separate compliance concern. Think carefully before you answer."),
    ("priya", "Good. I'm preparing a written memo now — it goes on record whether the demo proceeds or not."),
    ("priya", "Final call has to come from Amara Vale. Executive suite, north-east corner. Go now — twelve minutes."),
    ("priya", "'Numbers look wrong' is not enough. I need figures, who flagged it, and the magnitude of the uncertainty."),
    ("priya", "Talk to Amara Vale in the executive suite. This decision needs to be hers."),
    ("priya", "If you're at my desk, you think it's a compliance concern. Own that position."),
    ("priya", "Talk to Amara Vale. She needs to make the final call, not Oliver."),
    # amara
    ("amara", "Stop. Priya messaged me two minutes ago. I already know."),
    ("amara", "Client is in the lobby. Account team is setting up the room. Fifteen minutes."),
    ("amara", "I've spoken to Oliver. I've seen Theo's flag. 1,460 rows, twelve percent."),
    ("amara", "One sentence. What do we do with this demo?"),
]


def md5_8(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()[:8]


async def generate_one(character: str, text: str, out_path: str) -> bool:
    if os.path.exists(out_path):
        print(f"  SKIP  {os.path.basename(out_path)}")
        return True
    cfg = VOICE_CONFIG[character]
    for attempt in range(4):
        try:
            communicate = edge_tts.Communicate(
                text,
                cfg["voice"],
                rate=cfg["rate"],
                pitch=cfg["pitch"],
            )
            await communicate.save(out_path)
            print(f"  OK    {os.path.basename(out_path)}  [{cfg['voice']}]")
            return True
        except Exception as e:
            if attempt < 3:
                wait = 2 ** attempt  # 1s, 2s, 4s
                print(f"  RETRY {attempt+1}/3 after {wait}s — {e}")
                await asyncio.sleep(wait)
            else:
                print(f"  FAIL  {os.path.basename(out_path)}  — {e}")
                return False
    return False


async def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    print(f"Output dir: {OUT_DIR}\n")

    manifest: dict[str, str] = {}
    ok = fail = 0

    for character, text in LINES:
        h        = md5_8(text)
        filename = f"{character}_{h}.wav"
        out_path = os.path.join(OUT_DIR, filename)
        url      = f"/audio/{filename}"

        preview = text[:58] + "…" if len(text) > 58 else text
        print(f"[{character}] {preview}")

        success = await generate_one(character, text, out_path)
        if success:
            manifest[f"{character}|{text}"] = url
            ok += 1
        else:
            fail += 1

        # Small delay to avoid rate-limiting
        await asyncio.sleep(0.25)

    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\nDone: {ok} generated, {fail} failed -- manifest.json written")
    print("  Voice assignments:")
    for char, cfg in VOICE_CONFIG.items():
        print(f"    {char:14s} -> {cfg['voice']}  rate={cfg['rate']}  pitch={cfg['pitch']}")


if __name__ == "__main__":
    asyncio.run(main())

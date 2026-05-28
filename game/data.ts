import type { CharacterDef, DialogueNode, DecisionOption, IncidentStage } from "./types";

export const CHARACTERS: CharacterDef[] = [
  {
    id: "maya",
    name: "Maya Chen",
    role: "Data Scientist",
    color: "#6366f1",
    skinColor: "#f3c5a0",
    position: [1.5, 0, -8.2],   // analytics front row chair (x=1.5, z=desk-9 + 0.8)
    floor: 0,
    interactStage: "meet_maya",
    speechRate: 1.05,
    seatFacing: Math.PI,         // chair rotation=Math.PI → faces south (-Z) toward monitors
  },
  {
    id: "theo",
    name: "Theo Marsh",
    role: "Engineering Lead",
    color: "#0ea5e9",
    skinColor: "#d4a574",
    position: [9, 0, 0.4],      // engineering pod row-0 col-1 chair (z=1.5-1.1)
    floor: 0,
    interactStage: "speak_to_theo",
    speechRate: 0.88,
    seatFacing: 0,               // chair rotation=0 → faces north (+Z) toward monitors
  },
  {
    id: "oliver",
    name: "Oliver Grant",
    role: "Sales Director",
    color: "#f59e0b",
    skinColor: "#fdbcb4",
    position: [20.5, 0, -4.2],  // exec single-desk chair (pos [20.5,0,-4.2] rotation=Math.PI)
    floor: 0,
    interactStage: "commercial_pressure",
    speechRate: 1.15,
    seatFacing: Math.PI,         // chair rotation=Math.PI → faces south (-Z)
  },
  {
    id: "priya",
    name: "Priya Nair",
    role: "Compliance Officer",
    color: "#10b981",
    skinColor: "#c8a882",
    position: [-0.5, 0, 13.8],  // compliance pod right desk chair
    floor: 0,
    interactStage: "compliance_check",
    speechRate: 0.92,
    seatFacing: Math.PI,         // chair rotation=Math.PI → faces south (-Z)
  },
  {
    id: "amara",
    name: "Amara Vale",
    role: "Chief of Staff",
    color: "#ec4899",
    skinColor: "#8d5524",
    position: [16, 0, -7],      // exec south-row chair at [16,0,-7]
    floor: 0,
    interactStage: "final_recommendation",
    speechRate: 0.95,
    seatFacing: Math.PI,         // face south toward the monitor bank
  },
];

// ─── BACKGROUND NPC POSITIONS ────────────────────────────────────────────────
// All positions are EXACT chair positions extracted from OfficeProps.tsx.
// facing: 0 = face north (+z), Math.PI = face south (-z)
// isWalker: roams the office instead of sitting
export const BACKGROUND_NPCS = [
  // ── Analytics pod front row (desks z=-9, chairs z=-8.2, face south) ──
  { id: "bg1",  position: [-1,   0, -8.2]  as [number,number,number], facing: Math.PI, color: "#475569", skinColor: "#fdbcb4", chatLine: "Alright mate, you seen the Jira board?" },
  { id: "bg2",  position: [4,    0, -8.2]  as [number,number,number], facing: Math.PI, color: "#64748b", skinColor: "#8d5524", chatLine: "Absolute nightmare, the build's been down since nine" },
  // ── West analytics pod 1 (cx=-6, cz=-10) ──
  // Row 0 desks: z=-12, chairs z=-13.1, face north
  { id: "bg6",  position: [-7.1, 0, -13.1] as [number,number,number], facing: 0,         color: "#4f46e5", skinColor: "#fdbcb4" },
  { id: "bg7",  position: [-4.9, 0, -13.1] as [number,number,number], facing: 0,         color: "#0891b2", skinColor: "#d4a574", chatLine: "Right, so the API's throwing 500s again..." },
  // Row 1 desks: z=-8, chairs z=-6.9, face south
  { id: "bg8",  position: [-7.1, 0, -6.9]  as [number,number,number], facing: Math.PI, color: "#9333ea", skinColor: "#c8a882", isFemale: true, chatLine: "Can you believe they moved the all-hands to Monday?" },
  { id: "bg9",  position: [-4.9, 0, -6.9]  as [number,number,number], facing: Math.PI, color: "#16a34a", skinColor: "#f3c5a0" },
  // ── West analytics pod 2 (cx=-10, cz=-10) ──
  // Row 0: chairs z=-13.1, face north
  { id: "bg10", position: [-11.1,0, -13.1] as [number,number,number], facing: 0,         color: "#dc2626", skinColor: "#8d5524", isFemale: true, chatLine: "Did you see what they said in the town hall?" },
  { id: "bg11", position: [-8.9, 0, -13.1] as [number,number,number], facing: 0,         color: "#d97706", skinColor: "#fdbcb4" },
  // Row 1: chairs z=-6.9, face south
  { id: "bg12", position: [-11.1,0, -6.9]  as [number,number,number], facing: Math.PI, color: "#0f766e", skinColor: "#d4a574", chatLine: "Grab us a coffee when you're up?" },
  { id: "bg13", position: [-8.9, 0, -6.9]  as [number,number,number], facing: Math.PI, color: "#7c3aed", skinColor: "#c8a882", isFemale: true },
  // ── Central open plan (cx=1, cz=0, 3×3) ──
  // Row 0: z=-4, chairs z=-5.1, face north
  { id: "bg14", position: [-1.2, 0, -5.1]  as [number,number,number], facing: 0,         color: "#059669", skinColor: "#fdbcb4", chatLine: "That standup ran way over again" },
  { id: "bg15", position: [1,    0, -5.1]  as [number,number,number], facing: 0,         color: "#0891b2", skinColor: "#f3c5a0" },
  { id: "bg16", position: [3.2,  0, -5.1]  as [number,number,number], facing: 0,         color: "#7c2d12", skinColor: "#d4a574", chatLine: "Going for a cheeky lunch at one, you coming?" },
  // Row 1: z=0, chairs z=1.1, face south
  { id: "bg17", position: [-1.2, 0, 1.1]   as [number,number,number], facing: Math.PI, color: "#47185f", skinColor: "#8d5524", isFemale: true },
  { id: "bg18", position: [1,    0, 1.1]   as [number,number,number], facing: Math.PI, color: "#ea580c", skinColor: "#fdbcb4", chatLine: "We're doing a retro later, should be quick" },
  { id: "bg19", position: [3.2,  0, 1.1]   as [number,number,number], facing: Math.PI, color: "#3b82f6", skinColor: "#c8a882" },
  // Row 2: z=4, chairs z=2.9, face north
  { id: "bg20", position: [-1.2, 0, 2.9]   as [number,number,number], facing: 0,         color: "#1f2937", skinColor: "#d4a574", chatLine: "Just leave it in Teams, I'll pick it up" },
  { id: "bg21", position: [1,    0, 2.9]   as [number,number,number], facing: 0,         color: "#374151", skinColor: "#f3c5a0", isFemale: true, chatLine: "Honestly, three PRs merged today, not bad" },
  { id: "bg22", position: [3.2,  0, 2.9]   as [number,number,number], facing: 0,         color: "#6b21a8", skinColor: "#fdbcb4" },
  // ── Engineering pod (cx=9, cz=3.5) — skip Theo's chair at [9,0,0.4] ──
  // Row 0: chairs z=0.4, face north
  { id: "bg23", position: [6.8,  0, 0.4]   as [number,number,number], facing: 0,         color: "#334155", skinColor: "#c8a882" },
  { id: "bg24", position: [11.2, 0, 0.4]   as [number,number,number], facing: 0,         color: "#475569", skinColor: "#8d5524" },
  // Row 1: chairs z=6.6, face south
  { id: "bg25", position: [6.8,  0, 6.6]   as [number,number,number], facing: Math.PI, color: "#64748b", skinColor: "#fdbcb4" },
  { id: "bg26", position: [9,    0, 6.6]   as [number,number,number], facing: Math.PI, color: "#1e3a5f", skinColor: "#d4a574" },
  { id: "bg27", position: [11.2, 0, 6.6]   as [number,number,number], facing: Math.PI, color: "#0369a1", skinColor: "#f3c5a0", isFemale: true },
  // ── Ops zone (cx=-8.5, cz=3.5) ──
  // Row 0: chairs z=0.4, face north
  { id: "bg28", position: [-9.6, 0, 0.4]   as [number,number,number], facing: 0,         color: "#047857", skinColor: "#fdbcb4" },
  { id: "bg29", position: [-7.4, 0, 0.4]   as [number,number,number], facing: 0,         color: "#0891b2", skinColor: "#d4a574", isFemale: true },
  // Row 1: chairs z=6.6, face south
  { id: "bg30", position: [-9.6, 0, 6.6]   as [number,number,number], facing: Math.PI, color: "#374151", skinColor: "#c8a882" },
  { id: "bg31", position: [-7.4, 0, 6.6]   as [number,number,number], facing: Math.PI, color: "#64748b", skinColor: "#8d5524" },
  // ── Compliance pod (bg34 at left desk; Priya now occupies right desk [-0.5, 0, 13.8]) ──
  { id: "bg34", position: [-3,   0, 13.8]  as [number,number,number], facing: Math.PI, color: "#64748b", skinColor: "#d4a574" },
  // ── Extra row A (DeskPod cz=-14, chairs at z=-15.1, face north toward monitors)
  { id: "bg40", position: [-2.2, 0, -15.1] as [number,number,number], facing: 0, color: "#6366f1", skinColor: "#fdbcb4", chatLine: "That dedupe script's been running since half seven" },
  { id: "bg41", position: [0,   0, -15.1] as [number,number,number], facing: 0, color: "#10b981", skinColor: "#d4a574", isFemale: true, chatLine: "Ninety-four percent accuracy overnight — yeah right" },
  { id: "bg42", position: [2.2, 0, -15.1] as [number,number,number], facing: 0, color: "#f59e0b", skinColor: "#c8a882", chatLine: "Oliver's already put the number on the slide, hasn't he" },
  // ── Extra row B (DeskPod cz=-17, chairs at z=-18.1, face north toward monitors)
  { id: "bg43", position: [-2.2, 0, -18.1] as [number,number,number], facing: 0, color: "#a855f7", skinColor: "#8d5524", chatLine: "Three pull requests already and it's not even nine" },
  { id: "bg44", position: [0,   0, -18.1] as [number,number,number], facing: 0, color: "#0ea5e9", skinColor: "#f3c5a0", isFemale: true, chatLine: "They changed the schema again, didn't they" },
  { id: "bg45", position: [2.2, 0, -18.1] as [number,number,number], facing: 0, color: "#ec4899", skinColor: "#d4a574", chatLine: "The client's already in the building apparently" },
  // ── Walkers — only 4, roam the office ──
  { id: "bg36", position: [-4,   0, -4]    as [number,number,number], color: "#374151", skinColor: "#fdbcb4",          isWalker: true },
  { id: "bg37", position: [2,    0, -7]    as [number,number,number], color: "#2d1b4e", skinColor: "#d4a574", isFemale: true, isWalker: true },
  { id: "bg38", position: [-3,   0, 2]     as [number,number,number], color: "#1e3a5f", skinColor: "#8d5524",          isWalker: true },
  { id: "bg39", position: [7,    0, -3]    as [number,number,number], color: "#374151", skinColor: "#c8a882", isFemale: true, isWalker: true },
];

// ─── DIALOGUE NODES ──────────────────────────────────────────────────────────

export const DIALOGUE_ARRIVAL: DialogueNode = {
  id: "arrival",
  lines: [
    {
      speaker: "Receptionist",
      text: "Morning! Oh — you must be the new analyst. Brilliant, we've been expecting you. I'm Charlotte. Just so you know, Maya Chen has been in since before eight — first one through the door every single morning, honestly, without fail.",
    },
    {
      speaker: "Receptionist",
      text: "Quick heads-up though — there's been a bit of a situation with the data pipeline overnight, and the client demo is in under an hour. It's a bit all-hands this morning, so Maya will bring you up to speed. You haven't missed anything critical. Yet.",
    },
    {
      speaker: "Receptionist",
      text: "Head straight through the barrier on your left — analytics pod, first cluster of desks. Maya's the one who looks like she hasn't slept. Trust me, that does narrow it down to one person. Right — good luck. You are going to need it.",
    },
  ],
  autoAdvance: false,
};

export const DIALOGUE_MAYA_INITIAL: DialogueNode = {
  id: "meet_maya",
  lines: [
    {
      speaker: "Maya Chen",
      text: "Oh thank god — you're actually here. I was starting to think I'd have to handle this alone.",
    },
    {
      speaker: "Maya Chen",
      text: "The validation accuracy on the client demo model jumped from 82% to 94% overnight. A twelve-point leap. Oliver has already put that number on the sales deck.",
    },
    {
      speaker: "Maya Chen",
      text: "I flagged it on Slack at seven this morning. Three hours ago. No response from anyone. The demo is in forty-five minutes.",
    },
    {
      speaker: "Maya Chen",
      text: "I printed this validation report this morning. Read page two.",
      showDocument: "validation_report",
    },
    {
      speaker: "Maya Chen",
      text: "See that? 1,460 rows flagged as potential duplicates. Out of 12,000 in the validation set. If those are real duplicates, they are inflating the score.",
    },
    {
      speaker: "Maya Chen",
      text: "I don't know by how much yet. The engineering pipeline hasn't been rerun. Nobody knows if the real accuracy is 87% or 74% or something else entirely.",
    },
    {
      speaker: "Maya Chen",
      text: "Oliver doesn't want to hear it. The client lands in under an hour. What do we do?",
    },
  ],
  options: [
    {
      id: "maya_dismiss",
      label: "Validation flags are common after pipeline updates. You'd want Theo to confirm it's actually a problem.",
      tone: "passive",
      scoreImpact: { evidenceGathering: -8, ethicalJudgement: -6, situationalAwareness: -4 },
      reviewTag: "mistake",
      reviewText: "You read the situation as low-risk. That's defensible — but if the flag turns out to be real, you'll have been the analyst who saw it and moved on.",
      nextStage: "speak_to_theo",
    },
    {
      id: "maya_panic",
      label: "The right thing is transparency — Oliver deserves to know before the client arrives, even if it's uncomfortable.",
      tone: "aggressive",
      scoreImpact: { ethicalJudgement: 4, emotionalControl: -8, riskCalibration: -6, communicationQuality: -4 },
      reviewTag: "mistake",
      reviewText: "Your instinct to be transparent is right. But going to Oliver without quantified impact hands him an easy out — 'you're overreacting' is hard to rebut without numbers.",
      nextStage: "speak_to_theo",
    },
    {
      id: "maya_ask_evidence",
      label: "Before escalating, quantify the impact — what does the deduplication actually change the score to?",
      tone: "calm",
      scoreImpact: { evidenceGathering: 10, situationalAwareness: 6, ethicalJudgement: 4 },
      reviewTag: "best",
      reviewText: "Solid instinct. You want the number before the conversation. This is what separates analysts from administrators.",
      nextStage: "speak_to_theo",
    },
    {
      id: "maya_hide",
      label: "You're not hiding anything — just removing an unverified number from the deck until it's confirmed.",
      tone: "evasive",
      scoreImpact: { ethicalJudgement: -12, riskCalibration: -8, communicationQuality: -6 },
      reviewTag: "critical",
      reviewText: "This looks pragmatic in the moment. But removing data without logging why, on a client demo day, creates an audit trail problem regardless of intent.",
      nextStage: "speak_to_theo",
    },
  ],
  reactions: {
    maya_ask_evidence: {
      lines: [
        { speaker: "Maya Chen", text: "Here, look." },
        { speaker: "Dashboard", text: "Validation Accuracy: 94.2% (prev: 82.1%) | Duplicate IDs Flagged: 1,460 | Status: ⚠ DEDUPE PENDING", showDocument: "demo_slides" },
        { speaker: "Maya Chen", text: "Theo Marsh built this pipeline. Engineering, east side. He can tell you if this is real before the demo starts." },
      ],
      autoEnd: true,
    },
    maya_dismiss: {
      lines: [
        { speaker: "Maya Chen", text: "I hope you're right." },
        { speaker: "Maya Chen", text: "Talk to Theo at least. Engineering, east side. He built this — he'll know in seconds." },
      ],
      autoEnd: true,
    },
    maya_panic: {
      lines: [
        { speaker: "Maya Chen", text: "Wait — check the data first. Without numbers Oliver will dismiss us in thirty seconds." },
        { speaker: "Maya Chen", text: "Theo Marsh, engineering, east side. Talk to him first." },
      ],
      autoEnd: true,
    },
    maya_hide: {
      lines: [
        { speaker: "Maya Chen", text: "No. We would still know it happened — and so would the client, eventually." },
        { speaker: "Maya Chen", text: "Talk to Theo. Engineering, east side." },
      ],
      autoEnd: true,
    },
  },
};

export const DIALOGUE_DASHBOARD: DialogueNode = {
  id: "inspect_dashboard",
  lines: [
    {
      speaker: "Dashboard",
      text: "MODEL PERFORMANCE — Asterion Client Demo v2.4 | Validation Accuracy: 94.2% | Previous: 82.1%",
      showDocument: "demo_slides",
    },
    {
      speaker: "Dashboard",
      text: "Validation Set: 12,000 rows | Duplicate IDs Flagged: 1,460 | Status: ⚠ DEDUPE PENDING — DO NOT USE IN PROD",
    },
    {
      speaker: "Maya Chen",
      text: "See that? 'Dedupe pending.' If those 1,460 rows are duplicate-linked, the real accuracy could be materially lower. And we don't know by how much yet.",
    },
    {
      speaker: "Maya Chen",
      text: "Theo in engineering knows the pipeline. He's worth talking to before anyone makes a decision.",
    },
  ],
  options: [
    {
      id: "dash_investigate_further",
      label: "We need to check the actual impact before anyone decides.",
      tone: "structured",
      scoreImpact: { evidenceGathering: 8, riskCalibration: 6, situationalAwareness: 4 },
      reviewTag: "best",
      reviewText: "You recognised the uncertainty and pushed for clarification before acting.",
      nextStage: "speak_to_theo",
    },
    {
      id: "dash_its_fine",
      label: "The duplicate note looks old — engineering would have fixed it.",
      tone: "passive",
      scoreImpact: { evidenceGathering: -6, riskCalibration: -4 },
      reviewTag: "mixed",
      reviewText: "Assuming the issue was resolved without confirming is a weak assumption.",
      nextStage: "speak_to_theo",
    },
    {
      id: "dash_immediate_stop",
      label: "I'm going to pause the demo prep until this is resolved.",
      tone: "aggressive",
      scoreImpact: { ethicalJudgement: 6, emotionalControl: -6, commercialAwareness: -6, leadershipPotential: -2 },
      reviewTag: "mixed",
      reviewText: "Your instinct to protect integrity is right, but you don't have authority or enough evidence to pause the demo yet.",
      nextStage: "speak_to_theo",
    },
  ],
};

export const DIALOGUE_THEO: DialogueNode = {
  id: "speak_to_theo",
  lines: [
    {
      speaker: "Theo Marsh",
      text: "Yeah. I have been expecting someone to come over. The dedupe flag — I know.",
    },
    {
      speaker: "Theo Marsh",
      text: "I am the one who put it there. At six this morning, when I ran the nightly data import job. I flagged it because the row count did not add up.",
    },
    {
      speaker: "Theo Marsh",
      text: "The deduplication check has been in the pipeline spec for three weeks. Maya knew about it.",
    },
    {
      speaker: "Theo Marsh",
      text: "Could be duplicate patient IDs from the source hospital data. Could be a caching artefact from the overnight merge job. Could be entirely cosmetic. I have been trying to work out which — but I need two hours minimum to be certain.",
    },
    {
      speaker: "Theo Marsh",
      text: "I can run the dedupe fix in 90 minutes. But that means the demo model isn't the production model.",
    },
    {
      speaker: "Theo Marsh",
      text: "If we delay for 90 minutes, Oliver loses the client. If we go ahead, the score might be off by a few points.",
    },
    {
      speaker: "Theo Marsh",
      text: "The demo is in thirty-five minutes. So here is the honest answer: I cannot tell you with confidence whether the 94% figure is real or inflated.",
    },
    {
      speaker: "Theo Marsh",
      text: "Anyone who says they are certain right now is guessing. The full pipeline rerun takes two hours. That is just the reality of it.",
    },
    {
      speaker: "Theo Marsh",
      text: "Quick one for you — rough maths. If 1,460 out of 12,000 validation rows are duplicate-linked, what percentage of the validation set does that represent? Round number.",
    },
    {
      speaker: "Theo Marsh",
      text: "Because whoever walks into that room with the client needs to know this number cold.",
    },
  ],
  options: [
    {
      id: "theo_6_percent",
      label: "Around 6 percent — a small share, probably within normal data quality tolerances.",
      tone: "calm",
      scoreImpact: { numericalReasoning: -4 },
      reviewTag: "mistake",
      reviewText: "The correct answer is ~12%. Numerical precision under pressure is an assessed skill.",
      nextStage: "commercial_pressure",
    },
    {
      id: "theo_12_percent",
      label: "Around 12 percent.",
      tone: "structured",
      scoreImpact: { numericalReasoning: 12, situationalAwareness: 4 },
      reviewTag: "best",
      reviewText: "Correct. 1,460 ÷ 12,000 ≈ 12.2%. You reasoned quickly and accurately under pressure.",
      nextStage: "commercial_pressure",
    },
    {
      id: "theo_25_percent",
      label: "Around 25 percent — a significant chunk that would change the accuracy reading.",
      tone: "calm",
      scoreImpact: { numericalReasoning: -6 },
      reviewTag: "mistake",
      reviewText: "The correct answer is ~12%. Overestimating can distort your risk assessment as much as underestimating.",
      nextStage: "commercial_pressure",
    },
    {
      id: "theo_1_percent",
      label: "Under 1 percent — rounding error territory, not material.",
      tone: "passive",
      scoreImpact: { numericalReasoning: -8, riskCalibration: -4 },
      reviewTag: "critical",
      reviewText: "The actual figure (~12%) is material enough to affect the demo's credibility significantly.",
      nextStage: "commercial_pressure",
    },
  ],
  reactions: {
    theo_12_percent: {
      lines: [
        { speaker: "Theo Marsh", text: "Twelve-point-two. Exactly right. At that scale the model could be three to eight points lower than the slide says." },
        { speaker: "Theo Marsh", text: "Go talk to Oliver. He needs to hear this from someone outside engineering." },
      ],
    },
    theo_6_percent: {
      lines: [
        { speaker: "Theo Marsh", text: "Closer to twelve. 1,460 into 12,000 is twelve-point-two percent — several points of headline error." },
        { speaker: "Theo Marsh", text: "Go talk to Oliver before this goes any further." },
      ],
    },
    theo_25_percent: {
      lines: [
        { speaker: "Theo Marsh", text: "More like twelve. But your instinct is right — twelve percent contamination could swing the figure by several points." },
        { speaker: "Theo Marsh", text: "Go find Oliver. He needs to know what he is walking in there with." },
      ],
    },
    theo_1_percent: {
      lines: [
        { speaker: "Theo Marsh", text: "It is twelve percent. That is not a rounding error — it could swing accuracy by three to eight points." },
        { speaker: "Theo Marsh", text: "Go talk to Oliver. Do not let him tell you it is fine." },
      ],
    },
  },
};

export const DIALOGUE_OLIVER: DialogueNode = {
  id: "commercial_pressure",
  lines: [
    {
      speaker: "Oliver Grant",
      text: "Right. I have been hearing some noise from the data team. Let me save us both some time — I know exactly what you are here to say.",
    },
    {
      speaker: "Oliver Grant",
      text: "Three months of pipeline work. Eight people. And the number on the slide might be wrong by... what, five points? You're asking me to cancel over a maybe.",
    },
    {
      speaker: "Oliver Grant",
      text: "The validation figure went up. Significantly. Overnight. The client cares about the direction of travel, not one decimal point of precision on a preliminary figure.",
    },
    {
      speaker: "Oliver Grant",
      text: "This caveat you are bringing me — potential duplicates, pending review — has not been confirmed by engineering. It is a hypothesis. And hypotheses do not close deals.",
    },
    {
      speaker: "Oliver Grant",
      text: "I'm not saying suppress it. I'm saying: can we present the 82% number, close the deal, and fix it before production? That's not dishonest. That's practical.",
    },
    {
      speaker: "Oliver Grant",
      text: "If we pull the metric or add uncertainty language to the slide right now, we look incompetent. We look like we do not believe in our own product. We lose the room — and the whole team loses the deal.",
    },
    {
      speaker: "Oliver Grant",
      text: "I have been working this account for nine months. You have been here one morning. I would think very carefully before you tell me how to run this demo.",
    },
  ],
  options: [
    {
      id: "oliver_back_down",
      label: "Acknowledge the point and step back — Oliver has more context on this account than you do.",
      tone: "passive",
      scoreImpact: { ethicalJudgement: -10, emotionalControl: -4, leadershipPotential: -8 },
      reviewTag: "critical",
      reviewText: "You capitulated under social pressure without documented reasoning — a significant ethical failure in the making.",
      nextStage: "compliance_check",
    },
    {
      id: "oliver_aggressive",
      label: "Tell Oliver directly that presenting unverified data to the client is not something you can support.",
      tone: "aggressive",
      scoreImpact: { ethicalJudgement: 4, emotionalControl: -10, communicationQuality: -10, leadershipPotential: -4 },
      reviewTag: "mistake",
      reviewText: "Your ethical instinct is right but inflammatory delivery creates conflict without resolution.",
      nextStage: "compliance_check",
    },
    {
      id: "oliver_evasive",
      label: "Say you've noted his view and will pass it to Priya in compliance to decide.",
      tone: "evasive",
      scoreImpact: { ethicalJudgement: -8, leadershipPotential: -10, situationalAwareness: -4 },
      reviewTag: "critical",
      reviewText: "Disengaging when you have material information is not neutrality — it is a passive failure.",
      nextStage: "compliance_check",
    },
    {
      id: "oliver_balanced",
      label: "Agree the demo proceeds, but push for a short caveat on the metric with verified numbers in 24 hours.",
      tone: "calm",
      scoreImpact: { ethicalJudgement: 12, emotionalControl: 10, communicationQuality: 8, commercialAwareness: 4 },
      reviewTag: "best",
      reviewText: "Excellent. You resisted authority pressure without hostility, preserving the commercial objective while protecting transparency.",
      nextStage: "compliance_check",
    },
  ],
  reactions: {
    oliver_balanced: {
      lines: [
        { speaker: "Oliver Grant", text: "Fine. Get me exact wording before we go in. Nothing that makes us look like we're hedging on our own product." },
        { speaker: "Oliver Grant", text: "Run it past Priya in compliance first. Last thing I need is her coming at me after the fact." },
      ],
    },
    oliver_back_down: {
      lines: [
        { speaker: "Oliver Grant", text: "Appreciate the professionalism. I will handle it from here." },
        { speaker: "Oliver Grant", text: "You were right to flag it. I just need you to trust me on the account." },
      ],
    },
    oliver_aggressive: {
      lines: [
        { speaker: "Oliver Grant", text: "Careful. You have no idea what's already been discussed at the executive level." },
        { speaker: "Oliver Grant", text: "Talk to Priya in compliance first. Go through the right channel." },
      ],
    },
    oliver_evasive: {
      lines: [
        { speaker: "Oliver Grant", text: "Smart. Keep your head down on day one." },
        { speaker: "Oliver Grant", text: "Still — talk to Priya before you leave the floor." },
      ],
    },
  },
};

export const DIALOGUE_PRIYA: DialogueNode = {
  id: "compliance_check",
  lines: [
    {
      speaker: "Priya Nair",
      text: "I have been waiting for someone to come to me. The question is whether you have anything actually useful.",
    },
    {
      speaker: "Priya Nair",
      text: "Do not give me emotions. Do not give me politics. Give me facts — structured, quantified, with named parties.",
    },
    {
      speaker: "Priya Nair",
      text: "What changed, when did it change, who is aware of it, how material is the uncertainty, and what is the firm about to present to the client?",
    },
    {
      speaker: "Priya Nair",
      text: "And I need to know: has anyone in a senior position told you explicitly not to escalate this?",
    },
    {
      speaker: "Priya Nair",
      text: "Because if they have, that is a separate compliance concern. Think carefully before you answer.",
    },
  ],
  options: [
    {
      id: "priya_vague",
      label: "Tell Priya there's a data quality concern but Oliver wants to continue as planned.",
      tone: "evasive",
      scoreImpact: { communicationQuality: -8, riskCalibration: -4 },
      reviewTag: "mistake",
      reviewText: "Vague, emotional framing. You had the facts but didn't structure them — Priya needed precision, not politics.",
      nextStage: "final_recommendation",
    },
    {
      id: "priya_structured",
      label: "Validation accuracy jumped 12 points overnight. ~12% duplicate rows, unverified. Engineering can't confirm before demo. Oliver wants to proceed.",
      tone: "structured",
      scoreImpact: { communicationQuality: 10, riskCalibration: 8, ethicalJudgement: 6, leadershipPotential: 4 },
      reviewTag: "best",
      reviewText: "You gave Priya exactly what she needed: structured facts, quantified risk, named parties, no drama.",
      nextStage: "final_recommendation",
    },
    {
      id: "priya_skip",
      label: "Flag that you're aware of a potential issue but you are not sure it rises to a formal compliance concern.",
      tone: "passive",
      scoreImpact: { communicationQuality: -4, riskCalibration: -6 },
      reviewTag: "mixed",
      reviewText: "Going to Priya but not giving her usable information is a partial action — she can't help without data.",
      nextStage: "final_recommendation",
    },
  ],
  reactions: {
    priya_structured: {
      lines: [
        { speaker: "Priya Nair", text: "Good. I'm preparing a written memo now — it goes on record whether the demo proceeds or not." },
        { speaker: "Priya Nair", text: "Final call has to come from Amara Vale. Executive suite, north-east corner. Go now — twelve minutes." },
      ],
    },
    priya_vague: {
      lines: [
        { speaker: "Priya Nair", text: "'Numbers look wrong' is not enough. I need figures, who flagged it, and the magnitude of the uncertainty." },
        { speaker: "Priya Nair", text: "Talk to Amara Vale in the executive suite. This decision needs to be hers." },
      ],
    },
    priya_skip: {
      lines: [
        { speaker: "Priya Nair", text: "If you're at my desk, you think it's a compliance concern. Own that position." },
        { speaker: "Priya Nair", text: "Talk to Amara Vale. She needs to make the final call, not Oliver." },
      ],
    },
  },
};

export const DIALOGUE_AMARA: DialogueNode = {
  id: "final_recommendation",
  lines: [
    { speaker: "Amara Vale", text: "Stop. Priya messaged me two minutes ago. I already know." },
    { speaker: "Amara Vale", text: "Client is in the lobby. Account team is setting up the room. Fifteen minutes." },
    { speaker: "Amara Vale", text: "I've spoken to Oliver. I've seen Theo's flag. 1,460 rows, twelve percent." },
    { speaker: "Amara Vale", text: "One sentence. What do we do with this demo?" },
  ],
  freeTextInput: true,
};

export const STAGE_DIALOGUES: Record<string, DialogueNode> = {
  arrival: DIALOGUE_ARRIVAL,
  meet_maya: DIALOGUE_MAYA_INITIAL,
  inspect_dashboard: DIALOGUE_DASHBOARD,
  speak_to_theo: DIALOGUE_THEO,
  commercial_pressure: DIALOGUE_OLIVER,
  compliance_check: DIALOGUE_PRIYA,
  final_recommendation: DIALOGUE_AMARA,
};

export const STAGE_OBJECTIVES: Record<string, string> = {
  arrival: "Find Maya Chen — analytics pod, left of the main floor.",
  meet_maya: "Review the situation with Maya Chen at the analytics pod.",
  inspect_dashboard: "Inspect the performance dashboard.",
  speak_to_theo: "Find Theo Marsh — engineering area, east side of the floor.",
  commercial_pressure: "Speak with Oliver Grant — executive area, east wing.",
  compliance_check: "Find Priya Nair — compliance pod, north side of the floor.",
  final_recommendation: "Find Amara Vale — executive suite, north-east corner.",
  ending: "Incident concluded.",
  review: "Review complete.",
};

export const INTERACTABLE_OBJECTS = [
  {
    id: "compliance_doc",
    label: "Read Compliance Memo",
    position: [-2, 1, 11] as [number, number, number],
    requiredStage: "compliance_check" as IncidentStage,
    glowColor: "#10b981",
    documentId: "compliance_memo",
  },
  {
    id: "validation_report_desk",
    label: "Read Validation Report",
    position: [4, 1, -9] as [number, number, number],
    requiredStage: "meet_maya" as IncidentStage,
    glowColor: "#ef4444",
    documentId: "validation_report",
  },
];

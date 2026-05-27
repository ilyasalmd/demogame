import type { DecisionRecord, ReviewData, ReviewMove, SessionData, SkillKey } from "./types";
import { SKILL_LABELS, computeOverallScore, ENDING_DATA } from "./scoring";

const DECISION_LABELS: Record<string, { label: string; skillTags: string[] }> = {
  maya_initial: { label: "Maya's Warning", skillTags: ["Evidence Gathering", "Situational Awareness", "Ethical Judgement"] },
  meet_maya: { label: "Maya's Warning", skillTags: ["Evidence Gathering", "Situational Awareness", "Ethical Judgement"] },
  inspect_dashboard: { label: "Dashboard Inspection", skillTags: ["Evidence Gathering", "Risk Calibration"] },
  speak_to_theo: { label: "Theo's Technical Context", skillTags: ["Numerical Reasoning", "Situational Awareness"] },
  theo_initial: { label: "Theo's Technical Context", skillTags: ["Numerical Reasoning", "Situational Awareness"] },
  commercial_pressure: { label: "Oliver's Commercial Pressure", skillTags: ["Emotional Control", "Ethical Judgement", "Communication Quality"] },
  oliver_pressure: { label: "Oliver's Commercial Pressure", skillTags: ["Emotional Control", "Ethical Judgement", "Communication Quality"] },
  compliance_check: { label: "Compliance Check with Priya", skillTags: ["Communication Quality", "Risk Calibration"] },
  priya_check: { label: "Compliance Check with Priya", skillTags: ["Communication Quality", "Risk Calibration"] },
  final_recommendation: { label: "Final Recommendation to Amara", skillTags: ["Ethical Judgement", "Risk Calibration", "Leadership Potential", "Commercial Awareness"] },
  amara_final: { label: "Final Recommendation to Amara", skillTags: ["Ethical Judgement", "Risk Calibration", "Leadership Potential", "Commercial Awareness"] },
};

export function analyzeFreeTextAnswer(answer: string): { score: number; text: string; themes: string[]; scoreImpact: Partial<Record<SkillKey, number>> } {
  const lower = answer.toLowerCase().trim();
  const themes: string[] = [];
  const impact: Partial<Record<SkillKey, number>> = {};

  if (/caveat|footnote|note|disclose|flag|pending|unclear|uncertain|not confirmed|unverified|subject to/.test(lower)) {
    themes.push("Transparency");
    impact.ethicalJudgement = 10;
    impact.riskCalibration = 6;
  }
  if (/proceed|continue|go ahead|present|demo|client|meeting|show/.test(lower)) {
    themes.push("Commercial Awareness");
    impact.commercialAwareness = (impact.commercialAwareness ?? 0) + 6;
  }
  if (/cancel|stop|postpone|delay|halt|pause/.test(lower)) {
    themes.push("Caution");
    impact.riskCalibration = (impact.riskCalibration ?? 0) + 4;
    impact.commercialAwareness = (impact.commercialAwareness ?? 0) - 5;
  }
  if (/24 hour|24h|follow.up|rerun|verify|confirmed|engineering|pipeline|duplicate/.test(lower)) {
    themes.push("Structured Thinking");
    impact.evidenceGathering = 5;
    impact.communicationQuality = (impact.communicationQuality ?? 0) + 3;
  }
  if (/theo|priya|compliance|oliver|engineering|stakeholder/.test(lower)) {
    themes.push("Stakeholder Awareness");
    impact.communicationQuality = (impact.communicationQuality ?? 0) + 4;
    impact.leadershipPotential = 3;
  }

  const wordCount = lower.split(/\s+/).filter(Boolean).length;
  if (wordCount < 8) {
    impact.communicationQuality = (impact.communicationQuality ?? 0) - 6;
  } else if (wordCount >= 25) {
    impact.communicationQuality = (impact.communicationQuality ?? 0) + 4;
  }

  const totalImpact = Object.values(impact).reduce<number>((s, v) => s + (v ?? 0), 0);
  const score = Math.max(10, Math.min(100, 40 + totalImpact * 3));

  let text = "";
  const hasTransparency = themes.includes("Transparency");
  const hasCommercial = themes.includes("Commercial Awareness");
  const hasStructure = themes.includes("Structured Thinking");

  if (hasTransparency && hasCommercial && hasStructure) {
    text = "Excellent written response. You balanced commercial continuity with explicit transparency, named a concrete resolution timeline, and demonstrated structured risk communication — exactly what a senior stakeholder needs under time pressure.";
  } else if (hasTransparency && hasCommercial) {
    text = "Strong response. You combined transparency with commercial continuity. Adding a specific resolution timeline (e.g. verified figures in 24 hours) would have made this recommendation more actionable.";
  } else if (hasTransparency) {
    text = "Good ethical instinct — you prioritised disclosure. To strengthen this, integrate the commercial path: acknowledge the client context and propose a way to proceed alongside the caveat.";
  } else if (hasCommercial) {
    text = "Commercially aware, but the response lacks transparency language. Presenting unverified data without explicit caveats carries reputational risk. A brief acknowledgement of the pending deduplication would have protected both the firm and the recommendation.";
  } else if (themes.includes("Caution")) {
    text = "Cautious approach. Pulling the metric is a defensible choice, though the commercial cost is real. A caveated presentation often achieves both goals without requiring a full cancellation.";
  } else if (wordCount < 8) {
    text = "Response too brief to evaluate reasoning. Under pressure, brevity can read as unpreparedness. A one-sentence recommendation with a named path forward is the minimum expected.";
  } else {
    text = "Response received but lacked specific language around the data integrity issue, disclosure approach, or resolution timeline. The strongest written answers name the risk precisely and propose a concrete next step.";
  }

  return { score, text, themes, scoreImpact: impact };
}

export function generateReview(session: SessionData): ReviewData {
  const { scores, decisions, ending } = session;
  const overallScore = computeOverallScore(scores);
  const endingData = ENDING_DATA[ending];

  const timeline: ReviewMove[] = decisions.map((d) => {
    const meta = DECISION_LABELS[d.id] ?? { label: d.id, skillTags: [] };
    const totalImpact = Object.values(d.scoreImpact).reduce<number>((sum, v) => sum + (v ?? 0), 0);
    return {
      id: d.id,
      label: meta.label,
      playerChoice: d.optionLabel,
      reviewText: d.reviewText,
      tag: d.reviewTag,
      skillTags: meta.skillTags,
      scoreImpact: totalImpact,
      timestamp: d.timestamp,
    };
  });

  const bestMove = timeline.reduce<ReviewMove | null>((best, m) => {
    if (m.tag === "best" && (!best || m.scoreImpact > best.scoreImpact)) return m;
    return best;
  }, null);

  const biggestMistake = timeline.reduce<ReviewMove | null>((worst, m) => {
    if ((m.tag === "mistake" || m.tag === "critical") && (!worst || m.scoreImpact < worst.scoreImpact)) return m;
    return worst;
  }, null);

  const recommendations = buildRecommendations(scores, decisions);

  const freeTextAnalysis = session.freeTextAnswer
    ? (() => {
        const a = analyzeFreeTextAnswer(session.freeTextAnswer);
        return { score: a.score, text: a.text, themes: a.themes };
      })()
    : undefined;

  return {
    overallScore,
    overallLabel: endingData.title,
    outcomeTitle: endingData.subtitle,
    summary: endingData.description,
    skillScores: scores,
    timeline,
    bestMove,
    biggestMistake,
    recommendations,
    ending,
    freeTextAnalysis,
  };
}

function buildRecommendations(scores: Record<SkillKey, number>, decisions: DecisionRecord[]): string[] {
  const recs: string[] = [];
  if (scores.numericalReasoning < 55) recs.push("Practice quantitative estimation — quick maths under pressure is a core analyst skill.");
  if (scores.emotionalControl < 55) recs.push("Work on composure under social pressure. Calm, evidence-led responses outperform emotional reactions.");
  if (scores.communicationQuality < 55) recs.push("Structure your communication: state facts, quantify risk, name stakeholders.");
  if (scores.evidenceGathering < 55) recs.push("Gather evidence before escalating. The quality of your recommendation depends entirely on what you know.");
  if (scores.ethicalJudgement < 55) recs.push("Replay INCIDENT and test a more ethically-grounded path. Commercial pressure tests character.");
  if (scores.riskCalibration < 55) recs.push("Risk calibration means matching your response intensity to evidence quality.");
  if (recs.length === 0) {
    recs.push("Replay with a different escalation strategy to compare outcomes.");
    recs.push("Try a harder scenario: the next simulation includes less time and more conflicting information.");
  }
  return recs.slice(0, 3);
}

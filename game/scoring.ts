import type { SkillKey, DecisionRecord, SessionData, EndingType } from "./types";

export const SKILL_WEIGHTS: Record<SkillKey, number> = {
  ethicalJudgement: 0.15,
  situationalAwareness: 0.15,
  evidenceGathering: 0.12,
  communicationQuality: 0.12,
  emotionalControl: 0.12,
  riskCalibration: 0.12,
  numericalReasoning: 0.08,
  leadershipPotential: 0.08,
  commercialAwareness: 0.04,
  decisionSpeed: 0.02,
};

export const SKILL_LABELS: Record<SkillKey, string> = {
  situationalAwareness: "Situational Awareness",
  ethicalJudgement: "Ethical Judgement",
  emotionalControl: "Emotional Control",
  evidenceGathering: "Evidence Gathering",
  numericalReasoning: "Numerical Reasoning",
  communicationQuality: "Communication Quality",
  riskCalibration: "Risk Calibration",
  leadershipPotential: "Leadership Potential",
  commercialAwareness: "Commercial Awareness",
  decisionSpeed: "Decision Speed",
};

export const INITIAL_SCORES: Record<SkillKey, number> = {
  situationalAwareness: 50,
  ethicalJudgement: 50,
  emotionalControl: 50,
  evidenceGathering: 50,
  numericalReasoning: 50,
  communicationQuality: 50,
  riskCalibration: 50,
  leadershipPotential: 50,
  commercialAwareness: 50,
  decisionSpeed: 50,
};

export function applyScoreImpact(
  scores: Record<SkillKey, number>,
  impact: Partial<Record<SkillKey, number>>
): Record<SkillKey, number> {
  const next = { ...scores };
  for (const key in impact) {
    const k = key as SkillKey;
    next[k] = Math.max(0, Math.min(100, (next[k] ?? 50) + (impact[k] ?? 0)));
  }
  return next;
}

export function computeOverallScore(scores: Record<SkillKey, number>): number {
  let total = 0;
  for (const key in SKILL_WEIGHTS) {
    const k = key as SkillKey;
    total += (scores[k] ?? 50) * SKILL_WEIGHTS[k];
  }
  return Math.round(total);
}

export function applySpeedScore(
  scores: Record<SkillKey, number>,
  responseMs: number
): Record<SkillKey, number> {
  let impact = 0;
  if (responseMs < 5000) impact = 6;
  else if (responseMs < 10000) impact = 3;
  else if (responseMs < 20000) impact = 0;
  else impact = -3;
  return applyScoreImpact(scores, { decisionSpeed: impact });
}

export function determineEnding(
  decisions: DecisionRecord[],
  scores: Record<SkillKey, number>
): EndingType {
  const overallScore = computeOverallScore(scores);
  const finalDecision = decisions.find((d) => d.id === "amara_final");
  const oliverDecision = decisions.find((d) => d.id === "oliver_pressure");

  if (finalDecision?.optionId === "final_proceed_uncaveated" || finalDecision?.optionId === "final_remove_quietly") {
    return "ethical_failure";
  }

  if (oliverDecision?.optionId === "oliver_back_down") {
    if (overallScore < 55) return "passive";
  }

  if (scores.ethicalJudgement < 40 || scores.evidenceGathering < 40) {
    return "passive";
  }

  if (scores.emotionalControl < 40 && scores.communicationQuality < 40) {
    return "overreaction";
  }

  if (scores.ethicalJudgement >= 70 && scores.evidenceGathering >= 70 && scores.communicationQuality < 55) {
    return "analyst";
  }

  if (overallScore >= 70) return "trusted_operator";
  if (overallScore >= 55) return "analyst";
  if (scores.ethicalJudgement < 45) return "ethical_failure";
  return "passive";
}

export const ENDING_DATA: Record<EndingType, { title: string; subtitle: string; color: string; description: string }> = {
  trusted_operator: {
    title: "Trusted Operator",
    subtitle: "Strong executive judgement under pressure.",
    color: "#10b981",
    description:
      "You gathered evidence, resisted social pressure, communicated clearly, and gave a balanced recommendation that protected both trust and the commercial outcome.",
  },
  overreaction: {
    title: "Alarm Without Structure",
    subtitle: "Risk identified, but escalation lacked calibration.",
    color: "#f59e0b",
    description:
      "You identified the risk but your escalation was disproportionate to the evidence you had gathered. Good instincts need structural discipline to be effective.",
  },
  passive: {
    title: "Missed Risk",
    subtitle: "You avoided conflict, but failed to protect decision quality.",
    color: "#ef4444",
    description:
      "By accepting the path of least resistance, you allowed a potentially material risk to pass unchallenged. The short-term peace came at the cost of long-term trust.",
  },
  ethical_failure: {
    title: "Transparency Risk",
    subtitle: "High commercial awareness, unacceptable disclosure failure.",
    color: "#dc2626",
    description:
      "You prioritised the deal over accurate representation. Short-term the demo looked good. Long-term, this kind of decision damages professional reputation and institutional trust.",
  },
  analyst: {
    title: "Strong Analyst, Weak Influencer",
    subtitle: "Good reasoning, but communication did not convert.",
    color: "#6366f1",
    description:
      "Your analytical instincts were sound and you gathered the evidence. But you struggled to translate that into clear, confident recommendations that moved people.",
  },
};

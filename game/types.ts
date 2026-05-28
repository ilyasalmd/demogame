export type SkillKey =
  | "situationalAwareness"
  | "ethicalJudgement"
  | "emotionalControl"
  | "evidenceGathering"
  | "numericalReasoning"
  | "communicationQuality"
  | "riskCalibration"
  | "leadershipPotential"
  | "commercialAwareness"
  | "decisionSpeed";

export type IncidentStage =
  | "start"
  | "loading"
  | "arrival"
  | "meet_maya"
  | "inspect_dashboard"
  | "speak_to_theo"
  | "numerical_task"
  | "commercial_pressure"
  | "compliance_check"
  | "final_recommendation"
  | "ending"
  | "review";

export type DecisionTone = "calm" | "aggressive" | "passive" | "evasive" | "structured";
export type ReviewTag = "best" | "good" | "mixed" | "mistake" | "critical";
export type EndingType =
  | "trusted_operator"
  | "overreaction"
  | "passive"
  | "ethical_failure"
  | "analyst";

export interface DecisionOption {
  id: string;
  label: string;
  tone: DecisionTone;
  scoreImpact: Partial<Record<SkillKey, number>>;
  reviewTag: ReviewTag;
  reviewText: string;
  nextStage?: IncidentStage;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
  showDocument?: string;
}

export interface DialogueNode {
  id: string;
  lines: DialogueLine[];
  options?: DecisionOption[];
  autoAdvance?: boolean;
  freeTextInput?: boolean;
  reactions?: Record<string, { lines: DialogueLine[]; autoEnd?: boolean }>;
}

export interface CharacterDef {
  id: string;
  name: string;
  role: string;
  color: string;
  skinColor: string;
  position: [number, number, number];
  floor: 0 | 1;
  requiredStage?: IncidentStage;
  interactStage?: IncidentStage;
  speechRate?: number;
  /** Body.rotation.y when seated at desk (radians). 0 = face +Z, Math.PI = face -Z */
  seatFacing?: number;
}

export interface TelemetryEvent {
  type: string;
  id: string;
  timestamp: number;
  stage: IncidentStage;
  data?: Record<string, unknown>;
  scoreImpact?: Partial<Record<SkillKey, number>>;
}

export interface DecisionRecord {
  id: string;
  timestamp: number;
  optionId: string;
  optionLabel: string;
  responseTimeMs: number;
  scoreImpact: Partial<Record<SkillKey, number>>;
  reviewTag: ReviewTag;
  reviewText: string;
  decisionLabel: string;
}

export interface SessionData {
  sessionId: string;
  startedAt: number;
  completedAt: number;
  durationSeconds: number;
  ending: EndingType;
  scores: Record<SkillKey, number>;
  decisions: DecisionRecord[];
  events: TelemetryEvent[];
  interactions: Record<string, boolean>;
  zonesVisited: string[];
  freeTextAnswer?: string;
}

export interface ReviewMove {
  id: string;
  label: string;
  playerChoice: string;
  reviewText: string;
  tag: ReviewTag;
  skillTags: string[];
  scoreImpact: number;
  timestamp: number;
}

export interface ReviewData {
  overallScore: number;
  overallLabel: string;
  outcomeTitle: string;
  summary: string;
  skillScores: Record<SkillKey, number>;
  timeline: ReviewMove[];
  bestMove: ReviewMove | null;
  biggestMistake: ReviewMove | null;
  recommendations: string[];
  ending: EndingType;
  freeTextAnalysis?: { score: number; text: string; themes: string[] };
}

export interface GameState {
  screen: "start" | "loading" | "game" | "review";
  stage: IncidentStage;
  scores: Record<SkillKey, number>;
  currentFloor: 0 | 1;
  activeDialogue: DialogueNode | null;
  dialogueStep: number;
  dialogueCharacter: string;
  objectiveText: string;
  timeRemaining: number;
  gameStartTime: number;
  telemetryEvents: TelemetryEvent[];
  decisions: DecisionRecord[];
  interactionsCompleted: Record<string, boolean>;
  zonesVisited: string[];
  sessionData: SessionData | null;
  reviewData: ReviewData | null;
  nearbyInteractable: string | null;
  showObjectivePanel: boolean;
  cameraMode: "third" | "first";
  loadingProgress: number;
  decisionTimerStart: number;
  completedStages: IncidentStage[];
  freeTextAnswer: string;
}

"use client";
import { create } from "zustand";
import type {
  GameState,
  SkillKey,
  IncidentStage,
  DecisionOption,
  DecisionRecord,
  DialogueNode,
  TelemetryEvent,
} from "@/game/types";
import {
  INITIAL_SCORES,
  applyScoreImpact,
  applySpeedScore,
  determineEnding,
} from "@/game/scoring";
import { STAGE_DIALOGUES, STAGE_OBJECTIVES, INTERACTABLE_OBJECTS } from "@/game/data";
import { generateReview } from "@/game/review";
import type { DocumentItem } from "@/game/documents";
import { DOCUMENTS } from "@/game/documents";

interface GameStore extends GameState {
  // Player world position (for mini-map)
  playerPosition: [number, number, number];
  setPlayerPosition: (p: [number, number, number]) => void;

  // Speech bubbles above NPCs
  speechBubbles: Record<string, string>;
  setSpeechBubble: (characterId: string, text: string) => void;
  clearSpeechBubble: (characterId: string) => void;

  // Document viewer
  activeDocument: DocumentItem | null;
  openDocument: (doc: DocumentItem) => void;
  closeDocument: () => void;

  // Game actions
  startGame: () => void;
  setLoadingProgress: (p: number) => void;
  finishLoading: () => void;
  setNearbyInteractable: (id: string | null) => void;
  interact: (interactableId: string) => void;
  advanceDialogue: () => void;
  makeDecision: (option: DecisionOption) => void;
  toggleObjectivePanel: () => void;
  toggleCameraMode: () => void;
  trackEvent: (event: Omit<TelemetryEvent, "timestamp">) => void;
  trackZone: (zone: string) => void;
  finishGame: (endingOverride?: string) => void;
  resetGame: () => void;
  setTimeRemaining: (t: number) => void;
  freeTextAnswer: string;
  submitFreeText: (answer: string) => void;
}

const initialState: GameState = {
  screen: "start",
  stage: "start",
  scores: { ...INITIAL_SCORES },
  currentFloor: 0,
  activeDialogue: null,
  dialogueStep: 0,
  dialogueCharacter: "",
  objectiveText: "Find Maya Chen at the analyst pod.",
  timeRemaining: 600,
  gameStartTime: 0,
  telemetryEvents: [],
  decisions: [],
  interactionsCompleted: {},
  zonesVisited: [],
  sessionData: null,
  reviewData: null,
  nearbyInteractable: null,
  showObjectivePanel: false,
  cameraMode: "third",
  loadingProgress: 0,
  decisionTimerStart: 0,
  completedStages: [],
  freeTextAnswer: "",
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  playerPosition: [-18, 0.9, 0],
  speechBubbles: {},
  activeDocument: null,

  setPlayerPosition(p) {
    set({ playerPosition: p });
  },

  setSpeechBubble(characterId, text) {
    set((s) => ({ speechBubbles: { ...s.speechBubbles, [characterId]: text } }));
    // Auto-clear after 6s
    setTimeout(() => get().clearSpeechBubble(characterId), 6000);
  },

  clearSpeechBubble(characterId) {
    set((s) => {
      const next = { ...s.speechBubbles };
      delete next[characterId];
      return { speechBubbles: next };
    });
  },

  openDocument(doc) {
    set({ activeDocument: doc });
  },

  closeDocument() {
    set({ activeDocument: null });
  },

  startGame() {
    set({ screen: "loading", loadingProgress: 0 });
    const interval = setInterval(() => {
      const { loadingProgress } = get();
      if (loadingProgress >= 100) {
        clearInterval(interval);
        get().finishLoading();
      } else {
        set({ loadingProgress: loadingProgress + Math.random() * 12 + 3 });
      }
    }, 200);
  },

  setLoadingProgress(p) {
    set({ loadingProgress: Math.min(100, p) });
  },

  finishLoading() {
    set({
      screen: "game",
      stage: "arrival",
      gameStartTime: Date.now(),
      scores: { ...INITIAL_SCORES },
      decisions: [],
      telemetryEvents: [],
      interactionsCompleted: {},
      zonesVisited: [],
      completedStages: [],
      activeDialogue: STAGE_DIALOGUES["arrival"] ?? null,
      dialogueStep: 0,
      dialogueCharacter: "receptionist",
      objectiveText: STAGE_OBJECTIVES["arrival"],
    });
  },

  setNearbyInteractable(id) {
    set({ nearbyInteractable: id });
  },

  interact(interactableId) {
    const state = get();

    const charToDialogue: Record<string, string> = {
      maya: "meet_maya",
      theo: "speak_to_theo",
      oliver: "commercial_pressure",
      priya: "compliance_check",
      amara: "final_recommendation",
    };

    let dialogueKey = charToDialogue[interactableId] ?? interactableId;
    const characterId = interactableId;

    if (interactableId === "dashboard_monitor") dialogueKey = "inspect_dashboard";
    if (interactableId === "compliance_doc") dialogueKey = "compliance_check";

    // Check if this is a document interactable
    const interactableObj = INTERACTABLE_OBJECTS.find(o => o.id === interactableId);
    if (interactableObj?.documentId) {
      const doc = DOCUMENTS[interactableObj.documentId];
      if (doc) {
        get().openDocument(doc);
        return;
      }
    }

    const dialogue = STAGE_DIALOGUES[dialogueKey];
    if (!dialogue) return;

    if (state.interactionsCompleted[dialogueKey] && (dialogue.options || dialogue.freeTextInput)) return;

    set({
      activeDialogue: dialogue,
      dialogueStep: 0,
      dialogueCharacter: characterId,
      decisionTimerStart: Date.now(),
    });

    get().trackEvent({
      type: "npc_interaction_started",
      id: `interact_${interactableId}`,
      stage: state.stage,
      data: { target: interactableId },
    });
  },

  advanceDialogue() {
    const state = get();
    if (!state.activeDialogue) return;

    const nextStep = state.dialogueStep + 1;
    const dialogue = state.activeDialogue;

    // Check if the NEXT line has a showDocument trigger
    const nextLine = dialogue.lines[nextStep];
    if (nextLine?.showDocument) {
      const doc = DOCUMENTS[nextLine.showDocument];
      if (doc) setTimeout(() => get().openDocument(doc), 400);
    }

    if (nextStep < dialogue.lines.length) {
      set({ dialogueStep: nextStep });
    } else if ((dialogue.options && dialogue.options.length > 0) || dialogue.freeTextInput) {
      set({ dialogueStep: nextStep });
    } else {
      set({ activeDialogue: null, dialogueStep: 0 });
    }
  },

  makeDecision(option) {
    const state = get();
    const responseMs = Date.now() - state.decisionTimerStart;

    let updatedScores = applyScoreImpact(state.scores, option.scoreImpact);
    updatedScores = applySpeedScore(updatedScores, responseMs);

    const record: DecisionRecord = {
      id: state.activeDialogue?.id ?? "unknown",
      timestamp: Date.now() - state.gameStartTime,
      optionId: option.id,
      optionLabel: option.label,
      responseTimeMs: responseMs,
      scoreImpact: option.scoreImpact,
      reviewTag: option.reviewTag,
      reviewText: option.reviewText,
      decisionLabel: option.label,
    };

    const completedKey = state.activeDialogue?.id ?? option.id;
    const nextStage = (option.nextStage ?? state.stage) as IncidentStage;

    // Set speech bubble for the choosing character
    if (state.dialogueCharacter) {
      get().setSpeechBubble(state.dialogueCharacter, option.label.slice(0, 80));
    }

    get().trackEvent({
      type: "decision_made",
      id: record.id,
      stage: state.stage,
      data: { optionId: option.id, responseMs },
      scoreImpact: option.scoreImpact,
    });

    // Show reaction dialogue if available
    const reactionDialogue = state.activeDialogue?.reactions?.[option.id];

    if (reactionDialogue) {
      const reactionNode: DialogueNode = {
        id: completedKey + "_reaction",
        lines: reactionDialogue.lines,
        autoAdvance: reactionDialogue.autoEnd,
      };
      set({
        scores: updatedScores,
        decisions: [...state.decisions, record],
        activeDialogue: reactionNode,
        dialogueStep: 0,
        stage: nextStage,
        interactionsCompleted: { ...state.interactionsCompleted, [completedKey]: true },
        objectiveText: STAGE_OBJECTIVES[nextStage] ?? state.objectiveText,
        completedStages: [...state.completedStages, state.stage],
      });
    } else {
      set({
        scores: updatedScores,
        decisions: [...state.decisions, record],
        activeDialogue: null,
        dialogueStep: 0,
        stage: nextStage,
        interactionsCompleted: { ...state.interactionsCompleted, [completedKey]: true },
        objectiveText: STAGE_OBJECTIVES[nextStage] ?? state.objectiveText,
        completedStages: [...state.completedStages, state.stage],
      });
    }

    if (nextStage === "ending") {
      get().finishGame();
    }
  },

  toggleObjectivePanel() {
    set((s) => ({ showObjectivePanel: !s.showObjectivePanel }));
  },

  toggleCameraMode() {
    set((s) => ({ cameraMode: s.cameraMode === "third" ? "first" : "third" }));
  },

  trackEvent(event) {
    const full: TelemetryEvent = { ...event, timestamp: Date.now() };
    set((s) => ({ telemetryEvents: [...s.telemetryEvents, full] }));
  },

  trackZone(zone) {
    const { zonesVisited } = get();
    if (!zonesVisited.includes(zone)) {
      set((s) => ({ zonesVisited: [...s.zonesVisited, zone] }));
      get().trackEvent({
        type: "zone_entered",
        id: `zone_${zone}`,
        stage: get().stage,
        data: { zone },
      });
    }
  },

  finishGame(endingOverride) {
    const state = get();
    const completedAt = Date.now();
    const durationSeconds = Math.round((completedAt - state.gameStartTime) / 1000);
    const ending = endingOverride
      ? (endingOverride as import("@/game/types").EndingType)
      : determineEnding(state.decisions, state.scores);

    const sessionData = {
      sessionId: `incident_${Date.now()}`,
      startedAt: state.gameStartTime,
      completedAt,
      durationSeconds,
      ending,
      scores: state.scores,
      decisions: state.decisions,
      events: state.telemetryEvents,
      interactions: state.interactionsCompleted,
      zonesVisited: state.zonesVisited,
      freeTextAnswer: state.freeTextAnswer || undefined,
    };

    const reviewData = generateReview(sessionData);

    set({ sessionData, reviewData, stage: "ending" });
    setTimeout(() => set({ screen: "review" }), 4000);
  },

  resetGame() {
    set({
      ...initialState,
      playerPosition: [-18, 0.9, 0],
      speechBubbles: {},
      activeDocument: null,
      freeTextAnswer: "",
    });
  },

  submitFreeText(answer: string) {
    const state = get();
    const { analyzeFreeTextAnswer } = require("@/game/review");
    const analysis = analyzeFreeTextAnswer(answer);
    const updatedScores = applyScoreImpact(state.scores, analysis.scoreImpact);

    const record: DecisionRecord = {
      id: "final_recommendation",
      timestamp: Date.now() - state.gameStartTime,
      optionId: "free_text",
      optionLabel: answer.slice(0, 120),
      responseTimeMs: Date.now() - state.decisionTimerStart,
      scoreImpact: analysis.scoreImpact,
      reviewTag: analysis.score >= 70 ? "best" : analysis.score >= 50 ? "good" : analysis.score >= 35 ? "mixed" : "mistake",
      reviewText: analysis.text,
      decisionLabel: "Written Recommendation to Amara",
    };

    set({
      freeTextAnswer: answer,
      scores: updatedScores,
      decisions: [...state.decisions, record],
      activeDialogue: null,
      dialogueStep: 0,
      stage: "ending" as IncidentStage,
      interactionsCompleted: { ...state.interactionsCompleted, final_recommendation: true },
      completedStages: [...state.completedStages, state.stage],
    });

    get().finishGame();
  },

  setTimeRemaining(t) {
    set({ timeRemaining: t });
    if (t <= 0) get().finishGame();
  },
}));

"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { mouseSensitivity, setMouseSensitivity } from "@/game/settings";

export function GameHUD() {
  const {
    objectiveText,
    timeRemaining,
    nearbyInteractable,
    nearbyDoor,
    openDoors,
    showObjectivePanel,
    toggleObjectivePanel,
    toggleCameraMode,
    toggleDoor,
    cameraMode,
    stage,
    interact,
    setTimeRemaining,
    interactionsCompleted,
    zonesVisited,
    scores,
    activeDialogue,
    dialogueCharacter,
  } = useGameStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [sensitivity, setSensitivity] = useState(mouseSensitivity);

  const isReceptionistSpeaking = !!(activeDialogue && dialogueCharacter === "receptionist");

  useEffect(() => {
    if (stage === "ending" || stage === "review") return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(Math.max(0, timeRemaining - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining, stage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        toggleObjectivePanel();
      }
      if (e.key.toLowerCase() === "v") toggleCameraMode();
      if (e.key.toLowerCase() === "h") setShowControls((prev) => !prev);
      if (e.key.toLowerCase() === "e" && nearbyInteractable) {
        interact(nearbyInteractable);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nearbyInteractable, toggleObjectivePanel, toggleCameraMode, interact, nearbyDoor, toggleDoor]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timerStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const isLowTime = timeRemaining < 120;

  return (
    <>
      {/* Top-left: Objective */}
      <div className="fixed top-4 left-4 z-30 max-w-xs">
        <motion.div
          className="rounded-xl px-4 py-3"
          style={{
            background: "rgba(5,5,8,0.85)",
            border: "1px solid rgba(99,102,241,0.2)",
            backdropFilter: "blur(16px)",
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">Objective</p>
          <p className="text-sm text-slate-200 leading-relaxed">{objectiveText}</p>
        </motion.div>
      </div>

      {/* Top-center: SPACE hint during receptionist speech */}
      <AnimatePresence>
        {isReceptionistSpeaking && (
          <motion.div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                background: "#ffffff",
                border: "2px solid #000000",
              }}
            >
              <span
                className="text-sm font-mono font-bold tracking-widest"
                style={{ color: "#000000", fontFamily: "monospace" }}
              >
                SPACE
              </span>
              <span className="text-xs font-mono" style={{ color: "#333333" }}>
                to continue
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-right: Timer + H hint + Tab/V buttons */}
      <div className="fixed top-4 right-4 z-30 flex flex-col items-end gap-2">
        <motion.div
          className="rounded-xl px-4 py-3 text-right"
          style={{
            background: "rgba(5,5,8,0.85)",
            border: `1px solid ${isLowTime ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.2)"}`,
            backdropFilter: "blur(16px)",
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Time</p>
          <p className={`text-2xl font-mono font-bold tabular-nums ${isLowTime ? "text-red-400" : "text-white"}`}>
            {timerStr}
          </p>
        </motion.div>

        {/* H · Controls hint — sits right above the Tab/V row, to the left of the timer */}
        <motion.button
          onClick={() => setShowControls((p) => !p)}
          className="rounded-lg px-3 py-1.5 text-xs font-mono cursor-pointer transition-all"
          style={{
            background: showControls ? "rgba(99,102,241,0.15)" : "rgba(5,5,8,0.85)",
            border: showControls ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)",
            color: showControls ? "#818cf8" : "#94a3b8",
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          H · {showControls ? "Hide Keys" : "Controls"}
        </motion.button>

        <div className="flex gap-2">
          <button
            onClick={toggleObjectivePanel}
            className="rounded-lg px-3 py-1.5 text-xs font-mono cursor-pointer transition-colors"
            style={{
              background: "rgba(5,5,8,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
            }}
          >
            Tab · Goals
          </button>
          <button
            onClick={toggleCameraMode}
            className="rounded-lg px-3 py-1.5 text-xs font-mono cursor-pointer transition-colors"
            style={{
              background: "rgba(5,5,8,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
            }}
          >
            V · {cameraMode === "third" ? "3rd" : "1st"} Person
          </button>
        </div>

        {/* Mouse sensitivity slider */}
        <div
          className="flex flex-col gap-1 px-2 py-1.5 rounded-lg"
          style={{ background: "rgba(5,5,8,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono" style={{ color: "#64748b" }}>Mouse Speed</span>
            <span className="text-xs font-mono" style={{ color: "#94a3b8" }}>
              {Math.round(sensitivity * 10000) / 10}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={1}
            value={Math.round(sensitivity * 10000)}
            onChange={(e) => {
              const v = Number(e.target.value) / 10000;
              setSensitivity(v);
              setMouseSensitivity(v);
            }}
            className="w-full cursor-pointer"
            style={{ accentColor: "#6366f1", height: "4px" }}
          />
        </div>
      </div>

      {/* Bottom-center: Interaction prompt */}
      <AnimatePresence>
        {nearbyInteractable && (
          <motion.div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-xl"
              style={{
                background: "rgba(5,5,8,0.9)",
                border: "1px solid rgba(99,102,241,0.4)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 0 20px rgba(99,102,241,0.2)",
              }}
            >
              <span
                className="text-sm font-mono font-bold rounded px-2 py-0.5"
                style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.4)" }}
              >
                E
              </span>
              <span className="text-sm text-slate-200">
                {getInteractLabel(nearbyInteractable)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Door prompt */}
      <AnimatePresence>
        {nearbyDoor && (
          <motion.div
            className={`fixed ${nearbyInteractable ? "bottom-20" : "bottom-8"} left-1/2 -translate-x-1/2 z-30`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="flex items-center gap-3 px-5 py-3 rounded-xl"
              style={{
                background: "rgba(5,5,8,0.9)",
                border: "1px solid rgba(100,100,180,0.4)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 0 20px rgba(100,100,180,0.15)",
              }}
            >
              <span
                className="text-sm font-mono font-bold rounded px-2 py-0.5"
                style={{ background: "rgba(100,100,180,0.2)", color: "#a0a0e0", border: "1px solid rgba(100,100,180,0.4)" }}
              >
                T
              </span>
              <span className="text-sm text-slate-200">
                {openDoors.includes(nearbyDoor) ? "Close door" : "Open door"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crosshair — center dot, hidden during dialogue */}
      {!nearbyInteractable && (
        <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center">
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.55)",
              boxShadow: "0 0 4px rgba(0,0,0,0.8)",
            }}
          />
        </div>
      )}

      {/* Controls panel — toggled by H key or clicking the H chip above */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            className="fixed z-30 pointer-events-none"
            style={{ top: "1rem", right: "220px" }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="flex items-center gap-4 px-5 py-2.5 rounded-xl text-xs font-mono text-slate-400"
              style={{
                background: "rgba(5,5,8,0.88)",
                border: "1px solid rgba(99,102,241,0.18)",
                backdropFilter: "blur(14px)",
              }}
            >
              {[
                ["WASD", "Move"],
                ["Mouse", "Look"],
                ["Scroll", "Zoom"],
                ["Shift", "Sprint"],
                ["E", "Interact"],
                ["T", "Door"],
                ["M", "Map"],
                ["V", "Camera"],
              ].map(([key, label]) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span
                    className="px-1.5 py-0.5 rounded text-slate-300"
                    style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.3)" }}
                  >
                    {key}
                  </span>
                  <span className="text-slate-500">{label}</span>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Objective Panel (Tab) */}
      <AnimatePresence>
        {showObjectivePanel && (
          <ObjectivePanel
            objectiveText={objectiveText}
            zonesVisited={zonesVisited}
            interactionsCompleted={interactionsCompleted}
            onClose={toggleObjectivePanel}
            timeRemaining={timeRemaining}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function getInteractLabel(id: string): string {
  const labels: Record<string, string> = {
    maya: "Speak to Maya Chen",
    theo: "Speak to Theo Marsh",
    oliver: "Speak to Oliver Grant",
    priya: "Speak to Priya Nair",
    amara: "Speak to Amara Vale",
    dashboard_monitor: "Inspect Performance Dashboard",
    compliance_doc: "Read Compliance Note",
  };
  return labels[id] ?? `Interact`;
}

function ObjectivePanel({
  objectiveText,
  zonesVisited,
  interactionsCompleted,
  onClose,
  timeRemaining,
}: {
  objectiveText: string;
  zonesVisited: string[];
  interactionsCompleted: Record<string, boolean>;
  onClose: () => void;
  timeRemaining: number;
}) {
  const knownFacts = buildKnownFacts(interactionsCompleted);

  return (
    <motion.div
      className="fixed inset-y-0 right-0 z-40 w-80 flex flex-col"
      style={{
        background: "rgba(5,5,8,0.95)",
        borderLeft: "1px solid rgba(99,102,241,0.2)",
        backdropFilter: "blur(24px)",
      }}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <h3 className="font-semibold text-white">Assessment Panel</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl cursor-pointer">
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Current objective */}
        <div>
          <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Current Objective</p>
          <p className="text-sm text-slate-200">{objectiveText}</p>
        </div>

        {/* Known facts */}
        {knownFacts.length > 0 && (
          <div>
            <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">Known Facts</p>
            <ul className="space-y-1.5">
              {knownFacts.map((f, i) => (
                <li key={i} className="flex gap-2 items-start text-sm text-slate-300">
                  <span className="text-indigo-400 mt-0.5">›</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* People spoken to */}
        <div>
          <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-2">People Spoken To</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "meet_maya", name: "Maya" },
              { id: "speak_to_theo", name: "Theo" },
              { id: "commercial_pressure", name: "Oliver" },
              { id: "priya_check", name: "Priya" },
              { id: "amara_final", name: "Amara" },
            ].map(({ id, name }) => (
              <span
                key={id}
                className="px-2 py-1 rounded text-xs font-mono"
                style={{
                  background: interactionsCompleted[id]
                    ? "rgba(16,185,129,0.15)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${interactionsCompleted[id] ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`,
                  color: interactionsCompleted[id] ? "#34d399" : "#64748b",
                }}
              >
                {name} {interactionsCompleted[id] ? "✓" : "○"}
              </span>
            ))}
          </div>
        </div>

        {/* Time */}
        <div>
          <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">Time Remaining</p>
          <p className={`text-2xl font-mono font-bold ${timeRemaining < 120 ? "text-red-400" : "text-white"}`}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function buildKnownFacts(completed: Record<string, boolean>): string[] {
  const facts: string[] = [];
  if (completed["meet_maya"] || completed["maya_initial"]) {
    facts.push("Validation accuracy jumped from 82% to 94% after the last data refresh.");
    facts.push("Maya suspects duplicate records may be inflating the score.");
  }
  if (completed["inspect_dashboard"]) {
    facts.push("Dashboard shows 1,460 duplicate IDs flagged in a 12,000-row validation set.");
    facts.push("A note reads 'dedupe pending — do not use in prod'.");
  }
  if (completed["theo_initial"] || completed["speak_to_theo"]) {
    facts.push("Theo cannot confirm the cause in time. Could be duplicates, caching, or cosmetic.");
    facts.push("Roughly 12% of the validation set may be affected by duplicate rows.");
  }
  if (completed["commercial_pressure"] || completed["oliver_pressure"]) {
    facts.push("Oliver wants to proceed with the demo as planned, claiming the trend is positive.");
  }
  if (completed["priya_check"]) {
    facts.push("Priya needs structured facts: what changed, who knows, how material, and what we plan to tell the client.");
  }
  return facts;
}

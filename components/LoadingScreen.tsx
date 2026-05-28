"use client";
import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { initVoices } from "@/game/voiceSynthesis";

const LOADING_MESSAGES = [
  "Initialising office environment…",
  "Loading Asterion Labs floor plan…",
  "Spawning character interactions…",
  "Calibrating assessment signals…",
  "Syncing behavioural telemetry…",
  "Preparing incident timeline…",
  "Loading client demo materials…",
  "Setting up compliance protocols…",
  "Starting incident timeline…",
];

export function LoadingScreen() {
  const loadingProgress = useGameStore((s) => s.loadingProgress);
  const sceneReady      = useGameStore((s) => s.sceneReady);
  const finishLoading   = useGameStore((s) => s.finishLoading);

  const messageIndex = Math.min(
    Math.floor((loadingProgress / 100) * LOADING_MESSAGES.length),
    LOADING_MESSAGES.length - 1
  );

  // Pre-cache voices during the loading phase so they're ready when the game starts.
  useEffect(() => {
    initVoices();
  }, []);

  // ── Single-gesture entry ────────────────────────────────────────────────────
  // Chrome blocks ALL audio APIs (speechSynthesis, HTMLAudio, AudioContext) on a
  // fresh page until the first real user gesture.  There is no code-level bypass.
  //
  // Solution: wait for exactly ONE click or keypress on the loaded screen, which
  // (a) satisfies Chrome's gesture requirement, and (b) transitions to the game.
  // Audio fires in the same frame as the transition — feels instant to the user.
  //
  // This is the standard pattern for every web game (Unity WebGL, Construct, etc).

  const handleEnter = useCallback(() => {
    if (!sceneReady) return;

    // Prime speechSynthesis with a silent utterance so the gesture is "consumed"
    // before finishLoading() triggers the first real spoken line.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance("go");
      u.volume = 0;
      u.rate   = 10;
      window.speechSynthesis.speak(u);
    }

    finishLoading();
  }, [sceneReady, finishLoading]);

  // Listen for any key or click once the scene is ready.
  useEffect(() => {
    if (!sceneReady) return;
    const onKey = (e: KeyboardEvent) => {
      // Ignore pure-modifier keys
      if (["Shift","Control","Alt","Meta"].includes(e.key)) return;
      handleEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sceneReady, handleEnter]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#050508]"
      style={{ cursor: sceneReady ? "pointer" : "default" }}
      onPointerDown={sceneReady ? handleEnter : undefined}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.2) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center">
        {/* Rotating office icon */}
        <motion.div
          className="mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="20" width="48" height="36" rx="2" stroke="#6366f1" strokeWidth="1.5" fill="rgba(99,102,241,0.1)" />
            <rect x="16" y="28" width="10" height="12" rx="1" fill="rgba(99,102,241,0.3)" />
            <rect x="30" y="28" width="10" height="12" rx="1" fill="rgba(139,92,246,0.3)" />
            <rect x="16" y="44" width="10" height="8" rx="1" fill="rgba(99,102,241,0.2)" />
            <rect x="30" y="44" width="10" height="8" rx="1" fill="rgba(139,92,246,0.2)" />
            <rect x="44" y="28" width="8" height="20" rx="1" fill="rgba(6,182,212,0.2)" />
            <line x1="8" y1="20" x2="32" y2="8" stroke="#6366f1" strokeWidth="1" opacity="0.5" />
            <line x1="56" y1="20" x2="32" y2="8" stroke="#6366f1" strokeWidth="1" opacity="0.5" />
            <rect x="28" y="4" width="8" height="4" rx="1" fill="rgba(99,102,241,0.4)" />
          </svg>
        </motion.div>

        <h2 className="text-white text-xl font-semibold mb-1 tracking-wide">INCIDENT</h2>
        <p className="text-slate-500 text-sm font-mono mb-8 tracking-widest uppercase">First Day Protocol</p>

        {/* Loading message / enter prompt */}
        <AnimatePresence mode="wait">
          {!sceneReady ? (
            <motion.p
              key={messageIndex}
              className="text-slate-400 text-sm font-mono mb-6 text-center h-5"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {LOADING_MESSAGES[messageIndex]}
            </motion.p>
          ) : (
            <motion.p
              key="enter"
              className="text-sm font-mono mb-6 text-center h-5 tracking-widest uppercase"
              style={{ color: "#10b981" }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            >
              ▶ Click or press any key
            </motion.p>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full">
          <div className="w-full h-1 rounded-full overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }}
              animate={{ width: `${sceneReady ? 100 : loadingProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <p className="text-slate-600 text-xs font-mono text-center">
            {sceneReady ? "100%" : `${Math.round(loadingProgress)}%`}
          </p>
        </div>

        {/* Assessment signals */}
        <div className="mt-10 flex gap-2 flex-wrap justify-center">
          {["Situational Awareness", "Ethical Judgement", "Numerical Reasoning", "Communication"].map((label, i) => (
            <motion.span
              key={label}
              className="px-2 py-0.5 rounded text-xs font-mono"
              style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.15)",
                color: "#64748b",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: loadingProgress > i * 20 ? 1 : 0.2 }}
              transition={{ duration: 0.5 }}
            >
              {label}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

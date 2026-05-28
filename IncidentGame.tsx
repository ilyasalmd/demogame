"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef, useEffect } from "react";
import { useProgress } from "@react-three/drei";
import { useGameStore } from "@/store/gameStore";
import { OfficeScene } from "@/three/OfficeScene";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GameHUD } from "@/components/GameHUD";
import { DialoguePanel } from "@/components/DialoguePanel";
import { EndingScreen } from "@/components/EndingScreen";
import { ReviewScreen } from "@/components/ReviewScreen";
import { MiniMap } from "@/components/MiniMap";
import { DocumentViewer } from "@/components/DocumentViewer";
import { AnimatePresence, motion } from "framer-motion";
import { startAmbience, duckAmbience, unduckAmbience } from "@/game/audio";
import { initVoices } from "@/game/voiceSynthesis";

// ── LoadingBarrier ────────────────────────────────────────────────────────────
// Lives inside the Canvas during the loading phase.
// Uses drei's useProgress (real Three.js loader) + frame counting to ensure
// shaders/geometry are compiled on the GPU before we switch to the game.
const MIN_LOAD_MS = 600;  // lower = faster loading, especially on weak laptops
const READY_FRAMES = 15;  // ~0.25s at 60fps of actual rendering before unlock

function LoadingBarrier() {
  const setLoadingProgress = useGameStore((s) => s.setLoadingProgress);
  const setSceneReady = useGameStore((s) => s.setSceneReady);
  const screen = useGameStore((s) => s.screen);

  const { progress, active } = useProgress();

  const startTime = useRef(Date.now());
  const frameCount = useRef(0);
  const finished = useRef(false);

  useFrame(() => {
    if (screen !== "loading" || finished.current) return;

    frameCount.current += 1;
    const elapsed = Date.now() - startTime.current;

    // Combine: time-based sweep (smooth animation) + real asset progress
    const timePct  = Math.min(100, (elapsed / MIN_LOAD_MS) * 100);
    const assetPct = progress; // 0-100 from Three.js loader
    // Drive bar from whichever is further along — gives smooth motion even with no assets
    const combined = Math.max(timePct, assetPct);
    setLoadingProgress(combined);

    // Unlock conditions:
    //  1. Minimum wall-clock time has passed
    //  2. Three.js loader is done (no active downloads, or no assets at all)
    //  3. At least READY_FRAMES rendered (GPU shaders compiled and warmed)
    const assetsReady  = !active && (progress >= 100 || frameCount.current > 300);
    const timeReady    = elapsed >= MIN_LOAD_MS;
    const framesReady  = frameCount.current >= READY_FRAMES;

    if (assetsReady && timeReady && framesReady) {
      finished.current = true;
      // Signal the LoadingScreen to show the ENTER button (user-gesture gate).
      // finishLoading() is called only when the user clicks ENTER, which unlocks
      // speechSynthesis so the receptionist's first line has audio.
      setSceneReady();
    }
  });

  return null;
}

// ── Main game component ───────────────────────────────────────────────────────
export default function IncidentGame() {
  const { screen, stage, activeDialogue, ambienceUnlocked } = useGameStore();
  const canvasActive = screen === "loading" || screen === "game";

  // Pre-cache speech voices on mount so they're ready when the receptionist fires.
  useEffect(() => {
    initVoices();
  }, []);

  // Silent speech primer — satisfies Chrome's "user gesture required for
  // speechSynthesis" policy before the receptionist fires.
  // Fires a volume-0 utterance on the user's very first interaction anywhere on
  // the page (click, tap, keypress).  After that, all subsequent speak() calls
  // are unblocked and the receptionist voice plays with no extra gesture.
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    let primed = false;
    const prime = () => {
      if (primed) return;
      primed = true;
      const u = new SpeechSynthesisUtterance("go");
      u.volume = 0;
      u.rate   = 10;
      window.speechSynthesis.speak(u);
      document.removeEventListener("pointerdown", prime, true);
      document.removeEventListener("keydown",     prime, true);
    };
    document.addEventListener("pointerdown", prime, { capture: true, once: true });
    document.addEventListener("keydown",     prime, { capture: true, once: true });
    return () => {
      document.removeEventListener("pointerdown", prime, true);
      document.removeEventListener("keydown",     prime, true);
    };
  }, []);

  // Start ambient audio only once the receptionist has finished talking
  useEffect(() => {
    if (ambienceUnlocked) startAmbience();
  }, [ambienceUnlocked]);

  // Duck ambience during NPC conversations, restore when dialogue closes
  useEffect(() => {
    if (activeDialogue) {
      duckAmbience();
    } else {
      unduckAmbience();
    }
  }, [activeDialogue]);

  return (
    <div className="fixed inset-0 bg-[#030308]">
      <AnimatePresence mode="wait">
        {screen === "loading" && (
          <motion.div
            key="loading"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LoadingScreen />
          </motion.div>
        )}

        {screen === "review" && (
          <motion.div
            key="review"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ReviewScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Canvas — mounted during loading AND game so geometry/shaders compile
          while the loading screen is visible. Hidden until game starts. */}
      {canvasActive && (
        <Canvas
          camera={{ position: [-20, 5, -8], fov: 62, near: 0.1, far: 800 }}
          shadows                      // PCFShadowMap — cheaper than PCFSoftShadowMap
          dpr={[0.6, 1.25]}            // allow DPR to drop lower on weak laptops
          performance={{ min: 0.4 }}   // more aggressive adaptive downscale
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: 3, // ACESFilmicToneMapping
            toneMappingExposure: 1.05,
          }}
          style={{
            position: "absolute",
            inset: 0,
            // Invisible during loading — canvas renders in background, compiling GPU
            visibility: screen === "game" ? "visible" : "hidden",
            pointerEvents: screen === "game" ? "auto" : "none",
          }}
        >
          <Suspense fallback={null}>
            <OfficeScene />
            {/* Barrier only needed during loading phase */}
            {screen === "loading" && <LoadingBarrier />}
          </Suspense>
        </Canvas>
      )}

      {/* UI overlays — only when game is active */}
      {screen === "game" && (
        <>
          {stage !== "ending" && stage !== "review" && (
            <>
              <GameHUD />
              <MiniMap />
              <DialoguePanel />
            </>
          )}
          <DocumentViewer />
          {stage === "ending" && <EndingScreen />}
        </>
      )}
    </div>
  );
}

"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { OfficeScene } from "@/three/OfficeScene";
import { StartScreen } from "@/components/StartScreen";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GameHUD } from "@/components/GameHUD";
import { DialoguePanel } from "@/components/DialoguePanel";
import { EndingScreen } from "@/components/EndingScreen";
import { ReviewScreen } from "@/components/ReviewScreen";
import { MiniMap } from "@/components/MiniMap";
import { DocumentViewer } from "@/components/DocumentViewer";
import { AnimatePresence, motion } from "framer-motion";
import { startAmbience } from "@/game/audio";

export default function IncidentGame() {
  const { screen, stage } = useGameStore();

  // Start ambient audio when entering the game
  useEffect(() => {
    if (screen === "game") {
      startAmbience();
    }
  }, [screen]);

  return (
    <div className="fixed inset-0 bg-[#030308]">
      <AnimatePresence mode="wait">
        {screen === "start" && (
          <motion.div
            key="start"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StartScreen />
          </motion.div>
        )}

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

      {/* 3D game world */}
      {screen === "game" && (
        <>
          <Canvas
            camera={{ position: [-20, 5, -8], fov: 62, near: 0.1, far: 150 }}
            shadows
            gl={{
              antialias: true,
              toneMapping: 3, // ACESFilmicToneMapping
              toneMappingExposure: 1.05,
            }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Suspense fallback={null}>
              <OfficeScene />
            </Suspense>
          </Canvas>

          {/* UI overlays */}
          {stage !== "ending" && stage !== "review" && (
            <>
              <GameHUD />
              <MiniMap />
              <DialoguePanel />
            </>
          )}

          {/* Document viewer — shown on demand over game */}
          <DocumentViewer />

          {/* Ending overlay */}
          {stage === "ending" && <EndingScreen />}
        </>
      )}
    </div>
  );
}

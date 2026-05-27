"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useState } from "react";

export function StartScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const [showHow, setShowHow] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#050508] overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)",
          }}
        />
      </div>

      {/* Floating office silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10">
        <svg viewBox="0 0 1440 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="0" y="60" width="80" height="68" fill="#6366f1" />
          <rect x="90" y="30" width="120" height="98" fill="#8b5cf6" />
          <rect x="220" y="50" width="60" height="78" fill="#6366f1" />
          <rect x="290" y="10" width="180" height="118" fill="#4f46e5" />
          <rect x="480" y="40" width="90" height="88" fill="#7c3aed" />
          <rect x="580" y="20" width="200" height="108" fill="#6366f1" />
          <rect x="790" y="50" width="70" height="78" fill="#8b5cf6" />
          <rect x="870" y="5" width="160" height="123" fill="#4f46e5" />
          <rect x="1040" y="35" width="100" height="93" fill="#6366f1" />
          <rect x="1150" y="15" width="140" height="113" fill="#7c3aed" />
          <rect x="1300" y="55" width="140" height="73" fill="#6366f1" />
        </svg>
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-2xl px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* AI OA label */}
        <motion.div
          className="mb-6 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase"
          style={{
            background: "rgba(99,102,241,0.12)",
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#818cf8",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          AI OA · Assessment Simulation
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-7xl md:text-8xl font-bold tracking-tighter mb-2"
          style={{
            background: "linear-gradient(135deg, #f1f5f9 0%, #818cf8 50%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          INCIDENT
        </motion.h1>

        <motion.p
          className="text-slate-400 text-lg tracking-widest mb-2 font-mono uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          First Day Protocol
        </motion.p>

        <motion.div
          className="w-24 h-px mb-8"
          style={{ background: "linear-gradient(90deg, transparent, #6366f1, transparent)" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />

        <motion.p
          className="text-slate-400 text-base leading-relaxed mb-10 max-w-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Step inside a high-pressure London office simulation. Every decision, hesitation, and
          conversation shapes your assessment profile. 10 minutes. One incident.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <button
            onClick={startGame}
            className="relative px-8 py-4 rounded-xl text-white font-semibold text-lg cursor-pointer overflow-hidden group transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 0 30px rgba(99,102,241,0.4), 0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <span className="relative z-10">Start Simulation</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }} />
          </button>

          <button
            onClick={() => setShowHow(true)}
            className="px-6 py-4 rounded-xl text-slate-300 font-medium text-base cursor-pointer transition-all duration-200 hover:text-white"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            How It Works
          </button>
        </motion.div>

        {/* Assessment tags */}
        <motion.div
          className="mt-10 flex flex-wrap gap-2 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          {["Situational Judgement", "Ethical Reasoning", "Numerical Analysis", "Communication", "Risk Calibration"].map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded text-xs font-mono"
              style={{
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "#818cf8",
              }}
            >
              {tag}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* How it Works modal */}
      <AnimatePresence>
        {showHow && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.8)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHow(false)}
          >
            <motion.div
              className="relative max-w-lg w-full rounded-2xl p-8"
              style={{
                background: "rgba(15,15,25,0.95)",
                border: "1px solid rgba(99,102,241,0.3)",
                boxShadow: "0 0 40px rgba(99,102,241,0.2)",
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">How INCIDENT Works</h2>
              <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
                {[
                  ["Navigate", "Move through a 3D London office using WASD keys"],
                  ["Interact", "Press E near people or objects to trigger conversations"],
                  ["Decide", "Choose your responses under time pressure — every choice is measured"],
                  ["Review", "Get a Chess.com-style AI review of every decision you made"],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-3">
                    <div className="w-1 rounded-full flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(to bottom, #6366f1, #8b5cf6)", minHeight: "40px" }} />
                    <div>
                      <span className="text-white font-medium">{title}</span>
                      <p className="text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs text-slate-500 font-mono">
                  Controls: WASD move · Mouse look · E interact · Tab objectives · V camera toggle
                </p>
              </div>
              <button
                onClick={() => setShowHow(false)}
                className="mt-6 w-full py-3 rounded-xl text-white font-medium cursor-pointer transition-all"
                style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

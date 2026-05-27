"use client";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { ENDING_DATA } from "@/game/scoring";

export function EndingScreen() {
  const { reviewData, sessionData } = useGameStore();

  if (!reviewData || !sessionData) return null;

  const ending = ENDING_DATA[sessionData.ending];
  const color = ending.color;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]">
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at center, ${color}40 0%, transparent 60%)`,
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-md px-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Score ring */}
        <div className="relative mb-6">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              stroke={color}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - reviewData.overallScore / 100)}`}
              transform="rotate(-90 60 60)"
              initial={{ strokeDashoffset: `${2 * Math.PI * 52}` }}
              animate={{
                strokeDashoffset: `${2 * Math.PI * 52 * (1 - reviewData.overallScore / 100)}`,
              }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl font-bold text-white tabular-nums"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {reviewData.overallScore}
            </motion.span>
            <span className="text-xs text-slate-500 font-mono">/100</span>
          </div>
        </div>

        <motion.p
          className="text-sm font-mono uppercase tracking-widest mb-2"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {ending.title}
        </motion.p>

        <motion.h1
          className="text-2xl font-bold text-white mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          Simulation Complete
        </motion.h1>

        <motion.p
          className="text-slate-400 text-sm leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          {ending.description}
        </motion.p>

        <motion.p
          className="text-slate-600 text-xs font-mono mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          Loading AI Coach Review…
        </motion.p>
      </motion.div>
    </div>
  );
}

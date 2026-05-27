"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { SKILL_LABELS } from "@/game/scoring";
import type { SkillKey, ReviewMove } from "@/game/types";

const TAG_STYLES: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
  best:     { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.35)", label: "Best Move",   icon: "★" },
  good:     { bg: "rgba(99,102,241,0.12)", text: "#818cf8", border: "rgba(99,102,241,0.35)", label: "Good",        icon: "✓" },
  mixed:    { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.35)", label: "Mixed",       icon: "~" },
  mistake:  { bg: "rgba(239,68,68,0.12)",  text: "#f87171", border: "rgba(239,68,68,0.35)", label: "Mistake",     icon: "!" },
  critical: { bg: "rgba(239,68,68,0.20)",  text: "#ef4444", border: "rgba(239,68,68,0.45)", label: "Critical",    icon: "✕" },
};

const MOVE_CONTEXT: Record<string, string> = {
  receptionist:    "Arriving at Asterion Labs, first point of contact.",
  dashboard_check: "Reviewing live analytics dashboards at your workstation.",
  maya_initial:    "Senior Analyst Maya Thompson flags something in the data.",
  oliver_morning:  "Head of Analytics Oliver Chen drops by your desk.",
  theo_pipeline:   "Engineer Theo Blackwood is debugging the data pipeline.",
  priya_risk:      "Risk & Compliance Officer Priya Kapoor intercepts you.",
  amara_ethics:    "Chief Ethics & Data Officer Amara Osei requests a word.",
  board_demo:      "Client demo is live — Asterion's leadership is watching.",
};

export function ReviewScreen() {
  const { reviewData, sessionData, resetGame } = useGameStore();
  const [walkthrough, setWalkthrough] = useState(false);
  const [moveIdx, setMoveIdx] = useState(0);
  const [activeMove, setActiveMove] = useState<ReviewMove | null>(null);

  if (!reviewData || !sessionData) return null;

  const skills = Object.entries(SKILL_LABELS) as [SkillKey, string][];
  const topSkills = [...skills]
    .sort((a, b) => (reviewData.skillScores[b[0]] ?? 50) - (reviewData.skillScores[a[0]] ?? 50))
    .slice(0, 3);

  const endingColors: Record<string, string> = {
    trusted_operator: "#10b981",
    overreaction:     "#f59e0b",
    passive:          "#ef4444",
    ethical_failure:  "#dc2626",
    analyst:          "#6366f1",
  };
  const accentColor = endingColors[reviewData.ending] ?? "#6366f1";
  const minutes = Math.floor(sessionData.durationSeconds / 60);
  const seconds  = sessionData.durationSeconds % 60;
  const timeline = reviewData.timeline ?? [];

  return (
    <div className="fixed inset-0 overflow-y-auto z-50" style={{ background: "#050508" }}>
      {/* Subtle grid */}
      <div className="fixed inset-0 opacity-[0.07] pointer-events-none">
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(99,102,241,0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.2) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">

        {/* ── HEADER ────────────────────────────────────────────── */}
        <motion.div className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>
            AI OA · Assessment Review
          </p>
          <h1 className="text-5xl font-bold tracking-tighter mb-1"
            style={{
              background: "linear-gradient(135deg, #f1f5f9 0%, #818cf8 60%, #a78bfa 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
            INCIDENT
          </h1>
          <p className="text-slate-500 font-mono text-sm">First Day Protocol · Complete</p>
        </motion.div>

        {/* ── SUMMARY CARD ──────────────────────────────────────── */}
        <motion.div className="rounded-2xl p-8 mb-8 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${accentColor}30`, boxShadow: `0 0 40px ${accentColor}15` }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Score ring */}
            <div className="relative flex-shrink-0">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="58" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                <motion.circle cx="70" cy="70" r="58" stroke={accentColor} strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 58}`}
                  transform="rotate(-90 70 70)"
                  initial={{ strokeDashoffset: `${2 * Math.PI * 58}` }}
                  animate={{ strokeDashoffset: `${2 * Math.PI * 58 * (1 - reviewData.overallScore / 100)}` }}
                  transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                  style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span className="text-4xl font-bold text-white tabular-nums"
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}>
                  {reviewData.overallScore}
                </motion.span>
                <span className="text-slate-500 text-sm">/100</span>
              </div>
            </div>

            {/* Summary text */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wide"
                  style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}>
                  {reviewData.overallLabel}
                </span>
                <span className="text-slate-500 text-xs font-mono">{minutes}m {seconds}s</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{reviewData.outcomeTitle}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{reviewData.summary}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <StatPill label="Decisions"   value={String(sessionData.decisions.length)} />
                <StatPill label="NPCs Spoken" value={String(Object.values(sessionData.interactions).filter(Boolean).length)} />
                <StatPill label="Zones"       value={String(sessionData.zonesVisited.length)} />
                <StatPill label="Top Skill"   value={SKILL_LABELS[topSkills[0]?.[0] ?? "ethicalJudgement"]} />
              </div>
            </div>
          </div>

          {/* Walkthrough CTA */}
          {timeline.length > 0 && (
            <motion.div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">AI Coach Walkthrough</p>
                  <p className="text-xs text-slate-500">Step through every decision with detailed analysis.</p>
                </div>
                <button
                  onClick={() => { setMoveIdx(0); setWalkthrough(true); }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white cursor-pointer transition-all duration-200 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
                    boxShadow: `0 0 18px ${accentColor}40`,
                  }}>
                  ▶ Start Walkthrough
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ── SKILLS + RADAR ────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="text-white font-semibold mb-5">Skill Breakdown</h3>
            <div className="space-y-3">
              {skills.map(([key, label], idx) => {
                const score = reviewData.skillScores[key] ?? 50;
                const barColor = score >= 70 ? "#10b981" : score >= 50 ? "#6366f1" : "#ef4444";
                return (
                  <motion.div key={key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">{label}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: barColor }}>{score}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ delay: 0.7 + idx * 0.05, duration: 0.8, ease: "easeOut" }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div className="rounded-2xl p-6 flex flex-col items-center justify-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <h3 className="text-white font-semibold mb-4 self-start">Performance Radar</h3>
            <RadarChart scores={reviewData.skillScores} accentColor={accentColor} />
          </motion.div>
        </div>

        {/* ── BEST / WORST ──────────────────────────────────────── */}
        {(reviewData.bestMove || reviewData.biggestMistake) && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {reviewData.bestMove && <MoveHighlight move={reviewData.bestMove} type="best" delay={0.6} />}
            {reviewData.biggestMistake && <MoveHighlight move={reviewData.biggestMistake} type="worst" delay={0.7} />}
          </div>
        )}

        {/* ── DECISION TIMELINE ─────────────────────────────────── */}
        <motion.div className="rounded-2xl p-6 mb-8"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Decision Timeline</h3>
            <span className="text-xs text-slate-600 font-mono">{timeline.length} decisions</span>
          </div>
          <div className="space-y-3">
            {timeline.map((move, i) => {
              const tag = TAG_STYLES[move.tag] ?? TAG_STYLES.mixed;
              const ts  = Math.round(move.timestamp / 1000);
              const isActive = activeMove?.id === move.id;
              return (
                <motion.div key={move.id}
                  className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                  style={{
                    border: `1px solid ${isActive ? tag.border : "rgba(255,255,255,0.06)"}`,
                    background: isActive ? tag.bg : "rgba(255,255,255,0.02)",
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.07 }}
                  onClick={() => setActiveMove(isActive ? null : move)}>
                  <div className="flex items-start gap-4 p-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${tag.text}20`, color: tag.text }}>
                      {tag.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-white">{move.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{ background: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>
                          {tag.label}
                        </span>
                        <span className="text-xs text-slate-600 font-mono">
                          {Math.floor(ts / 60)}:{(ts % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{move.playerChoice}</p>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }} className="mt-3 space-y-2">
                            {MOVE_CONTEXT[move.id] && (
                              <p className="text-xs text-slate-600 italic">{MOVE_CONTEXT[move.id]}</p>
                            )}
                            <p className="text-sm text-slate-300 leading-relaxed">{move.reviewText}</p>
                            <div className="flex gap-2 flex-wrap mt-2">
                              {move.skillTags.map((t) => (
                                <span key={t} className="text-xs px-2 py-0.5 rounded font-mono"
                                  style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs font-mono"
                              style={{ color: move.scoreImpact >= 0 ? "#34d399" : "#f87171" }}>
                              Score impact: {move.scoreImpact >= 0 ? "+" : ""}{move.scoreImpact} pts
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="text-slate-600 text-sm">{isActive ? "▲" : "▼"}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── RECOMMENDATIONS ───────────────────────────────────── */}
        {reviewData.recommendations.length > 0 && (
          <motion.div className="rounded-2xl p-6 mb-8"
            style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
            <h3 className="text-white font-semibold mb-4">AI Coach Recommendations</h3>
            <div className="space-y-3">
              {reviewData.recommendations.map((rec, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── ACTIONS ───────────────────────────────────────────── */}
        <motion.div className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <button onClick={resetGame}
            className="px-8 py-4 rounded-xl font-semibold text-white cursor-pointer transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 0 20px rgba(99,102,241,0.3)",
            }}>
            Play Again
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify({ ...sessionData, review: reviewData }, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href = url;
              a.download = `incident_review_${sessionData.sessionId}.json`;
              a.click();
            }}
            className="px-8 py-4 rounded-xl font-medium text-slate-300 cursor-pointer transition-all duration-200 hover:text-white"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Export Session Data
          </button>
        </motion.div>
        <div className="text-center mt-8 pb-4">
          <p className="text-xs text-slate-700 font-mono">AI OA · Powered by INCIDENT Engine v1.0</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          WALKTHROUGH OVERLAY
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {walkthrough && timeline.length > 0 && (
          <WalkthroughOverlay
            timeline={timeline}
            moveIdx={moveIdx}
            onNext={() => setMoveIdx((i) => Math.min(i + 1, timeline.length - 1))}
            onPrev={() => setMoveIdx((i) => Math.max(i - 1, 0))}
            onJump={setMoveIdx}
            onClose={() => setWalkthrough(false)}
            accentColor={accentColor}
            skillScores={reviewData.skillScores}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Walkthrough Overlay
// ─────────────────────────────────────────────────────────────────────────────

function WalkthroughOverlay({
  timeline, moveIdx, onNext, onPrev, onJump, onClose, accentColor, skillScores,
}: {
  timeline: ReviewMove[];
  moveIdx: number;
  onNext: () => void;
  onPrev: () => void;
  onJump: (idx: number) => void;
  onClose: () => void;
  accentColor: string;
  skillScores: Record<SkillKey, number>;
}) {
  const move   = timeline[moveIdx];
  const tag    = TAG_STYLES[move.tag] ?? TAG_STYLES.mixed;
  const ts     = Math.round(move.timestamp / 1000);
  const isLast = moveIdx === timeline.length - 1;
  const isFirst = moveIdx === 0;

  // Skill impact bars from skillTags
  const affectedSkills = move.skillTags.slice(0, 4);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d") onNext();
      if (e.key === "ArrowLeft"  || e.key === "a") onPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNext, onPrev, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(2,2,8,0.93)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
        ✕
      </button>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div
          className="h-full"
          style={{ background: accentColor }}
          animate={{ width: `${((moveIdx + 1) / timeline.length) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Step counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <span className="text-xs font-mono text-slate-500">Move</span>
        <span className="text-sm font-bold text-white">{moveIdx + 1}</span>
        <span className="text-xs font-mono text-slate-600">/ {timeline.length}</span>
      </div>

      {/* Dot indicators */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-1.5">
        {timeline.map((m, i) => {
          const t = TAG_STYLES[m.tag] ?? TAG_STYLES.mixed;
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              className="w-2 h-2 rounded-full transition-all duration-200 cursor-pointer"
              style={{
                background: i === moveIdx ? t.text : i < moveIdx ? `${t.text}55` : "rgba(255,255,255,0.15)",
                transform: i === moveIdx ? "scale(1.4)" : "scale(1)",
              }}
            />
          );
        })}
      </div>

      {/* Main card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={move.id}
          className="w-full max-w-2xl rounded-2xl overflow-hidden"
          style={{
            background: "rgba(12,12,20,0.98)",
            border: `1px solid ${tag.border}`,
            boxShadow: `0 0 60px ${tag.text}18, 0 0 120px ${tag.text}08`,
          }}
          initial={{ opacity: 0, x: 40, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -40, scale: 0.97 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Card header */}
          <div className="px-7 pt-7 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: `${tag.text}18`, color: tag.text, border: `1px solid ${tag.border}` }}>
                {moveIdx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase"
                    style={{ background: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>
                    {tag.icon} {tag.label}
                  </span>
                  <span className="text-xs text-slate-600 font-mono">
                    {Math.floor(ts / 60)}:{(ts % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{move.label}</h3>
                {MOVE_CONTEXT[move.id] && (
                  <p className="text-xs text-slate-600 italic">{MOVE_CONTEXT[move.id]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Choice made */}
          <div className="px-7 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs uppercase tracking-widest text-slate-600 font-mono mb-2">Your Choice</p>
            <p className="text-sm font-medium text-white leading-relaxed"
              style={{ borderLeft: `3px solid ${tag.text}60`, paddingLeft: "0.75rem" }}>
              "{move.playerChoice}"
            </p>
          </div>

          {/* AI Analysis */}
          <div className="px-7 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded flex items-center justify-center text-xs"
                style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>
                AI
              </div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-mono">Coach Analysis</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{move.reviewText}</p>
          </div>

          {/* Skills + Score impact */}
          <div className="px-7 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 flex-wrap">
                {affectedSkills.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-600 font-mono mb-0.5">Score Impact</p>
                <p className="text-lg font-bold font-mono"
                  style={{ color: move.scoreImpact >= 0 ? "#34d399" : "#f87171" }}>
                  {move.scoreImpact >= 0 ? "+" : ""}{move.scoreImpact}
                </p>
              </div>
            </div>

            {/* Skill mini-bars for affected skills */}
            <div className="space-y-1.5">
              {affectedSkills.map((skillKey) => {
                const score = skillScores[skillKey as SkillKey] ?? 50;
                const barColor = score >= 70 ? "#10b981" : score >= 50 ? "#6366f1" : "#ef4444";
                return (
                  <div key={skillKey} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-28 truncate font-mono">{skillKey}</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: barColor }}
                        initial={{ width: 0 }} animate={{ width: `${score}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }} />
                    </div>
                    <span className="text-xs font-mono w-6 text-right" style={{ color: barColor }}>{score}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="px-7 pb-7 flex items-center justify-between gap-4">
            <button
              onClick={onPrev}
              disabled={isFirst}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: isFirst ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
                color: isFirst ? "#374151" : "#cbd5e1",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: isFirst ? "not-allowed" : "pointer",
              }}>
              ← Previous
            </button>

            <div className="text-center">
              <p className="text-xs text-slate-700 font-mono">← → to navigate · ESC to close</p>
            </div>

            {isLast ? (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
                  boxShadow: `0 0 16px ${accentColor}40`,
                }}>
                Finish Review
              </button>
            ) : (
              <button
                onClick={onNext}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
                  boxShadow: `0 0 16px ${accentColor}40`,
                }}>
                Next Move →
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-1.5 rounded-lg text-xs"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span className="text-slate-500 mr-1.5">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function MoveHighlight({ move, type, delay }: { move: ReviewMove; type: "best" | "worst"; delay: number }) {
  const isBest = type === "best";
  const color  = isBest ? "#10b981" : "#ef4444";
  return (
    <motion.div className="rounded-2xl p-5"
      style={{ background: `${color}08`, border: `1px solid ${color}25` }}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded flex items-center justify-center text-sm"
          style={{ background: `${color}20`, color }}>
          {isBest ? "★" : "!"}
        </div>
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color }}>
          {isBest ? "Best Move" : "Key Improvement"}
        </span>
      </div>
      <p className="text-sm font-medium text-white mb-1">{move.label}</p>
      <p className="text-xs text-slate-400 mb-2 italic">"{move.playerChoice}"</p>
      <p className="text-xs text-slate-300 leading-relaxed">{move.reviewText}</p>
    </motion.div>
  );
}

function RadarChart({ scores, accentColor }: { scores: Record<SkillKey, number>; accentColor: string }) {
  const keys: SkillKey[] = [
    "situationalAwareness", "ethicalJudgement", "emotionalControl", "evidenceGathering",
    "numericalReasoning",   "communicationQuality", "riskCalibration", "leadershipPotential",
  ];
  const labels = keys.map((k) => SKILL_LABELS[k].split(" ").slice(-1)[0]);
  const cx = 110, cy = 110, r = 80, n = keys.length;

  const getPoint = (i: number, val: number) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + (val / 100) * r * Math.cos(angle), y: cy + (val / 100) * r * Math.sin(angle) };
  };

  const points = keys.map((k, i) => getPoint(i, scores[k] ?? 50));
  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const gridLevels = [25, 50, 75, 100];

  return (
    <svg width="220" height="220" viewBox="0 0 220 220">
      {gridLevels.map((level) => {
        const gp = keys.map((_, i) => { const p = getPoint(i, level); return `${p.x},${p.y}`; }).join(" ");
        return <polygon key={level} points={gp} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      {keys.map((_, i) => {
        const outer = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      <polygon points={polygonPoints} fill={`${accentColor}20`} stroke={accentColor} strokeWidth="1.5"
        strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${accentColor}60)` }} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={accentColor}
          style={{ filter: `drop-shadow(0 0 3px ${accentColor})` }} />
      ))}
      {keys.map((_, i) => {
        const lp = getPoint(i, 118);
        return <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(148,163,184,0.8)" fontSize="8" fontFamily="DM Sans, sans-serif">{labels[i]}</text>;
      })}
    </svg>
  );
}

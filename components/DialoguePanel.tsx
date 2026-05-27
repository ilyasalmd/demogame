"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { DecisionOption } from "@/game/types";
import { speakLine, stopSpeech, initVoices } from "@/game/voiceSynthesis";

const CHARACTER_META: Record<string, { color: string; icon: string; npcId: string; role: string }> = {
  "maya chen":    { color: "#6366f1", icon: "MC", npcId: "maya",  role: "Data Scientist" },
  maya:           { color: "#6366f1", icon: "MC", npcId: "maya",  role: "Data Scientist" },
  "theo marsh":   { color: "#0ea5e9", icon: "TM", npcId: "theo",  role: "Engineering Lead" },
  theo:           { color: "#0ea5e9", icon: "TM", npcId: "theo",  role: "Engineering Lead" },
  "oliver grant": { color: "#f59e0b", icon: "OG", npcId: "oliver", role: "Sales Director" },
  oliver:         { color: "#f59e0b", icon: "OG", npcId: "oliver", role: "Sales Director" },
  "priya nair":   { color: "#10b981", icon: "PN", npcId: "priya", role: "Compliance Officer" },
  priya:          { color: "#10b981", icon: "PN", npcId: "priya", role: "Compliance Officer" },
  "amara vale":   { color: "#ec4899", icon: "AV", npcId: "amara", role: "Chief of Staff" },
  amara:          { color: "#ec4899", icon: "AV", npcId: "amara", role: "Chief of Staff" },
  receptionist:   { color: "#8b5cf6", icon: "R",  npcId: "receptionist", role: "Reception" },
  system:         { color: "#06b6d4", icon: "⬡",  npcId: "system", role: "System" },
  dashboard:      { color: "#334155", icon: "DB", npcId: "dashboard", role: "Dashboard" },
};

function getMeta(name: string) {
  return CHARACTER_META[name.toLowerCase()] ?? { color: "#6366f1", icon: name.slice(0, 2).toUpperCase(), npcId: name, role: "" };
}

const REVIEW_TAG_COLORS = {
  best:     "#10b981",
  good:     "#6366f1",
  mixed:    "#f59e0b",
  mistake:  "#ef4444",
  critical: "#dc2626",
};

const REVIEW_TAG_LABELS = {
  best:     "Best",
  good:     "Good",
  mixed:    "Risky",
  mistake:  "Poor",
  critical: "Critical",
};

function CharacterPortrait({ npcId, color }: { npcId: string; color: string }) {
  const portraits: Record<string, { skin: string; hair: string; female: boolean }> = {
    maya:         { skin: "#f3c5a0", hair: "#1a0800", female: true },
    theo:         { skin: "#d4a574", hair: "#4a2800", female: false },
    oliver:       { skin: "#fdbcb4", hair: "#8b5e0a", female: false },
    priya:        { skin: "#c8a882", hair: "#0a0404", female: true },
    amara:        { skin: "#8d5524", hair: "#0a0404", female: true },
    receptionist: { skin: "#fdbcb4", hair: "#4a2800", female: false },
    dashboard:    { skin: "#7090b0", hair: "#203060", female: false },
    system:       { skin: "#8090a8", hair: "#304060", female: false },
  };
  const p = portraits[npcId] ?? { skin: "#d4a574", hair: "#3a2010", female: false };
  const darker = color + "88";

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ borderRadius: "14px", display: "block" }}>
      <rect width="64" height="64" fill="#0a0a18" rx="0" />
      <rect x="6" y="38" width="52" height="30" fill={color} />
      <polygon points="29,38 32,50 35,38" fill="white" />
      <polygon points="6,38 29,38 22,54 6,64" fill={darker} />
      <polygon points="58,38 35,38 42,54 58,64" fill={darker} />
      <rect x="26" y="30" width="12" height="12" fill={p.skin} />
      <circle cx="32" cy="22" r="14" fill={p.skin} />
      {p.female ? (
        <>
          <path d="M18 22 Q18 6 32 6 Q46 6 46 22" fill={p.hair} />
          <rect x="18" y="18" width="4" height="14" fill={p.hair} />
          <rect x="42" y="18" width="4" height="14" fill={p.hair} />
        </>
      ) : (
        <path d="M18 22 Q18 6 32 6 Q46 6 46 22 Q40 15 32 15 Q24 15 18 22Z" fill={p.hair} />
      )}
      <circle cx="27" cy="21" r="2.5" fill="white" />
      <circle cx="37" cy="21" r="2.5" fill="white" />
      <circle cx="27.6" cy="21.2" r="1.4" fill="#080810" />
      <circle cx="37.6" cy="21.2" r="1.4" fill="#080810" />
      <circle cx="32" cy="25" r="1" fill={p.skin} opacity={0.6} />
    </svg>
  );
}

export function DialoguePanel() {
  const { activeDialogue, dialogueStep, dialogueCharacter, advanceDialogue, makeDecision, submitFreeText, setSpeechBubble } = useGameStore();

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const completedRef = useRef(false);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevNpcIdRef = useRef<string>("");

  const currentLine = activeDialogue?.lines[dialogueStep];
  const showOptions = (activeDialogue?.options || activeDialogue?.freeTextInput) && dialogueStep >= (activeDialogue?.lines.length ?? 0);

  const speakerName = currentLine?.speaker ?? dialogueCharacter;
  const meta = getMeta(speakerName);

  // Typewriter + voice
  useEffect(() => {
    initVoices();
    if (!currentLine) { setDisplayedText(""); setIsTyping(false); return; }
    if (typingRef.current) clearInterval(typingRef.current);

    completedRef.current = false;
    setIsTyping(true);
    setDisplayedText("");
    const text = currentLine.text;

    speakLine(text, meta.npcId);

    if (prevNpcIdRef.current && prevNpcIdRef.current !== meta.npcId) {
      setSpeechBubble(prevNpcIdRef.current, "");
    }
    prevNpcIdRef.current = meta.npcId;

    if (meta.npcId && meta.npcId !== "system" && currentLine) {
      setSpeechBubble(meta.npcId, currentLine.text);
    }

    let i = 0;
    typingRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
      } else {
        if (typingRef.current) clearInterval(typingRef.current);
        setIsTyping(false);
        completedRef.current = true;
        if (activeDialogue?.autoAdvance) setTimeout(() => advanceDialogue(), 1200);
      }
    }, 20);

    return () => { if (typingRef.current) clearInterval(typingRef.current); };
  }, [currentLine?.text, dialogueStep]);

  useEffect(() => {
    if (!activeDialogue) {
      stopSpeech();
      if (prevNpcIdRef.current) setSpeechBubble(prevNpcIdRef.current, "");
    }
  }, [activeDialogue]);

  useEffect(() => {
    return () => {
      if (prevNpcIdRef.current) setSpeechBubble(prevNpcIdRef.current, "");
    };
  }, []);

  const skipOrAdvance = useCallback(() => {
    if (isTyping) {
      if (typingRef.current) clearInterval(typingRef.current);
      setDisplayedText(currentLine?.text ?? "");
      setIsTyping(false);
      completedRef.current = true;
    } else if (!showOptions && completedRef.current) {
      advanceDialogue();
    }
  }, [isTyping, showOptions, currentLine, advanceDialogue]);

  useEffect(() => {
    if (!activeDialogue) return;
    const SKIP = new Set(["e", "tab", "v", "shift", "control", "alt", "meta", "escape"]);
    const onKey = (e: KeyboardEvent) => {
      if (showOptions) return;
      // Ignore all media/volume/function keys
      if (SKIP.has(e.key.toLowerCase())) return;
      if (e.key.startsWith("Audio") || e.key.startsWith("Media") || e.key.includes("Volume")) return;
      if (e.key.startsWith("F") && e.key.length <= 3 && !isNaN(Number(e.key.slice(1)))) return;
      e.preventDefault();
      skipOrAdvance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeDialogue, showOptions, skipOrAdvance]);

  if (!activeDialogue) return null;

  return (
    <AnimatePresence>
      {!isTyping && !showOptions && activeDialogue && (
        <motion.div
          className="fixed bottom-[10.5rem] left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <div
            style={{
              background: "#ffffff",
              color: "#000000",
              padding: "8px 20px",
              borderRadius: "4px",
              fontFamily: '"Press Start 2P", "Courier New", monospace',
              fontSize: "11px",
              letterSpacing: "1px",
              boxShadow: "3px 3px 0 #888888",
              border: "2px solid #888888",
            }}
          >
            ▼ SPACE
          </div>
        </motion.div>
      )}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-40 pointer-events-auto"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div
          className="relative"
          style={{
            background: "rgba(4,4,14,0.96)",
            borderTop: `2px solid ${meta.color}`,
          }}
        >

          {!showOptions ? (
            <div className="flex items-end gap-0 max-w-4xl mx-auto px-4 py-4">
              {/* Character portrait */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1.5 mr-4">
                <motion.div
                  key={speakerName}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative"
                >
                  <div className="w-16 h-16 overflow-hidden rounded-2xl">
                    <CharacterPortrait npcId={meta.npcId} color={meta.color} />
                  </div>
                  {/* Speaking pulse ring */}
                  {isTyping && (
                    <motion.div
                      className="absolute -inset-1 rounded-2xl border-2 pointer-events-none"
                      style={{ borderColor: meta.color }}
                      animate={{ opacity: [0.6, 0.1, 0.6] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <div className="text-center">
                  <div className="text-xs font-bold tracking-wide" style={{ color: meta.color }}>
                    {speakerName.split(" ")[0].toUpperCase()}
                  </div>
                  {meta.role && (
                    <div className="text-[9px] text-slate-600 font-mono leading-none mt-0.5">
                      {meta.role.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Dialogue text area */}
              <div className="flex-1 min-w-0">
                {/* Name bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-px flex-1"
                    style={{ background: `linear-gradient(90deg, ${meta.color}60, transparent)` }}
                  />
                  {isTyping && (
                    <div className="flex gap-0.5 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="block w-1 h-1 rounded-full"
                          style={{ background: meta.color }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, delay: i * 0.18, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="relative">
                  <p
                    className="text-white text-[15px] leading-relaxed font-light min-h-[3.5rem]"
                    style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
                  >
                    {displayedText}
                    {isTyping && (
                      <motion.span
                        className="inline-block w-[2px] h-4 ml-0.5 align-middle rounded"
                        style={{ background: meta.color }}
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </p>
                </div>

              </div>
            </div>
          ) : activeDialogue?.freeTextInput ? (
            <FreeTextInput onSubmit={submitFreeText} speakerColor={meta.color} />
          ) : (
            <DecisionOptions options={activeDialogue!.options!} onSelect={makeDecision} speakerColor={meta.color} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function DecisionOptions({
  options, onSelect, speakerColor,
}: {
  options: DecisionOption[];
  onSelect: (option: DecisionOption) => void;
  speakerColor: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const shuffledOptions = useMemo(() => {
    const arr = [...options];
    let seed = arr.reduce((s, o, i) => s + o.id.charCodeAt(0) * (i + 1), 0);
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
      const j = seed % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [options]);
  const [elapsed, setElapsed] = useState(0);
  const DECISION_TIME = 25;

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed((e) => {
        if (e >= DECISION_TIME) { clearInterval(iv); return e; }
        return e + 0.1;
      });
    }, 100);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected) return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < shuffledOptions.length) handleSelect(shuffledOptions[idx]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, shuffledOptions]);

  const handleSelect = (option: DecisionOption) => {
    if (selected) return;
    setSelected(option.id);
    stopSpeech();
    setTimeout(() => onSelect(option), 350);
  };

  const progress = Math.min(1, elapsed / DECISION_TIME);
  const timeLeft = Math.max(0, Math.ceil(DECISION_TIME - elapsed));

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: speakerColor }} />
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">How do you respond?</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-28 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ background: progress > 0.7 ? "#ef4444" : speakerColor, width: `${(1 - progress) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span
            className="text-xs font-mono tabular-nums w-5 text-right"
            style={{ color: timeLeft <= 8 ? "#ef4444" : "rgba(255,255,255,0.4)" }}
          >
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="grid gap-2">
        {shuffledOptions.map((option, i) => {
          const tagColor = REVIEW_TAG_COLORS[option.reviewTag] ?? speakerColor;
          const isSelected = selected === option.id;
          return (
            <motion.button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className="text-left rounded-xl transition-all duration-150 group cursor-pointer overflow-hidden"
              style={{
                background: isSelected ? `${tagColor}14` : "rgba(255,255,255,0.028)",
                border: `1px solid ${isSelected ? tagColor + "55" : "rgba(255,255,255,0.07)"}`,
                boxShadow: isSelected ? `0 0 16px ${tagColor}20` : "none",
              }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={!selected ? { backgroundColor: "rgba(255,255,255,0.05)", borderColor: speakerColor + "44" } : {}}
              whileTap={!selected ? { scale: 0.99 } : {}}
            >
              <div className="flex items-center px-3 py-2.5 gap-3">
                {/* Number badge */}
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background: isSelected ? `${tagColor}30` : "rgba(255,255,255,0.06)",
                    color: isSelected ? tagColor : "rgba(255,255,255,0.5)",
                    border: `1px solid ${isSelected ? tagColor + "50" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {i + 1}
                </div>
                {/* Text */}
                <span
                  className="flex-1 text-sm leading-snug"
                  style={{ color: isSelected ? "white" : "rgba(255,255,255,0.75)" }}
                >
                  {option.label}
                </span>
                {/* Tag pill — only show when selected */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{ background: `${tagColor}22`, color: tagColor, border: `1px solid ${tagColor}44` }}
                  >
                    {REVIEW_TAG_LABELS[option.reviewTag] ?? "—"}
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <p className="text-right text-[10px] text-slate-700 font-mono mt-2">
        Press 1–{shuffledOptions.length} or click
      </p>
    </div>
  );
}

function FreeTextInput({ onSubmit, speakerColor }: { onSubmit: (answer: string) => void; speakerColor: string }) {
  const [value, setValue] = useState("");
  const MAX = 180;

  const handleSubmit = () => {
    if (value.trim().length < 5) return;
    onSubmit(value.trim());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: speakerColor }} />
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Your written recommendation</span>
      </div>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX))}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        placeholder="Type your recommendation... What should happen with the demo? (Press Enter to submit)"
        className="w-full text-sm text-white bg-transparent border rounded-xl px-3 py-2.5 outline-none resize-none leading-relaxed placeholder:text-slate-600"
        style={{
          borderColor: `${speakerColor}44`,
          background: "rgba(255,255,255,0.03)",
          minHeight: "80px",
        }}
        rows={3}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-mono" style={{ color: value.length > MAX * 0.85 ? "#ef4444" : "rgba(255,255,255,0.3)" }}>
          {value.length}/{MAX}
        </span>
        <button
          onClick={handleSubmit}
          disabled={value.trim().length < 5}
          className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all"
          style={{
            background: value.trim().length >= 5 ? speakerColor : "rgba(255,255,255,0.06)",
            color: value.trim().length >= 5 ? "white" : "rgba(255,255,255,0.3)",
          }}
        >
          Submit
        </button>
      </div>
      <p className="text-right text-[10px] text-slate-700 font-mono mt-1">Enter or click Submit</p>
    </div>
  );
}

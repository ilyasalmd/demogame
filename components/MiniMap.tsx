"use client";
import { useState, useEffect, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import { CHARACTERS } from "@/game/data";
import { motion } from "framer-motion";

/* ──────────────────────────────────────────────────────────────
   AMONG-US STYLE MINI-MAP
   SVG top-left overlay. Player = blue pulsing dot.
   NPCs = coloured dots. Zones = labelled rooms.
   Office world coords: X -25..25, Z -20..20  →  map 0..100
   ────────────────────────────────────────────────────────────── */

const MAP_W = 160;
const MAP_H = 128;
const PAD = 8;

const MAP_W_FS = 480;
const MAP_H_FS = 384;
const PAD_FS = 24;

// World extents
const WX_MIN = -25, WX_MAX = 25;
const WZ_MIN = -20, WZ_MAX = 20;

function toMap(worldX: number, worldZ: number, mapW = MAP_W, mapH = MAP_H, pad = PAD) {
  const mx = pad + ((worldX - WX_MIN) / (WX_MAX - WX_MIN)) * (mapW - pad * 2);
  const my = pad + ((worldZ - WZ_MIN) / (WZ_MAX - WZ_MIN)) * (mapH - pad * 2);
  return { mx, my };
}

// Zone definitions [worldX, worldZ, worldW, worldD, label, color]
const ZONES = [
  { x: -20, z: -5, w: 8, d: 10, label: "LOBBY", color: "rgba(139,92,246,0.2)" },
  { x: -8, z: -14, w: 14, d: 10, label: "ANALYTICS", color: "rgba(99,102,241,0.2)" },
  { x: 4, z: -14, w: 10, d: 10, label: "BOARDROOM", color: "rgba(245,158,11,0.2)" },
  { x: 14, z: -14, w: 10, d: 10, label: "EXEC", color: "rgba(236,72,153,0.2)" },
  { x: 6, z: -2, w: 10, d: 10, label: "ENGINEERING", color: "rgba(14,165,233,0.2)" },
  { x: -10, z: 2, w: 10, d: 10, label: "OPS", color: "rgba(6,182,212,0.2)" },
  { x: -8, z: 10, w: 10, d: 8, label: "COMPLIANCE", color: "rgba(16,185,129,0.2)" },
  { x: 5, z: 10, w: 8, d: 8, label: "COFFEE", color: "rgba(245,158,11,0.1)" },
];

const CHARACTER_COLORS: Record<string, string> = {
  maya: "#6366f1",
  theo: "#0ea5e9",
  oliver: "#f59e0b",
  priya: "#10b981",
  amara: "#ec4899",
};

function MapSVG({
  mapW,
  mapH,
  pad,
  pmx,
  pmy,
  interactionsCompleted,
  nearbyInteractable,
  fontSize = { zone: 5, char: 4, compass: 6, legend: 4 },
}: {
  mapW: number;
  mapH: number;
  pad: number;
  pmx: number;
  pmy: number;
  interactionsCompleted: Record<string, boolean>;
  nearbyInteractable: string | null;
  fontSize?: { zone: number; char: number; compass: number; legend: number };
}) {
  return (
    <svg width={mapW} height={mapH} viewBox={`0 0 ${mapW} ${mapH}`}>
      {/* Floor background */}
      <rect x={pad} y={pad} width={mapW - pad * 2} height={mapH - pad * 2}
        fill="rgba(10,10,25,0.9)" stroke="rgba(99,102,241,0.3)" strokeWidth="0.8" rx="2" />

      {/* Zones */}
      {ZONES.map((zone, i) => {
        const { mx: zx, my: zy } = toMap(zone.x, zone.z, mapW, mapH, pad);
        const zw = (zone.w / (WX_MAX - WX_MIN)) * (mapW - pad * 2);
        const zh = (zone.d / (WZ_MAX - WZ_MIN)) * (mapH - pad * 2);
        return (
          <g key={i}>
            <rect x={zx} y={zy} width={zw} height={zh}
              fill={zone.color} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" rx="1" />
            <text x={zx + zw / 2} y={zy + zh / 2}
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.35)" fontSize={fontSize.zone} fontFamily="monospace" letterSpacing="0.5">
              {zone.label}
            </text>
          </g>
        );
      })}

      {/* Walls / room outlines */}
      {/* Boardroom walls */}
      <rect x={toMap(10, -20, mapW, mapH, pad).mx} y={toMap(10, -20, mapW, mapH, pad).my}
        width={toMap(20, -20, mapW, mapH, pad).mx - toMap(10, -20, mapW, mapH, pad).mx}
        height={toMap(10, -12, mapW, mapH, pad).my - toMap(10, -20, mapW, mapH, pad).my}
        fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="0.8" />
      {/* Lift area */}
      <rect x={toMap(-25, -8, mapW, mapH, pad).mx} y={toMap(-25, -8, mapW, mapH, pad).my}
        width={toMap(-17, -8, mapW, mapH, pad).mx - toMap(-25, -8, mapW, mapH, pad).mx}
        height={toMap(-25, 8, mapW, mapH, pad).my - toMap(-25, -8, mapW, mapH, pad).my}
        fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.3)" strokeWidth="0.6" />

      {/* NPCs */}
      {CHARACTERS.map((char) => {
        const { mx: cx, my: cy } = toMap(char.position[0], char.position[2], mapW, mapH, pad);
        const spoken = interactionsCompleted[char.id] || interactionsCompleted[char.id + "_initial"];
        const dotR = mapW > 200 ? (spoken ? 8 : 6) : (spoken ? 3.5 : 3);
        const ringR = mapW > 200 ? 14 : 6;
        const nameOffset = mapW > 200 ? -10 : -4.5;
        return (
          <g key={char.id}>
            <circle cx={cx} cy={cy} r={dotR}
              fill={CHARACTER_COLORS[char.id]}
              stroke={spoken ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}
              strokeWidth="0.8"
              opacity={0.9}
            />
            {nearbyInteractable === char.id && (
              <circle cx={cx} cy={cy} r={ringR} fill="none"
                stroke={CHARACTER_COLORS[char.id]} strokeWidth="0.8" opacity={0.6} />
            )}
            <text x={cx} y={cy + nameOffset} textAnchor="middle"
              fill="rgba(255,255,255,0.7)" fontSize={fontSize.char} fontFamily="sans-serif">
              {char.name.split(" ")[0]}
            </text>
          </g>
        );
      })}

      {/* Player dot */}
      <circle cx={pmx} cy={pmy} r={mapW > 200 ? 10 : 4.5} fill="#6366f1" stroke="white" strokeWidth="1.2">
        <animate attributeName="r" values={mapW > 200 ? "10;13;10" : "4.5;5.5;4.5"} dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* Player direction indicator */}
      <circle cx={pmx} cy={pmy} r={mapW > 200 ? 6 : 3} fill="white" opacity={0.9} />

      {/* Compass */}
      <text x={mapW - pad - 2} y={pad + 6} textAnchor="end"
        fill="rgba(99,102,241,0.7)" fontSize={fontSize.compass} fontFamily="monospace">N</text>

      {/* Legend */}
      <circle cx={pad + 4} cy={mapH - 6} r={2} fill="#6366f1" />
      <text x={pad + 8} y={mapH - 4} fill="rgba(255,255,255,0.4)" fontSize={fontSize.legend} fontFamily="monospace">YOU</text>
    </svg>
  );
}

export function MiniMap() {
  const { playerPosition, interactionsCompleted, nearbyInteractable } = useGameStore();
  const [px, , pz] = playerPosition ?? [0, 0, 0];
  const { mx: pmx, my: pmy } = toMap(px, pz);
  const { mx: pmxFs, my: pmyFs } = toMap(px, pz, MAP_W_FS, MAP_H_FS, PAD_FS);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
    setZoomLevel(1);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, closeFullscreen]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoomLevel((prev) => Math.max(0.8, Math.min(3.0, prev - e.deltaY * 0.001)));
  }, []);

  return (
    <>
      <motion.div
        className="fixed top-28 left-4 z-30 select-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div
          className="rounded-xl overflow-hidden cursor-pointer"
          style={{
            background: "rgba(5,5,15,0.88)",
            border: "1px solid rgba(99,102,241,0.25)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
          onClick={openFullscreen}
        >
          {/* Header */}
          <div className="px-2 py-1 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-mono text-indigo-400 tracking-widest">FLOOR 40</span>
            <span className="text-xs font-mono text-slate-600">ASTERION</span>
          </div>

          <MapSVG
            mapW={MAP_W}
            mapH={MAP_H}
            pad={PAD}
            pmx={pmx}
            pmy={pmy}
            interactionsCompleted={interactionsCompleted}
            nearbyInteractable={nearbyInteractable}
          />

          {/* Expand hint */}
          <div className="px-2 py-0.5 border-t border-white/5 text-center">
            <span className="text-[8px] font-mono text-slate-600 tracking-widest">click to expand</span>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <div
            className="relative select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(5,5,15,0.95)",
                border: "1px solid rgba(99,102,241,0.35)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
              }}
            >
              {/* Modal header */}
              <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                <span className="text-sm font-mono text-indigo-400 tracking-widest">FLOOR 40 — ASTERION LABS</span>
                <div className="flex items-center gap-3">
                  {/* Zoom controls */}
                  <button
                    className="w-6 h-6 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 font-mono text-sm transition-colors"
                    onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                  >
                    −
                  </button>
                  <span className="text-xs font-mono text-slate-500 w-10 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    className="w-6 h-6 rounded flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 font-mono text-sm transition-colors"
                    onClick={() => setZoomLevel((z) => Math.min(3.0, z + 0.2))}
                  >
                    +
                  </button>
                  {/* Close */}
                  <button
                    className="w-6 h-6 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 font-mono text-base transition-colors ml-2"
                    onClick={closeFullscreen}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Zoomable map */}
              <div
                className="overflow-auto"
                style={{ maxWidth: "90vw", maxHeight: "80vh" }}
                onWheel={handleWheel}
              >
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    transition: "transform 0.1s ease",
                  }}
                >
                  <MapSVG
                    mapW={MAP_W_FS}
                    mapH={MAP_H_FS}
                    pad={PAD_FS}
                    pmx={pmxFs}
                    pmy={pmyFs}
                    interactionsCompleted={interactionsCompleted}
                    nearbyInteractable={nearbyInteractable}
                    fontSize={{ zone: 14, char: 11, compass: 16, legend: 11 }}
                  />
                </div>
              </div>

              {/* Footer hint */}
              <div className="px-4 py-1.5 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600">scroll to zoom · esc to close</span>
                <span className="text-xs font-mono text-slate-600">click outside to dismiss</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";
import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import { useGameStore } from "@/store/gameStore";
import { CHARACTERS } from "@/game/data";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

/* ──────────────────────────────────────────────────────────────
   MINIMAP — small 2-D thumbnail + fullscreen 3-D interactive map
   Small: SVG floor-plan (unchanged, compact, performance-free)
   Full:  React-Three-Fiber canvas with OrbitControls
   ────────────────────────────────────────────────────────────── */

const MAP_W = 180;
const MAP_H = 144;
const PAD = 10;

// World extents
const WX_MIN = -25, WX_MAX = 25;
const WZ_MIN = -20, WZ_MAX = 20;

function toMap(worldX: number, worldZ: number, mapW = MAP_W, mapH = MAP_H, pad = PAD) {
  const mx = pad + ((worldX - WX_MIN) / (WX_MAX - WX_MIN)) * (mapW - pad * 2);
  const my = pad + ((worldZ - WZ_MIN) / (WZ_MAX - WZ_MIN)) * (mapH - pad * 2);
  return { mx, my };
}

const ZONES = [
  { x: -20, z: -5,  w: 8,  d: 10, label: "LOBBY",       stroke: "rgba(139,92,246,0.55)",  fill: "rgba(139,92,246,0.04)"  },
  { x: -8,  z: -14, w: 14, d: 10, label: "ANALYTICS",   stroke: "rgba(99,102,241,0.6)",   fill: "rgba(99,102,241,0.05)"  },
  { x: 4,   z: -14, w: 10, d: 10, label: "BOARDROOM",   stroke: "rgba(245,158,11,0.55)",  fill: "rgba(245,158,11,0.04)"  },
  { x: 14,  z: -14, w: 10, d: 10, label: "EXEC",        stroke: "rgba(236,72,153,0.55)",  fill: "rgba(236,72,153,0.04)"  },
  { x: 6,   z: -2,  w: 10, d: 10, label: "ENGINEERING", stroke: "rgba(14,165,233,0.6)",   fill: "rgba(14,165,233,0.04)"  },
  { x: -10, z: 2,   w: 10, d: 10, label: "OPS",         stroke: "rgba(6,182,212,0.55)",   fill: "rgba(6,182,212,0.04)"   },
  { x: -8,  z: 10,  w: 10, d: 8,  label: "COMPLIANCE",  stroke: "rgba(16,185,129,0.6)",   fill: "rgba(16,185,129,0.04)"  },
  { x: 5,   z: 10,  w: 8,  d: 8,  label: "COFFEE",      stroke: "rgba(245,158,11,0.45)",  fill: "rgba(245,158,11,0.03)"  },
];

const CHARACTER_COLORS: Record<string, string> = {
  maya: "#6366f1",
  theo: "#0ea5e9",
  oliver: "#f59e0b",
  priya: "#10b981",
  amara: "#ec4899",
};

/* ── 2-D SVG thumbnail (unchanged) ──────────────────────────── */
function DotGrid({ mapW, mapH, pad }: { mapW: number; mapH: number; pad: number }) {
  const spacing = mapW > 200 ? 14 : 10;
  const dots: { x: number; y: number }[] = [];
  for (let x = pad + spacing / 2; x < mapW - pad; x += spacing)
    for (let y = pad + spacing / 2; y < mapH - pad; y += spacing)
      dots.push({ x, y });
  return (
    <g opacity={0.35}>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={mapW > 200 ? 0.7 : 0.5} fill="rgba(80,80,130,0.7)" />
      ))}
    </g>
  );
}

function MapSVGThumb({ pmx, pmy, interactionsCompleted, nearbyInteractable }: {
  pmx: number; pmy: number;
  interactionsCompleted: Record<string, boolean>;
  nearbyInteractable: string | null;
}) {
  return (
    <svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: "block" }}>
      <defs>
        <filter id="playerGlowT" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x={PAD} y={PAD} width={MAP_W - PAD * 2} height={MAP_H - PAD * 2}
        fill="rgba(248,248,255,1)" stroke="rgba(99,102,241,0.25)" strokeWidth="0.6" rx="2" />
      <DotGrid mapW={MAP_W} mapH={MAP_H} pad={PAD} />
      {ZONES.map((zone, i) => {
        const { mx: zx, my: zy } = toMap(zone.x, zone.z);
        const zw = (zone.w / (WX_MAX - WX_MIN)) * (MAP_W - PAD * 2);
        const zh = (zone.d / (WZ_MAX - WZ_MIN)) * (MAP_H - PAD * 2);
        return (
          <g key={i}>
            <rect x={zx} y={zy} width={zw} height={zh} fill={zone.fill}
              stroke={zone.stroke} strokeWidth="0.6" rx="1" />
            <text x={zx + zw / 2} y={zy + zh / 2} textAnchor="middle" dominantBaseline="middle"
              fill={zone.stroke} fontSize={5.5} fontFamily="'Courier New',monospace"
              letterSpacing="0.8" opacity={0.85}>{zone.label}</text>
          </g>
        );
      })}
      {CHARACTERS.map((char) => {
        const { mx: cx, my: cy } = toMap(char.position[0], char.position[2]);
        const color = CHARACTER_COLORS[char.id] ?? "#94a3b8";
        const spoken = interactionsCompleted[char.id] || interactionsCompleted[char.id + "_initial"];
        return (
          <g key={char.id}>
            {nearbyInteractable === char.id && (
              <circle cx={cx} cy={cy} r={5.8} fill="none" stroke={color}
                strokeWidth="0.5" opacity={0.5} strokeDasharray="1.5 1.5" />
            )}
            <circle cx={cx} cy={cy} r={2.8} fill={color}
              stroke={spoken ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)"} strokeWidth="0.5" />
          </g>
        );
      })}
      {/* Player */}
      <circle cx={pmx} cy={pmy} r={7} fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="0.8">
        <animate attributeName="r" values="7;12;7" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={pmx} cy={pmy} r={4} fill="#818cf8"
        stroke="rgba(255,255,255,0.9)" strokeWidth="1" filter="url(#playerGlowT)" />
      <circle cx={pmx} cy={pmy} r={1.8} fill="white" opacity={0.95} />
      <text x={MAP_W - PAD - 1} y={PAD + 6} textAnchor="end"
        fill="rgba(99,102,241,0.6)" fontSize={6} fontFamily="'Courier New',monospace">N</text>
      <circle cx={PAD + 4} cy={MAP_H - 6} r={2} fill="#818cf8" />
      <text x={PAD + 8} y={MAP_H - 4} fill="rgba(148,163,184,0.5)"
        fontSize={4.5} fontFamily="'Courier New',monospace">YOU</text>
    </svg>
  );
}

/* ── 3-D map scene ────────────────────────────────────────────── */

// Zone data for 3D rendering (world coords)
const ZONES_3D = [
  { cx: -16, cz: -10, w: 8,  d: 10, color: "#8b5cf6", label: "LOBBY"       },
  { cx: -1,  cz: -9,  w: 14, d: 10, color: "#6366f1", label: "ANALYTICS"   },
  { cx: 9,   cz: -9,  w: 10, d: 10, color: "#f59e0b", label: "BOARDROOM"   },
  { cx: 19,  cz: -9,  w: 10, d: 10, color: "#ec4899", label: "EXEC"        },
  { cx: 11,  cz: 3,   w: 10, d: 10, color: "#0ea5e9", label: "ENGINEERING" },
  { cx: -5,  cz: 7,   w: 10, d: 10, color: "#06b6d4", label: "OPS"         },
  { cx: -3,  cz: 14,  w: 10, d: 8,  color: "#10b981", label: "COMPLIANCE"  },
  { cx: 9,   cz: 14,  w: 8,  d: 8,  color: "#f59e0b", label: "COFFEE"      },
];

// Desk cluster positions (simplified, not every desk — just enough to show the layout)
const DESK_CLUSTERS = [
  { cx: 0,    cz: -14, w: 6,  d: 0.9, label: "" },
  { cx: 0,    cz: -17, w: 6,  d: 0.9, label: "" },
  { cx: 1,    cz: -9,  w: 7,  d: 0.9, label: "" },
  { cx: -6,   cz: -10, w: 4,  d: 3.5, label: "" },
  { cx: -10,  cz: -10, w: 4,  d: 3.5, label: "" },
  { cx: 9,    cz: 3.5, w: 6,  d: 3.5, label: "" },
  { cx: -8.5, cz: 3.5, w: 4,  d: 3.5, label: "" },
  { cx: 1,    cz: 0,   w: 6,  d: 6,   label: "" },
  { cx: 5,    cz: 8,   w: 4,  d: 3.5, label: "" },
  { cx: 17.5, cz: -5,  w: 6,  d: 4,   label: "" },
];

// Rooms (glass boxes shown as colored frames)
const ROOMS_3D = [
  { cx: 13,   cz: -14.5, w: 10, d: 8.5, color: "#f59e0b", label: "BOARDROOM"     },
  { cx: 11,   cz: 10.5,  w: 6,  d: 7,   color: "#0ea5e9", label: "ENG SYNC"      },
  { cx: -2.5, cz: 14,    w: 9,  d: 8,   color: "#10b981", label: "COMPLIANCE"    },
];

function OfficeMap3D({
  playerPosition,
  interactionsCompleted,
  nearbyInteractable,
}: {
  playerPosition: [number, number, number];
  interactionsCompleted: Record<string, boolean>;
  nearbyInteractable: string | null;
}) {
  const playerRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (playerRef.current) {
      const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      playerRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <>
      {/* Lighting — bright top-down for clean colours */}
      <ambientLight intensity={2.2} color="#dde8ff" />
      <directionalLight position={[20, 40, 20]} intensity={2.5} color="#fffbe0" />
      <directionalLight position={[-15, 30, -10]} intensity={1.0} color="#c8d8f0" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#f0f0f6" roughness={0.9} metalness={0} />
      </mesh>

      {/* Floor grid lines */}
      <GridLines />

      {/* Office perimeter walls */}
      <PerimeterWalls />

      {/* Zone colored floor patches */}
      {ZONES_3D.map((z, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[z.cx, 0.01, z.cz]}>
          <planeGeometry args={[z.w, z.d]} />
          <meshStandardMaterial color={z.color} transparent opacity={0.10} roughness={1} />
        </mesh>
      ))}

      {/* Zone border outlines (as thin box frames at floor level) */}
      {ZONES_3D.map((z, i) => (
        <ZoneOutline key={`zo${i}`} cx={z.cx} cz={z.cz} w={z.w} d={z.d} color={z.color} />
      ))}

      {/* Zone labels */}
      {ZONES_3D.map((z, i) => (
        <Text
          key={`zl${i}`}
          position={[z.cx, 0.25, z.cz]}
          fontSize={0.7}
          color={z.color}
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
          letterSpacing={0.08}
          fillOpacity={0.65}
        >
          {z.label}
        </Text>
      ))}

      {/* Meeting rooms — raised thin glass box outlines */}
      {ROOMS_3D.map((r, i) => (
        <RoomBox key={i} cx={r.cx} cz={r.cz} w={r.w} d={r.d} color={r.color} label={r.label} />
      ))}

      {/* Desk clusters */}
      {DESK_CLUSTERS.map((d, i) => (
        <mesh key={i} position={[d.cx, 0.12, d.cz]}>
          <boxGeometry args={[d.w, 0.08, d.d]} />
          <meshStandardMaterial color="#7878a0" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* Lobby area floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-21.5, 0.02, 0]}>
        <planeGeometry args={[7, 18]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.2} metalness={0.05} transparent opacity={0.15} />
      </mesh>

      {/* Internal lobby partition wall */}
      <mesh position={[-18, 1.5, 0]}>
        <boxGeometry args={[0.12, 3, 18]} />
        <meshStandardMaterial color="#5060b0" transparent opacity={0.18} roughness={0} metalness={0.1} />
      </mesh>

      {/* NPC dots */}
      {CHARACTERS.map((char) => {
        const color = CHARACTER_COLORS[char.id] ?? "#94a3b8";
        const spoken = interactionsCompleted[char.id] || interactionsCompleted[char.id + "_initial"];
        const isNearby = nearbyInteractable === char.id;
        return (
          <group key={char.id} position={[char.position[0], 0, char.position[2]]}>
            {/* Glow ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
              <ringGeometry args={[0.42, 0.6, 16]} />
              <meshStandardMaterial color={color} emissive={color}
                emissiveIntensity={isNearby ? 1.2 : 0.4} transparent opacity={isNearby ? 0.7 : 0.3} />
            </mesh>
            {/* Body sphere */}
            <mesh position={[0, 0.35, 0]}>
              <sphereGeometry args={[0.28, 10, 8]} />
              <meshStandardMaterial color={color} emissive={color}
                emissiveIntensity={spoken ? 0.6 : 0.25} roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Spoken checkmark ring */}
            {spoken && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.3, 0.38, 16]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.45} />
              </mesh>
            )}
            {/* Name label */}
            <Text position={[0, 0.78, 0]} fontSize={0.32} color={color}
              anchorX="center" anchorY="bottom" rotation={[-Math.PI / 2, 0, 0]}
              fillOpacity={0.9}>
              {char.id.charAt(0).toUpperCase() + char.id.slice(1)}
            </Text>
          </group>
        );
      })}

      {/* Player position */}
      <group position={[playerPosition[0], 0, playerPosition[2]]}>
        {/* Outer pulse ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.5, 0.72, 20]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8"
            emissiveIntensity={0.8} transparent opacity={0.45} />
        </mesh>
        {/* Player sphere */}
        <mesh ref={playerRef} position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.32, 12, 10]} />
          <meshStandardMaterial color="#818cf8" emissive="#6366f1"
            emissiveIntensity={1.2} roughness={0.1} metalness={0.3} />
        </mesh>
        {/* Centre dot */}
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>
        <Text position={[0, 0.85, 0]} fontSize={0.35} color="#818cf8"
          anchorX="center" anchorY="bottom" rotation={[-Math.PI / 2, 0, 0]}
          fillOpacity={0.9}>
          YOU
        </Text>
      </group>

      {/* Compass — tiny N label at north end */}
      <Text position={[0, 0.15, -19.5]} fontSize={0.6} color="rgba(99,102,241,0.55)"
        anchorX="center" rotation={[-Math.PI / 2, 0, 0]} letterSpacing={0.1}>
        ▲ N
      </Text>
    </>
  );
}

function GridLines() {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const v: number[] = [];
    for (let z = -20; z <= 20; z += 2) v.push(-25, 0.005, z, 25, 0.005, z);
    for (let x = -25; x <= 25; x += 2) v.push(x, 0.005, -20, x, 0.005, 20);
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    return g;
  }, []);
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color="#b0b4cc" transparent opacity={0.45} />
    </lineSegments>
  );
}

function PerimeterWalls() {
  const WALL_H = 1.0; // keep walls short on the minimap so you can see inside
  const WALL_T = 0.3;
  return (
    <group>
      {/* South wall */}
      <mesh position={[0, WALL_H / 2, -20]}>
        <boxGeometry args={[50, WALL_H, WALL_T]} />
        <meshStandardMaterial color="#4060b0" transparent opacity={0.3} roughness={0} metalness={0.1} />
      </mesh>
      {/* North wall */}
      <mesh position={[0, WALL_H / 2, 20]}>
        <boxGeometry args={[50, WALL_H, WALL_T]} />
        <meshStandardMaterial color="#4060b0" transparent opacity={0.3} roughness={0} metalness={0.1} />
      </mesh>
      {/* West wall */}
      <mesh position={[-25, WALL_H / 2, 0]}>
        <boxGeometry args={[WALL_T, WALL_H, 40]} />
        <meshStandardMaterial color="#4060b0" transparent opacity={0.3} roughness={0} metalness={0.1} />
      </mesh>
      {/* East wall */}
      <mesh position={[25, WALL_H / 2, 0]}>
        <boxGeometry args={[WALL_T, WALL_H, 40]} />
        <meshStandardMaterial color="#4060b0" transparent opacity={0.3} roughness={0} metalness={0.1} />
      </mesh>
      {/* Exec glass partition at x=14 */}
      <mesh position={[14, WALL_H / 2, -9]}>
        <boxGeometry args={[0.15, WALL_H, 10]} />
        <meshStandardMaterial color="#8090d0" transparent opacity={0.18} roughness={0} />
      </mesh>
    </group>
  );
}

function ZoneOutline({ cx, cz, w, d, color }: { cx: number; cz: number; w: number; d: number; color: string }) {
  const ht = 0.02;
  const thick = 0.1;
  return (
    <group position={[cx, ht, cz]}>
      <mesh position={[0, 0, -d / 2]}><boxGeometry args={[w, ht, thick]} /><meshStandardMaterial color={color} transparent opacity={0.55} /></mesh>
      <mesh position={[0, 0,  d / 2]}><boxGeometry args={[w, ht, thick]} /><meshStandardMaterial color={color} transparent opacity={0.55} /></mesh>
      <mesh position={[-w / 2, 0, 0]}><boxGeometry args={[thick, ht, d]} /><meshStandardMaterial color={color} transparent opacity={0.55} /></mesh>
      <mesh position={[ w / 2, 0, 0]}><boxGeometry args={[thick, ht, d]} /><meshStandardMaterial color={color} transparent opacity={0.55} /></mesh>
    </group>
  );
}

function RoomBox({ cx, cz, w, d, color, label }: {
  cx: number; cz: number; w: number; d: number; color: string; label: string;
}) {
  const WALL_H = 1.2;
  return (
    <group position={[cx, 0, cz]}>
      {/* South */}
      <mesh position={[0, WALL_H / 2, -d / 2]}><boxGeometry args={[w, WALL_H, 0.1]} />
        <meshStandardMaterial color={color} transparent opacity={0.22} roughness={0} metalness={0.1} /></mesh>
      {/* North */}
      <mesh position={[0, WALL_H / 2,  d / 2]}><boxGeometry args={[w, WALL_H, 0.1]} />
        <meshStandardMaterial color={color} transparent opacity={0.22} roughness={0} metalness={0.1} /></mesh>
      {/* West */}
      <mesh position={[-w / 2, WALL_H / 2, 0]}><boxGeometry args={[0.1, WALL_H, d]} />
        <meshStandardMaterial color={color} transparent opacity={0.22} roughness={0} metalness={0.1} /></mesh>
      {/* East */}
      <mesh position={[ w / 2, WALL_H / 2, 0]}><boxGeometry args={[0.1, WALL_H, d]} />
        <meshStandardMaterial color={color} transparent opacity={0.22} roughness={0} metalness={0.1} /></mesh>
      {/* Floor accent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[w - 0.2, d - 0.2]} />
        <meshStandardMaterial color={color} transparent opacity={0.07} roughness={1} />
      </mesh>
      <Text position={[0, 0.3, 0]} fontSize={0.55} color={color}
        anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}
        letterSpacing={0.06} fillOpacity={0.7}>
        {label}
      </Text>
    </group>
  );
}

/* ── Main MiniMap component ──────────────────────────────────── */
export function MiniMap() {
  const { playerPosition, interactionsCompleted, nearbyInteractable } = useGameStore();
  const [px, , pz] = playerPosition ?? [0, 0, 0];
  const { mx: pmx, my: pmy } = toMap(px, pz);

  const [isFullscreen, setIsFullscreen] = useState(false);
  // Once the 3D map has been opened at least once we keep the Canvas mounted in
  // the background (hidden via opacity + pointer-events) so the second open is
  // instant — no WebGL context creation, no font loading delay.
  const [hasEverOpened, setHasEverOpened] = useState(false);

  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);

  const openFullscreen = useCallback(() => {
    setHasEverOpened(true);
    setIsFullscreen(true);
    if (document.pointerLockElement) document.exitPointerLock();
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    isDraggingRef.current = false;
    const canvas = document.querySelector("canvas");
    if (canvas) {
      setTimeout(() => {
        if (!document.pointerLockElement && !useGameStore.getState().activeDialogue) {
          canvas.requestPointerLock().catch(() => {});
        }
      }, 120);
    }
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeFullscreen(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, closeFullscreen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") {
        setIsFullscreen((prev) => {
          const next = !prev;
          if (next) {
            // Opening — mark as ever opened so Canvas stays mounted on close
            setHasEverOpened(true);
            if (document.pointerLockElement) document.exitPointerLock();
          } else {
            const canvas = document.querySelector("canvas");
            if (canvas) {
              setTimeout(() => {
                if (!document.pointerLockElement && !useGameStore.getState().activeDialogue)
                  canvas.requestPointerLock().catch(() => {});
              }, 120);
            }
          }
          return next;
        });
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* ── Small 2-D thumbnail ────────────────────── */}
      <motion.div
        className="fixed top-[8rem] left-4 z-30 select-none"
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="rounded-xl overflow-hidden cursor-pointer group"
          style={{
            background: "rgba(5,5,20,0.72)",
            border: "1px solid rgba(99,102,241,0.18)",
            backdropFilter: "blur(18px) saturate(180%)",
            WebkitBackdropFilter: "blur(18px) saturate(180%)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.55), 0 0 40px rgba(99,102,241,0.08)",
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 0 1px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.55), 0 0 60px rgba(99,102,241,0.18), 0 0 0 1px rgba(99,102,241,0.28)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 0 1px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.55), 0 0 40px rgba(99,102,241,0.08)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.18)";
          }}
          onClick={openFullscreen}
        >
          <div className="px-2.5 py-1 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: "8px",
              letterSpacing: "0.18em", color: "rgba(148,163,184,0.8)", textTransform: "uppercase" }}>
              FLOOR 40
            </span>
            <span className="flex items-center gap-1">
              <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%",
                background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.8)",
                animation: "minimap-live 2s ease-in-out infinite" }} />
            </span>
          </div>
          <MapSVGThumb pmx={pmx} pmy={pmy}
            interactionsCompleted={interactionsCompleted} nearbyInteractable={nearbyInteractable} />
          <div className="px-2.5 py-1 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: "7px",
              letterSpacing: "0.12em", color: "rgba(100,116,139,0.7)" }}>1 SQ = 2M</span>
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: "7px",
              letterSpacing: "0.12em", color: "rgba(100,116,139,0.5)" }}>[M] 3D</span>
          </div>
        </div>
      </motion.div>

      {/* ── Fullscreen 3-D map modal ─────────────────────────────────────────────
           Once opened for the first time the Canvas stays mounted even when
           closed (hidden via opacity + pointer-events).  This keeps the WebGL
           context and drei/Text fonts alive so re-opens are instant.           */}
      {hasEverOpened && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.82)",
            backdropFilter: isFullscreen ? "blur(6px)" : "none",
            transition: "opacity 0.2s ease",
            opacity: isFullscreen ? 1 : 0,
            pointerEvents: isFullscreen ? "auto" : "none",
          }}
          onClick={() => { if (!didDragRef.current) closeFullscreen(); didDragRef.current = false; }}
        >
          <div
            className="relative select-none"
            style={{
              width: "min(88vw, 1100px)", height: "min(78vh, 680px)",
              transition: "transform 0.22s ease, opacity 0.22s ease",
              transform: isFullscreen ? "scale(1) translateY(0px)" : "scale(0.94) translateY(12px)",
              opacity: isFullscreen ? 1 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card wrapper */}
            <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "rgba(5,5,20,0.96)",
                border: "1px solid rgba(99,102,241,0.28)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 24px 80px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.12)",
              }}>
              {/* Header */}
              <div className="flex-shrink-0 px-5 py-2.5 flex items-center justify-between gap-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: "'Courier New',monospace", fontSize: "11px",
                    letterSpacing: "0.22em", color: "rgba(148,163,184,0.9)", textTransform: "uppercase" }}>
                    FLOOR 40
                  </span>
                  <span style={{ width: "1px", height: "12px", background: "rgba(255,255,255,0.1)", display: "inline-block" }} />
                  <span style={{ fontFamily: "'Courier New',monospace", fontSize: "9px",
                    letterSpacing: "0.16em", color: "rgba(99,102,241,0.7)", textTransform: "uppercase" }}>
                    AI OA Ltd — 3D OFFICE PLAN
                  </span>
                  <span style={{ fontFamily: "'Courier New',monospace", fontSize: "8px",
                    letterSpacing: "0.12em", color: "rgba(100,116,139,0.5)", textTransform: "uppercase" }}>
                    · DRAG ORBIT · SCROLL ZOOM · RIGHT-DRAG PAN
                  </span>
                </div>
                {/* Close */}
                <button
                  style={{ width: "26px", height: "26px", display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: "4px", background: "transparent",
                    border: "none", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.12)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  onClick={closeFullscreen}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(148,163,184,0.6)" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* 3D canvas */}
              <div className="flex-1 relative"
                onMouseDown={() => { isDraggingRef.current = false; didDragRef.current = false; }}
                onMouseMove={() => { isDraggingRef.current = true; didDragRef.current = true; }}>
                <Canvas
                  camera={{ position: [0, 38, 22], fov: 40, near: 0.1, far: 400 }}
                  gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
                  style={{ background: "#eaecf5" }}
                >
                  <Suspense fallback={null}>
                    <OfficeMap3D
                      playerPosition={playerPosition}
                      interactionsCompleted={interactionsCompleted}
                      nearbyInteractable={nearbyInteractable}
                    />
                    <OrbitControls
                      makeDefault
                      target={[0, 0, 0]}
                      minPolarAngle={Math.PI / 8}
                      maxPolarAngle={Math.PI / 2.1}
                      minDistance={12}
                      maxDistance={90}
                      enablePan={true}
                      panSpeed={1.2}
                      rotateSpeed={0.7}
                      zoomSpeed={1.2}
                      enableDamping
                      dampingFactor={0.08}
                    />
                  </Suspense>
                </Canvas>

                {/* Overlay legend */}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 pointer-events-none">
                  {[
                    { color: "#818cf8", label: "You" },
                    { color: "#6366f1", label: "Maya" },
                    { color: "#0ea5e9", label: "Theo" },
                    { color: "#f59e0b", label: "Oliver" },
                    { color: "#10b981", label: "Priya" },
                    { color: "#ec4899", label: "Amara" },
                  ].map(({ color, label }) => (
                    <span key={label} className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono"
                      style={{ background: "rgba(5,5,20,0.85)", border: `1px solid ${color}44`, color }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-5 py-2 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontFamily: "'Courier New',monospace", fontSize: "9px",
                  letterSpacing: "0.1em", color: "rgba(100,116,139,0.55)" }}>
                  LEFT-DRAG ORBIT · SCROLL ZOOM · RIGHT-DRAG PAN · ESC CLOSE
                </span>
                <span style={{ fontFamily: "'Courier New',monospace", fontSize: "9px",
                  letterSpacing: "0.1em", color: "rgba(100,116,139,0.4)" }}>
                  1 UNIT = 1M
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe injection for live dot */}
      <style>{`
        @keyframes minimap-live {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(34,197,94,0.8); }
          50%       { opacity: 0.5; box-shadow: 0 0 10px rgba(34,197,94,1); }
        }
      `}</style>
    </>
  );
}

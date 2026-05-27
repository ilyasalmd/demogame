"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────
// Primitive building blocks
// ─────────────────────────────────────────────

function Desk({ position, rotation = 0, w = 1.8 }: {
  position: [number, number, number]; rotation?: number; w?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.76, 0]}>
        <boxGeometry args={[w, 0.07, 0.9]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.76, -0.44]}>
        <boxGeometry args={[w, 0.08, 0.02]} />
        <meshStandardMaterial color="#252545" roughness={0.3} metalness={0.5} />
      </mesh>
      {[[-w / 2 + 0.1, -0.38], [w / 2 - 0.1, -0.38], [-w / 2 + 0.1, 0.38], [w / 2 - 0.1, 0.38]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]}>
          <boxGeometry args={[0.07, 0.72, 0.07]} />
          <meshStandardMaterial color="#2d2d4e" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
      {/* Cable tray */}
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[w - 0.4, 0.04, 0.1]} />
        <meshStandardMaterial color="#1a1a28" roughness={0.9} />
      </mesh>
    </group>
  );
}

function StandingDesk({ position, rotation = 0 }: {
  position: [number, number, number]; rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.06, 0]}>
        <boxGeometry args={[1.6, 0.07, 0.8]} />
        <meshStandardMaterial color="#1e1e38" roughness={0.35} metalness={0.3} />
      </mesh>
      {[[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.52, z]}>
          <boxGeometry args={[0.06, 1.0, 0.06]} />
          <meshStandardMaterial color="#252545" roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Monitor({
  position, screenColor = "#6366f1", active = true, label, rotation = 0, size = 1,
}: {
  position: [number, number, number];
  screenColor?: string;
  active?: boolean;
  label?: string;
  rotation?: number;
  size?: number;
}) {
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (screenRef.current && active) {
      screenRef.current.emissiveIntensity =
        0.55 + Math.sin(state.clock.elapsedTime * 0.8 + position[0] * 0.4) * 0.12;
    }
  });
  const sw = 0.72 * size, sh = 0.44 * size;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, sh / 2, 0]}>
        <boxGeometry args={[sw + 0.06, sh + 0.05, 0.04]} />
        <meshStandardMaterial color="#101020" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, sh / 2, 0.026]}>
        <boxGeometry args={[sw, sh, 0.01]} />
        <meshStandardMaterial
          ref={screenRef}
          color="#030310"
          emissive={active ? screenColor : "#111"}
          emissiveIntensity={active ? 0.65 : 0.08}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.02, 0.04, 0.14, 8]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.14]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.5} metalness={0.5} />
      </mesh>
      {label && active && (
        <Text position={[0, sh / 2, 0.04]} fontSize={0.038 * size} color={screenColor}
          anchorX="center" anchorY="middle" maxWidth={sw * 0.85}>
          {label}
        </Text>
      )}
    </group>
  );
}

function DualMonitorSetup({ position, colors, labels, rotation = 0 }: {
  position: [number, number, number];
  colors?: [string, string];
  labels?: [string, string];
  rotation?: number;
}) {
  const c = colors ?? ["#6366f1", "#8b5cf6"];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Monitor position={[-0.42, 0, -0.05]} screenColor={c[0]} active label={labels?.[0]} rotation={0.14} />
      <Monitor position={[0.42, 0, -0.05]} screenColor={c[1]} active label={labels?.[1]} rotation={-0.14} />
    </group>
  );
}

function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.44, 0.07, 0.44]} />
        <meshStandardMaterial color="#1e1e3a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.74, -0.2]}>
        <boxGeometry args={[0.42, 0.5, 0.07]} />
        <meshStandardMaterial color="#1e1e3a" roughness={0.8} />
      </mesh>
      <mesh position={[-0.22, 0.56, 0]}>
        <boxGeometry args={[0.04, 0.05, 0.35]} />
        <meshStandardMaterial color="#252545" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0.22, 0.56, 0]}>
        <boxGeometry args={[0.04, 0.05, 0.35]} />
        <meshStandardMaterial color="#252545" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color="#303050" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.03, 5]} />
        <meshStandardMaterial color="#252540" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

function MeetingChair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.5, 0.07, 0.5]} />
        <meshStandardMaterial color="#141428" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.82, -0.22]}>
        <boxGeometry args={[0.48, 0.62, 0.07]} />
        <meshStandardMaterial color="#141428" roughness={0.7} />
      </mesh>
      {[[-0.08, -0.22], [0.08, -0.22], [-0.08, 0.22], [0.08, 0.22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.23, z]}>
          <boxGeometry args={[0.04, 0.42, 0.04]} />
          <meshStandardMaterial color="#202040" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.13, 0.11, 0.3, 8]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
      </mesh>
      {[0, 1.2, 2.4, 3.6, 4.8, 5.8].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * (0.1 + i * 0.04), 0.4 + i * 0.1, Math.sin(angle) * (0.1 + i * 0.04)]}
          rotation={[0.4, angle, 0.2]}>
          <coneGeometry args={[0.12, 0.3, 4]} />
          <meshStandardMaterial color="#0d3d1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function LargePlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.15, 0.4, 8]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.9} />
      </mesh>
      {[0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle) * (0.15 + i * 0.06), 0.5 + i * 0.15, Math.sin(angle) * (0.15 + i * 0.06)]}
          rotation={[0.5, angle, 0.3]}>
          <coneGeometry args={[0.18, 0.45, 5]} />
          <meshStandardMaterial color="#0a3016" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Whiteboard({ position, rotation = 0, text }: {
  position: [number, number, number]; rotation?: number; text?: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[0.06, 1.6, 2.8]} />
        <meshStandardMaterial color="#ece8e0" roughness={0.3} />
      </mesh>
      <mesh position={[0.04, 0, 0]}>
        <boxGeometry args={[0.02, 1.65, 2.85]} />
        <meshStandardMaterial color="#2a2a5a" metalness={0.5} roughness={0.4} />
      </mesh>
      <Text position={[0.07, 0.12, 0]} fontSize={0.13} color="#3355bb"
        anchorX="center" rotation={[0, Math.PI / 2, 0]} maxWidth={2.4}>
        {text ?? "DATA PIPELINE"}
      </Text>
    </group>
  );
}

function ServerRack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.6, 2, 0.5]} />
        <meshStandardMaterial color="#0a0a18" roughness={0.3} metalness={0.7} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[0, 0.18 + i * 0.21, 0.26]}>
          <boxGeometry args={[0.55, 0.17, 0.02]} />
          <meshStandardMaterial color="#121222" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={`l${i}`} position={[-0.22, 0.18 + i * 0.21, 0.27]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? "#10b981" : "#6366f1"}
            emissive={i % 3 === 0 ? "#10b981" : "#6366f1"}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function TV({ position, rotation = 0, label }: {
  position: [number, number, number]; rotation?: number; label?: string;
}) {
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (screenRef.current) {
      screenRef.current.emissiveIntensity = 0.45 + Math.sin(state.clock.elapsedTime * 0.35) * 0.1;
    }
  });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[0.06, 0.9, 1.7]} />
        <meshStandardMaterial color="#0a0a18" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0.04, 0, 0]}>
        <boxGeometry args={[0.02, 0.83, 1.6]} />
        <meshStandardMaterial ref={screenRef} color="#020210"
          emissive="#1a0860" emissiveIntensity={0.5} />
      </mesh>
      {label && (
        <Text position={[0.06, 0.1, 0]} fontSize={0.09} color="#818cf8"
          anchorX="center" rotation={[0, Math.PI / 2, 0]} maxWidth={1.5}>
          {label}
        </Text>
      )}
    </group>
  );
}

function WallTV({ position, rotation = 0, label, color = "#6366f1" }: {
  position: [number, number, number]; rotation?: number; label?: string; color?: string;
}) {
  const screenRef = useRef<THREE.MeshStandardMaterial>(null);
  const barRefs = useRef<number[]>(
    Array.from({ length: 8 }, () => 0.3 + Math.random() * 1.4)
  );
  useFrame((state) => {
    if (screenRef.current) {
      screenRef.current.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    }
  });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 1.4, 2.6]} />
        <meshStandardMaterial color="#080814" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Screen */}
      <mesh position={[0.05, 0, 0]}>
        <boxGeometry args={[0.02, 1.3, 2.5]} />
        <meshStandardMaterial ref={screenRef} color="#020210"
          emissive={color} emissiveIntensity={0.4} roughness={0.1} />
      </mesh>
      {/* Chart bars on screen */}
      {barRefs.current.map((h, i) => (
        <mesh key={i} position={[0.07, h / 2 - 0.55, -1.0 + i * 0.28]}>
          <boxGeometry args={[0.02, h, 0.18]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.7} />
        </mesh>
      ))}
      {label && (
        <Text position={[0.09, 0.55, 0]} fontSize={0.08} color={color}
          anchorX="center" rotation={[0, Math.PI / 2, 0]}>
          {label}
        </Text>
      )}
    </group>
  );
}

function Partition({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.08, 1.6, 1.4]} />
        <meshStandardMaterial color="#141424" roughness={0.6} />
      </mesh>
      <mesh position={[0.05, 0.8, 0]}>
        <boxGeometry args={[0.02, 1.55, 1.35]} />
        <meshStandardMaterial color="#252545" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Laptop({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.32, 0.02, 0.22]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.13, -0.09]} rotation={[-0.6, 0, 0]}>
        <boxGeometry args={[0.3, 0.21, 0.02]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.14, -0.094]} rotation={[-0.6, 0, 0]}>
        <boxGeometry args={[0.27, 0.18, 0.01]} />
        <meshStandardMaterial color="#020210" emissive="#4466ff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function Keyboard({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[0.38, 0.02, 0.14]} />
        <meshStandardMaterial color="#121222" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────
// Complex assemblies
// ─────────────────────────────────────────────

function DeskPod({ cx, cz, rotation = 0, colors, labels, rows = 2, cols = 3 }: {
  cx: number; cz: number; rotation?: number;
  colors?: string[]; labels?: string[];
  rows?: number; cols?: number;
}) {
  const spacingX = 2.2;
  const spacingZ = 2.6;
  const indices = Array.from({ length: rows * cols }, (_, i) => i);
  return (
    <group rotation={[0, rotation, 0]}>
      {indices.map((idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = cx + (col - (cols - 1) / 2) * spacingX;
        const z = cz + (row - (rows - 1) / 2) * spacingZ;
        const flip = row % 2 === 1;
        const rot = flip ? Math.PI : 0;
        const sc = colors?.[idx % (colors?.length ?? 1)] ?? "#6366f1";
        return (
          <group key={idx}>
            <Desk position={[x, 0, z]} rotation={rot} />
            <Monitor
              position={[x, 0.83, flip ? z + 0.55 : z - 0.55]}
              screenColor={sc} active label={labels?.[idx]}
              rotation={flip ? Math.PI : 0} />
            <Keyboard
              position={[x, 0.77, flip ? z + 0.25 : z - 0.25]}
              rotation={rot} />
            <Chair
              position={[x, 0, flip ? z + 1.1 : z - 1.1]}
              rotation={flip ? Math.PI : 0} />
          </group>
        );
      })}
    </group>
  );
}

function BoardroomTable({ cx, cz, w = 5, d = 2.2 }: {
  cx: number; cz: number; w?: number; d?: number;
}) {
  const chairPositions: [number, number, number, number][] = [];
  const seats = Math.floor(w / 1.1);
  for (let i = 0; i < seats; i++) {
    const x = cx - w / 2 + 0.6 + i * (w / seats);
    chairPositions.push([x, cz - d / 2 - 0.55, Math.PI, 0]);
    chairPositions.push([x, cz + d / 2 + 0.55, 0, 1]);
  }
  return (
    <>
      {/* Table top */}
      <mesh position={[cx, 0.76, cz]}>
        <boxGeometry args={[w, 0.07, d]} />
        <meshStandardMaterial color="#141424" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Table legs */}
      {[[-w / 2 + 0.2, -d / 2 + 0.2], [w / 2 - 0.2, -d / 2 + 0.2],
        [-w / 2 + 0.2, d / 2 - 0.2], [w / 2 - 0.2, d / 2 - 0.2]].map(([lx, lz], i) => (
        <mesh key={i} position={[cx + lx, 0.36, cz + lz]}>
          <boxGeometry args={[0.08, 0.72, 0.08]} />
          <meshStandardMaterial color="#0a0a20" roughness={0.5} metalness={0.6} />
        </mesh>
      ))}
      {chairPositions.map(([x, z, rot, side], i) => (
        <MeetingChair key={i} position={[x, 0, z]} rotation={rot} />
      ))}
    </>
  );
}

function CoffeeStation({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Counter */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[4.0, 0.1, 1.2]} />
        <meshStandardMaterial color="#181828" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[4.0, 0.9, 1.2]} />
        <meshStandardMaterial color="#111120" roughness={0.7} />
      </mesh>
      {/* Coffee machine */}
      <mesh position={[-1.3, 1.35, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.42]} />
        <meshStandardMaterial color="#1e1e3e" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-1.3, 1.15, 0.22]}>
        <boxGeometry args={[0.35, 0.08, 0.04]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.0} />
      </mesh>
      {/* Cups */}
      {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.97, 0.32]}>
          <cylinderGeometry args={[0.042, 0.036, 0.09, 8]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
        </mesh>
      ))}
      {/* Fruit bowl */}
      <mesh position={[1.2, 0.96, 0.1]}>
        <sphereGeometry args={[0.22, 8, 4, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
        <meshStandardMaterial color="#1e1840" roughness={0.6} />
      </mesh>
      {/* Fridge */}
      <mesh position={[1.7, 1.0, 0]}>
        <boxGeometry args={[0.55, 2.0, 0.7]} />
        <meshStandardMaterial color="#141424" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[1.96, 1.0, 0]}>
        <boxGeometry args={[0.01, 1.85, 0.65]} />
        <meshStandardMaterial color="#0a0a1e" roughness={0.3} metalness={0.3} />
      </mesh>
      <Text position={[0, 1.8, 0.6]} fontSize={0.12} color="#06b6d4" anchorX="center">
        BREAKOUT
      </Text>
      {/* Bar stools */}
      {[-1.4, -0.7, 0, 0.7].map((x, i) => (
        <group key={i} position={[x, 0, -0.9]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.05, 8]} />
            <meshStandardMaterial color="#1e1e3a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
            <meshStandardMaterial color="#303050" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.24, 0.26, 0.03, 5]} />
            <meshStandardMaterial color="#252540" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ReceptionDesk() {
  // Harvey Specter / Suits aesthetic: dark mahogany, black leather, gold accents, marble countertop
  const mahogany = "#1e0a04";
  const mahoganyMid = "#2d0f06";
  const gold = "#c9a827";
  const marble = "#ede8e3";
  const blackLeather = "#0d0d0d";

  return (
    <group position={[-19, 0, 0]}>
      {/* ── MAIN DESK BODY — dark mahogany ── */}
      {/* Side panels */}
      <mesh position={[-1.6, 0.55, 0]}>
        <boxGeometry args={[0.12, 1.1, 1.4]} />
        <meshStandardMaterial color={mahogany} roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[1.6, 0.55, 0]}>
        <boxGeometry args={[0.12, 1.1, 1.4]} />
        <meshStandardMaterial color={mahogany} roughness={0.3} metalness={0.15} />
      </mesh>
      {/* Front face */}
      <mesh position={[0, 0.55, 0.7]}>
        <boxGeometry args={[3.2, 1.1, 0.1]} />
        <meshStandardMaterial color={mahoganyMid} roughness={0.25} metalness={0.1} />
      </mesh>
      {/* Back fill */}
      <mesh position={[0, 0.55, -0.7]}>
        <boxGeometry args={[3.2, 1.1, 0.1]} />
        <meshStandardMaterial color={mahogany} roughness={0.3} metalness={0.15} />
      </mesh>
      {/* Base fill */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[3.2, 0.1, 1.4]} />
        <meshStandardMaterial color={mahogany} roughness={0.4} />
      </mesh>

      {/* ── MARBLE COUNTERTOP ── */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[3.3, 0.06, 1.5]} />
        <meshStandardMaterial color={marble} roughness={0.08} metalness={0.05} />
      </mesh>
      {/* Marble edge trim — gold */}
      <mesh position={[0, 1.1, 0.75]}>
        <boxGeometry args={[3.3, 0.04, 0.02]} />
        <meshStandardMaterial color={gold} roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0, 1.1, -0.75]}>
        <boxGeometry args={[3.3, 0.04, 0.02]} />
        <meshStandardMaterial color={gold} roughness={0.1} metalness={0.9} />
      </mesh>

      {/* ── GOLD ASTERION LABS LETTERING on front face ── */}
      <mesh position={[0, 0.55, 0.76]}>
        <boxGeometry args={[1.8, 0.14, 0.02]} />
        <meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={0.18} roughness={0.1} metalness={0.95} />
      </mesh>
      <Text position={[0, 0.55, 0.78]} fontSize={0.1} color="#fffbe8" anchorX="center">
        ASTERION LABS
      </Text>

      {/* ── VERTICAL GOLD ACCENT STRIPS on front face ── */}
      {[-1.4, -0.7, 0.7, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0.55, 0.76]}>
          <boxGeometry args={[0.018, 0.9, 0.015]} />
          <meshStandardMaterial color={gold} roughness={0.08} metalness={0.95} />
        </mesh>
      ))}

      {/* ── MONITORS on countertop ── */}
      <Monitor position={[0.6, 1.15, 0.2]} screenColor="#c9a827" active label="RECEPTION" rotation={-0.18} />
      <Monitor position={[-0.5, 1.15, 0.2]} screenColor="#6366f1" active label="VISITOR LOG" rotation={0.15} />
      <Keyboard position={[0.6, 1.13, 0.45]} rotation={-0.18} />

      {/* ── SIGN-IN TABLET (gold-edged) ── */}
      <mesh position={[-1.1, 1.14, 0.52]}>
        <boxGeometry args={[0.22, 0.02, 0.3]} />
        <meshStandardMaterial color={gold} roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[-1.1, 1.16, 0.52]}>
        <boxGeometry args={[0.19, 0.01, 0.27]} />
        <meshStandardMaterial color="#020210" emissive="#c9a827" emissiveIntensity={0.7} />
      </mesh>
      <Text position={[-1.1, 1.22, 0.53]} fontSize={0.022} color="#c9a827" anchorX="center">
        SIGN IN
      </Text>

      {/* ── BADGE SCANNER ── */}
      <mesh position={[1.7, 1.05, 0.64]}>
        <boxGeometry args={[0.16, 0.3, 0.06]} />
        <meshStandardMaterial color="#1a1206" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[1.7, 1.05, 0.68]}>
        <boxGeometry args={[0.1, 0.09, 0.01]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.0} />
      </mesh>

      {/* ── BLACK LEATHER HIGH-BACK CHAIR behind desk ── */}
      <group position={[0.3, 0, -1.0]} rotation={[0, Math.PI, 0]}>
        {/* Seat */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.58, 0.08, 0.58]} />
          <meshStandardMaterial color={blackLeather} roughness={0.7} />
        </mesh>
        {/* High back */}
        <mesh position={[0, 1.1, -0.26]}>
          <boxGeometry args={[0.56, 1.2, 0.1]} />
          <meshStandardMaterial color={blackLeather} roughness={0.7} />
        </mesh>
        {/* Gold top cap on back */}
        <mesh position={[0, 1.72, -0.26]}>
          <boxGeometry args={[0.56, 0.04, 0.12]} />
          <meshStandardMaterial color={gold} roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Armrests */}
        {[-0.32, 0.32].map((x, i) => (
          <mesh key={i} position={[x, 0.7, 0]}>
            <boxGeometry args={[0.04, 0.06, 0.5]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.4} />
          </mesh>
        ))}
        {/* Chrome stem */}
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.46, 8]} />
          <meshStandardMaterial color="#aaa" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Base */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.3, 0.32, 0.03, 5]} />
          <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* ── LIFT DOORS — brushed steel ── */}
      {[-1.5, 1.5].map((z, i) => (
        <group key={i} position={[-2.5, 1.5, z]}>
          <mesh>
            <boxGeometry args={[0.1, 3.2, 1.15]} />
            <meshStandardMaterial color="#2a2018" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Gold trim strips */}
          {[-0.56, 0, 0.56].map((oz, j) => (
            <mesh key={j} position={[0.06, 0, oz]}>
              <boxGeometry args={[0.02, 2.9, 0.02]} />
              <meshStandardMaterial color={gold} roughness={0.08} metalness={0.95} />
            </mesh>
          ))}
          {/* Reflective door panel */}
          <mesh position={[0.055, 0, 0]}>
            <boxGeometry args={[0.01, 3.0, 1.0]} />
            <meshStandardMaterial color="#1a1208" roughness={0.05} metalness={0.95} />
          </mesh>
        </group>
      ))}

      {/* ── FLOOR INDICATOR ── */}
      <mesh position={[-2.6, 2.6, 0]}>
        <boxGeometry args={[0.06, 0.7, 0.55]} />
        <meshStandardMaterial color="#1a1206" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-2.56, 2.6, 0]}>
        <boxGeometry args={[0.01, 0.6, 0.45]} />
        <meshStandardMaterial color="#050502" emissive={gold} emissiveIntensity={0.3} />
      </mesh>
      <Text position={[-2.54, 2.62, 0]} fontSize={0.28} color={gold} anchorX="center" rotation={[0, Math.PI / 2, 0]}>
        40
      </Text>
      <Text position={[-2.54, 2.3, 0]} fontSize={0.075} color="#888" anchorX="center" rotation={[0, Math.PI / 2, 0]}>
        ASTERION LABS
      </Text>

      {/* ── CALL BUTTON (gold) ── */}
      <mesh position={[-2.35, 1.5, 2.4]}>
        <boxGeometry args={[0.07, 0.26, 0.2]} />
        <meshStandardMaterial color="#1a1206" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-2.32, 1.5, 2.4]}>
        <cylinderGeometry args={[0.038, 0.038, 0.02, 8]} />
        <meshStandardMaterial color={gold} emissive={gold} emissiveIntensity={0.9} roughness={0.05} metalness={0.95} />
      </mesh>

      {/* ── LOBBY SEATING — black leather visitor chairs with gold legs ── */}
      {[[-16, 0, -5.2, Math.PI / 2], [-16, 0, -3.8, Math.PI / 2], [-16, 0, 3.8, Math.PI / 2], [-16, 0, 5.2, Math.PI / 2]].map(([x, y, z, rot], i) => (
        <group key={`vs${i}`} position={[x - (-19), y, z]} rotation={[0, rot, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.56, 0.07, 0.54]} />
            <meshStandardMaterial color={blackLeather} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.78, -0.24]}>
            <boxGeometry args={[0.54, 0.64, 0.08]} />
            <meshStandardMaterial color={blackLeather} roughness={0.7} />
          </mesh>
          {[[-0.25, -0.24], [0.25, -0.24], [-0.25, 0.24], [0.25, 0.24]].map(([lx, lz], j) => (
            <mesh key={j} position={[lx, 0.22, lz]}>
              <boxGeometry args={[0.04, 0.44, 0.04]} />
              <meshStandardMaterial color={gold} roughness={0.1} metalness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Connecting bench between visitor chairs */}
      <mesh position={[-16 - (-19), 0.4, -4.5]}>
        <boxGeometry args={[0.06, 0.8, 2.8]} />
        <meshStandardMaterial color={mahogany} roughness={0.3} />
      </mesh>
      <mesh position={[-16 - (-19), 0.4, 4.5]}>
        <boxGeometry args={[0.06, 0.8, 2.8]} />
        <meshStandardMaterial color={mahogany} roughness={0.3} />
      </mesh>

      {/* ── STANDING LAMP (gold pole, cream shade) ── */}
      {[[-3.5, -4.5], [-3.5, 4.5]].map(([lx, lz], i) => (
        <group key={`lamp${i}`} position={[lx, 0, lz]}>
          <mesh position={[0, 1.15, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 2.3, 8]} />
            <meshStandardMaterial color={gold} roughness={0.08} metalness={0.95} />
          </mesh>
          <mesh position={[0, 2.4, 0]}>
            <cylinderGeometry args={[0.28, 0.18, 0.4, 10]} />
            <meshStandardMaterial color="#f5eed8" roughness={0.8} emissive="#ffe8a0" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.18, 0.2, 0.06, 8]} />
            <meshStandardMaterial color={gold} roughness={0.1} metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PrinterStation({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.7, 0.44, 0.52]} />
        <meshStandardMaterial color="#141424" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.7, 0.27]}>
        <boxGeometry args={[0.5, 0.06, 0.04]} />
        <meshStandardMaterial color="#1e1e3a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.6, 0.27]}>
        <boxGeometry args={[0.6, 0.02, 0.01]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.8} />
      </mesh>
      {/* Stand */}
      <mesh position={[0, 0.27, 0]}>
        <boxGeometry args={[0.72, 0.54, 0.54]} />
        <meshStandardMaterial color="#0e0e20" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

function LoungeArea({ cx, cz }: { cx: number; cz: number }) {
  return (
    <group>
      {/* Low coffee table */}
      <mesh position={[cx, 0.4, cz]}>
        <cylinderGeometry args={[0.7, 0.7, 0.06, 10]} />
        <meshStandardMaterial color="#181828" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[cx, 0.14, cz]}>
        <cylinderGeometry args={[0.04, 0.04, 0.28, 6]} />
        <meshStandardMaterial color="#252545" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Sofa */}
      <group position={[cx - 1.4, 0, cz]}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.7, 0.38, 1.6]} />
          <meshStandardMaterial color="#1a1636" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.65, -0.75]}>
          <boxGeometry args={[0.7, 0.6, 0.12]} />
          <meshStandardMaterial color="#1a1636" roughness={0.8} />
        </mesh>
        {[-0.7, 0.7].map((z, i) => (
          <mesh key={i} position={[-0.36, 0.54, z]}>
            <boxGeometry args={[0.1, 0.45, 0.28]} />
            <meshStandardMaterial color="#141232" roughness={0.8} />
          </mesh>
        ))}
      </group>
      {/* Armchairs */}
      {[[cx, cz - 1.2, 0], [cx, cz + 1.2, Math.PI]].map(([x, z, rot], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.36, 0]}>
            <boxGeometry args={[0.66, 0.38, 0.66]} />
            <meshStandardMaterial color="#1a1636" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.65, -0.3]}>
            <boxGeometry args={[0.66, 0.6, 0.1]} />
            <meshStandardMaterial color="#1a1636" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <boxGeometry args={[0.62, 0.18, 0.62]} />
            <meshStandardMaterial color="#141028" roughness={0.6} metalness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MeetingRoomContents({ cx, cz, label = "MEETING ROOM", tvColor = "#6366f1" }: {
  cx: number; cz: number; label?: string; tvColor?: string;
}) {
  return (
    <>
      <BoardroomTable cx={cx} cz={cz} w={4.5} d={1.8} />
      <TV position={[cx - 2.35, 2.0, cz]} rotation={Math.PI / 2} label={label} />
      <Whiteboard position={[cx + 2.45, 1.8, cz]} rotation={-Math.PI / 2} text={label} />
    </>
  );
}

function SmallMeetingRoom({ cx, cz, label = "HUDDLE" }: { cx: number; cz: number; label?: string }) {
  return (
    <>
      {/* Small round table */}
      <mesh position={[cx, 0.74, cz]}>
        <cylinderGeometry args={[0.9, 0.9, 0.07, 10]} />
        <meshStandardMaterial color="#141424" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[cx, 0.37, cz]}>
        <cylinderGeometry args={[0.05, 0.08, 0.74, 8]} />
        <meshStandardMaterial color="#0a0a20" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Chairs around table */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, i) => (
        <MeetingChair key={i}
          position={[cx + Math.cos(angle) * 1.3, 0, cz + Math.sin(angle) * 1.3]}
          rotation={angle + Math.PI} />
      ))}
      {/* Small screen */}
      <Monitor position={[cx, 1.55, cz - 1.4]} screenColor="#6366f1" active label={label} size={1.2} />
    </>
  );
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export function OfficeProps() {
  return (
    <>
      {/* ═══════════════════════════════════════
          RECEPTION & LOBBY
      ═══════════════════════════════════════ */}
      <ReceptionDesk />

      {/* ═══════════════════════════════════════
          ANALYTICS POD  (Maya area ~[2, 0, -10])
      ═══════════════════════════════════════ */}
      {/* Front row */}
      <Desk position={[-1, 0, -9]} />
      <Desk position={[1.5, 0, -9]} />
      <Desk position={[4, 0, -9]} />
      <Monitor position={[-1, 0.83, -9.45]} screenColor="#6366f1" active label="ANALYTICS" />
      <Monitor position={[1.5, 0.83, -9.45]} screenColor="#ef4444" active label="⚠ DEDUPE" />
      <Monitor position={[4, 0.83, -9.45]} screenColor="#8b5cf6" active />
      <Keyboard position={[-1, 0.77, -9.2]} />
      <Keyboard position={[1.5, 0.77, -9.2]} />
      <Keyboard position={[4, 0.77, -9.2]} />
      <Chair position={[-1, 0, -8.2]} rotation={Math.PI} />
      <Chair position={[1.5, 0, -8.2]} rotation={Math.PI} />
      <Chair position={[4, 0, -8.2]} rotation={Math.PI} />
      {/* Back row */}
      <Desk position={[-1, 0, -11.5]} rotation={Math.PI} />
      <Desk position={[1.5, 0, -11.5]} rotation={Math.PI} />
      <Desk position={[4, 0, -11.5]} rotation={Math.PI} />
      <DualMonitorSetup position={[-1, 0.76, -11.1]} colors={["#6366f1", "#8b5cf6"]} labels={["LIVE METRICS", "MODEL v2.4"]} />
      <DualMonitorSetup position={[1.5, 0.76, -11.1]} colors={["#ef4444", "#6366f1"]} labels={["ALERTS", "PIPELINE"]} />
      <DualMonitorSetup position={[4, 0.76, -11.1]} colors={["#8b5cf6", "#6366f1"]} />
      <Chair position={[-1, 0, -12.3]} />
      <Chair position={[1.5, 0, -12.3]} />
      <Chair position={[4, 0, -12.3]} />
      <Laptop position={[4, 0.77, -11.35]} rotation={Math.PI} />
      <Partition position={[-3.2, 0, -10.5]} rotation={Math.PI / 2} />
      <Partition position={[5.8, 0, -10.5]} rotation={Math.PI / 2} />

      {/* Validation report desk — interactable */}
      <Desk position={[4.5, 0, -10]} />
      <Monitor position={[4.5, 0.83, -10.45]} screenColor="#ef4444" active label="VALIDATION REPORT" />
      <Keyboard position={[4.5, 0.77, -10.2]} />
      <Chair position={[4.5, 0, -9.2]} rotation={Math.PI} />

      {/* ═══════════════════════════════════════
          OPEN PLAN — WEST ANALYTICS ROWS
      ═══════════════════════════════════════ */}
      <DeskPod cx={-6} cz={-9} colors={["#6366f1", "#8b5cf6"]} rows={2} cols={2} />
      <DeskPod cx={-10} cz={-9} colors={["#8b5cf6", "#6366f1"]} rows={2} cols={2} />
      <Partition position={[-7.8, 0, -9]} />
      <Whiteboard position={[-4.5, 1.8, -19.47]} rotation={-Math.PI / 2} text="Q4 ROADMAP" />
      <Whiteboard position={[1, 1.8, -19.47]} rotation={-Math.PI / 2} text="MODEL NOTES" />
      <Whiteboard position={[5.5, 1.8, -19.47]} rotation={-Math.PI / 2} text="DEMO PREP" />

      {/* ═══════════════════════════════════════
          BOARDROOM  (x: 8-18, z: -10 to -19)
      ═══════════════════════════════════════ */}
      <MeetingRoomContents cx={13} cz={-14.5} label="EXEC BOARDROOM" tvColor="#f59e0b" />
      <WallTV position={[17.9, 2.5, -14.5]} rotation={Math.PI / 2} label="PIPELINE STATUS" color="#f59e0b" />

      {/* ═══════════════════════════════════════
          ENGINEERING  (Theo ~[9, 0, 4])
      ═══════════════════════════════════════ */}
      {/* Main engineering rows */}
      <DeskPod cx={9} cz={3.5} colors={["#0ea5e9", "#38bdf8", "#06b6d4"]} rows={2} cols={3}
        labels={["DEV CONSOLE", "PIPELINE", "MONITORING", "STAGING", "CI/CD", "TESTS"]} />
      <StandingDesk position={[13.5, 0, 4]} rotation={Math.PI / 2} />
      <Monitor position={[13.5, 1.13, 3.5]} screenColor="#0ea5e9" active label="BUILD STATUS" />
      <Keyboard position={[13.5, 1.07, 3.7]} rotation={Math.PI / 2} />
      <Whiteboard position={[12, 1.8, -9.73]} rotation={-Math.PI / 2} text="ARCHITECTURE" />
      <WallTV position={[24.5, 2.5, 3]} rotation={-Math.PI / 2} label="LIVE MONITORING" color="#0ea5e9" />

      {/* ═══════════════════════════════════════
          HUDDLE ROOM A  (~[11, 0, 10.5])
      ═══════════════════════════════════════ */}
      <SmallMeetingRoom cx={11} cz={10.5} label="ENGINEERING SYNC" />

      {/* ═══════════════════════════════════════
          OPS ZONE  (~[-8, 0, 3])
      ═══════════════════════════════════════ */}
      <DeskPod cx={-8.5} cz={3.5} colors={["#06b6d4", "#0ea5e9"]}
        labels={["OPS DASHBOARD", "INFRA", "ALERTS", "UPTIME"]} rows={2} cols={2} />
      <TV position={[-13.5, 2.1, 0]} rotation={Math.PI / 2} label="OPS STATUS" />
      <Partition position={[-6.2, 0, 3.5]} />
      <Partition position={[-10.8, 0, 3.5]} />

      {/* ═══════════════════════════════════════
          COMPLIANCE POD  (Priya ~[-2, 0, 12])
      ═══════════════════════════════════════ */}
      <Desk position={[-3, 0, 10.5]} />
      <Desk position={[-0.5, 0, 10.5]} />
      <Desk position={[-3, 0, 13]} rotation={Math.PI} />
      <Desk position={[-0.5, 0, 13]} rotation={Math.PI} />
      <Monitor position={[-3, 0.83, -0.45 + 10.5]} screenColor="#10b981" active label="COMPLIANCE" />
      <Monitor position={[-0.5, 0.83, -0.45 + 10.5]} screenColor="#10b981" active label="RISK REGISTER" />
      <DualMonitorSetup position={[-3, 0.76, 13.45]} colors={["#10b981", "#059669"]} labels={["AUDIT LOG", "REPORTS"]} />
      <Monitor position={[-0.5, 0.83, 13.45]} screenColor="#059669" active rotation={Math.PI} />
      <Chair position={[-3, 0, 9.7]} rotation={Math.PI} />
      <Chair position={[-0.5, 0, 9.7]} rotation={Math.PI} />
      <Chair position={[-3, 0, 13.8]} />
      <Chair position={[-0.5, 0, 13.8]} />
      <Whiteboard position={[-2.5, 1.8, 10.1]} rotation={-Math.PI / 2} text="RISK MATRIX" />
      <Laptop position={[-0.5, 0.77, 10.25]} />

      {/* ═══════════════════════════════════════
          HUDDLE ROOM B  (~[-2.5, 0, 14])
      ═══════════════════════════════════════ */}
      <SmallMeetingRoom cx={-2.5} cz={15} label="COMPLIANCE REVIEW" />

      {/* ═══════════════════════════════════════
          COFFEE / BREAKOUT  (~[-10, 0, 14])
      ═══════════════════════════════════════ */}
      <CoffeeStation position={[-10, 0, 14.5]} />
      <LoungeArea cx={-15} cz={14} />

      {/* ═══════════════════════════════════════
          EXECUTIVE SUITE  (Oliver/Amara ~[13-20, 0, -2 to -8])
      ═══════════════════════════════════════ */}
      <Desk position={[16, 0, -2]} />
      <Desk position={[18.5, 0, -2]} />
      <Desk position={[20.5, 0, -5]} />
      <DualMonitorSetup position={[16, 0.76, -2.45]} colors={["#f59e0b", "#ec4899"]} labels={["EXEC BOARD", "PIPELINE"]} />
      <DualMonitorSetup position={[18.5, 0.76, -2.45]} colors={["#ec4899", "#f59e0b"]} labels={["REVENUE", "FORECAST"]} />
      <Monitor position={[20.5, 0.83, -5.45]} screenColor="#f59e0b" active label="OLIVER — STATUS" />
      <Laptop position={[20.5, 0.77, -5.2]} />
      <Chair position={[16, 0, -1.2]} rotation={Math.PI} />
      <Chair position={[18.5, 0, -1.2]} rotation={Math.PI} />
      <Chair position={[20.5, 0, -4.2]} rotation={Math.PI} />
      <Chair position={[16, 0, -7]} />
      <Chair position={[20.5, 0, -8]} />
      <Desk position={[16, 0, -7.5]} rotation={Math.PI} />
      <Desk position={[18.5, 0, -7.5]} rotation={Math.PI} />
      <Monitor position={[16, 0.83, -7.05]} screenColor="#ec4899" active rotation={Math.PI} />
      <Monitor position={[18.5, 0.83, -7.05]} screenColor="#f59e0b" active label="AMARA" rotation={Math.PI} />
      <WallTV position={[24.5, 2.5, -7]} rotation={-Math.PI / 2} label="EXEC METRICS" color="#f59e0b" />

      {/* ═══════════════════════════════════════
          CENTRAL OPEN PLAN — MID OFFICE
      ═══════════════════════════════════════ */}
      <DeskPod cx={1} cz={-2} colors={["#6366f1", "#8b5cf6", "#a855f7"]} rows={3} cols={3}
        labels={["DASH A", "DASH B", "DASH C", "MODEL", "PIPE", "CACHE", "LOG", "TRACE", "BUILD"]} />
      <PrinterStation position={[-4, 0, 0.5]} />
      <PrinterStation position={[5.5, 0, -5.5]} />
      <Partition position={[-0.5, 0, -5.5]} />
      <Partition position={[3.5, 0, -5.5]} />

      {/* ═══════════════════════════════════════
          SERVER ROOM — NE CORNER
      ═══════════════════════════════════════ */}
      <ServerRack position={[21, 0, 9]} />
      <ServerRack position={[22, 0, 9]} />
      <ServerRack position={[21, 0, 12]} />
      <ServerRack position={[22, 0, 12]} />
      <ServerRack position={[21, 0, 15]} />
      <ServerRack position={[22, 0, 15]} />
      {/* Server room cooling units */}
      <mesh position={[23.5, 1.0, 12]}>
        <boxGeometry args={[0.5, 2.0, 4]} />
        <meshStandardMaterial color="#0a0a1a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[23.5, 1.5, 12]}>
        <boxGeometry args={[0.52, 0.05, 4.05]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.3} metalness={0.6} />
      </mesh>
      <WallTV position={[19.5, 2.5, 9]} rotation={Math.PI / 2} label="SERVER HEALTH" color="#10b981" />

      {/* ═══════════════════════════════════════
          DASHBOARD WALL — EAST
      ═══════════════════════════════════════ */}
      <WallTV position={[24.5, 2.5, -1]} rotation={-Math.PI / 2} label="ASTERION — LIVE METRICS" color="#6366f1" />
      <WallTV position={[24.5, 2.5, 5]} rotation={-Math.PI / 2} label="GLOBAL DASHBOARD" color="#8b5cf6" />

    </>
  );
}

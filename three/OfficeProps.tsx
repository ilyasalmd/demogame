"use client";
import { useRef, useMemo, Suspense } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Text, useTexture, Detailed, useFBX } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader";
import { MTLLoader } from "three/addons/loaders/MTLLoader";

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

type MonitorContentType = 'excel' | 'code' | 'graph' | 'dashboard' | 'chart' | 'logo';

// Separate component so useTexture is always called at component top-level (rules of hooks)
function LogoScreen({ sw, sh }: { sw: number; sh: number; useIcon?: boolean }) {
  const tex = useTexture("/main_logo.png") as THREE.Texture;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <group position={[0, sh / 2, 0]}>
      <mesh position={[0, 0, 0.036]}>
        <planeGeometry args={[sw * 0.96, sh * 0.96]} />
        <meshStandardMaterial color="#000000" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[sw * 0.96, sh * 0.96]} />
        <meshStandardMaterial
          map={tex}
          color="#ffffff"
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={0.55}
          roughness={0.05}
          transparent
        />
      </mesh>
    </group>
  );
}

function MonitorScreenContent({
  contentType, screenColor, sw, sh, size, label, logoVariant,
}: {
  contentType: MonitorContentType;
  screenColor: string;
  sw: number;
  sh: number;
  size: number;
  label?: string;
  logoVariant?: boolean;
}) {
  const z = 0.04;

  if (contentType === 'code') {
    const codeColors = ["#4ade80", "#60a5fa", "#f472b6", "#fbbf24", "#94a3b8"];
    const widths = [0.78, 0.55, 0.68, 0.42, 0.62];
    return (
      <>
        {codeColors.map((c, i) => (
          <mesh key={i} position={[-(sw * 0.5) + (widths[i] * sw * 0.5), sh * 0.78 - i * sh * 0.165, z]}>
            <boxGeometry args={[widths[i] * sw * 0.92, sh * 0.07, 0.002]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.9} transparent opacity={0.85} />
          </mesh>
        ))}
      </>
    );
  }

  if (contentType === 'excel') {
    const rows = 4, cols = 4;
    const cellW = sw / (cols + 0.5);
    const cellH = sh / (rows + 0.5);
    return (
      <>
        {/* Header column indicators — coloured bars replace Text labels */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={`h${i}`} position={[-(sw * 0.38) + i * cellW, sh * 0.82, z]}>
            <boxGeometry args={[cellW * 0.72, sh * 0.055, 0.001]} />
            <meshStandardMaterial color="#4ade80" transparent opacity={0.85} />
          </mesh>
        ))}
        {/* Row label indicators — short neutral bars replace Text labels */}
        {[0, 1, 2].map((r) => (
          <mesh key={`rl${r}`} position={[-(sw * 0.46), sh * 0.62 - r * cellH, z]}>
            <boxGeometry args={[cellW * 0.52, sh * 0.05, 0.001]} />
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.65} />
          </mesh>
        ))}
        {/* Data rows */}
        {[0, 1, 2].map((r) => (
          <group key={`row${r}`}>
            {[0, 1, 2, 3].map((c) => (
              <mesh key={c} position={[-(sw * 0.3) + c * cellW, sh * 0.62 - r * cellH, z - 0.001]}>
                <boxGeometry args={[cellW * 0.88, cellH * 0.72, 0.001]} />
                <meshStandardMaterial
                  color={r % 2 === 0 ? "#0a1a10" : "#081208"}
                  transparent opacity={0.7}
                />
              </mesh>
            ))}
          </group>
        ))}
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(r => (
          <mesh key={`gl${r}`} position={[0, sh * 0.7 - r * cellH, z]}>
            <boxGeometry args={[sw * 0.92, 0.005, 0.001]} />
            <meshStandardMaterial color="#22c55e" transparent opacity={0.25} />
          </mesh>
        ))}
      </>
    );
  }

  if (contentType === 'graph') {
    const barHeights = [0.55, 0.72, 0.44, 0.81, 0.63, 0.38];
    const bw = (sw * 0.82) / barHeights.length;
    return (
      <>
        {/* Baseline */}
        <mesh position={[0, sh * 0.15, z]}>
          <boxGeometry args={[sw * 0.88, 0.007, 0.001]} />
          <meshStandardMaterial color={screenColor} transparent opacity={0.5} />
        </mesh>
        {barHeights.map((h, i) => {
          const bh = h * sh * 0.72;
          return (
            <mesh key={i} position={[-(sw * 0.41) + bw * (i + 0.5), sh * 0.15 + bh / 2, z]}>
              <boxGeometry args={[bw * 0.7, bh, 0.002]} />
              <meshStandardMaterial color={screenColor} emissive={screenColor} emissiveIntensity={0.7} transparent opacity={0.75 - i * 0.04} />
            </mesh>
          );
        })}
      </>
    );
  }

  if (contentType === 'chart') {
    const sliceColors = [screenColor, "#60a5fa", "#f472b6", "#fbbf24"];
    const sliceOpacities = [0.9, 0.7, 0.65, 0.55];
    // Simple concentric arc indicators
    return (
      <>
        {sliceColors.map((c, i) => (
          <mesh key={i} position={[-(sw * 0.1) + i * sw * 0.12, sh * 0.55, z]}>
            <ringGeometry args={[0.055 - i * 0.005, 0.078 - i * 0.005, 20, 1, 0, Math.PI * (1.6 - i * 0.3)]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.8} transparent opacity={sliceOpacities[i]} />
          </mesh>
        ))}
        {/* Labels */}
        {sliceColors.map((c, i) => (
          <mesh key={`lb${i}`} position={[-(sw * 0.35) + i * sw * 0.24, sh * 0.22, z]}>
            <boxGeometry args={[sw * 0.18, sh * 0.08, 0.001]} />
            <meshStandardMaterial color={c} transparent opacity={0.4} />
          </mesh>
        ))}
      </>
    );
  }

  if (contentType === 'logo') {
    return <LogoScreen sw={sw} sh={sh} useIcon={logoVariant} />;
  }

  // default 'dashboard'
  const metricColors = [screenColor, "#60a5fa", "#4ade80"];
  return (
    <>
      {metricColors.map((c, i) => (
        <mesh key={i} position={[-(sw * 0.28) + i * sw * 0.28, sh * 0.62, z]}>
          <boxGeometry args={[sw * 0.24, sh * 0.24, 0.002]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.55} transparent opacity={0.35} />
        </mesh>
      ))}
      {/* Label bar replaces Text — no canvas texture allocation */}
      <mesh position={[0, sh * 0.2, z]}>
        <boxGeometry args={[sw * 0.65, sh * 0.06, 0.001]} />
        <meshStandardMaterial color={screenColor} transparent opacity={0.5} />
      </mesh>
    </>
  );
}

function Monitor({
  position, screenColor = "#6366f1", active = true, label, rotation = 0, size = 1, codeLines,
  contentType = 'dashboard',
}: {
  position: [number, number, number];
  screenColor?: string;
  active?: boolean;
  label?: string;
  rotation?: number;
  size?: number;
  codeLines?: string[];
  contentType?: MonitorContentType;
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
      {active && !codeLines && (
        <MonitorScreenContent
          contentType={contentType}
          screenColor={screenColor}
          sw={sw}
          sh={sh}
          size={size}
          label={label}
        />
      )}
      {codeLines && active && codeLines.map((line, i) => (
        <Text
          key={i}
          position={[-(sw * 0.44), sh * 0.38 - i * sh * 0.145, 0.04]}
          fontSize={0.021 * size}
          color={screenColor}
          anchorX="left"
          anchorY="middle"
          maxWidth={sw * 0.92}
        >
          {line}
        </Text>
      ))}
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

// ── Procedural fallback chair (used while FBX loads) ─────────────────────────
function ChairProcedural({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
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

// ── FBX office chair (loads from /public/models/office-chair.fbx) ─────────────
function ChairFBX({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const fbx = useFBX("/models/office-chair.fbx");
  const chairTex = useTexture("/models/Chair.png") as THREE.Texture;
  chairTex.colorSpace = THREE.SRGBColorSpace;
  const clone = useMemo(() => {
    const c = fbx.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = new THREE.MeshStandardMaterial({
          map: chairTex,
          roughness: 0.65,
          metalness: 0.25,
          color: "#c8c4e0",
        });
        (child as THREE.Mesh).material = mat;
        (child as THREE.Mesh).castShadow = true;
      }
    });
    return c;
  }, [fbx, chairTex]);

  return (
    // +Math.PI/2 corrects the FBX model's 90° clockwise offset so every chair
    // faces its monitor; DeskPod rot (0 or π) still handles the flip direction
    <group position={position} rotation={[0, rotation + Math.PI / 2, 0]}>
      <primitive object={clone} scale={[0.004, 0.004, 0.004]} position={[0, -0.02, 0]} />
    </group>
  );
}

// ── Chair: FBX with procedural fallback ──────────────────────────────────────
function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <Suspense fallback={<ChairProcedural position={position} rotation={rotation} />}>
      <ChairFBX position={position} rotation={rotation} />
    </Suspense>
  );
}

// ── Sofa: FBX with procedural fallback ──────────────────────────────────────

function SofaProcedural({ position, rotation = 0 }: {
  position: [number, number, number]; rotation?: number;
}) {
  const foam  = "#1e1a38"; // deep midnight-blue fabric
  const frame = "#13102a";
  const legCol = "#0e0a1a";
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat cushion */}
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[2.0, 0.20, 0.90]} />
        <meshStandardMaterial color={foam} roughness={0.85} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, 0.78, -0.38]}>
        <boxGeometry args={[2.0, 0.78, 0.14]} />
        <meshStandardMaterial color={foam} roughness={0.85} />
      </mesh>
      {/* Top back roll */}
      <mesh position={[0, 1.16, -0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.98, 8]} />
        <meshStandardMaterial color={frame} roughness={0.7} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.93, 0.55, 0]}>
        <boxGeometry args={[0.16, 0.44, 0.90]} />
        <meshStandardMaterial color={foam} roughness={0.85} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.93, 0.55, 0]}>
        <boxGeometry args={[0.16, 0.44, 0.90]} />
        <meshStandardMaterial color={foam} roughness={0.85} />
      </mesh>
      {/* Legs */}
      {([[-0.85, -0.35], [0.85, -0.35], [-0.85, 0.35], [0.85, 0.35]] as [number,number][]).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.1, lz]}>
          <boxGeometry args={[0.08, 0.2, 0.08]} />
          <meshStandardMaterial color={legCol} roughness={0.45} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function SofaFBXInner({ position, rotation = 0 }: {
  position: [number, number, number]; rotation?: number;
}) {
  const fbx  = useFBX("/models/sofa/koltuk2.fbx");
  const tex1 = useTexture("/models/sofa/Koltuk1.png") as THREE.Texture;
  const tex2 = useTexture("/models/sofa/Koltuk2.png") as THREE.Texture;
  tex1.colorSpace = THREE.SRGBColorSpace;
  tex2.colorSpace = THREE.SRGBColorSpace;

  const clone = useMemo(() => {
    const c = fbx.clone(true);
    let meshIdx = 0;
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          map:      meshIdx === 0 ? tex1 : tex2,
          roughness: 0.78,
          metalness: 0.05,
          color: "#cec6b6",
        });
        (child as THREE.Mesh).castShadow = true;
        meshIdx++;
      }
    });
    return c;
  }, [fbx, tex1, tex2]);

  // Scale 0.008 assumes FBX units ≈ 1 mm (sofa ≈ 220 mm → 1.76 m wide).
  // If the sofa looks too small bump to 0.010; too large drop to 0.006.
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={clone} scale={[0.008, 0.008, 0.008]} position={[0, 0, 0]} />
    </group>
  );
}

function Sofa({ position, rotation = 0 }: {
  position: [number, number, number]; rotation?: number;
}) {
  return (
    <Suspense fallback={<SofaProcedural position={position} rotation={rotation} />}>
      <SofaFBXInner position={position} rotation={rotation} />
    </Suspense>
  );
}

// Small lobby coffee table (for sofa clusters)
function LobbyTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.7, 0.05, 0.45]} />
        <meshStandardMaterial color="#101020" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.38, 6]} />
        <meshStandardMaterial color="#252540" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.03, 6]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.5} metalness={0.4} />
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

// ── Canvas-based whiteboard textures ──────────────────────────────────────────

function wbQ4(g: CanvasRenderingContext2D, W: number, H: number) {
  const rows = [
    { m: "OCT", label: "Data Audit & Deduplication", pct: 1.0,  col: "#22c55e" },
    { m: "NOV", label: "Model v2.0  Training Run",   pct: 0.65, col: "#f59e0b" },
    { m: "DEC", label: "Client Demo Launch",         pct: 0.25, col: "#ef4444" },
  ];
  const barH = 62, gap = 84, startY = 108;
  rows.forEach(({ m, label, pct, col }, i) => {
    const y = startY + i * gap;
    g.fillStyle = "#1e1e3a"; g.font = "bold 30px Arial"; g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText(m, 24, y + barH / 2);
    g.fillStyle = "#ddd8ce"; g.fillRect(90, y, W - 160, barH);
    g.fillStyle = col; g.fillRect(90, y, (W - 160) * pct, barH);
    g.fillStyle = "#0a0a20"; g.font = "22px Arial"; g.fillText(label, 98, y + barH / 2);
    g.fillStyle = col; g.font = "bold 26px Arial"; g.textAlign = "right";
    g.fillText(`${Math.round(pct * 100)}%`, W - 18, y + barH / 2);
  });
  g.fillStyle = "#7f1d1d"; g.font = "bold 21px Arial"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.fillText("⚠  DEDUPE CHECK URGENT — confirm with Maya Chen before go-live", W / 2, H - 14);
}

function wbModel(g: CanvasRenderingContext2D, W: number, H: number) {
  g.fillStyle = "#22c55e"; g.font = "bold 100px Arial"; g.textAlign = "left"; g.textBaseline = "top";
  g.fillText("94.2%", 36, 94);
  g.fillStyle = "#2a4a3a"; g.font = "26px Arial"; g.fillText("Validation Accuracy  (v2.4)", 40, 208);
  g.fillStyle = "#22c55e"; g.font = "bold 30px Arial"; g.fillText("▲ +12.1 pp vs v1   |   dupes flagged: 1,460", 40, 246);
  g.fillStyle = "#c0ccd4"; g.fillRect(478, 92, 3, 180);
  const bx = 528, bw = 170, bh_max = 145, base = 285;
  g.fillStyle = "#64748b"; g.font = "22px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("v1 baseline", bx + bw / 2, 108);
  g.fillText("v2 current", bx + bw + 70 + bw / 2, 108);
  g.fillStyle = "#94a3b8"; g.fillRect(bx, base - bh_max * 0.821, bw, bh_max * 0.821);
  g.fillStyle = "#22c55e"; g.fillRect(bx + bw + 70, base - bh_max * 0.942, bw, bh_max * 0.942);
  g.fillStyle = "#1e3a5a"; g.font = "bold 22px Arial"; g.textBaseline = "bottom";
  g.fillText("82.1%", bx + bw / 2, base - bh_max * 0.821 - 6);
  g.fillStyle = "#0a3a1a"; g.fillText("94.2%", bx + bw + 70 + bw / 2, base - bh_max * 0.942 - 6);
  g.fillStyle = "#b0aca4"; g.fillRect(bx - 10, base, bw * 2 + 70 + 20, 2);
  g.fillStyle = "#f59e0b"; g.font = "bold 23px Arial"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.fillText("⚠  DEDUPE: PENDING — re-run pipeline before sign-off", W / 2, H - 14);
}

function wbDemo(g: CanvasRenderingContext2D, W: number, H: number) {
  const items = [
    { icon: "✓", col: "#22c55e", text: "Deck ready  (v2.4 final export)",        bold: false },
    { icon: "✓", col: "#22c55e", text: "Staging environment: GREEN  ✓",          bold: false },
    { icon: "⚠", col: "#f59e0b", text: "Data quality — confirm with Maya Chen",  bold: true  },
    { icon: "○", col: "#6366f1", text: "Sign-off: Oliver Grant  |  Brief sent",  bold: false },
    { icon: "!", col: "#ef4444", text: "DEDUPE CHECK URGENT — before go-live",   bold: true  },
  ];
  items.forEach(({ icon, col, text, bold }, i) => {
    const y = 116 + i * 74;
    g.fillStyle = col; g.beginPath(); g.arc(36, y + 16, 20, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = "bold 26px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(icon, 36, y + 16);
    g.fillStyle = bold ? "#7f1d1d" : "#1a1a2e"; g.font = bold ? "bold 28px Arial" : "26px Arial";
    g.textAlign = "left"; g.fillText(text, 70, y + 16);
  });
  g.fillStyle = "#7c2d12"; g.font = "bold 21px Arial"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.fillText("Client arrives in < 1 hour  —  40F, AI OA Ltd Labs  |  Room: Aldgate Suite", W / 2, H - 14);
}

function wbArch(g: CanvasRenderingContext2D, W: number, H: number) {
  const boxes = [
    { l: "INGEST",    col: "#0ea5e9", sub: "ETL / Kafka" },
    { l: "TRANSFORM", col: "#0891b2", sub: "dbt / Spark" },
    { l: "MODEL API", col: "#6366f1", sub: "v2.4 / PyTorch" },
    { l: "DASHBOARD", col: "#8b5cf6", sub: "React / D3" },
  ];
  const bw = 196, bh = 92, startX = 22, y = 112;
  boxes.forEach(({ l, col, sub }, i) => {
    const x = startX + i * (bw + 50);
    g.fillStyle = col; g.fillRect(x, y, bw, bh);
    g.fillStyle = "#fff"; g.font = "bold 27px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(l, x + bw / 2, y + bh / 2 - 11);
    g.font = "19px Arial"; g.fillText(sub, x + bw / 2, y + bh / 2 + 19);
    g.fillStyle = "#22c55e"; g.beginPath(); g.arc(x + bw - 16, y + 16, 9, 0, Math.PI * 2); g.fill();
    if (i < boxes.length - 1) {
      const ax = x + bw + 6;
      g.fillStyle = "#555"; g.fillRect(ax, y + bh / 2 - 3, 28, 6);
      g.beginPath(); g.moveTo(ax + 32, y + bh / 2 - 9); g.lineTo(ax + 48, y + bh / 2);
      g.lineTo(ax + 32, y + bh / 2 + 9); g.fill();
    }
  });
  g.fillStyle = "#1e1b4b"; g.font = "bold 24px Arial"; g.textAlign = "center"; g.textBaseline = "top";
  g.fillText("v2.4 DEPLOYED  |  CI: 142 / 142 ✓  |  K8s: 3/3 pods UP  |  p95 latency: 42 ms", W / 2, 222);
  g.fillStyle = "#22c55e"; g.font = "bold 26px Arial";
  g.fillText("SLA: 98.4%   Uptime: 99.97%   DB: replicated   Last commit: 4 min ago", W / 2, 260);
  g.fillStyle = "#4b5563"; g.font = "21px Arial"; g.textBaseline = "alphabetic";
  g.fillText("Owner: Theo Marsh   Environment: 40F production   Repo: ai-oa/incident-model", W / 2, H - 14);
}

function wbPipeline(g: CanvasRenderingContext2D, W: number, H: number) {
  const stages = [
    { l: "SOURCE",  col: "#0ea5e9", s: "✓" }, { l: "INGEST",  col: "#0891b2", s: "✓" },
    { l: "CLEAN",   col: "#f59e0b", s: "⚠" }, { l: "MODEL",   col: "#6366f1", s: "✓" },
    { l: "OUTPUT",  col: "#8b5cf6", s: "✓" },
  ];
  const bw = 152, bh = 82, sx = 22, y = 116, gap = 22;
  stages.forEach(({ l, col, s }, i) => {
    const x = sx + i * (bw + gap);
    g.fillStyle = col; g.fillRect(x, y, bw, bh);
    g.fillStyle = "#fff"; g.font = "bold 24px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(l, x + bw / 2, y + bh / 2 - 8);
    g.font = "bold 22px Arial";
    g.fillStyle = s === "✓" ? "#bbf7d0" : "#fef3c7";
    g.fillText(s, x + bw / 2, y + bh / 2 + 18);
    if (i < stages.length - 1) {
      const ax = x + bw + 3;
      g.fillStyle = "#888"; g.fillRect(ax, y + bh / 2 - 3, 12, 6);
      g.beginPath(); g.moveTo(ax + 14, y + bh / 2 - 9);
      g.lineTo(ax + 22, y + bh / 2); g.lineTo(ax + 14, y + bh / 2 + 9); g.fill();
    }
  });
  const mets = [["SLA","98.4%","#0c4a6e"],["UPTIME","99.97%","#22c55e"],
                 ["ALERTS","1 WARN","#f59e0b"],["ROWS/HR","12.4k","#6366f1"],["SYNC","2 min","#10b981"]];
  mets.forEach(([k, v, col], i) => {
    const mx = 26 + i * 196, my = 234;
    g.fillStyle = col; g.fillRect(mx, my, 180, 66);
    g.fillStyle = "#fff"; g.font = "bold 17px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(k, mx + 90, my + 20); g.font = "bold 25px Arial"; g.fillText(v, mx + 90, my + 48);
  });
  g.fillStyle = "#374151"; g.font = "21px Arial"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.fillText("DB replication: OK  |  Owner: Theo Marsh  |  Prod environment active", W / 2, H - 14);
}

function wbRisk(g: CanvasRenderingContext2D, W: number, H: number) {
  const cells = [
    { l: "HIGH",   sub: "Data Accuracy  (P1 — open)",   col: "#ef4444", tx: "#fff"     },
    { l: "MED",    sub: "Client Timeline Pressure",      col: "#f59e0b", tx: "#1a1a1a"  },
    { l: "MED",    sub: "Model Drift Risk",              col: "#f59e0b", tx: "#1a1a1a"  },
    { l: "LOW",    sub: "Infrastructure Scaling",        col: "#22c55e", tx: "#0a2a1a"  },
  ];
  const cw = 458, ch = 150, sx = 28, sy = 98, gap = 8;
  cells.forEach(({ l, sub, col, tx }, i) => {
    const x = sx + (i % 2) * (cw + gap), y = sy + Math.floor(i / 2) * (ch + gap);
    g.fillStyle = col; g.fillRect(x, y, cw, ch);
    g.fillStyle = tx; g.font = "bold 38px Arial"; g.textAlign = "left"; g.textBaseline = "top";
    g.fillText(l, x + 18, y + 16);
    g.font = "24px Arial"; g.fillText(sub, x + 18, y + 62);
    g.fillStyle = tx === "#fff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)";
    g.beginPath(); g.arc(x + cw - 28, y + ch / 2, 24, 0, Math.PI * 2); g.fill();
  });
  g.fillStyle = "#4b5563"; g.font = "bold 21px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("PROBABILITY  ──▶", 512, sy - 14);
  g.fillStyle = "#7f1d1d"; g.font = "bold 21px Arial"; g.textBaseline = "alphabetic";
  g.fillText("Owner: Priya Nair   Review: weekly   Escalation path: Amara Vale → Board", W / 2, H - 14);
}

function wbExec(g: CanvasRenderingContext2D, W: number, H: number) {
  const bars = [
    { l:"Q1", v:0.72, col:"#78350f80" }, { l:"Q2", v:0.80, col:"#78350fa0" },
    { l:"Q3", v:0.88, col:"#78350fc0" }, { l:"Q4*",v:0.96, col:"#f59e0b",  },
  ];
  const chartX = 38, chartW = 440, chartH = 155, baseY = 292, bw = chartW / bars.length;
  bars.forEach(({ l, v, col }, i) => {
    const x = chartX + i * bw + 10, bh = chartH * v;
    g.fillStyle = col; g.fillRect(x, baseY - bh, bw - 20, bh);
    g.fillStyle = "#1e1a0a"; g.font = "bold 22px Arial"; g.textAlign = "center"; g.textBaseline = "top";
    g.fillText(l, x + (bw - 20) / 2, baseY + 8);
    g.fillStyle = "#78350f"; g.font = "bold 20px Arial"; g.textBaseline = "bottom";
    g.fillText(`${Math.round(v * 100)}%`, x + (bw - 20) / 2, baseY - bh - 4);
  });
  g.fillStyle = "#c0bdb5"; g.fillRect(chartX - 8, baseY, chartW + 16, 2);
  g.strokeStyle = "#f59e0b"; g.lineWidth = 4; g.setLineDash([8, 4]);
  g.beginPath(); g.moveTo(chartX + 10, baseY - chartH * 0.72);
  g.lineTo(chartX + bw * 3 + 10, baseY - chartH * 0.96); g.stroke();
  g.setLineDash([]); g.lineWidth = 1;
  const kpis = [["Q4 Revenue","+9.6%","#f59e0b"],["APAC Pipeline","+6.3%","#22c55e"]];
  kpis.forEach(([l, v, col], i) => {
    const kx = 540 + i * 222, ky = 112;
    g.fillStyle = col; g.fillRect(kx, ky, 208, 92);
    g.fillStyle = "#fff"; g.font = "bold 19px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(l, kx + 104, ky + 28); g.font = "bold 38px Arial"; g.fillText(v, kx + 104, ky + 65);
  });
  g.fillStyle = "#451a03"; g.fillRect(538, 222, 450, 68);
  g.fillStyle = "#fef3c7"; g.font = "bold 22px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("Demo: 10 Dec — London HQ", 538 + 225, 222 + 24);
  g.font = "19px Arial"; g.fillText("PENDING: data sign-off  (see Priya Nair)", 538 + 225, 222 + 50);
  g.fillStyle = "#78350f"; g.font = "bold 21px Arial"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.fillText("Owners: Oliver Grant / Amara Vale   |   Confidential — Board Eyes Only", W / 2, H - 14);
}

function makeWBTexture(label: string): THREE.CanvasTexture {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const accentMap: Record<string, string> = {
    "Q4 ROADMAP":"#1a2a8a","MODEL NOTES":"#0a4a2a","DEMO PREP":"#7c2d12",
    "ARCHITECTURE":"#1e1b4b","DATA PIPELINE":"#0c4a6e","RISK MATRIX":"#7f1d1d","EXEC BOARDROOM":"#78350f",
  };
  const accent = accentMap[label] ?? "#2a2a5a";
  // Board surface
  g.fillStyle = "#f7f3ec"; g.fillRect(0, 0, W, H);
  // Header
  g.fillStyle = accent; g.fillRect(0, 0, W, 84);
  g.fillStyle = "#ffffff"; g.font = "bold 50px Arial"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(label, W / 2, 42);
  g.fillStyle = accent + "99"; g.fillRect(0, 84, W, 3);
  // Content
  if      (label === "Q4 ROADMAP")    wbQ4(g, W, H);
  else if (label === "MODEL NOTES")   wbModel(g, W, H);
  else if (label === "DEMO PREP")     wbDemo(g, W, H);
  else if (label === "ARCHITECTURE")  wbArch(g, W, H);
  else if (label === "DATA PIPELINE") wbPipeline(g, W, H);
  else if (label === "RISK MATRIX")   wbRisk(g, W, H);
  else if (label === "EXEC BOARDROOM")wbExec(g, W, H);
  else {
    g.fillStyle = "#333"; g.font = "32px Arial"; g.textAlign = "center";
    g.textBaseline = "middle"; g.fillText(label, W / 2, H / 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function WhiteboardCanvasContent({ label }: { label: string }) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    return makeWBTexture(label);
  }, [label]);
  if (!texture) return null;
  return (
    <mesh position={[0.072, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[2.58, 1.46]} />
      <meshStandardMaterial map={texture} roughness={0.88} metalness={0} />
    </mesh>
  );
}

function Whiteboard({ position, rotation = 0, text }: {
  position: [number, number, number]; rotation?: number; text?: string;
}) {
  const label = text ?? "DATA PIPELINE";
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
      <WhiteboardCanvasContent label={label} />
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

// ── Wall Clock — procedural fallback ─────────────────────────────────────────
function WallClockProcedural({ position, rotation = 0 }: {
  position: [number, number, number]; rotation?: number;
}) {
  const hrRef = useRef<THREE.Mesh>(null);
  const minRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (hrRef.current) hrRef.current.rotation.z = -(t * 0.008727);
    if (minRef.current) minRef.current.rotation.z = -(t * 0.10472);
  });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Rim ring — torus in the XY plane (face = Z axis) */}
      <mesh>
        <torusGeometry args={[0.265, 0.025, 8, 40]} />
        <meshStandardMaterial color="#2a2a4a" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Face */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.235, 32]} />
        <meshStandardMaterial color="#e8e8f8" roughness={0.5} />
      </mesh>
      {/* 12 hour ticks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.2, Math.cos(a) * 0.2, 0.015]} rotation={[0, 0, -a]}>
            <boxGeometry args={[0.012, 0.04, 0.005]} />
            <meshStandardMaterial color="#1a1a3a" />
          </mesh>
        );
      })}
      {/* Hour hand */}
      <mesh ref={hrRef} position={[0, 0.05, 0.02]}>
        <boxGeometry args={[0.018, 0.13, 0.007]} />
        <meshStandardMaterial color="#101028" />
      </mesh>
      {/* Minute hand */}
      <mesh ref={minRef} position={[0, 0.085, 0.023]}>
        <boxGeometry args={[0.011, 0.18, 0.005]} />
        <meshStandardMaterial color="#1e1e40" />
      </mesh>
      {/* Centre pin */}
      <mesh position={[0, 0, 0.026]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.012, 10]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

function WallClockFBX({ position, rotation = 0 }: {
  position: [number, number, number]; rotation?: number;
}) {
  const fbx = useFBX("/models/clock/clock.fbx");
  const clockTex = useTexture("/models/clock/textures/Uhr_ohne_Zeiger.jpg") as THREE.Texture;
  clockTex.colorSpace = THREE.SRGBColorSpace;
  const clone = useMemo(() => {
    const c = fbx.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          map: clockTex, roughness: 0.55, metalness: 0.25,
        });
        (child as THREE.Mesh).castShadow = true;
      }
    });
    return c;
  }, [fbx, clockTex]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={clone} scale={[0.007, 0.007, 0.007]} />
    </group>
  );
}

function WallClock({ position, rotation = 0 }: {
  position: [number, number, number]; rotation?: number;
}) {
  return (
    <Suspense fallback={<WallClockProcedural position={position} rotation={rotation} />}>
      <WallClockFBX position={position} rotation={rotation} />
    </Suspense>
  );
}

// ── Server Rack OBJ ───────────────────────────────────────────────────────────
function ServerRackOBJInner({ position, rotation = 0 }: {
  position: [number, number, number]; rotation?: number;
}) {
  const materials = useLoader(MTLLoader, "/models/server-rack/server_computer.mtl");
  const obj = useLoader(OBJLoader, "/models/server-rack/server.obj", (loader) => {
    materials.preload();
    (loader as OBJLoader).setMaterials(materials);
  });
  const clone = useMemo(() => {
    const c = obj.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
    return c;
  }, [obj]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={clone} scale={[0.006, 0.006, 0.006]} />
    </group>
  );
}

function ServerRackOBJ({ position, rotation = 0 }: {
  position: [number, number, number]; rotation?: number;
}) {
  return (
    <Suspense fallback={<ServerRack position={position} />}>
      <ServerRackOBJInner position={position} rotation={rotation} />
    </Suspense>
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
  // Fixed bar heights for the accent chart — computed once
  const barHeights = useRef<number[]>(
    Array.from({ length: 5 }, () => 0.18 + Math.random() * 0.44)
  );
  useFrame((state) => {
    if (screenRef.current) {
      screenRef.current.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    }
  });
  // Screen face offset
  const sf = 0.065;
  // Screen dimensions: h=1.3, w=2.5 (along Z)
  const sh = 1.3, sw = 2.5;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, sh + 0.1, sw + 0.1]} />
        <meshStandardMaterial color="#080814" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Screen — dark navy background with glow */}
      <mesh position={[sf, 0, 0]}>
        <boxGeometry args={[0.02, sh, sw]} />
        <meshStandardMaterial ref={screenRef} color="#050510"
          emissive={color} emissiveIntensity={0.65} roughness={0.05} />
      </mesh>

      {/* Title bar — colour strip at top */}
      <mesh position={[sf + 0.011, sh * 0.38, 0]}>
        <boxGeometry args={[0.001, sh * 0.18, sw * 0.94]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={0.55} />
      </mesh>
      {/* Title text */}
      {label && (
        <Text position={[sf + 0.02, sh * 0.38, 0]} fontSize={0.09} color="#ffffff"
          anchorX="center" rotation={[0, Math.PI / 2, 0]} maxWidth={sw * 0.86}>
          {label}
        </Text>
      )}

      {/* Bullet point strips (body text lines) */}
      {[0.14, 0.52, 0.72, 0.88].map((widthRatio, i) => (
        <mesh key={`bp${i}`} position={[sf + 0.011, sh * 0.18 - i * sh * 0.135, -(sw * 0.42) + widthRatio * sw * 0.44]}>
          <boxGeometry args={[0.001, sh * 0.042, widthRatio * sw * 0.55]} />
          <meshStandardMaterial color="#c8d4f0" emissive="#c8d4f0" emissiveIntensity={0.9} transparent opacity={0.7} />
        </mesh>
      ))}
      {/* Bullet dot indicators */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`dot${i}`} position={[sf + 0.011, sh * 0.18 - i * sh * 0.135, -(sw * 0.44)]}>
          <boxGeometry args={[0.001, sh * 0.04, sh * 0.04]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
        </mesh>
      ))}

      {/* Bar chart — bottom portion */}
      {/* Baseline */}
      <mesh position={[sf + 0.011, -sh * 0.35, 0]}>
        <boxGeometry args={[0.001, 0.008, sw * 0.82]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} transparent opacity={0.4} />
      </mesh>
      {barHeights.current.map((h, i) => (
        <mesh key={`bc${i}`} position={[sf + 0.011, -sh * 0.35 + h / 2, -(sw * 0.36) + i * sw * 0.16]}>
          <boxGeometry args={[0.001, h, sw * 0.12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} transparent opacity={0.85} />
        </mesh>
      ))}
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

// 12 deterministic screen configurations — indices 3,7,11 are logo (used for wall monitors)
const SCREEN_CONFIGS: { contentType: MonitorContentType; color: string }[] = [
  { contentType: 'code',      color: '#4ade80' },  // 0  green terminal
  { contentType: 'excel',     color: '#10b981' },  // 1  teal spreadsheet
  { contentType: 'graph',     color: '#0ea5e9' },  // 2  blue bar chart
  { contentType: 'logo',      color: '#6366f1' },  // 3  company logo
  { contentType: 'dashboard', color: '#6366f1' },  // 4  indigo metrics
  { contentType: 'chart',     color: '#f59e0b' },  // 5  amber arc chart
  { contentType: 'code',      color: '#a78bfa' },  // 6  purple IDE
  { contentType: 'logo',      color: '#06b6d4' },  // 7  company logo
  { contentType: 'excel',     color: '#34d399' },  // 8  mint spreadsheet
  { contentType: 'graph',     color: '#ec4899' },  // 9  pink analytics
  { contentType: 'dashboard', color: '#06b6d4' },  // 10 cyan dashboard
  { contentType: 'logo',      color: '#a78bfa' },  // 11 company logo
];

// Non-logo entries for hash-based assignment to the 3 non-guaranteed slots per desk
const NON_LOGO_CONFIGS = SCREEN_CONFIGS.filter(c => c.contentType !== 'logo');

// MonitorBank — positions relative to the desk center [0,0,0].
// Guaranteed logos: lower-row positions 0 & 2, upper-row position 1 (center).
// hashX/hashZ are the absolute world coords used only for deterministic content hashing.
function MonitorBank({ hashX, hashZ, flip, color }: {
  hashX: number; hashZ: number; flip: boolean; color?: string;
}) {
  // flip=false → face -Z (faceRot=π); flip=true → face +Z (faceRot=0)
  const faceRot  = flip ? 0 : Math.PI;
  const monitorZ = flip ? -0.35 : 0.35;     // Z offset from desk centre
  const mw = 0.55, mh = 0.32, md = 0.04;
  const offsets   = [-0.65, 0, 0.65];
  const arcAngles = [0.18, 0, -0.18];       // outer screens curve toward chair
  const upperPitch = -0.15;

  return (
    <group>
      {/* ── Lower row: positions 0 & 2 → logo, position 1 → hash content ── */}
      {offsets.map((dx, i) => {
        const isLogo = i === 0 || i === 2;
        const cfg = isLogo
          ? { contentType: 'logo' as MonitorContentType, color: '#6366f1' }
          : NON_LOGO_CONFIGS[Math.abs(Math.round(hashX * 7.3 + hashZ * 4.7 + i * 13.1)) % NON_LOGO_CONFIGS.length];
        const logoVariant = Math.abs(Math.round(hashX * 3.7 + hashZ * 2.3 + i * 5.1)) % 2 === 0;
        return (
          <group key={`lo${i}`} position={[dx, 0.83, monitorZ]}
            rotation={[0, faceRot + (flip ? arcAngles[i] : -arcAngles[i]), 0]}>
            <mesh position={[0, mh / 2, 0]}>
              <boxGeometry args={[mw + 0.04, mh + 0.03, md]} />
              <meshStandardMaterial color="#101020" roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[0, mh / 2, md / 2 + 0.006]}>
              <boxGeometry args={[mw, mh, 0.008]} />
              <meshStandardMaterial color="#030310" emissive={cfg.color} emissiveIntensity={0.18} roughness={0.1} />
            </mesh>
            <MonitorScreenContent contentType={cfg.contentType} screenColor={cfg.color} sw={mw} sh={mh} size={mh / 0.44} logoVariant={isLogo ? logoVariant : undefined} />
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[0.04, 0.18, 0.04]} />
              <meshStandardMaterial color="#1a1a30" roughness={0.5} metalness={0.5} />
            </mesh>
          </group>
        );
      })}

      {/* ── Upper row: position 1 → logo, positions 0 & 2 → hash content ── */}
      {offsets.map((dx, i) => {
        const isLogo = i === 1;
        const cfg = isLogo
          ? { contentType: 'logo' as MonitorContentType, color: '#06b6d4' }
          : NON_LOGO_CONFIGS[Math.abs(Math.round(hashX * 7.3 + hashZ * 4.7 + (i + 3) * 13.1)) % NON_LOGO_CONFIGS.length];
        const logoVariant = Math.abs(Math.round(hashX * 3.7 + hashZ * 2.3 + (i + 3) * 5.1)) % 2 === 0;
        return (
          <group key={`hi${i}`} position={[dx, 0.83 + 0.45, monitorZ]}
            rotation={[upperPitch, faceRot + (flip ? arcAngles[i] : -arcAngles[i]), 0]}>
            <mesh position={[0, mh / 2, 0]}>
              <boxGeometry args={[mw + 0.04, mh + 0.03, md]} />
              <meshStandardMaterial color="#101020" roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[0, mh / 2, md / 2 + 0.006]}>
              <boxGeometry args={[mw, mh, 0.008]} />
              <meshStandardMaterial color="#030310" emissive={cfg.color} emissiveIntensity={0.18} roughness={0.1} />
            </mesh>
            <MonitorScreenContent contentType={cfg.contentType} screenColor={cfg.color} sw={mw} sh={mh} size={mh / 0.44} logoVariant={isLogo ? logoVariant : undefined} />
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[0.03, 0.08, 0.03]} />
              <meshStandardMaterial color="#1a1a30" roughness={0.5} metalness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Casing-only monitor bank — used for medium LOD level (no screen content textures/geometry)
function MonitorBankSimple({ flip }: { flip: boolean }) {
  const faceRot  = flip ? 0 : Math.PI;
  const monitorZ = flip ? -0.35 : 0.35;
  const mw = 0.55, mh = 0.32, md = 0.04;
  const offsets = [-0.65, 0, 0.65];
  return (
    <group>
      {[0, 1].map((row) =>
        offsets.map((dx, i) => (
          <group key={`${row}${i}`}
            position={[dx, 0.83 + row * 0.45, monitorZ]}
            rotation={[0, faceRot, 0]}>
            <mesh position={[0, mh / 2, 0]}>
              <boxGeometry args={[mw + 0.04, mh + 0.03, md]} />
              <meshStandardMaterial color="#101020" roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[0, mh / 2, md / 2 + 0.005]}>
              <boxGeometry args={[mw, mh, 0.006]} />
              <meshStandardMaterial color="#030310" emissive="#3344aa" emissiveIntensity={0.1} roughness={0.15} />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}

// DeskPod — each desk slot uses three LOD levels via drei <Detailed>:
//   0– 15 m: full detail (desk + 6 monitors with content + keyboard + chair)
//  15– 30 m: medium    (desk + casing-only monitors + chair)
//     >30 m: low       (single desk-top plane)
function DeskPod({ cx, cz, rotation = 0, colors, labels, rows = 2, cols = 3 }: {
  cx: number; cz: number; rotation?: number;
  colors?: string[]; labels?: string[];
  rows?: number; cols?: number;
}) {
  const spacingX = 2.2;
  const spacingZ = 4.0;
  return (
    <group rotation={[0, rotation, 0]}>
      {Array.from({ length: rows * cols }, (_, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x  = cx + (col - (cols - 1) / 2) * spacingX;
        const z  = cz + (row - (rows - 1) / 2) * spacingZ;
        const flip = row % 2 === 1;
        const rot  = flip ? Math.PI : 0;
        const sc   = colors?.[idx % (colors?.length ?? 1)] ?? "#6366f1";
        return (
          // Detailed is positioned at the desk's world coord; children use local [0,0,0]
          <Detailed key={idx} distances={[0, 15, 30]} position={[x, 0, z]}>
            {/* ── LOD 0: Full detail ── */}
            <group>
              <Desk position={[0, 0, 0]} rotation={rot} />
              <MonitorBank hashX={x} hashZ={z} flip={flip} color={sc} />
              <Keyboard position={[0, 0.77, flip ? 0.25 : -0.25]} rotation={rot} />
              <Chair position={[0, 0, flip ? 1.1 : -1.1]} rotation={rot} />
            </group>
            {/* ── LOD 1: Medium ── */}
            <group>
              <Desk position={[0, 0, 0]} rotation={rot} />
              <MonitorBankSimple flip={flip} />
              <Chair position={[0, 0, flip ? 1.1 : -1.1]} rotation={rot} />
            </group>
            {/* ── LOD 2: Low — just the desk surface ── */}
            <mesh position={[0, 0.76, 0]}>
              <boxGeometry args={[1.8, 0.07, 0.9]} />
              <meshStandardMaterial color="#1a1a30" roughness={0.4} metalness={0.2} />
            </mesh>
          </Detailed>
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

function LobbyArea() {
  const gold = "#c9a827";
  const marble = "#ede8e3";
  const darkSteel = "#1e2838";
  const mahogany = "#1e0a04";

  return (
    <group>
      {/* ── MARBLE LOBBY FLOOR OVERLAY ── */}
      <mesh position={[-21.5, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 18]} />
        <meshStandardMaterial color="#d8d4cc" roughness={0.08} metalness={0.05} />
      </mesh>
      {/* Marble grid lines */}
      {[-6, -3, 0, 3, 6].map((z, i) => (
        <mesh key={`mz${i}`} position={[-21.5, 0.007, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7, 0.03]} />
          <meshStandardMaterial color="#b0a898" roughness={0.1} />
        </mesh>
      ))}
      {[-24, -22, -20, -18].map((x, i) => (
        <mesh key={`mx${i}`} position={[x, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.03, 18]} />
          <meshStandardMaterial color="#b0a898" roughness={0.1} />
        </mesh>
      ))}

      {/* ── BRANDED WEST WALL PANEL ── */}
      <mesh position={[-24.8, 3.0, 0]}>
        <boxGeometry args={[0.12, 4.0, 8]} />
        <meshStandardMaterial color="#060608" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Gold horizontal accent strip */}
      <mesh position={[-24.75, 3.8, 0]}>
        <boxGeometry args={[0.05, 0.05, 8]} />
        <meshStandardMaterial color={gold} roughness={0.08} metalness={0.95} />
      </mesh>
      <mesh position={[-24.75, 2.2, 0]}>
        <boxGeometry args={[0.05, 0.05, 8]} />
        <meshStandardMaterial color={gold} roughness={0.08} metalness={0.95} />
      </mesh>
      <Text position={[-24.72, 3.0, 0]} fontSize={0.28} color={gold}
        anchorX="center" anchorY="middle" rotation={[0, Math.PI / 2, 0]}
        letterSpacing={0.12}>
        AI OA Ltd LABS · 40F
      </Text>

      {/* ── RECEPTION DESK — sleek dark with gold trim ── */}
      <group position={[-20.5, 0, 0]}>
        {/* Main desk body */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.6, 1.1, 3.8]} />
          <meshStandardMaterial color={mahogany} roughness={0.25} metalness={0.15} />
        </mesh>
        {/* Marble top */}
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[1.7, 0.06, 4.0]} />
          <meshStandardMaterial color={marble} roughness={0.06} metalness={0.05} />
        </mesh>
        {/* Gold edge trim front/back */}
        <mesh position={[0.86, 1.1, 0]}>
          <boxGeometry args={[0.02, 0.04, 4.0]} />
          <meshStandardMaterial color={gold} roughness={0.08} metalness={0.95} />
        </mesh>
        <mesh position={[-0.86, 1.1, 0]}>
          <boxGeometry args={[0.02, 0.04, 4.0]} />
          <meshStandardMaterial color={gold} roughness={0.08} metalness={0.95} />
        </mesh>
        {/* Company name on front face */}
        <mesh position={[0.81, 0.55, 0]}>
          <boxGeometry args={[0.02, 0.22, 1.6]} />
          <meshStandardMaterial color={gold} roughness={0.08} metalness={0.95} emissive={gold} emissiveIntensity={0.1} />
        </mesh>
        {/* Reception monitor */}
        <mesh position={[-0.4, 1.3, -0.8]}>
          <boxGeometry args={[0.06, 0.44, 0.72]} />
          <meshStandardMaterial color="#101020" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[-0.37, 1.3, -0.8]}>
          <boxGeometry args={[0.02, 0.38, 0.65]} />
          <meshStandardMaterial color="#020210" emissive="#8b5cf6" emissiveIntensity={0.7} roughness={0.05} />
        </mesh>
        {/* Keyboard */}
        <mesh position={[-0.12, 1.16, -0.6]}>
          <boxGeometry args={[0.04, 0.02, 0.35]} />
          <meshStandardMaterial color="#141428" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Sign-in tablet */}
        <mesh position={[-0.12, 1.14, 0.7]}>
          <boxGeometry args={[0.03, 0.02, 0.26]} />
          <meshStandardMaterial color={gold} roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[-0.1, 1.17, 0.7]}>
          <boxGeometry args={[0.02, 0.01, 0.22]} />
          <meshStandardMaterial color="#020210" emissive={gold} emissiveIntensity={0.7} />
        </mesh>
        {/* Vertical gold accent bars on front */}
        {[-1.5, -0.5, 0.5, 1.5].map((z, i) => (
          <mesh key={i} position={[0.82, 0.55, z]}>
            <boxGeometry args={[0.025, 0.9, 0.022]} />
            <meshStandardMaterial color={gold} roughness={0.08} metalness={0.95} />
          </mesh>
        ))}
      </group>

      {/* ── LIFT SHAFT ALCOVES — set into west wall ── */}
      {/* Lift A (z=-4) */}
      <mesh position={[-24.8, 2.75, -4]}>
        <boxGeometry args={[0.08, 5.5, 2.2]} />
        <meshStandardMaterial color="#0a0a18" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Lift B (z=+4) */}
      <mesh position={[-24.8, 2.75, 4]}>
        <boxGeometry args={[0.08, 5.5, 2.2]} />
        <meshStandardMaterial color="#0a0a18" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Floor indicator text above each lift */}
      <Text position={[-24.72, 5.88, -4]} fontSize={0.28} color={gold}
        anchorX="center" anchorY="middle" rotation={[0, Math.PI / 2, 0]}>
        40
      </Text>
      <Text position={[-24.72, 5.88, 4]} fontSize={0.28} color={gold}
        anchorX="center" anchorY="middle" rotation={[0, Math.PI / 2, 0]}>
        40
      </Text>

      {/* ── LOBBY SEATING — black leather visitor chairs ── */}
      {[
        [-22.5, -7, Math.PI / 2],
        [-22.5, -6, Math.PI / 2],
        [-22.5,  6, Math.PI / 2],
        [-22.5,  7, Math.PI / 2],
      ].map(([x, z, rot], i) => (
        <group key={`vs${i}`} position={[x, 0, z]} rotation={[0, rot, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.56, 0.07, 0.54]} />
            <meshStandardMaterial color="#0d0d0d" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.78, -0.24]}>
            <boxGeometry args={[0.54, 0.64, 0.08]} />
            <meshStandardMaterial color="#0d0d0d" roughness={0.7} />
          </mesh>
          {[[-0.25, -0.24], [0.25, -0.24], [-0.25, 0.24], [0.25, 0.24]].map(([lx, lz], j) => (
            <mesh key={j} position={[lx, 0.22, lz]}>
              <boxGeometry args={[0.04, 0.44, 0.04]} />
              <meshStandardMaterial color={gold} roughness={0.1} metalness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Connecting bench between seating pairs */}
      <mesh position={[-22.5, 0.4, -6.5]}>
        <boxGeometry args={[0.06, 0.8, 2.4]} />
        <meshStandardMaterial color={mahogany} roughness={0.3} />
      </mesh>
      <mesh position={[-22.5, 0.4, 6.5]}>
        <boxGeometry args={[0.06, 0.8, 2.4]} />
        <meshStandardMaterial color={mahogany} roughness={0.3} />
      </mesh>

      {/* ── STANDING LAMPS ── */}
      {[[-22, -7.5], [-22, 7.5]].map(([x, z], i) => (
        <group key={`lamp${i}`} position={[x, 0, z]}>
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

      {/* ── PLANTS in lobby corners ── */}
      <group position={[-23, 0, -8]}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.18, 0.15, 0.4, 8]} /><meshStandardMaterial color="#1a0a00" roughness={0.9} /></mesh>
        {[0, 0.9, 1.8, 2.7, 3.6].map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * (0.12 + i * 0.06), 0.45 + i * 0.14, Math.sin(angle) * (0.12 + i * 0.06)]} rotation={[0.5, angle, 0.3]}>
            <coneGeometry args={[0.18, 0.44, 5]} />
            <meshStandardMaterial color="#0a3016" roughness={0.9} />
          </mesh>
        ))}
      </group>
      <group position={[-23, 0, 8]}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.18, 0.15, 0.4, 8]} /><meshStandardMaterial color="#1a0a00" roughness={0.9} /></mesh>
        {[0, 0.9, 1.8, 2.7, 3.6].map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * (0.12 + i * 0.06), 0.45 + i * 0.14, Math.sin(angle) * (0.12 + i * 0.06)]} rotation={[0.5, angle, 0.3]}>
            <coneGeometry args={[0.18, 0.44, 5]} />
            <meshStandardMaterial color="#0a3016" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* ── FLOOR INDICATOR PANEL above gates (x=-18 side) ── */}
      <mesh position={[-17.9, 5.0, 0]}>
        <boxGeometry args={[0.08, 0.7, 7.2]} />
        <meshStandardMaterial color="#060608" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-17.86, 5.0, 0]}>
        <boxGeometry args={[0.02, 0.5, 7.0]} />
        <meshStandardMaterial color="#020202" emissive={gold} emissiveIntensity={0.25} />
      </mesh>
      <Text position={[-17.84, 5.0, 0]} fontSize={0.12} color={gold}
        anchorX="center" anchorY="middle" rotation={[0, Math.PI / 2, 0]} letterSpacing={0.06}>
        AI OA Ltd LABS — FLOOR 40 — PLEASE SCAN YOUR BADGE
      </Text>
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
      <Whiteboard position={[cx, 1.8, cz - 3.8]} rotation={-Math.PI / 2} text={label} />
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
      {/* Small screen at back of room */}
      <Monitor position={[cx, 1.55, cz - 1.4]} screenColor="#6366f1" active label={label} size={1.2} />
    </>
  );
}

// ─────────────────────────────────────────────
// Filing Cabinet (procedural, 3-drawer steel)
// ─────────────────────────────────────────────

function FilingCabinet({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const body  = "#1a1a28";
  const dark  = "#111118";
  const panel = "#141420";
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main body */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.55, 1.5, 0.65]} />
        <meshStandardMaterial color={body} roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 1.53, 0]}>
        <boxGeometry args={[0.57, 0.06, 0.67]} />
        <meshStandardMaterial color="#252535" roughness={0.3} metalness={0.55} />
      </mesh>
      {/* Drawer faces */}
      {[1.18, 0.74, 0.30].map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, 0.328]}>
            <boxGeometry args={[0.52, 0.36, 0.01]} />
            <meshStandardMaterial color={panel} roughness={0.4} metalness={0.45} />
          </mesh>
          {/* Handle */}
          <mesh position={[0, y, 0.338]}>
            <boxGeometry args={[0.18, 0.025, 0.01]} />
            <meshStandardMaterial color="#b0b0c8" roughness={0.15} metalness={0.9} />
          </mesh>
          {/* Handle brackets */}
          <mesh position={[-0.09, y, 0.334]}>
            <boxGeometry args={[0.014, 0.05, 0.015]} />
            <meshStandardMaterial color="#808098" roughness={0.2} metalness={0.85} />
          </mesh>
          <mesh position={[0.09, y, 0.334]}>
            <boxGeometry args={[0.014, 0.05, 0.015]} />
            <meshStandardMaterial color="#808098" roughness={0.2} metalness={0.85} />
          </mesh>
          {/* Label slot */}
          <mesh position={[0.15, y + 0.1, 0.336]}>
            <boxGeometry args={[0.14, 0.05, 0.005]} />
            <meshStandardMaterial color="#0a0a18" roughness={0.1} />
          </mesh>
        </group>
      ))}
      {/* Divider lines between drawers */}
      {[0.94, 0.52].map((y, i) => (
        <mesh key={i} position={[0, y, 0.326]}>
          <boxGeometry args={[0.52, 0.008, 0.003]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.8} />
        </mesh>
      ))}
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.55, 0.04, 0.65]} />
        <meshStandardMaterial color={dark} roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
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
      <LobbyArea />

      {/* ── LOBBY SOFAS — waiting area to the left of the reception desk ── */}
      {/* South cluster (visitor's left as they face the reception) */}
      <Sofa position={[-22.5, 0, -4.5]} rotation={-Math.PI / 2} />
      <Sofa position={[-22.5, 0, -2.8]} rotation={-Math.PI / 2} />
      <LobbyTable position={[-22.5, 0, -3.65]} />
      {/* Single sofa on the north side for balance */}
      <Sofa position={[-22.5, 0, 2.5]} rotation={-Math.PI / 2} />

      {/* ═══════════════════════════════════════
          TWO EXTRA ANALYTICS ROWS  (between south whiteboard wall and main analytics pod)
          Row A: desks z=-14, chairs z=-15.1 | Row B: desks z=-17, chairs z=-18.1
      ═══════════════════════════════════════ */}
      <DeskPod cx={0} cz={-14} rows={1} cols={3} colors={["#6366f1", "#8b5cf6", "#a855f7"]} />
      <DeskPod cx={0} cz={-17} rows={1} cols={3} colors={["#0ea5e9", "#6366f1", "#10b981"]} />

      {/* ═══════════════════════════════════════
          ANALYTICS POD  (Maya area ~[2, 0, -10])
      ═══════════════════════════════════════ */}
      {/* Front row */}
      <Desk position={[-1, 0, -9]} />
      <Desk position={[1.5, 0, -9]} />
      <Desk position={[4, 0, -9]} />
      <Monitor position={[-1, 0.83, -9.45]} screenColor="#6366f1" active codeLines={["df = load_pipeline()", "merged = df.merge(hist,", "  on='client_id')", "delta = merged['v2']-", "  merged['v1']", "print(delta.describe())"]} />
      <Monitor position={[1.5, 0.83, -9.45]} screenColor="#ef4444" active codeLines={["⚠  DEDUPLICATION", "Found 847 dupes", "client_id  count", "C-10294    3", "C-10891    2", "Run fix? [Y/N]"]} />
      <Monitor position={[4, 0.83, -9.45]} screenColor="#8b5cf6" active codeLines={["SELECT client_id,", "  SUM(value) AS total,", "  COUNT(*) AS rows", "FROM analytics.live", "GROUP BY client_id", "HAVING rows > 1"]} />
      <Keyboard position={[-1, 0.77, -9.2]} />
      <Keyboard position={[1.5, 0.77, -9.2]} />
      <Keyboard position={[4, 0.77, -9.2]} />
      <Chair position={[-1, 0, -8.2]} rotation={Math.PI} />
      <Chair position={[1.5, 0, -8.2]} rotation={Math.PI} />
      <Chair position={[4, 0, -8.2]} rotation={Math.PI} />

      {/* Validation report desk — interactable */}
      <Desk position={[4.5, 0, -10]} />
      <Monitor position={[4.5, 0.83, -10.45]} screenColor="#ef4444" active codeLines={["VALIDATION REPORT", "─────────────────", "Rows checked: 12,847", "Errors found:   391", "Dupes found:    847", "Status: REVIEW ⚠"]} />
      <Keyboard position={[4.5, 0.77, -10.2]} />
      <Chair position={[4.5, 0, -9.2]} rotation={Math.PI} />

      {/* ═══════════════════════════════════════
          OPEN PLAN — WEST ANALYTICS ROWS
      ═══════════════════════════════════════ */}
      <DeskPod cx={-6} cz={-10} colors={["#6366f1", "#8b5cf6"]} rows={2} cols={2} />
      <DeskPod cx={-10} cz={-10} colors={["#8b5cf6", "#6366f1"]} rows={2} cols={2} />
      <Whiteboard position={[-4.5, 1.8, -19.47]} rotation={-Math.PI / 2} text="Q4 ROADMAP" />
      <Whiteboard position={[1, 1.8, -19.47]} rotation={-Math.PI / 2} text="MODEL NOTES" />
      <Whiteboard position={[5.5, 1.8, -19.47]} rotation={-Math.PI / 2} text="DEMO PREP" />

      {/* ═══════════════════════════════════════
          BOARDROOM  (x: 8-18, z: -10 to -19)
      ═══════════════════════════════════════ */}
      <MeetingRoomContents cx={13} cz={-14.5} label="EXEC BOARDROOM" tvColor="#f59e0b" />

      {/* ═══════════════════════════════════════
          ENGINEERING  (Theo ~[9, 0, 4])
      ═══════════════════════════════════════ */}
      {/* Main engineering rows */}
      <DeskPod cx={9} cz={3.5} colors={["#0ea5e9", "#38bdf8", "#06b6d4"]} rows={2} cols={3}
        labels={["$ git push origin main", "PIPELINE ✓ 142/142", "CPU 34% MEM 61%", "STAGING: PASSING", "CI ✓ JEST 98%", "K8S: 3/3 pods UP"]} />
      <StandingDesk position={[13.5, 0, 4]} rotation={Math.PI / 2} />
      <Monitor position={[13.5, 1.13, 3.5]} screenColor="#0ea5e9" active label="BUILD STATUS" />
      <Keyboard position={[13.5, 1.07, 3.7]} rotation={Math.PI / 2} />
      <Whiteboard position={[9, 1.8, -9.73]} rotation={-Math.PI / 2} text="ARCHITECTURE" />

      {/* ═══════════════════════════════════════
          HUDDLE ROOM A  (~[11, 0, 10.5])
      ═══════════════════════════════════════ */}
      <SmallMeetingRoom cx={11} cz={10.5} label="ENGINEERING SYNC" />

      {/* ═══════════════════════════════════════
          OPS ZONE  (~[-8, 0, 3])
      ═══════════════════════════════════════ */}
      <DeskPod cx={-8.5} cz={3.5} colors={["#06b6d4", "#0ea5e9"]}
        labels={["UPTIME 99.97%", "ALERTS: 1 WARN", "SLA 98.4%", "DB REPL OK"]} rows={2} cols={2} />

      {/* ═══════════════════════════════════════
          COMPLIANCE POD  (Priya ~[-2, 0, 12])
      ═══════════════════════════════════════ */}
      {/* COMPLIANCE POD (Priya ~[-2, 0, 12]) */}
      {/* Front desks + chairs removed — were blocking the glass room door */}
      <Desk position={[-3, 0, 13]} rotation={Math.PI} />
      <Desk position={[-0.5, 0, 13]} rotation={Math.PI} />
      {/* Back monitors: far side of back desk, screen faces toward chair at z=13.8 */}
      <DualMonitorSetup position={[-3, 0.76, 12.55]} colors={["#10b981", "#059669"]} labels={["AUDIT LOG", "REPORTS"]} />
      <Monitor position={[-0.5, 0.83, 12.55]} screenColor="#059669" active />
      {/* Back chairs: person faces north (-z) toward desk at z=13 */}
      <Chair position={[-3, 0, 13.8]} rotation={Math.PI} />
      <Chair position={[-0.5, 0, 13.8]} rotation={Math.PI} />
      {/* RISK MATRIX — moved to north wall inside room, faces south into room */}
      <Whiteboard position={[-2.5, 1.8, 17.6]} rotation={Math.PI / 2} text="RISK MATRIX" />

      {/* ═══════════════════════════════════════
          HUDDLE ROOM B  (~[-2.5, 0, 14])
      ═══════════════════════════════════════ */}
      <SmallMeetingRoom cx={-2.5} cz={15} label="COMPLIANCE REVIEW" />

      {/* ═══════════════════════════════════════
          COFFEE / BREAKOUT  (~[-10, 0, 14])
      ═══════════════════════════════════════ */}
      <CoffeeStation position={[-10, 0, 14.5]} />
      <LoungeArea cx={-15} cz={14} />
      {/* Sofa pair near the coffee station — facing each other across a table */}
      <Sofa position={[-12.5, 0, 12]} rotation={Math.PI / 2} />
      <Sofa position={[-12.5, 0, 16]} rotation={-Math.PI / 2} />
      <LobbyTable position={[-12.5, 0, 14]} />

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

      {/* ═══════════════════════════════════════
          CENTRAL OPEN PLAN — MID OFFICE
      ═══════════════════════════════════════ */}
      {/* Central pod moved 2 units north (cz=0) to open a consistent aisle after analytics rows */}
      <DeskPod cx={1} cz={0} colors={["#6366f1", "#8b5cf6", "#a855f7"]} rows={3} cols={3}
        labels={["Q3 REVENUE +9.6%", "APAC GROWTH +6.3%", "AMER PIPELINE +11.2%", "=VLOOKUP(A2,Sheet2!A:C,3,0)", "PIVOT: By Region Q3", "FORECAST 2024", "0 CRITICAL ERRORS", "API LATENCY 42ms", "BUILD ✓ DEPLOY READY"]} />
      {/* Engineering north extension */}
      <DeskPod cx={5} cz={8} rows={2} cols={2} colors={["#0ea5e9","#38bdf8"]} />
      {/* Analytics west extension */}
      <PrinterStation position={[-4, 0, 0.5]} />
      <PrinterStation position={[5.5, 0, -6.5]} />

      {/* ── Sofas near server room — informal seating outside NE corner ── */}
      <Sofa position={[16, 0, 7.5]} rotation={Math.PI} />
      <Sofa position={[18.5, 0, 7.5]} rotation={Math.PI} />
      <LobbyTable position={[17.25, 0, 7.5]} />

      {/* ═══════════════════════════════════════
          SERVER ROOM — NE CORNER
          rotation=-π/2 → model front faces west (-X), toward office interior
      ═══════════════════════════════════════ */}
      <ServerRackOBJ position={[21.5, 0, 9]}  rotation={-Math.PI / 2} />
      <ServerRackOBJ position={[21.5, 0, 12]} rotation={-Math.PI / 2} />
      <ServerRackOBJ position={[21.5, 0, 15]} rotation={-Math.PI / 2} />
      {/* Server room cooling units */}
      <mesh position={[23.5, 1.0, 12]}>
        <boxGeometry args={[0.5, 2.0, 4]} />
        <meshStandardMaterial color="#0a0a1a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[23.5, 1.5, 12]}>
        <boxGeometry args={[0.52, 0.05, 4.05]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* ═══════════════════════════════════════
          DASHBOARD WALL — EAST
          Flat logo panels already mounted by OfficeScene LogoPanel; WallTVs removed
          to prevent geometry protruding from the east glass wall.
      ═══════════════════════════════════════ */}

      {/* ═══════════════════════════════════════
          WALL CLOCKS — mounted on walls throughout office
          Positions: [x, height, z], rotation faces clock away from wall
      ═══════════════════════════════════════ */}
      {/* North wall — face south, rotation=Math.PI */}
      <WallClock position={[-8, 2.9, 19.3]}  rotation={Math.PI} />
      <WallClock position={[5,  2.9, 19.3]}  rotation={Math.PI} />
      {/* South wall — face north, rotation=0 */}
      <WallClock position={[0,  2.9, -19.3]} rotation={0} />
      {/* West wall — face east, rotation=Math.PI / 2 */}
      <WallClock position={[-24.3, 2.9, -5]} rotation={Math.PI / 2} />
      <WallClock position={[-24.3, 2.9, 10]} rotation={Math.PI / 2} />
      {/* East wall — face west, rotation=-Math.PI / 2 */}
      <WallClock position={[24.3, 2.9, -5]}  rotation={-Math.PI / 2} />

      {/* ═══════════════════════════════════════
          FILING CABINETS — side-by-side, drawers facing office interior
          rotation=Math.PI/2  → drawers face east (+X)
          rotation=-Math.PI/2 → drawers face west (-X)
          rotation=Math.PI    → drawers face south (-Z)
      ═══════════════════════════════════════ */}
      {/* West wall — 8 side-by-side, drawers face east (+X) toward office */}
      {[4.5,5.15,5.8,6.45,7.1,7.75,8.4,9.05].map((z, i) => (
        <FilingCabinet key={`wc${i}`} position={[-23.5, 0, z]} rotation={Math.PI / 2} />
      ))}
      {/* West wall second cluster — near south end */}
      {[-5,-4.35,-3.7,-3.05].map((z, i) => (
        <FilingCabinet key={`wc2${i}`} position={[-23.5, 0, z]} rotation={Math.PI / 2} />
      ))}
      {/* North wall — 9 side-by-side, drawers face south (-Z) toward office */}
      {[-16,-15.3,-14.6,-13.9,-13.2,-12.5,-11.8,-11.1,-10.4].map((x, i) => (
        <FilingCabinet key={`nc${i}`} position={[x, 0, 19.1]} rotation={Math.PI} />
      ))}
      {/* North wall second cluster — east section */}
      {[6,6.7,7.4,8.1].map((x, i) => (
        <FilingCabinet key={`nc2${i}`} position={[x, 0, 19.1]} rotation={Math.PI} />
      ))}
      {/* East side (south of server room) — 7 side-by-side, drawers face west (-X) */}
      {[2.0,2.65,3.3,3.95,4.6,5.25,5.9].map((z, i) => (
        <FilingCabinet key={`ec${i}`} position={[23.5, 0, z]} rotation={-Math.PI / 2} />
      ))}
      {/* Coffee/compliance area — 5 side-by-side, drawers face south */}
      {[-7.0,-6.35,-5.7,-5.05,-4.4].map((x, i) => (
        <FilingCabinet key={`cc${i}`} position={[x, 0, 9.1]} rotation={Math.PI} />
      ))}
      {/* West wall third cluster — near south end, drawers face east */}
      {[-14,-13.35,-12.7,-12.05].map((z, i) => (
        <FilingCabinet key={`ws${i}`} position={[-23.5, 0, z]} rotation={Math.PI / 2} />
      ))}

    </>
  );
}

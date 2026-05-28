"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Daytime London from Canary Wharf, 40th floor
// Office bounds: X -25..25, Z -20..20
// Buildings outside these bounds; y = h/2 - 12 (floor at y=-12)

// ─── Primitive helpers ────────────────────────────────────────────────────────

// Building: glass=true → deep blue transparent curtain wall; glass=false → solid concrete
function Building({
  x, y, z, w, h, d, color, glass = false,
}: {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  color: string; glass?: boolean;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={color}
        roughness={glass ? 0.04 : 0.65}
        metalness={glass ? 0.15 : 0.08}
        transparent={glass}
        opacity={glass ? 0.82 : 1.0}
      />
    </mesh>
  );
}

// Aluminium curtain-wall mullions — horizontal spandrel bands + vertical fins
// Only applied to close/landmark buildings for performance
function GlassMullions({
  x, y, z, w, h, d,
}: {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
}) {
  const hBands = Math.ceil(h / 3.4);
  const vBands = Math.ceil(w / 1.8) + 1;
  const dBands = Math.ceil(d / 1.8) + 1;
  const ALU = "#7a8fa0";
  const aluMat = { roughness: 0.18, metalness: 0.88 };
  return (
    <group position={[x, y, z]}>
      {/* Horizontal spandrel bands wrapping all faces */}
      {Array.from({ length: hBands }, (_, i) => (
        <mesh key={`hb${i}`} position={[0, -h / 2 + i * (h / hBands), 0]}>
          <boxGeometry args={[w + 0.02, 0.07, d + 0.02]} />
          <meshStandardMaterial color={ALU} {...aluMat} />
        </mesh>
      ))}
      {/* Vertical mullions — front face (+Z) */}
      {Array.from({ length: vBands }, (_, i) => (
        <mesh key={`vf${i}`} position={[-w / 2 + i * (w / Math.max(vBands - 1, 1)), 0, d / 2 + 0.01]}>
          <boxGeometry args={[0.07, h + 0.02, 0.05]} />
          <meshStandardMaterial color={ALU} {...aluMat} />
        </mesh>
      ))}
      {/* Vertical mullions — back face (-Z) */}
      {Array.from({ length: vBands }, (_, i) => (
        <mesh key={`vb${i}`} position={[-w / 2 + i * (w / Math.max(vBands - 1, 1)), 0, -d / 2 - 0.01]}>
          <boxGeometry args={[0.07, h + 0.02, 0.05]} />
          <meshStandardMaterial color={ALU} {...aluMat} />
        </mesh>
      ))}
      {/* Vertical mullions — left face (-X) */}
      {Array.from({ length: dBands }, (_, i) => (
        <mesh key={`vl${i}`} position={[-w / 2 - 0.01, 0, -d / 2 + i * (d / Math.max(dBands - 1, 1))]}>
          <boxGeometry args={[0.05, h + 0.02, 0.07]} />
          <meshStandardMaterial color={ALU} {...aluMat} />
        </mesh>
      ))}
      {/* Vertical mullions — right face (+X) */}
      {Array.from({ length: dBands }, (_, i) => (
        <mesh key={`vr${i}`} position={[w / 2 + 0.01, 0, -d / 2 + i * (d / Math.max(dBands - 1, 1))]}>
          <boxGeometry args={[0.05, h + 0.02, 0.07]} />
          <meshStandardMaterial color={ALU} {...aluMat} />
        </mesh>
      ))}
    </group>
  );
}

// Aluminium accent fin / frame strip
function GlassStripe({
  x, y, z, w, h, d, color,
}: {
  x: number; y: number; z: number;
  w: number; h: number; d: number; color: string;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.12} metalness={0.90} />
    </mesh>
  );
}

function WindowGrid({
  x, baseY, z, cols, rows, spacingX, spacingY, facingZ = false,
}: {
  x: number; baseY: number; z: number;
  cols: number; rows: number;
  spacingX: number; spacingY: number;
  facingZ?: boolean;
}) {
  const windows = useMemo(() => {
    const arr: { px: number; py: number; pz: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        arr.push({
          px: facingZ ? x + (c - cols / 2) * spacingX : x,
          py: baseY + r * spacingY,
          pz: facingZ ? z : z + (c - cols / 2) * spacingX,
        });
      }
    }
    return arr;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {windows.map((w, i) => (
        <mesh key={i} position={[w.px, w.py, w.pz]}>
          <planeGeometry args={[spacingX * 0.6, spacingY * 0.6]} />
          <meshStandardMaterial
            color="#c8e8ff"
            roughness={0.02}
            metalness={0.9}
            transparent
            opacity={0.70}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── One Canada Square (iconic pyramid top) ───────────────────────────────────

function OneCanadaSquare() {
  const x = 52, z = 0;
  const h = 72;
  return (
    <group>
      {/* Main glass shaft — stainless-steel / dark blue glass like the real tower */}
      <Building x={x} y={h / 2 - 12} z={z} w={10} h={h} d={10} color="#1a4d82" glass />
      <GlassMullions x={x} y={h / 2 - 12} z={z} w={10} h={h} d={10} />
      {/* Pyramid top */}
      <mesh position={[x, h - 12 + 5, z]}>
        <coneGeometry args={[7.1, 10, 4]} />
        <meshStandardMaterial color="#1a4d82" roughness={0.04} metalness={0.15} transparent opacity={0.88} />
      </mesh>
      {/* Spire beacon */}
      <mesh position={[x, h - 12 + 10.5, z]}>
        <sphereGeometry args={[0.25, 6, 6]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

// ─── HSBC Tower ───────────────────────────────────────────────────────────────

function HSBCTower() {
  const x = 64, z = -10;
  const h = 54;
  return (
    <group>
      <Building x={x} y={h / 2 - 12} z={z} w={12} h={h} d={9} color="#124868" glass />
      <GlassMullions x={x} y={h / 2 - 12} z={z} w={12} h={h} d={9} />
      <Building x={x} y={h - 8} z={z} w={9} h={6} d={7} color="#0e3d58" glass />
      <Building x={x} y={h + 2} z={z} w={6} h={10} d={5} color="#0c3550" glass />
    </group>
  );
}

// ─── Citigroup Centre (sloping top) ──────────────────────────────────────────

function CitigroupCentre() {
  const x = 46, z = -16;
  const h = 48;
  return (
    <group>
      <Building x={x} y={h / 2 - 12} z={z} w={10} h={h} d={8} color="#155076" glass />
      <GlassMullions x={x} y={h / 2 - 12} z={z} w={10} h={h} d={8} />
      {/* Sloped cap */}
      <mesh position={[x + 1, h - 8, z]}>
        <boxGeometry args={[10, 8, 8]} />
        <meshStandardMaterial color="#0e3d60" roughness={0.05} metalness={0.15} transparent opacity={0.85} />
      </mesh>
      {/* Aluminium pyramid cap detail */}
      <mesh position={[x + 3, h - 5, z]}>
        <cylinderGeometry args={[0, 4, 6, 4]} />
        <meshStandardMaterial color="#7a8fa0" roughness={0.18} metalness={0.88} />
      </mesh>
    </group>
  );
}

// ─── JPMorgan Tower ──────────────────────────────────────────────────────────

function JPMorganTower() {
  const x = 78, z = 8;
  const h = 60;
  return (
    <group>
      <Building x={x} y={h / 2 - 12} z={z} w={13} h={h} d={11} color="#0f4a7e" glass />
      <GlassMullions x={x} y={h / 2 - 12} z={z} w={13} h={h} d={11} />
      {/* Corner structural fins */}
      {[-5, 0, 5].map((oz, i) => (
        <GlassStripe key={i} x={x - 6.6} y={h / 2 - 12} z={z + oz}
          w={0.07} h={h - 4} d={2.2} color="#7a8fa0" />
      ))}
      <Building x={x} y={h - 8} z={z} w={10} h={8} d={9} color="#0c3d6e" glass />
      {/* Antenna mast */}
      <mesh position={[x, h - 3, z]}>
        <cylinderGeometry args={[0.2, 0.2, 12, 6]} />
        <meshStandardMaterial color="#7a8fa0" roughness={0.25} metalness={0.85} />
      </mesh>
    </group>
  );
}

// ─── Barclays HQ ─────────────────────────────────────────────────────────────

function BarclaysHQ() {
  const x = 60, z = 12;
  const h = 52;
  return (
    <group>
      <Building x={x} y={h / 2 - 12} z={z} w={11} h={h} d={9} color="#13456e" glass />
      <GlassMullions x={x} y={h / 2 - 12} z={z} w={11} h={h} d={9} />
      {/* Rooftop parapet */}
      <Building x={x} y={h - 7} z={z} w={12} h={2} d={10} color="#7a8fa0" />
    </group>
  );
}

// ─── Twin tower complex (Credit Suisse / KPMG style) ─────────────────────────

function TwinTowerBlock() {
  return (
    <group>
      {/* Tower A — tall */}
      <Building x={70} y={45 - 12} z={-6} w={8} h={90} d={8} color="#0e5280" glass />
      <GlassMullions x={70} y={45 - 12} z={-6} w={8} h={90} d={8} />
      {/* Tower B — slightly shorter */}
      <Building x={70} y={38 - 12} z={6} w={8} h={76} d={8} color="#124e7a" glass />
      <GlassMullions x={70} y={38 - 12} z={6} w={8} h={76} d={8} />
      {/* Low podium linking them */}
      <Building x={70} y={8 - 12} z={0} w={10} h={16} d={22} color="#0c3d60" glass />
    </group>
  );
}

// ─── Close East buildings (pushed back — furthest from office wall) ───────────
// All x values shifted +12 from original so the nearest building is ~15 units
// from the office east glass wall at x=25, giving a proper street-level gap.

function CloseEastBuildings() {
  return (
    <group>
      {/* Tall slim glass tower */}
      <group>
        <Building x={40} y={40 - 12} z={-5} w={7} h={80} d={7} color="#0f5290" glass />
        <GlassMullions x={40} y={40 - 12} z={-5} w={7} h={80} d={7} />
        {/* Spire */}
        <mesh position={[40, 80 - 12 + 6, -5]}>
          <cylinderGeometry args={[0.15, 0.15, 12, 6]} />
          <meshStandardMaterial color="#7a8fa0" roughness={0.25} metalness={0.85} />
        </mesh>
      </group>

      {/* Stepped setback tower */}
      <group>
        <Building x={44} y={55 - 12} z={10} w={9} h={110} d={8} color="#1a5a90" glass />
        <GlassMullions x={44} y={55 - 12} z={10} w={9} h={110} d={8} />
        <Building x={44} y={80 - 12} z={10} w={7} h={50} d={6} color="#155088" glass />
        <Building x={44} y={95 - 12} z={10} w={5} h={30} d={4} color="#104480" glass />
      </group>

      {/* Wide flat-top office block */}
      <group>
        <Building x={50} y={30 - 12} z={-12} w={14} h={60} d={10} color="#104878" glass />
        <GlassMullions x={50} y={30 - 12} z={-12} w={14} h={60} d={10} />
        {/* Rooftop parapet */}
        <Building x={50} y={60} z={-12} w={15} h={2} d={11} color="#7a8fa0" />
      </group>

      {/* Wedge-shaped tower with angled top */}
      <group>
        <Building x={48} y={35 - 12} z={15} w={8} h={70} d={9} color="#124e80" glass />
        <GlassMullions x={48} y={35 - 12} z={15} w={8} h={70} d={9} />
        <mesh position={[48, 35 + 35 + 4, 15]}>
          <boxGeometry args={[8, 8, 9]} />
          <meshStandardMaterial color="#0e4070" roughness={0.05} metalness={0.15} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* Cylindrical glass tower */}
      <group>
        <mesh position={[42, 22 - 12, 6]}>
          <cylinderGeometry args={[3, 3, 44, 20]} />
          <meshStandardMaterial color="#10507a" roughness={0.04} metalness={0.14} transparent opacity={0.80} />
        </mesh>
        {/* Horizontal ring bands */}
        {Array.from({ length: 13 }, (_, i) => (
          <mesh key={i} position={[42, 22 - 12 - 22 + i * 3.6, 6]}>
            <cylinderGeometry args={[3.08, 3.08, 0.07, 20, 1, true]} />
            <meshStandardMaterial color="#7a8fa0" roughness={0.18} metalness={0.88} side={THREE.BackSide} />
          </mesh>
        ))}
        <mesh position={[42, 22 - 12 + 22, 6]}>
          <cylinderGeometry args={[3, 1, 6, 20]} />
          <meshStandardMaterial color="#0c3d60" roughness={0.05} metalness={0.15} transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Mid-distance East towers (x=60-130) ─────────────────────────────────────

// [x, z, w, d, h, color, glass]
const MID_EAST_DATA: [number, number, number, number, number, string, boolean][] = [
  // Deep blue glass towers close-mid
  [85,  -6,  10, 44, 38, "#0e4878", true],
  [90,  16,   9, 38, 32, "#135284", true],
  [78, -20,   8, 36, 30, "#0c4070", true],
  [100,  4,  12, 32, 28, "#104e7e", true],
  [110, -12, 10, 28, 24, "#0e4878", true],
  [120,  8,  11, 34, 26, "#124d80", true],
  [95,  24,   8, 26, 22, "#104878", true],
  // Background — glass, distant dark blue
  [130, -8,  14, 22, 20, "#0b3060", true],
  [115, 20,   9, 20, 18, "#0a2e5e", true],
  // Additional mid towers — glass
  [70,  -5,  11, 40, 34, "#104878", true],
  [72,  18,   9, 35, 28, "#0e4d7a", true],
  [80,   0,  10, 38, 32, "#104878", true],
  [88, -18,   8, 30, 26, "#0c4270", true],
  // Distant mid — glass, deep dark blue
  [98,  12,  10, 32, 24, "#0a3060", true],
  [105, -20,  9, 28, 22, "#0a2e5e", true],
  [118,  -2, 11, 26, 20, "#092c5c", true],
  [125,  18, 10, 24, 18, "#092a58", true],
  [112,  -8,  8, 22, 16, "#092856", true],
  // More glass mid
  [92,  -14, 10, 30, 24, "#104878", true],
  [83,   10,  9, 34, 28, "#0f4d7c", true],
];

function MidEastTowers() {
  return (
    <>
      {MID_EAST_DATA.map(([x, z, w, d, h, color, glass], i) => (
        <group key={i}>
          <Building x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} color={color} glass={glass} />
          {glass && x <= 110 && (
            <GlassMullions x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} />
          )}
        </group>
      ))}
    </>
  );
}

// ─── Far East towers (x=130-180) — atmospheric silhouette ────────────────────

const FAR_EAST_DATA: [number, number, number, number, number, string, boolean][] = [
  [140,   4, 16, 18, 14, "#0d3a5a", true],
  [150, -16, 12, 16, 14, "#0c3858", true],
  [160,  12, 18, 14, 12, "#0b3456", true],
  [170,  -4, 20, 12, 10, "#0a3052", true],
  [145,  20, 14, 15, 12, "#0c3858", true],
  [155,   8, 16, 13, 11, "#0b3456", true],
  [165, -10, 18, 11, 10, "#0a3052", true],
  [175,  16, 22, 10,  9, "#093050", true],
];

function FarEastTowers() {
  return (
    <>
      {FAR_EAST_DATA.map(([x, z, w, d, h, color, glass], i) => (
        <group key={i}>
          <Building x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} color={color} glass={glass} />
          {glass && x <= 158 && (
            <GlassMullions x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} />
          )}
        </group>
      ))}
    </>
  );
}

// ─── West towers (City of London) ────────────────────────────────────────────

const WEST_DATA: [number, number, number, number, number, string, boolean][] = [
  // close glass towers — Canary Wharf blue glass with aluminium mullions
  [-30,  -4,  9, 9,  52, "#104878", true],
  [-35,  10,  8, 8,  44, "#0e4570", true],
  [-40, -12,  7, 7,  38, "#0e4878", true],
  [-45,   2, 10, 10, 36, "#0f4878", true],
  [-38,  18,  6, 6,  30, "#0d4474", true],
  [-50,  -8, 11, 11, 32, "#104878", true],
  [-42, -20,  8, 8,  28, "#0d4272", true],
  [-55,  14,  9, 9,  26, "#0c4070", true],
  // mid distance — all glass, slightly darker
  [-60,   0, 11, 11, 24, "#0d3d6e", true],
  [-70,  -8,  8, 8,  20, "#0c3a6a", true],
  [-65,  15, 10, 10, 22, "#0b3868", true],
  [-80,   5, 10, 10, 18, "#0b3464", true],
  [-85, -12, 14, 14, 16, "#0a3060", true],
  [-90,  -5, 14, 14, 14, "#0a2e5e", true],
  [-100,  10, 16, 16, 12, "#092c5a", true],
  [-110, -8, 18, 18, 10, "#092a58", true],
  [-120,  2, 20, 20, 10, "#082856", true],
];

function WestTowers() {
  return (
    <>
      {WEST_DATA.map(([x, z, w, d, h, color, glass], i) => (
        <group key={i}>
          <Building x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} color={color} glass={glass} />
          {glass && Math.abs(x) <= 75 && (
            <GlassMullions x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} />
          )}
        </group>
      ))}
    </>
  );
}

// ─── South towers (Docklands / Isle of Dogs) ─────────────────────────────────

const SOUTH_DATA: [number, number, number, number, number, string, boolean][] = [
  [-10, -28,  8, 8,  28, "#0f4878", true],
  [  5, -30, 10, 10, 34, "#104d80", true],
  [ 18, -28,  8, 8,  28, "#0e4878", true],
  [ -5, -40, 12, 12, 24, "#0e4878", true],
  [ 12, -40,  9, 9,  26, "#0d4474", true],
  [ 30, -35,  7, 7,  22, "#0c4070", true],
  [-28, -35,  6, 6,  20, "#0c3d6e", true],
  [ 42, -45, 11, 11, 22, "#0b3a6a", true],
  [-42, -45,  9, 9,  18, "#0b3868", true],
  [  0, -55, 22, 22, 16, "#0a3464", true],
  [ 20, -55, 14, 14, 18, "#0a3060", true],
  [-20, -60, 16, 16, 14, "#092e5e", true],
  [ 38, -65, 18, 18, 12, "#092c5a", true],
  [-38, -70, 18, 18, 12, "#082a56", true],
];

function SouthTowers() {
  return (
    <>
      {SOUTH_DATA.map(([x, z, w, d, h, color, glass], i) => (
        <group key={i}>
          <Building x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} color={color} glass={glass} />
          {glass && Math.abs(z) <= 50 && (
            <GlassMullions x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} />
          )}
        </group>
      ))}
    </>
  );
}

// ─── North towers (Greenwich / Stratford) ────────────────────────────────────

const NORTH_DATA: [number, number, number, number, number, string, boolean][] = [
  [-10, 28,  7, 7,  26, "#104878", true],
  [  5, 30,  9, 9,  32, "#0f4d7e", true],
  [ 20, 28,  8, 8,  28, "#104878", true],
  [ -5, 40, 12, 12, 22, "#0c3a6a", true],
  [ 15, 40,  8, 8,  24, "#0b3868", true],
  [-25, 35,  6, 6,  20, "#0c3d6e", true],
  [ 35, 40, 10, 10, 22, "#0b3464", true],
  [-18, 50, 10, 10, 18, "#0a3060", true],
  [ 25, 55, 12, 12, 16, "#0a2e5e", true],
  [  0, 60, 16, 16, 14, "#092c5a", true],
  [ 40, 60, 14, 14, 12, "#092a58", true],
  [-35, 65, 16, 16, 12, "#082856", true],
];

function NorthTowers() {
  return (
    <>
      {NORTH_DATA.map(([x, z, w, d, h, color, glass], i) => (
        <group key={i}>
          <Building x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} color={color} glass={glass} />
          {glass && z <= 50 && (
            <GlassMullions x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} />
          )}
        </group>
      ))}
    </>
  );
}

// ─── Thames ───────────────────────────────────────────────────────────────────

function Thames() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.06 + Math.sin(state.clock.elapsedTime * 0.6) * 0.02;
    }
  });
  return (
    <>
      {/* Main river — east of Canary Wharf, curving south */}
      <mesh position={[80, -16, -25]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[320, 80]} />
        <meshStandardMaterial ref={matRef}
          color="#6a8faa" roughness={0.04} metalness={0.7}
          emissive="#4a6a8a" emissiveIntensity={0.06} />
      </mesh>
      {/* Sun glint streaks */}
      {[40, 55, 70, 85, 100, 120, 140].map((x, i) => (
        <mesh key={i} position={[x, -15.8, -20 + (i - 3) * 6]} rotation={[-Math.PI / 2, 0, 0.1]}>
          <planeGeometry args={[6, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.01} metalness={1}
            transparent opacity={0.12 + i * 0.015} />
        </mesh>
      ))}
    </>
  );
}

// ─── Ground / city base ──────────────────────────────────────────────────────

function CityGround() {
  return (
    <>
      {/* Main ground plane — extends 500 units in all directions */}
      <mesh position={[0, -18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#9aa0a8" roughness={0.95} />
      </mesh>
      {/* Road grid lines — Z direction */}
      {[-60, -45, -30, -15, 0, 15, 30, 45, 60, 75, 90].map((z, i) => (
        <mesh key={`rz${i}`} position={[50, -17.8, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[400, 0.4]} />
          <meshStandardMaterial color="#808890" roughness={0.9} />
        </mesh>
      ))}
      {/* Road grid lines — X direction */}
      {[-80, -60, -40, -20, 0, 30, 45, 60, 75, 90, 110, 130, 150].map((x, i) => (
        <mesh key={`rx${i}`} position={[x, -17.8, -10]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 200]} />
          <meshStandardMaterial color="#808890" roughness={0.9} />
        </mesh>
      ))}
      {/* Low rise foreground blocks near office */}
      {[
        [28, -25, 5, 5, 8], [32, -18, 4, 6, 6], [26, 18, 5, 4, 7],
        [30, 22, 6, 5, 8], [60, -25, 8, 7, 10], [65, 24, 7, 6, 9],
        [-30, -28, 8, 6, 10], [-28, 22, 7, 5, 8],
        [-26, -5, 5, 4, 6], [-27, 8, 6, 5, 7],
        [26, -8, 5, 5, 9], [27, 5, 4, 4, 6],
        [0, -24, 8, 4, 5], [10, -23, 6, 4, 4],
      ].map(([x, z, w, d, h], i) => (
        <mesh key={i} position={[x, h / 2 - 18, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#8a9099" roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}

// ─── Clouds ──────────────────────────────────────────────────────────────────

const CLOUD_SEEDS: [number, number, number][] = [
  [30,  140, -80],
  [60,  160,  60],
  [100, 155, -30],
  [80,  145,  30],
  [120, 150, -60],
  [150, 140,  20],
  [-40, 130, -50],
  [-60, 150,  80],
  [-80, 138,  50],
  [-100, 145, -20],
  [-130, 142,  40],
  [10,  135, -100],
  [-20, 142, 120],
  [50,  148, -120],
  [20,  155,  140],
  [-30, 138,  160],
  [0,   160,   0],
  [40,  148, -140],
  [-50, 145,  -90],
  [70,  142,  100],
  [-10, 150, -60],
  [90,  158,  70],
  [-70, 135,  10],
  [110, 143, -100],
];

const CLOUD_BLOBS: { ox: number; oy: number; oz: number; r: number }[][] = CLOUD_SEEDS.map((_, ci) => {
  const n = 4 + (ci % 4);
  return Array.from({ length: n }, (__, bi) => {
    const t = ci * 7 + bi * 13;
    return {
      ox: ((t * 17 + 5) % 24) - 12,
      oy: ((t * 11 + 3) % 6) - 3,
      oz: ((t * 19 + 7) % 12) - 6,
      r: 4 + ((t * 23) % 6),
    };
  });
});

function Clouds() {
  return (
    <>
      {CLOUD_SEEDS.map(([cx, cy, cz], ci) => (
        <group key={ci} position={[cx, cy, cz]}>
          {CLOUD_BLOBS[ci].map((b, bi) => (
            <mesh key={bi} position={[b.ox, b.oy, b.oz]}>
              <sphereGeometry args={[b.r, 7, 5]} />
              <meshStandardMaterial color="#f0f4f8" roughness={1} metalness={0} transparent opacity={0.82} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

// ─── Daytime Sky ─────────────────────────────────────────────────────────────

function DaySky() {
  return (
    <>
      <color attach="background" args={["#87b0d8"]} />

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[380, 32, 20]} />
        <meshBasicMaterial color="#4a8ed4" side={THREE.BackSide} />
      </mesh>

      {[
        { y: -10, color: "#d8eeff", r: 370 },
        { y: -4,  color: "#a8d4f4", r: 365 },
        { y:  8,  color: "#7abce8", r: 360 },
      ].map((band, i) => (
        <mesh key={i} position={[0, band.y, 0]}>
          <sphereGeometry args={[band.r, 24, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.1]} />
          <meshBasicMaterial color={band.color} side={THREE.BackSide} transparent opacity={0.55} />
        </mesh>
      ))}

      {/* Sun disc */}
      <mesh position={[180, 120, -200]}>
        <sphereGeometry args={[18, 12, 10]} />
        <meshBasicMaterial color="#fffbe0" />
      </mesh>
      <mesh position={[180, 120, -200]}>
        <sphereGeometry args={[28, 10, 8]} />
        <meshBasicMaterial color="#fff8c0" transparent opacity={0.3} />
      </mesh>

      <Clouds />
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LondonExterior() {
  return (
    <group>
      <DaySky />
      <Thames />
      <CityGround />

      {/* Canary Wharf landmark towers (close east) */}
      <OneCanadaSquare />
      <HSBCTower />
      <CitigroupCentre />
      <JPMorganTower />
      <BarclaysHQ />
      <TwinTowerBlock />
      <CloseEastBuildings />

      {/* East skyline */}
      <MidEastTowers />
      <FarEastTowers />

      {/* West — City of London */}
      <WestTowers />

      {/* South — Docklands / Isle of Dogs */}
      <SouthTowers />

      {/* North — Greenwich / Stratford */}
      <NorthTowers />
    </group>
  );
}

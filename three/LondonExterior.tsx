"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Daytime London from Canary Wharf, 40th floor
// Office bounds: X -25..25, Z -20..20
// Buildings start outside these bounds

// ─── Primitive helpers ─────────────────────────────────────────────────────

function Building({ x, y, z, w, h, d, color, glass = false }: {
  x: number; y: number; z: number; w: number; h: number; d: number;
  color: string; glass?: boolean;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={color}
        roughness={glass ? 0.05 : 0.6}
        metalness={glass ? 0.9 : 0.1}
        envMapIntensity={glass ? 1.5 : 0.3}
      />
    </mesh>
  );
}

function GlassStripe({ x, y, z, w, h, d, color }: {
  x: number; y: number; z: number; w: number; h: number; d: number; color: string;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.05} metalness={0.95} transparent opacity={0.7} />
    </mesh>
  );
}

function WindowGrid({ x, baseY, z, cols, rows, spacingX, spacingY, facingZ = false }: {
  x: number; baseY: number; z: number; cols: number; rows: number;
  spacingX: number; spacingY: number; facingZ?: boolean;
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
  }, []);

  return (
    <>
      {windows.map((w, i) => (
        <mesh key={i} position={[w.px, w.py, w.pz]}>
          <planeGeometry args={[spacingX * 0.6, spacingY * 0.6]} />
          <meshStandardMaterial
            color="#d4ecff"
            roughness={0.02}
            metalness={0.9}
            transparent
            opacity={0.75}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── One Canada Square (iconic pyramid top) ─────────────────────────────────

function OneCanadaSquare() {
  // The tallest tower in Canary Wharf — square with pyramid roof
  const x = 42, z = 0;
  const h = 72;
  return (
    <group>
      {/* Main shaft */}
      <Building x={x} y={h / 2 - 12} z={z} w={10} h={h} d={10} color="#c8d8e8" glass />
      {/* Vertical stripe accents */}
      {[-4.5, -1.5, 1.5, 4.5].map((ox, i) => (
        <GlassStripe key={i} x={x + ox} y={h / 2 - 12} z={z - 5.02}
          w={0.8} h={h - 2} d={0.04} color="#a0b8d0" />
      ))}
      {/* Pyramid cap */}
      <mesh position={[x, h - 12 + 5, z]}>
        <coneGeometry args={[7.1, 10, 4]} />
        <meshStandardMaterial color="#9ab4cc" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Blinking red light */}
      <mesh position={[x, h - 12 + 10.5, z]}>
        <sphereGeometry args={[0.25, 6, 6]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={1.5} />
      </mesh>
      {/* Windows */}
      <WindowGrid x={x} baseY={-8} z={z - 5.1} cols={6} rows={22}
        spacingX={1.5} spacingY={3} />
    </group>
  );
}

// ─── HSBC Tower ─────────────────────────────────────────────────────────────

function HSBCTower() {
  const x = 55, z = -10;
  const h = 54;
  return (
    <group>
      <Building x={x} y={h / 2 - 12} z={z} w={12} h={h} d={9} color="#d4dce8" glass />
      {/* Horizontal setback steps */}
      <Building x={x} y={h - 8} z={z} w={9} h={6} d={7} color="#c8d2e0" glass />
      <Building x={x} y={h + 2} z={z} w={6} h={10} d={5} color="#bac8d8" glass />
      <WindowGrid x={x} baseY={-9} z={z - 4.6} cols={7} rows={16} spacingX={1.5} spacingY={3} />
    </group>
  );
}

// ─── Citigroup Centre (sloping top) ─────────────────────────────────────────

function CitigroupCentre() {
  const x = 34, z = -16;
  const h = 48;
  return (
    <group>
      <Building x={x} y={h / 2 - 12} z={z} w={10} h={h} d={8} color="#ccd8e4" glass />
      {/* Asymmetric sloped top */}
      <mesh position={[x + 1, h - 8, z]}>
        <boxGeometry args={[10, 8, 8]} />
        <meshStandardMaterial color="#b8c8d8" roughness={0.1} metalness={0.85} />
      </mesh>
      <mesh position={[x + 3, h - 5, z]}>
        <cylinderGeometry args={[0, 4, 6, 4]} />
        <meshStandardMaterial color="#a8b8c8" roughness={0.2} metalness={0.7} />
      </mesh>
      <WindowGrid x={x} baseY={-9} z={z - 4.1} cols={6} rows={14} spacingX={1.5} spacingY={3} />
    </group>
  );
}

// ─── JPMorgan Tower ─────────────────────────────────────────────────────────

function JPMorganTower() {
  const x = 68, z = 8;
  const h = 60;
  return (
    <group>
      <Building x={x} y={h / 2 - 12} z={z} w={13} h={h} d={11} color="#d0dcea" glass />
      {/* Glass fins on facade */}
      {[-5, 0, 5].map((oz, i) => (
        <GlassStripe key={i} x={x - 6.6} y={h / 2 - 12} z={z + oz}
          w={0.05} h={h - 4} d={2} color="#a8c0d8" />
      ))}
      <Building x={x} y={h - 8} z={z} w={10} h={8} d={9} color="#c0d0e0" glass />
      <mesh position={[x, h - 3, z]}>
        <cylinderGeometry args={[0.2, 0.2, 12, 6]} />
        <meshStandardMaterial color="#778899" roughness={0.4} metalness={0.6} />
      </mesh>
      <WindowGrid x={x} baseY={-9} z={z - 5.6} cols={8} rows={18} spacingX={1.5} spacingY={3} />
    </group>
  );
}

// ─── Barclays / 8 Canada Square ─────────────────────────────────────────────

function BarclaysHQ() {
  const x = 50, z = 12;
  const h = 52;
  return (
    <group>
      <Building x={x} y={h / 2 - 12} z={z} w={11} h={h} d={9} color="#c8d4e0" glass />
      {/* Flat top */}
      <Building x={x} y={h - 7} z={z} w={12} h={2} d={10} color="#b8c8d8" glass />
      <WindowGrid x={x} baseY={-9} z={z + 4.6} cols={7} rows={15} spacingX={1.5} spacingY={3} facingZ />
    </group>
  );
}

// ─── Mid-distance towers ─────────────────────────────────────────────────────

function MidTowers() {
  const towers: [number, number, number, number, string][] = [
    [85, -6, 10, 44, "#ccd4de"],
    [90, 16, 9, 38, "#c8d0da"],
    [78, -20, 8, 36, "#d0d8e2"],
    [100, 4, 12, 32, "#c4ccd8"],
    [110, -12, 10, 28, "#c0c8d4"],
    [120, 8, 11, 34, "#bcc8d4"],
    [95, 24, 8, 26, "#c8d0dc"],
    [130, -8, 14, 22, "#b8c4d0"],
    [115, 20, 9, 20, "#bcc4d0"],
    [140, 4, 16, 18, "#b4c0cc"],
    [150, -16, 12, 16, "#b0bcc8"],
    [160, 12, 18, 14, "#acb8c4"],
    [170, -4, 20, 12, "#a8b4c0"],
  ];

  return (
    <>
      {towers.map(([x, z, d, h, color], i) => {
        const w = d * (0.8 + Math.random() * 0.5);
        return (
          <group key={i}>
            <Building x={x} y={h / 2 - 12} z={z} w={w} h={h} d={d} color={color} glass />
            <WindowGrid x={x} baseY={-9} z={z - d / 2 - 0.05}
              cols={Math.floor(w / 1.8)} rows={Math.floor(h / 3.5)}
              spacingX={1.6} spacingY={3.2} />
          </group>
        );
      })}
    </>
  );
}

// ─── West towers (City of London) ────────────────────────────────────────────

function WestTowers() {
  const towers: [number, number, number, number, string][] = [
    [-38, -5, 9, 36, "#ccd4de"],
    [-50, 5, 8, 30, "#c8d0da"],
    [-42, -14, 7, 24, "#d0d8e2"],
    [-55, -10, 10, 28, "#c4ccd8"],
    [-45, 12, 6, 22, "#c8d0dc"],
    [-60, 0, 11, 20, "#c0c8d4"],
    [-70, -8, 8, 16, "#bcc4d0"],
    [-80, 5, 10, 14, "#b8c0cc"],
    [-90, -5, 14, 12, "#b4bcc8"],
  ];

  return (
    <>
      {towers.map(([x, z, d, h, color], i) => (
        <group key={i}>
          <Building x={x} y={h / 2 - 12} z={z} w={d * 1.1} h={h} d={d} color={color} glass />
          <WindowGrid x={x + d / 2 * 1.1 + 0.05} baseY={-9} z={z}
            cols={Math.floor(d / 1.8)} rows={Math.floor(h / 3.5)}
            spacingX={1.6} spacingY={3.2} />
        </group>
      ))}
    </>
  );
}

// ─── South towers (Docklands / Isle of Dogs) ─────────────────────────────────

function SouthTowers() {
  const towers: [number, number, number, number, string][] = [
    [-10, -36, 8, 22, "#ccd4de"],
    [5, -40, 10, 28, "#c8d0da"],
    [18, -36, 8, 24, "#d0d8e2"],
    [-5, -55, 12, 18, "#c4ccd8"],
    [12, -55, 9, 20, "#c8d0dc"],
    [30, -45, 7, 16, "#bcc4d0"],
    [-28, -45, 6, 14, "#c0c8d4"],
    [42, -55, 11, 18, "#b8c0cc"],
    [-42, -55, 9, 16, "#b4bcc8"],
    [0, -75, 22, 12, "#b0bcc8"],
  ];
  return (
    <>
      {towers.map(([x, z, d, h, color], i) => (
        <group key={i}>
          <Building x={x} y={h / 2 - 12} z={z} w={d * 1.1} h={h} d={d} color={color} glass />
        </group>
      ))}
    </>
  );
}

// ─── North towers (Greenwich / Stratford) ────────────────────────────────────

function NorthTowers() {
  const towers: [number, number, number, number, string][] = [
    [-10, 36, 7, 20, "#ccd4de"],
    [5, 40, 9, 26, "#c8d0da"],
    [20, 36, 8, 22, "#d0d8e2"],
    [-5, 50, 12, 16, "#c4ccd8"],
    [15, 50, 8, 18, "#c8d0dc"],
    [-25, 45, 6, 14, "#bcc4d0"],
    [35, 50, 10, 16, "#b8c0cc"],
  ];
  return (
    <>
      {towers.map(([x, z, d, h, color], i) => (
        <group key={i}>
          <Building x={x} y={h / 2 - 12} z={z} w={d * 1.1} h={h} d={d} color={color} glass />
        </group>
      ))}
    </>
  );
}

// ─── Thames ────────────────────────────────────────────────────────────────

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
      <mesh position={[65, -16, -20]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <planeGeometry args={[200, 60]} />
        <meshStandardMaterial ref={matRef}
          color="#6a8faa" roughness={0.04} metalness={0.7}
          emissive="#4a6a8a" emissiveIntensity={0.06} />
      </mesh>
      {/* Sun glint streaks */}
      {[40, 55, 70, 85, 100].map((x, i) => (
        <mesh key={i} position={[x, -15.8, -15 + (i - 2) * 6]} rotation={[-Math.PI / 2, 0, 0.1]}>
          <planeGeometry args={[6, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.01} metalness={1}
            transparent opacity={0.12 + i * 0.02} />
        </mesh>
      ))}
    </>
  );
}

// ─── Ground / city base ────────────────────────────────────────────────────

function CityGround() {
  return (
    <>
      {/* Main ground plane */}
      <mesh position={[20, -18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 400]} />
        <meshStandardMaterial color="#9aa0a8" roughness={0.95} />
      </mesh>
      {/* Road grid lines */}
      {[-30, -15, 0, 15, 30, 45, 60, 75].map((z, i) => (
        <mesh key={`rz${i}`} position={[80, -17.8, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 0.4]} />
          <meshStandardMaterial color="#808890" roughness={0.9} />
        </mesh>
      ))}
      {[30, 45, 60, 75, 90, 110, 130].map((x, i) => (
        <mesh key={`rx${i}`} position={[x, -17.8, -10]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 120]} />
          <meshStandardMaterial color="#808890" roughness={0.9} />
        </mesh>
      ))}
      {/* Low rise foreground blocks */}
      {[
        [28, -25, 5, 5, 8], [32, -18, 4, 6, 6], [26, 18, 5, 4, 7],
        [30, 22, 6, 5, 8], [60, -25, 8, 7, 10], [65, 24, 7, 6, 9],
        [-30, -28, 8, 6, 10], [-28, 22, 7, 5, 8],
      ].map(([x, z, w, d, h], i) => (
        <mesh key={i} position={[x, h / 2 - 18, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#8a9099" roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}

// ─── Clouds ─────────────────────────────────────────────────────────────────

function Clouds() {
  const clouds = useMemo(() => {
    const arr = [];
    const seed = [
      [30, 140, -80], [60, 160, 60], [-40, 130, -50], [80, 145, 30],
      [-60, 150, 80], [10, 135, -100], [100, 155, -30], [-20, 142, 120],
      [50, 148, -120], [-80, 138, 50], [0, 160, 0], [120, 145, -60],
    ];
    for (const [x, y, z] of seed) {
      const blobs = Math.floor(3 + Math.random() * 4);
      const cloudBlobs = [];
      for (let b = 0; b < blobs; b++) {
        cloudBlobs.push({
          ox: (Math.random() - 0.5) * 12,
          oy: (Math.random() - 0.5) * 3,
          oz: (Math.random() - 0.5) * 6,
          r: 4 + Math.random() * 5,
        });
      }
      arr.push({ x, y, z, blobs: cloudBlobs });
    }
    return arr;
  }, []);

  return (
    <>
      {clouds.map((cloud, ci) => (
        <group key={ci} position={[cloud.x, cloud.y, cloud.z]}>
          {cloud.blobs.map((b, bi) => (
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

// ─── Daytime Sky ────────────────────────────────────────────────────────────

function DaySky() {
  return (
    <>
      {/* Sky dome — bright vivid London blue */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[380, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshBasicMaterial color="#3a7ec8" side={THREE.BackSide} />
      </mesh>
      {/* Sun disc — bright white-yellow */}
      <mesh position={[180, 120, -200]}>
        <sphereGeometry args={[18, 12, 10]} />
        <meshBasicMaterial color="#fffbe0" />
      </mesh>
      {/* Sun halo glow */}
      <mesh position={[180, 120, -200]}>
        <sphereGeometry args={[28, 10, 8]} />
        <meshBasicMaterial color="#fff8c0" transparent opacity={0.3} />
      </mesh>
      {/* Gradient band near horizon — bright haze */}
      {[
        { y: -10, color: "#d8eeff", r: 370 },
        { y: -4, color: "#a8d4f4", r: 365 },
        { y: 8, color: "#7abce8", r: 360 },
      ].map((band, i) => (
        <mesh key={i} position={[0, band.y, 0]}>
          <sphereGeometry args={[band.r, 24, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.1]} />
          <meshBasicMaterial color={band.color} side={THREE.BackSide} transparent opacity={0.55} />
        </mesh>
      ))}
      <Clouds />
    </>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────

export function LondonExterior() {
  return (
    <group>
      <DaySky />
      <Thames />
      <CityGround />
      {/* Canary Wharf iconic towers */}
      <OneCanadaSquare />
      <HSBCTower />
      <CitigroupCentre />
      <JPMorganTower />
      <BarclaysHQ />
      <MidTowers />
      <WestTowers />
      <SouthTowers />
      <NorthTowers />
    </group>
  );
}

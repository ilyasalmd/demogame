"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { PlayerController } from "./PlayerController";
import { OfficeProps } from "./OfficeProps";
import { NPCCharacter } from "./NPCCharacter";
import { BackgroundNPCs } from "./BackgroundNPCs";
import { LondonExterior } from "./LondonExterior";
import { CHARACTERS, BACKGROUND_NPCS, INTERACTABLE_OBJECTS } from "@/game/data";
import { useGameStore } from "@/store/gameStore";

// Office: X -25..25, Z -20..20 — ceiling at Y=5.5
export const COLLISION_WALLS: number[][] = [
  // ── Outer boundary ────────────────────────────────────────────────
  [-25, -20, 25, -19.5],    // south glass wall
  [-25, 19.5, 25, 20],      // north glass wall
  [-25, -20, -24.5, 20],    // west glass wall
  [24.5, -20, 25, 20],      // east glass wall

  // ── Lift lobby dividing wall — 6-unit door gap at z=0 for entry ──
  [-18.3, -9, -18, -3],     // south portion
  [-18.3, 3, -18, 9],       // north portion

  // ── Boardroom (fully enclosed glass box) ─────────────────────────
  [7.7, -19.5, 8, -10.5],   // west wall
  [7.7, -10.5, 18, -9.7],   // north wall
  [18, -10.5, 18.3, -19.5], // east wall
  // south wall = outer boundary at z=-19.5

  // ── Huddle room A — west / north / east walls, open on south ─────
  [7.7, 7.2, 8, 14],
  [7.7, 14, 14, 14.3],
  [14, 7.2, 14.3, 14],

  // ── Huddle room B — west / north walls + south wall with door ────
  [-7, 9.7, -7.3, 18],      // west wall
  [-7, 18, 2, 18.3],        // north wall
  [-7.3, 9.7, -3.8, 10],    // south-west (leaves 3-unit door near Priya at x=-2)
  [-0.2, 9.7, 2, 10],       // south-east

  // ── Server room (fully enclosed) ─────────────────────────────────
  [20, 7, 24.5, 19.5],
];

export function OfficeScene() {
  const { nearbyInteractable } = useGameStore();

  return (
    <>
      {/* Daytime haze — light blue-grey */}
      <fog attach="fog" args={["#c8d8ec", 55, 110]} />

      <SceneLighting />
      <OfficeEnvironment />
      <LondonExterior />
      <OfficeProps />
      <BackgroundNPCs npcs={BACKGROUND_NPCS} />

      {CHARACTERS.map((char) => (
        <NPCCharacter key={char.id} character={char} isNearby={nearbyInteractable === char.id} />
      ))}

      {INTERACTABLE_OBJECTS.map((obj) => (
        <InteractableObject key={obj.id} object={obj} isNearby={nearbyInteractable === obj.id} />
      ))}

      <PlayerController walls={COLLISION_WALLS} />
    </>
  );
}

function SceneLighting() {
  return (
    <>
      {/* Bright daytime ambient — London overcast/sunny mix */}
      <ambientLight intensity={2.0} color="#deeeff" />

      {/* Main sun — strong morning sun from south-east */}
      <directionalLight
        position={[45, 40, -15]}
        intensity={4.0}
        color="#fff8e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Sky fill from overhead */}
      <directionalLight position={[0, 50, 0]} intensity={1.6} color="#c0d8f8" />
      {/* North skylight bounce */}
      <directionalLight position={[-20, 20, 30]} intensity={0.9} color="#d0e4f8" />

      {/* LED panel ceiling lights — grid across entire office */}
      {/* Row 1 — south zone (analytics) */}
      <rectAreaLight position={[-12, 5.3, -14]} width={4} height={1.5} intensity={15} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[-4, 5.3, -14]} width={4} height={1.5} intensity={15} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[4, 5.3, -14]} width={4} height={1.5} intensity={15} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[12, 5.3, -14]} width={4} height={1.5} intensity={14} color="#f0e8d8" rotation={[Math.PI / 2, 0, 0]} />
      {/* Row 2 — middle */}
      <rectAreaLight position={[-16, 5.3, -5]} width={4} height={1.5} intensity={14} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[-8, 5.3, -5]} width={4} height={1.5} intensity={15} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[0, 5.3, -5]} width={4} height={1.5} intensity={16} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[8, 5.3, -5]} width={4} height={1.5} intensity={14} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[16, 5.3, -5]} width={4} height={1.5} intensity={13} color="#f0e8d8" rotation={[Math.PI / 2, 0, 0]} />
      {/* Row 3 — north zone */}
      <rectAreaLight position={[-16, 5.3, 5]} width={4} height={1.5} intensity={14} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[-8, 5.3, 5]} width={4} height={1.5} intensity={14} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[0, 5.3, 5]} width={4} height={1.5} intensity={14} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[8, 5.3, 5]} width={4} height={1.5} intensity={13} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[16, 5.3, 5]} width={4} height={1.5} intensity={12} color="#f0e8d8" rotation={[Math.PI / 2, 0, 0]} />
      {/* Row 4 — compliance/breakout */}
      <rectAreaLight position={[-10, 5.3, 14]} width={4} height={1.5} intensity={13} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[-2, 5.3, 14]} width={4} height={1.5} intensity={13} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />
      <rectAreaLight position={[6, 5.3, 14]} width={4} height={1.5} intensity={12} color="#e8f0ff" rotation={[Math.PI / 2, 0, 0]} />

      {/* Accent / zone colours */}
      <pointLight position={[0, 3, -14]} intensity={8} color="#6366f1" distance={10} decay={2} />
      <pointLight position={[14, 3, -6]} intensity={8} color="#f59e0b" distance={10} decay={2} />
      <pointLight position={[-3, 3, 14]} intensity={8} color="#10b981" distance={10} decay={2} />
      <pointLight position={[10, 3, 5]} intensity={8} color="#0ea5e9" distance={10} decay={2} />
      <pointLight position={[-10, 3, 14]} intensity={6} color="#06b6d4" distance={8} decay={2} />

      {/* Daylight wash through glass walls */}
      <pointLight position={[23, 2.5, 0]} intensity={10} color="#d0e4f8" distance={18} decay={2} />
      <pointLight position={[-23, 2.5, 0]} intensity={6} color="#c8dcf4" distance={14} decay={2} />
      <pointLight position={[0, 2.5, -19]} intensity={8} color="#ccd8f0" distance={16} decay={2} />
      <pointLight position={[0, 2.5, 19]} intensity={6} color="#c8dcf0" distance={14} decay={2} />
    </>
  );
}

function OfficeEnvironment() {
  return (
    <>
      {/* Floor — polished light grey concrete, modern London office */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#d0d4d8" roughness={0.18} metalness={0.08} />
      </mesh>

      {/* Subtle floor tile grid */}
      <FloorGrid />

      {/* Ceiling — white acoustic tiles */}
      <CeilingSystem />

      {/* ALL 4 WALLS — floor-to-ceiling glass */}
      <AllGlassWalls />

      {/* Internal glass partitions */}
      <InternalPartitions />

      {/* Meeting rooms */}
      <BoardroomGlass />
      <HuddleRoomA />
      <HuddleRoomB />

      {/* Floor accent zones */}
      <FloorAccents />
    </>
  );
}

function FloorGrid() {
  const lines = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const verts: number[] = [];
    for (let x = -25; x <= 25; x += 2) {
      verts.push(x, 0.003, -20, x, 0.003, 20);
    }
    for (let z = -20; z <= 20; z += 2) {
      verts.push(-25, 0.003, z, 25, 0.003, z);
    }
    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return geom;
  }, []);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#b8bcc0" transparent opacity={0.4} />
    </lineSegments>
  );
}

function CeilingSystem() {
  // White ceiling tiles at y=5.5, LED panels recessed
  const CEIL_Y = 5.5;
  const tileW = 1.2;
  const panels = useMemo(() => {
    const arr: { x: number; z: number }[] = [];
    // LED panels every 4 units in a grid
    for (let x = -22; x <= 22; x += 4) {
      for (let z = -18; z <= 18; z += 4) {
        arr.push({ x, z });
      }
    }
    return arr;
  }, []);

  const tilePositions = useMemo(() => {
    const arr: { x: number; z: number }[] = [];
    for (let x = -24; x <= 24; x += tileW) {
      for (let z = -19; z <= 19; z += tileW) {
        arr.push({ x, z });
      }
    }
    return arr;
  }, []);

  return (
    <group>
      {/* Main white ceiling plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_Y, 0]}>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#dde4f0" roughness={0.85} />
      </mesh>

      {/* Ceiling tile grid lines */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_Y - 0.01, 0]}>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#c8d0e8" roughness={0.9} wireframe={false} transparent opacity={0.0} />
      </mesh>

      {/* Recessed LED panels */}
      {panels.map((p, i) => (
        <group key={i}>
          {/* LED panel recess */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[p.x, CEIL_Y - 0.04, p.z]}>
            <planeGeometry args={[1.8, 0.6]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#d8e8ff"
              emissiveIntensity={0.9}
              roughness={0.1}
            />
          </mesh>
        </group>
      ))}

      {/* Ceiling tile dividers — subtle grey lines */}
      {tilePositions.slice(0, 400).map((t, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[t.x, CEIL_Y - 0.005, t.z]}>
          <planeGeometry args={[tileW, tileW]} />
          <meshStandardMaterial color="#c8d2e8" roughness={0.9} wireframe={true} transparent opacity={0.12} />
        </mesh>
      ))}
    </group>
  );
}

function GlassPanel({ x, y, z, w, h, d, tint = "#5070c0", opacity = 0.08 }: {
  x: number; y: number; z: number; w: number; h: number; d: number;
  tint?: string; opacity?: number;
}) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={tint} transparent opacity={opacity} roughness={0} metalness={0.05} />
    </mesh>
  );
}

function MullionV({ x, y, z, h }: { x: number; y: number; z: number; h: number }) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[0.12, h, 0.12]} />
      <meshStandardMaterial color="#b0b8cc" roughness={0.3} metalness={0.7} />
    </mesh>
  );
}

function MullionH({ x, y, z, w, isZ = false }: { x: number; y: number; z: number; w: number; isZ?: boolean }) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={isZ ? [0.12, 0.08, w] : [w, 0.08, 0.12]} />
      <meshStandardMaterial color="#b0b8cc" roughness={0.3} metalness={0.7} />
    </mesh>
  );
}

function AllGlassWalls() {
  const CEIL = 5.5;
  const MID = CEIL / 2;

  // East wall panels — full panorama London view
  const eastPanels = useMemo(() => {
    const arr = [];
    for (let z = -19; z <= 19; z += 2.4) arr.push(z);
    return arr;
  }, []);

  // South wall panels
  const southPanels = useMemo(() => {
    const arr = [];
    for (let x = -23; x <= 23; x += 2.4) arr.push(x);
    return arr;
  }, []);

  // North wall panels
  const northPanels = useMemo(() => {
    const arr = [];
    for (let x = -23; x <= 23; x += 2.4) arr.push(x);
    return arr;
  }, []);

  // West wall panels — with lift shaft solid section in middle
  const westPanels = useMemo(() => {
    const arr = [];
    for (let z = -19; z <= 19; z += 2.4) {
      if (z < -9 || z > 9) arr.push({ z, solid: false });
      else arr.push({ z, solid: false }); // all glass even west side
    }
    return arr;
  }, []);

  return (
    <group>
      {/* EAST WALL — London panorama */}
      {eastPanels.map((z, i) => (
        <group key={`e${i}`}>
          <GlassPanel x={24.88} y={MID} z={z} w={0.06} h={CEIL} d={2.3} tint="#4060b0" opacity={0.08} />
          <MullionV x={24.9} y={MID} z={z + 1.2} h={CEIL} />
          <MullionH x={24.9} y={0.1} z={z} w={CEIL} isZ={true} />
          <MullionH x={24.9} y={CEIL - 0.04} z={z} w={CEIL} isZ={true} />
        </group>
      ))}

      {/* SOUTH WALL — city view */}
      {southPanels.map((x, i) => (
        <group key={`s${i}`}>
          <GlassPanel x={x} y={MID} z={-19.92} w={2.3} h={CEIL} d={0.06} tint="#4060b0" opacity={0.08} />
          <MullionV x={x + 1.2} y={MID} z={-19.9} h={CEIL} />
          <MullionH x={x} y={0.1} z={-19.9} w={2.4} />
          <MullionH x={x} y={CEIL - 0.04} z={-19.9} w={2.4} />
        </group>
      ))}

      {/* NORTH WALL — city view */}
      {northPanels.map((x, i) => (
        <group key={`n${i}`}>
          <GlassPanel x={x} y={MID} z={19.92} w={2.3} h={CEIL} d={0.06} tint="#4060b0" opacity={0.08} />
          <MullionV x={x + 1.2} y={MID} z={19.9} h={CEIL} />
          <MullionH x={x} y={0.1} z={19.9} w={2.4} />
          <MullionH x={x} y={CEIL - 0.04} z={19.9} w={2.4} />
        </group>
      ))}

      {/* WEST WALL — lift lobby visible + city beyond */}
      {westPanels.map(({ z }, i) => (
        <group key={`w${i}`}>
          <GlassPanel x={-24.88} y={MID} z={z} w={0.06} h={CEIL} d={2.3} tint="#4060b0" opacity={0.08} />
          <MullionV x={-24.9} y={MID} z={z + 1.2} h={CEIL} />
        </group>
      ))}

      {/* Structural corner columns */}
      {[
        [-25, 0, -20], [25, 0, -20], [-25, 0, 20], [25, 0, 20],
        [-25, 0, 0], [25, 0, 0], [0, 0, -20], [0, 0, 20],
      ].map(([x, _, z], i) => (
        <mesh key={`col${i}`} position={[x, MID, z]}>
          <boxGeometry args={[0.3, CEIL, 0.3]} />
          <meshStandardMaterial color="#a0a8bc" roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function InternalPartitions() {
  return (
    <group>
      {/* Lift lobby glass partition — separates lobby from main floor */}
      {[-8, -4, 0, 4, 8].map((z, i) => (
        <group key={i}>
          <GlassPanel x={-18} y={2.75} z={z} w={0.06} h={5.5} d={3.8} tint="#8090d0" opacity={0.12} />
          <MullionV x={-18} y={2.75} z={z + 2} h={5.5} />
        </group>
      ))}
      {/* Lobby door opening at z=0 — gap in partition (no glass at z=-1 to z=1) */}

      {/* Executive suite glass partition */}
      {[-8, -4, 0].map((z, i) => (
        <group key={i}>
          <GlassPanel x={14} y={2.75} z={z} w={0.06} h={5.5} d={3.8} tint="#8090d0" opacity={0.1} />
          <MullionV x={14} y={2.75} z={z + 2} h={5.5} />
        </group>
      ))}

      {/* Low partition — compliance boundary */}
      <mesh position={[-5, 0.75, 10]}>
        <boxGeometry args={[6, 1.5, 0.1]} />
        <meshStandardMaterial color="#1e2035" roughness={0.6} />
      </mesh>
    </group>
  );
}

function GlassRoom({ cx, cz, w, d, label, color = "#8090d0" }: {
  cx: number; cz: number; w: number; d: number; label?: string; color?: string;
}) {
  const CEIL = 5.5;
  const walls = [
    { pos: [0, CEIL / 2, -d / 2] as [number,number,number], args: [w, CEIL, 0.07] as [number,number,number], panels: w },
    { pos: [0, CEIL / 2, d / 2] as [number,number,number], args: [w, CEIL, 0.07] as [number,number,number], panels: w },
    { pos: [-w / 2, CEIL / 2, 0] as [number,number,number], args: [0.07, CEIL, d] as [number,number,number], panels: d },
    { pos: [w / 2, CEIL / 2, 0] as [number,number,number], args: [0.07, CEIL, d] as [number,number,number], panels: d },
  ];

  return (
    <group position={[cx, 0, cz]}>
      {walls.map((wall, i) => (
        <mesh key={i} position={wall.pos}>
          <boxGeometry args={wall.args} />
          <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
        </mesh>
      ))}
      {/* Top frame */}
      {[
        [0, CEIL - 0.03, -d / 2, w, 0.07, 0.1],
        [0, CEIL - 0.03, d / 2, w, 0.07, 0.1],
        [-w / 2, CEIL - 0.03, 0, 0.1, 0.07, d],
        [w / 2, CEIL - 0.03, 0, 0.1, 0.07, d],
      ].map((p, i) => (
        <mesh key={`f${i}`} position={p.slice(0, 3) as [number,number,number]}>
          <boxGeometry args={p.slice(3) as [number,number,number]} />
          <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      {/* Door frame */}
      <mesh position={[-w / 2, CEIL / 2, 0]}>
        <boxGeometry args={[0.1, CEIL, 0.1]} />
        <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Door glass panel */}
      <mesh position={[-w / 2 + 0.05, CEIL / 2 - 0.5, 0]}>
        <boxGeometry args={[0.04, CEIL - 0.5, 1.8]} />
        <meshStandardMaterial color={color} transparent opacity={0.15} roughness={0} />
      </mesh>

      {label && (
        <Text position={[0, CEIL + 0.2, 0]} fontSize={0.18} color={color}
          anchorX="center" anchorY="middle" letterSpacing={0.08}>
          {label}
        </Text>
      )}
    </group>
  );
}

function BoardroomGlass() {
  // x=8..18, z=-10..-19 (cx=13, cz=-14.5, w=10, d=8.5)
  const cx = 13, cz = -14.5;
  return (
    <group>
      <GlassRoom cx={cx} cz={cz} w={10} d={8.5} label="BOARDROOM" color="#8090d0" />
      {/* Conference table */}
      <mesh position={[cx, 0.78, cz]}>
        <boxGeometry args={[6, 0.09, 2.5]} />
        <meshStandardMaterial color="#151530" roughness={0.25} metalness={0.35} />
      </mesh>
      {[-2.5, -1.2, 0, 1.2, 2.5].flatMap((x, i) => [
        <group key={`ba${i}`} position={[cx + x, 0, cz - 1.7]}>
          <mesh position={[0, 0.44, 0]}><boxGeometry args={[0.4, 0.07, 0.4]} /><meshStandardMaterial color="#1e1e3a" roughness={0.8} /></mesh>
          <mesh position={[0, 0.72, 0.19]}><boxGeometry args={[0.38, 0.5, 0.06]} /><meshStandardMaterial color="#1e1e3a" roughness={0.8} /></mesh>
        </group>,
        <group key={`bb${i}`} position={[cx + x, 0, cz + 1.7]}>
          <mesh position={[0, 0.44, 0]}><boxGeometry args={[0.4, 0.07, 0.4]} /><meshStandardMaterial color="#1e1e3a" roughness={0.8} /></mesh>
          <mesh position={[0, 0.72, -0.19]}><boxGeometry args={[0.38, 0.5, 0.06]} /><meshStandardMaterial color="#1e1e3a" roughness={0.8} /></mesh>
        </group>,
      ])}
      {/* Projector screen on east wall */}
      <mesh position={[cx + 5.2, 3, cz]}>
        <boxGeometry args={[0.08, 2.2, 4]} />
        <meshStandardMaterial color="#0a0a20" emissive="#1010a0" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[cx + 5.15, 3, cz]} fontSize={0.2} color="#818cf8"
        anchorX="center" anchorY="middle" rotation={[0, Math.PI / 2, 0]}>
        Q4 CLIENT DEMO
      </Text>
      {/* Monitor on table */}
      <mesh position={[cx + 1, 0.9, cz]}>
        <boxGeometry args={[0.6, 0.38, 0.04]} />
        <meshStandardMaterial color="#101020" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[cx + 1, 0.9, cz + 0.025]}>
        <boxGeometry args={[0.54, 0.32, 0.01]} />
        <meshStandardMaterial color="#030310" emissive="#6366f1" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function HuddleRoomA() {
  // Engineering side: x=8..14, z=7..14 (cx=11, cz=10.5, w=6, d=7)
  const cx = 11, cz = 10.5;
  return (
    <group>
      <GlassRoom cx={cx} cz={cz} w={6} d={7} label="HUDDLE A" color="#0ea5e9" />
      {/* Small round table */}
      <mesh position={[cx, 0.74, cz]}>
        <cylinderGeometry args={[1.0, 1.0, 0.08, 12]} />
        <meshStandardMaterial color="#151530" roughness={0.3} metalness={0.3} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <group key={i} position={[cx + Math.cos(angle) * 1.5, 0, cz + Math.sin(angle) * 1.5]}>
          <mesh position={[0, 0.44, 0]}><boxGeometry args={[0.38, 0.07, 0.38]} /><meshStandardMaterial color="#1e1e3a" roughness={0.8} /></mesh>
          <mesh position={[0, 0.7, Math.sin(angle + Math.PI) * 0.17]}>
            <boxGeometry args={[0.36, 0.46, 0.06]} />
            <meshStandardMaterial color="#1e1e3a" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Whiteboard */}
      <mesh position={[cx + 3.1, 2.5, cz]}>
        <boxGeometry args={[0.05, 1.5, 2.4]} />
        <meshStandardMaterial color="#ece8e0" roughness={0.3} />
      </mesh>
    </group>
  );
}

function HuddleRoomB() {
  // Compliance side: x=-7..2, z=10..18 (cx=-2.5, cz=14, w=9, d=8)
  const cx = -2.5, cz = 14;
  return (
    <group>
      <GlassRoom cx={cx} cz={cz} w={9} d={8} label="COMPLIANCE ROOM" color="#10b981" />
      {/* Rectangular table */}
      <mesh position={[cx, 0.78, cz]}>
        <boxGeometry args={[4.5, 0.09, 1.8]} />
        <meshStandardMaterial color="#151530" roughness={0.25} metalness={0.3} />
      </mesh>
      {[-1.8, -0.6, 0.6, 1.8].flatMap((x, i) => [
        <group key={`ca${i}`} position={[cx + x, 0, cz - 1.3]}>
          <mesh position={[0, 0.44, 0]}><boxGeometry args={[0.4, 0.07, 0.4]} /><meshStandardMaterial color="#1e1e3a" roughness={0.8} /></mesh>
          <mesh position={[0, 0.7, 0.19]}><boxGeometry args={[0.38, 0.46, 0.06]} /><meshStandardMaterial color="#1e1e3a" roughness={0.8} /></mesh>
        </group>,
        <group key={`cb${i}`} position={[cx + x, 0, cz + 1.3]}>
          <mesh position={[0, 0.44, 0]}><boxGeometry args={[0.4, 0.07, 0.4]} /><meshStandardMaterial color="#1e1e3a" roughness={0.8} /></mesh>
          <mesh position={[0, 0.7, -0.19]}><boxGeometry args={[0.38, 0.46, 0.06]} /><meshStandardMaterial color="#1e1e3a" roughness={0.8} /></mesh>
        </group>,
      ])}
    </group>
  );
}

function FloorAccents() {
  return (
    <>
      <mesh position={[0, 0.003, -12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial color="#6366f1" transparent opacity={0.035} roughness={1} />
      </mesh>
      <mesh position={[11, 0.003, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.035} roughness={1} />
      </mesh>
      <mesh position={[-2, 0.003, 14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#10b981" transparent opacity={0.035} roughness={1} />
      </mesh>
      <mesh position={[18, 0.003, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 12]} />
        <meshStandardMaterial color="#f59e0b" transparent opacity={0.035} roughness={1} />
      </mesh>
      <mesh position={[-10, 0.003, 14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.035} roughness={1} />
      </mesh>
    </>
  );
}

function InteractableObject({
  object,
  isNearby,
}: {
  object: typeof INTERACTABLE_OBJECTS[0];
  isNearby: boolean;
}) {
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.intensity = isNearby
        ? 10 + Math.sin(state.clock.elapsedTime * 3) * 4
        : 3 + Math.sin(state.clock.elapsedTime * 1.5) * 1;
    }
  });

  return (
    <group position={object.position}>
      <pointLight ref={glowRef} color={object.glowColor} intensity={3} distance={4} decay={2} />
      <mesh position={[0, -object.position[1] + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 16]} />
        <meshStandardMaterial color={object.glowColor} emissive={object.glowColor}
          emissiveIntensity={isNearby ? 0.9 : 0.3} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

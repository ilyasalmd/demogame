"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { PlayerController } from "./PlayerController";
import { OfficeProps } from "./OfficeProps";
import { NPCCharacter } from "./NPCCharacter";
import { BackgroundNPCs } from "./BackgroundNPCs";
import { LondonExterior } from "./LondonExterior";
import { CHARACTERS, BACKGROUND_NPCS, INTERACTABLE_OBJECTS } from "@/game/data";
import { useGameStore } from "@/store/gameStore";
import { COLLISION_WALLS } from "@/game/collisionWalls";
export { COLLISION_WALLS };

function AnimatedLiftDoor({ position, phaseOffset = 0 }: {
  position: [number, number, number]; phaseOffset?: number;
}) {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const timerRef = useRef(phaseOffset);

  const CYCLE = 14; // 14s full cycle
  const OPEN_DUR = 1.1;
  const STAY_DUR = 3.2;
  const CLOSE_DUR = 1.1;
  const DOOR_HALF = 0.88; // how far each panel slides

  useFrame((_, delta) => {
    timerRef.current = (timerRef.current + delta) % CYCLE;
    const t = timerRef.current;
    let offset: number;
    if (t < OPEN_DUR) {
      offset = DOOR_HALF * (t / OPEN_DUR);
    } else if (t < OPEN_DUR + STAY_DUR) {
      offset = DOOR_HALF;
    } else if (t < OPEN_DUR + STAY_DUR + CLOSE_DUR) {
      offset = DOOR_HALF * (1 - (t - OPEN_DUR - STAY_DUR) / CLOSE_DUR);
    } else {
      offset = 0;
    }
    if (leftRef.current) leftRef.current.position.x = -offset;
    if (rightRef.current) rightRef.current.position.x = offset;
  });

  const DOOR_H = 5.5;
  return (
    <group position={position}>
      {/* Lift shaft recess / wall surround */}
      <mesh position={[0, DOOR_H / 2, 0]}>
        <boxGeometry args={[2.0, DOOR_H + 0.1, 0.35]} />
        <meshStandardMaterial color="#111120" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Frame surround — brushed steel */}
      <mesh position={[0, DOOR_H / 2, 0.17]}>
        <boxGeometry args={[2.12, DOOR_H + 0.12, 0.06]} />
        <meshStandardMaterial color="#808898" roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Left door panel */}
      <group ref={leftRef} position={[-DOOR_HALF / 2, 0, 0]}>
        <mesh position={[0, DOOR_H / 2, 0.21]}>
          <boxGeometry args={[DOOR_HALF * 2, DOOR_H - 0.06, 0.09]} />
          <meshStandardMaterial color="#1e2838" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Gold vertical stripe on left door */}
        <mesh position={[DOOR_HALF - 0.04, DOOR_H / 2, 0.27]}>
          <boxGeometry args={[0.04, DOOR_H - 0.3, 0.02]} />
          <meshStandardMaterial color="#c9a827" roughness={0.08} metalness={0.95} />
        </mesh>
      </group>
      {/* Right door panel */}
      <group ref={rightRef} position={[DOOR_HALF / 2, 0, 0]}>
        <mesh position={[0, DOOR_H / 2, 0.21]}>
          <boxGeometry args={[DOOR_HALF * 2, DOOR_H - 0.06, 0.09]} />
          <meshStandardMaterial color="#1e2838" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Gold vertical stripe on right door */}
        <mesh position={[-(DOOR_HALF - 0.04), DOOR_H / 2, 0.27]}>
          <boxGeometry args={[0.04, DOOR_H - 0.3, 0.02]} />
          <meshStandardMaterial color="#c9a827" roughness={0.08} metalness={0.95} />
        </mesh>
      </group>
      {/* Floor indicator display above doors */}
      <mesh position={[0, DOOR_H + 0.22, 0.17]}>
        <boxGeometry args={[1.8, 0.38, 0.06]} />
        <meshStandardMaterial color="#050508" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, DOOR_H + 0.22, 0.21]}>
        <boxGeometry args={[1.6, 0.28, 0.01]} />
        <meshStandardMaterial color="#020202" emissive="#c9a827" emissiveIntensity={0.6} />
      </mesh>
      {/* Call button panel on right side of door */}
      <mesh position={[1.14, 1.45, 0.22]}>
        <boxGeometry args={[0.12, 0.28, 0.06]} />
        <meshStandardMaterial color="#0a0a14" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[1.14, 1.52, 0.26]}>
        <cylinderGeometry args={[0.032, 0.032, 0.02, 8]} />
        <meshStandardMaterial color="#c9a827" emissive="#c9a827" emissiveIntensity={0.9} roughness={0.05} metalness={0.95} />
      </mesh>
      <mesh position={[1.14, 1.38, 0.26]}>
        <cylinderGeometry args={[0.032, 0.032, 0.02, 8]} />
        <meshStandardMaterial color="#808898" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}


export function OfficeScene() {
  const { nearbyInteractable } = useGameStore();

  return (
    <>
      {/* Daytime haze — light blue-grey */}
      <color attach="background" args={["#87b0d8"]} />
      <fog attach="fog" args={["#87b0d8", 80, 600]} />

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
      {/* Bright daytime ambient — boosted to compensate for removed rect area lights */}
      <ambientLight intensity={2.8} color="#deeeff" />

      {/* Main sun — 512 shadow map (reduced for perf) */}
      <directionalLight
        position={[45, 40, -15]}
        intensity={4.0}
        color="#fff8e0"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />

      {/* Sky fill + bounce — no shadows */}
      <directionalLight position={[0, 50, 0]} intensity={1.6} color="#c0d8f8" />
      <directionalLight position={[-20, 20, 30]} intensity={0.9} color="#d0e4f8" />

      {/* Ceiling fill — removed rect area lights (expensive WebGL shaders); brightness compensated by ambient */}

      {/* Zone accent colours — 4 key points (was 9) */}
      <pointLight position={[0, 3, -14]} intensity={10} color="#6366f1" distance={14} decay={2} />
      <pointLight position={[10, 3, 5]}  intensity={10} color="#0ea5e9" distance={12} decay={2} />
      <pointLight position={[-3, 3, 14]} intensity={9}  color="#10b981" distance={12} decay={2} />
      <pointLight position={[0, 3, 0]}   intensity={8}  color="#d0e4f8" distance={30} decay={1} />
    </>
  );
}

// ── AI OA Ltd logo — image texture on wall ───────────────────────────────────
function LogoWall() {
  const tex = useTexture("/main_logo.png") as THREE.Texture;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;

  // Subtle screen-glow ref
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.emissiveIntensity =
        0.55 + Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
  });

  // Reception wall (south, z ≈ -19.8) — large display panel
  return (
    <group position={[0, 3.0, -19.72]}>
      {/* Black backing panel — 5.5 × 1.5 m */}
      <mesh>
        <boxGeometry args={[5.5, 1.5, 0.08]} />
        <meshStandardMaterial color="#060608" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Logo image plane */}
      <mesh position={[0, 0, 0.051]}>
        <planeGeometry args={[5.1, 1.25]} />
        <meshStandardMaterial
          ref={glowRef}
          map={tex}
          color="#ffffff"
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={0.6}
          roughness={0.05}
          transparent
        />
      </mesh>
    </group>
  );
}

// Logo panel for side walls / atrium columns
function LogoPanel({ position, rotation = 0, w = 3.8, h = 1.0 }: {
  position: [number, number, number]; rotation?: number; w?: number; h?: number; useIcon?: boolean;
}) {
  const tex = useTexture("/main_logo.png") as THREE.Texture;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.06]} />
        <meshStandardMaterial color="#060608" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={tex}
          color="#ffffff"
          emissive="#ffffff"
          emissiveMap={tex}
          emissiveIntensity={0.5}
          roughness={0.05}
          transparent
        />
      </mesh>
    </group>
  );
}

function OfficeEnvironment() {
  return (
    <>
      {/* Floor — warm dark-charcoal carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#1e1c2a" roughness={0.96} metalness={0} />
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
      <ServerRoomGlass />

      {/* Floor accent zones */}
      <FloorAccents />

      {/* Logo on reception south wall — large image display */}
      <LogoWall />

      {/* Logo panels on north wall + east/west walls — alternate icon/full for 50/50 */}
      <LogoPanel position={[0,   3.0,  19.72]} rotation={Math.PI}      w={6.0} h={1.6} useIcon={true} />
      <LogoPanel position={[24.72, 3.0, -5]}   rotation={-Math.PI / 2} w={4.0} h={1.2} useIcon={false} />
      <LogoPanel position={[-24.72, 3.0, 8]}   rotation={Math.PI / 2}  w={4.0} h={1.2} useIcon={true} />

      {/* Animated lift doors on west wall */}
      <AnimatedLiftDoor position={[-24.5, 0, -4]} phaseOffset={0} />
      <AnimatedLiftDoor position={[-24.5, 0, 4]} phaseOffset={7} />
    </>
  );
}

function FloorGrid() {
  // Carpet micro-pattern — tight crosshatch, E-W and N-S lines
  const lines = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const verts: number[] = [];
    for (let z = -20; z <= 20.01; z += 0.45) {
      verts.push(-25, 0.004, z, 25, 0.004, z);
    }
    for (let x = -25; x <= 25.01; x += 0.45) {
      verts.push(x, 0.004, -20, x, 0.004, 20);
    }
    geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return geom;
  }, []);

  return (
    <lineSegments geometry={lines}>
      <lineBasicMaterial color="#1e1c30" transparent opacity={0.18} />
    </lineSegments>
  );
}

function CeilingSystem() {
  const CEIL_Y = 5.5;

  // Long LED strip positions — one strip per Z row, running full E-W width
  const strips = useMemo(() => {
    const arr: number[] = [];
    for (let z = -18; z <= 18.01; z += 2.2) arr.push(z);
    return arr;
  }, []);

  return (
    <group>
      {/* Main ceiling plane — clean white */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL_Y, 0]}>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial color="#f0f0f8" roughness={0.9} />
      </mesh>

      {/* LED strip housings + emissive diffusers — full ceiling width, modern JP Morgan style */}
      {strips.map((z, i) => (
        <group key={i} position={[0, CEIL_Y - 0.03, z]}>
          {/* Aluminum housing channel */}
          <mesh>
            <boxGeometry args={[48, 0.06, 0.14]} />
            <meshStandardMaterial color="#3a3a50" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Emissive LED diffuser strip — faces downward */}
          <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[48, 0.10]} />
            <meshStandardMaterial color="#ffffff" emissive="#ddeeff" emissiveIntensity={1.8} roughness={0.05} />
          </mesh>
        </group>
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
      {/* Lift lobby glass partition — 3 gate openings (each 0.9m wide) at z=-2.7, 0, +2.7 */}
      {/* South section: z=-9 to z=-3.15 */}
      {[-8, -4].map((z, i) => (
        <group key={`ls${i}`}>
          <GlassPanel x={-18} y={2.75} z={z} w={0.06} h={5.5} d={3.8} tint="#8090d0" opacity={0.14} />
          <MullionV x={-18} y={2.75} z={z + 2} h={5.5} />
        </group>
      ))}
      {/* Gate gap sections — thin half-panels with gate post between */}
      {[-2.7, 0, 2.7].map((z, i) => (
        <group key={`gate${i}`}>
          {/* Gate post */}
          <mesh position={[-18, 1.0, z]}>
            <boxGeometry args={[0.12, 2.0, 0.12]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.2} metalness={0.85} />
          </mesh>
          {/* Card reader on post */}
          <mesh position={[-17.88, 1.1, z]}>
            <boxGeometry args={[0.06, 0.18, 0.1]} />
            <meshStandardMaterial color="#0a0a18" roughness={0.2} metalness={0.6} />
          </mesh>
          <mesh position={[-17.85, 1.1, z]}>
            <boxGeometry args={[0.02, 0.08, 0.07]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.2} />
          </mesh>
          {/* Horizontal gate arm (barrier) */}
          <mesh position={[-17.8, 0.88, z + 0.4]}>
            <boxGeometry args={[0.04, 0.025, 0.7]} />
            <meshStandardMaterial color="#1a4a8a" emissive="#1a4a8a" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      {/* North section: z=3.15 to z=9 */}
      {[4, 8].map((z, i) => (
        <group key={`ln${i}`}>
          <GlassPanel x={-18} y={2.75} z={z} w={0.06} h={5.5} d={3.8} tint="#8090d0" opacity={0.14} />
          <MullionV x={-18} y={2.75} z={z + 2} h={5.5} />
        </group>
      ))}
      {/* Glass partial panel above gates (top 3m, above head height) */}
      <GlassPanel x={-18} y={4.5} z={0} w={0.06} h={2.0} d={6} tint="#8090d0" opacity={0.10} />

      {/* Executive suite glass partition */}
      {[-8, -4, 0].map((z, i) => (
        <group key={`ex${i}`}>
          <GlassPanel x={14} y={2.75} z={z} w={0.06} h={5.5} d={3.8} tint="#8090d0" opacity={0.1} />
          <MullionV x={14} y={2.75} z={z + 2} h={5.5} />
        </group>
      ))}

      {/* Low partition removed — was blocking Priya's glass room door */}
    </group>
  );
}

function GlassRoom({ cx, cz, w, d, label, color = "#8090d0", doorId, doorSide = "south" }: {
  cx: number; cz: number; w: number; d: number; label?: string; color?: string;
  doorId?: string; doorSide?: "south" | "north";
}) {
  const CEIL = 5.5;
  const DOOR_H = 2.6;  // human-scale door height — character is ~1.8 m
  const DOOR_W = 1.5;
  const openDoors = useGameStore(s => s.openDoors);
  const nearbyDoor = useGameStore(s => s.nearbyDoor);
  const isOpen = doorId ? openDoors.includes(doorId) : false;
  // Hinge on left post; 0.15 rad ≈ slightly ajar when closed, PI/2 = fully open into room
  const doorRotY = isOpen ? Math.PI / 2 : 0.15;
  const sideW = (w - DOOR_W) / 2;
  // For north-side door, the hinge opens outward (-Z direction)
  const northDoorRotY = isOpen ? -Math.PI / 2 : -0.15;

  return (
    <group position={[cx, 0, cz]}>
      {/* North wall — full width, or with door if doorSide='north' */}
      {doorId && doorSide === "north" ? (
        <>
          <mesh position={[-(DOOR_W / 2 + sideW / 2), CEIL / 2, d / 2]}>
            <boxGeometry args={[sideW, CEIL, 0.07]} />
            <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
          </mesh>
          <mesh position={[(DOOR_W / 2 + sideW / 2), CEIL / 2, d / 2]}>
            <boxGeometry args={[sideW, CEIL, 0.07]} />
            <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
          </mesh>
          <mesh position={[-DOOR_W / 2, CEIL / 2, d / 2]}>
            <boxGeometry args={[0.1, CEIL, 0.14]} />
            <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[DOOR_W / 2, CEIL / 2, d / 2]}>
            <boxGeometry args={[0.1, CEIL, 0.14]} />
            <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Transom glass above door opening */}
          <mesh position={[0, DOOR_H + (CEIL - DOOR_H) / 2, d / 2]}>
            <boxGeometry args={[DOOR_W, CEIL - DOOR_H, 0.07]} />
            <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
          </mesh>
          {/* Transom bar */}
          <mesh position={[0, DOOR_H, d / 2]}>
            <boxGeometry args={[DOOR_W + 0.12, 0.06, 0.1]} />
            <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
          </mesh>
          <group position={[-DOOR_W / 2, DOOR_H / 2, d / 2]} rotation={[0, northDoorRotY, 0]}>
            <mesh position={[DOOR_W / 2, 0, 0]}>
              <boxGeometry args={[DOOR_W, DOOR_H, 0.06]} />
              <meshStandardMaterial color="#b8d4f0" transparent opacity={isOpen ? 0.12 : 0.58}
                roughness={0.02} metalness={0.15} />
            </mesh>
            <mesh position={[DOOR_W / 2, DOOR_H / 2 - 0.04, 0]}>
              <boxGeometry args={[DOOR_W + 0.04, 0.06, 0.09]} />
              <meshStandardMaterial color="#8090b0" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[DOOR_W / 2, -DOOR_H / 2 + 0.04, 0]}>
              <boxGeometry args={[DOOR_W + 0.04, 0.06, 0.09]} />
              <meshStandardMaterial color="#8090b0" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0.04, 0, 0]}>
              <boxGeometry args={[0.06, DOOR_H, 0.09]} />
              <meshStandardMaterial color="#8090b0" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[DOOR_W - 0.02, 0, 0]}>
              <boxGeometry args={[0.06, DOOR_H, 0.09]} />
              <meshStandardMaterial color="#8090b0" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[DOOR_W - 0.24, -0.14, 0.06]}>
              <boxGeometry args={[0.22, 0.04, 0.04]} />
              <meshStandardMaterial color="#c0c8d8" roughness={0.1} metalness={0.95} />
            </mesh>
            <mesh position={[DOOR_W - 0.13, -0.16, 0.06]}>
              <boxGeometry args={[0.04, 0.18, 0.04]} />
              <meshStandardMaterial color="#c0c8d8" roughness={0.1} metalness={0.95} />
            </mesh>
          </group>
        </>
      ) : (
        <mesh position={[0, CEIL / 2, d / 2]}>
          <boxGeometry args={[w, CEIL, 0.07]} />
          <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
        </mesh>
      )}
      {/* West wall */}
      <mesh position={[-w / 2, CEIL / 2, 0]}>
        <boxGeometry args={[0.07, CEIL, d]} />
        <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
      </mesh>
      {/* East wall */}
      <mesh position={[w / 2, CEIL / 2, 0]}>
        <boxGeometry args={[0.07, CEIL, d]} />
        <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
      </mesh>

      {/* South wall — with door opening if doorId provided and doorSide='south' */}
      {doorId && doorSide === "south" ? (
        <>
          {/* Left glass panel */}
          <mesh position={[-(DOOR_W / 2 + sideW / 2), CEIL / 2, -d / 2]}>
            <boxGeometry args={[sideW, CEIL, 0.07]} />
            <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
          </mesh>
          {/* Right glass panel */}
          <mesh position={[(DOOR_W / 2 + sideW / 2), CEIL / 2, -d / 2]}>
            <boxGeometry args={[sideW, CEIL, 0.07]} />
            <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
          </mesh>
          {/* Left door post */}
          <mesh position={[-DOOR_W / 2, CEIL / 2, -d / 2]}>
            <boxGeometry args={[0.1, CEIL, 0.14]} />
            <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Right door post */}
          <mesh position={[DOOR_W / 2, CEIL / 2, -d / 2]}>
            <boxGeometry args={[0.1, CEIL, 0.14]} />
            <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Transom glass above door opening */}
          <mesh position={[0, DOOR_H + (CEIL - DOOR_H) / 2, -d / 2]}>
            <boxGeometry args={[DOOR_W, CEIL - DOOR_H, 0.07]} />
            <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
          </mesh>
          {/* Transom bar */}
          <mesh position={[0, DOOR_H, -d / 2]}>
            <boxGeometry args={[DOOR_W + 0.12, 0.06, 0.1]} />
            <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Door panel — hinges at left post, swings inward (+Z) when open */}
          <group position={[-DOOR_W / 2, DOOR_H / 2, -d / 2]} rotation={[0, doorRotY, 0]}>
            {/* Door glass */}
            <mesh position={[DOOR_W / 2, 0, 0]}>
              <boxGeometry args={[DOOR_W, DOOR_H, 0.06]} />
              <meshStandardMaterial color="#b8d4f0" transparent opacity={isOpen ? 0.12 : 0.58}
                roughness={0.02} metalness={0.15} />
            </mesh>
            {/* Door frame — top */}
            <mesh position={[DOOR_W / 2, DOOR_H / 2 - 0.04, 0]}>
              <boxGeometry args={[DOOR_W + 0.04, 0.06, 0.09]} />
              <meshStandardMaterial color="#8090b0" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Door frame — bottom */}
            <mesh position={[DOOR_W / 2, -DOOR_H / 2 + 0.04, 0]}>
              <boxGeometry args={[DOOR_W + 0.04, 0.06, 0.09]} />
              <meshStandardMaterial color="#8090b0" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Door frame — hinge side */}
            <mesh position={[0.04, 0, 0]}>
              <boxGeometry args={[0.06, DOOR_H, 0.09]} />
              <meshStandardMaterial color="#8090b0" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Door frame — latch side */}
            <mesh position={[DOOR_W - 0.02, 0, 0]}>
              <boxGeometry args={[0.06, DOOR_H, 0.09]} />
              <meshStandardMaterial color="#8090b0" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Door handle — lever bar */}
            <mesh position={[DOOR_W - 0.24, -0.14, 0.06]}>
              <boxGeometry args={[0.22, 0.04, 0.04]} />
              <meshStandardMaterial color="#c0c8d8" roughness={0.1} metalness={0.95} />
            </mesh>
            <mesh position={[DOOR_W - 0.13, -0.16, 0.06]}>
              <boxGeometry args={[0.04, 0.18, 0.04]} />
              <meshStandardMaterial color="#c0c8d8" roughness={0.1} metalness={0.95} />
            </mesh>
          </group>
        </>
      ) : (
        <mesh position={[0, CEIL / 2, -d / 2]}>
          <boxGeometry args={[w, CEIL, 0.07]} />
          <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0} metalness={0.05} />
        </mesh>
      )}

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

      {label && (
        <Text position={[0, CEIL + 0.2, 0]} fontSize={0.18} color={color}
          anchorX="center" anchorY="middle" letterSpacing={0.08}>
          {label}
        </Text>
      )}

      {/* Floating [T] hint — eye-level, camera-facing, visible only when player is close */}
      {doorId && nearbyDoor === doorId && (
        <group position={[0, 1.2, doorSide === "south" ? -d / 2 - 0.15 : d / 2 + 0.15]}>
          <Billboard>
            <Text
              fontSize={0.22}
              color={isOpen ? "#4ade80" : "#60a5fa"}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
            >
              {isOpen ? "[T] Close" : "[T] Open"}
            </Text>
          </Billboard>
        </group>
      )}
    </group>
  );
}

function BoardroomGlass() {
  // x=8..18, z=-10..-19 (cx=13, cz=-14.5, w=10, d=8.5)
  const cx = 13, cz = -14.5;
  return (
    <group>
      <GlassRoom cx={cx} cz={cz} w={10} d={8.5} label="BOARDROOM" color="#8090d0"
        doorId="door_boardroom" doorSide="north" />
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
  // Furniture rendered by SmallMeetingRoom in OfficeProps
  const cx = 11, cz = 10.5;
  return (
    <group>
      <GlassRoom cx={cx} cz={cz} w={6} d={7} label="ENGINEERING SYNC" color="#0ea5e9" doorId="door_eng" doorSide="north" />
    </group>
  );
}

function HuddleRoomB() {
  // Compliance side: x=-7..2, z=10..18 (cx=-2.5, cz=14, w=9, d=8)
  // Furniture rendered by SmallMeetingRoom in OfficeProps
  const cx = -2.5, cz = 14;
  return (
    <group>
      <GlassRoom cx={cx} cz={cz} w={9} d={8} label="COMPLIANCE REVIEW" color="#10b981" doorId="door_compliance" />
    </group>
  );
}

// ── Server room glass enclosure ───────────────────────────────────────────────
// Server room occupies x=20..24.5, z=7..19.5. West wall faces main office —
// that's where the visual (non-interactive) door sits.
function ServerRoomGlass() {
  const CEIL = 5.5;
  const DOOR_H = 2.6;
  const DOOR_W = 1.5;
  const color = "#80a0c8";
  // Room dimensions (local coords, group positioned at center)
  const w = 4.5, d = 12.5;         // east-west width, north-south depth
  const sideD = (d - DOOR_W) / 2;  // glass panel height on each side of door gap

  return (
    <group position={[22.25, 0, 13.25]}>
      {/* South wall */}
      <mesh position={[0, CEIL / 2, -d / 2]}>
        <boxGeometry args={[w, CEIL, 0.07]} />
        <meshStandardMaterial color={color} transparent opacity={0.13} roughness={0} metalness={0.05} />
      </mesh>
      {/* North wall */}
      <mesh position={[0, CEIL / 2, d / 2]}>
        <boxGeometry args={[w, CEIL, 0.07]} />
        <meshStandardMaterial color={color} transparent opacity={0.13} roughness={0} metalness={0.05} />
      </mesh>
      {/* East wall (inner face of outer glass wall — keep thin so it doesn't double-up) */}
      <mesh position={[w / 2, CEIL / 2, 0]}>
        <boxGeometry args={[0.07, CEIL, d]} />
        <meshStandardMaterial color={color} transparent opacity={0.08} roughness={0} metalness={0.05} />
      </mesh>
      {/* West wall — south panel (below door) */}
      <mesh position={[-w / 2, CEIL / 2, -(DOOR_W / 2 + sideD / 2)]}>
        <boxGeometry args={[0.07, CEIL, sideD]} />
        <meshStandardMaterial color={color} transparent opacity={0.13} roughness={0} metalness={0.05} />
      </mesh>
      {/* West wall — north panel (above door) */}
      <mesh position={[-w / 2, CEIL / 2, (DOOR_W / 2 + sideD / 2)]}>
        <boxGeometry args={[0.07, CEIL, sideD]} />
        <meshStandardMaterial color={color} transparent opacity={0.13} roughness={0} metalness={0.05} />
      </mesh>
      {/* Door posts */}
      <mesh position={[-w / 2, CEIL / 2, -DOOR_W / 2]}>
        <boxGeometry args={[0.14, CEIL, 0.10]} />
        <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[-w / 2, CEIL / 2, DOOR_W / 2]}>
        <boxGeometry args={[0.14, CEIL, 0.10]} />
        <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Transom glass above door */}
      <mesh position={[-w / 2, DOOR_H + (CEIL - DOOR_H) / 2, 0]}>
        <boxGeometry args={[0.07, CEIL - DOOR_H, DOOR_W]} />
        <meshStandardMaterial color={color} transparent opacity={0.13} roughness={0} metalness={0.05} />
      </mesh>
      {/* Transom bar */}
      <mesh position={[-w / 2, DOOR_H, 0]}>
        <boxGeometry args={[0.10, 0.06, DOOR_W + 0.12]} />
        <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Static door glass panel */}
      <mesh position={[-w / 2, DOOR_H / 2, 0]}>
        <boxGeometry args={[0.06, DOOR_H, DOOR_W]} />
        <meshStandardMaterial color="#b8d4f0" transparent opacity={0.55} roughness={0.02} metalness={0.15} />
      </mesh>
      {/* Top frame rail */}
      {[
        [0, CEIL - 0.03, -d / 2, w, 0.07, 0.10],
        [0, CEIL - 0.03,  d / 2, w, 0.07, 0.10],
        [-w / 2, CEIL - 0.03, 0, 0.10, 0.07, d],
        [ w / 2, CEIL - 0.03, 0, 0.10, 0.07, d],
      ].map((p, i) => (
        <mesh key={`sr${i}`} position={p.slice(0, 3) as [number, number, number]}>
          <boxGeometry args={p.slice(3) as [number, number, number]} />
          <meshStandardMaterial color="#a0a8c0" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      <Text position={[0, CEIL + 0.2, 0]} fontSize={0.18} color={color}
        anchorX="center" anchorY="middle" letterSpacing={0.08}>
        SERVER ROOM
      </Text>
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

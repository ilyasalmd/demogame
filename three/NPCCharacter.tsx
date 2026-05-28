"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { CharacterDef } from "@/game/types";
import { useGameStore } from "@/store/gameStore";
import { NPC_POSITIONS } from "@/game/npcRegistry";
import { COLLISION_WALLS } from "@/game/collisionWalls";

// ─── NPC wall collision ───────────────────────────────────────────────────────
const NPC_RADIUS = 0.32;
function checkNPCWall(x: number, z: number): boolean {
  for (const [minX, minZ, maxX, maxZ] of COLLISION_WALLS) {
    if (
      x + NPC_RADIUS > minX && x - NPC_RADIUS < maxX &&
      z + NPC_RADIUS > minZ && z - NPC_RADIUS < maxZ
    ) return true;
  }
  return false;
}

interface NPCCharacterProps {
  character: CharacterDef;
  isNearby: boolean;
}

// ─── Deterministic outfit / hair helpers ─────────────────────────────────────

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getOutfitIndex(id: string): number {
  return strHash(id) % 4;
}

interface OutfitColors {
  jacket: string;
  trouser: string;
  shirt: string;
  shirtCuff: string;
  sleeveColor: string;
}

function getOutfit(id: string): OutfitColors {
  const idx = getOutfitIndex(id);
  // 0 = navy suit, 1 = charcoal/black suit, 2 = dark brown suit, 3 = quarter-zip / casual
  switch (idx) {
    case 0:
      return { jacket: "#1a2a4a", trouser: "#111828", shirt: "#f4f4f8", shirtCuff: "#f4f4f8", sleeveColor: "#1a2a4a" };
    case 1:
      return { jacket: "#2a2a3a", trouser: "#18181e", shirt: "#f4f4f8", shirtCuff: "#f4f4f8", sleeveColor: "#2a2a3a" };
    case 2:
      return { jacket: "#3a2010", trouser: "#2a1a0a", shirt: "#f4f4f8", shirtCuff: "#f4f4f8", sleeveColor: "#3a2010" };
    default: // 3 — business casual / quarter-zip
      return { jacket: "#1a1a2a", trouser: "#1a2010", shirt: "#1a1a2a", shirtCuff: "#1a1a2a", sleeveColor: "#1a1a2a" };
  }
}

interface HairConfig {
  style: "short" | "mid" | "bun" | "bald";
  color: string;
}

const HAIR_PALETTE = ["#0a0600", "#1a0a00", "#2a1500", "#3a2510", "#0a0a14", "#5a3820", "#c0a060"];

function getHairConfig(id: string): HairConfig {
  const h = strHash(id);
  const styleIdx = h % 4;
  const colorIdx = (h >> 2) % HAIR_PALETTE.length;
  const styles: HairConfig["style"][] = ["short", "mid", "bun", "bald"];
  return { style: styles[styleIdx], color: HAIR_PALETTE[colorIdx] };
}

const NAMED_HAIR: Record<string, HairConfig> = {
  maya:   { style: "bun",   color: "#1a0800" },
  theo:   { style: "short", color: "#4a2800" },
  oliver: { style: "mid",   color: "#8b5e0a" },
  priya:  { style: "bun",   color: "#0a0404" },
  amara:  { style: "mid",   color: "#0a0404" },
};

const HEIGHT_SCALES: Record<string, number> = {
  maya:   0.96,
  theo:   1.08,
  oliver: 1.04,
  priya:  0.93,
  amara:  1.00,
};

function getWatchColor(id: string): string {
  return strHash(id) % 2 === 0 ? "#c9a827" : "#c0c0c8";
}

// ─── Hair sub-component ───────────────────────────────────────────────────────

function HairMesh({ style, color, headY }: { style: HairConfig["style"]; color: string; headY: number }) {
  if (style === "bald") return null;
  if (style === "short") {
    return (
      <mesh position={[0, headY + 0.02, -0.02]}>
        <sphereGeometry args={[0.225, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    );
  }
  if (style === "mid") {
    return (
      <group>
        <mesh position={[0, headY + 0.02, -0.02]}>
          <sphereGeometry args={[0.228, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.60]} />
          <meshStandardMaterial color={color} roughness={0.88} />
        </mesh>
        <mesh position={[-0.20, headY - 0.06, 0.03]}>
          <boxGeometry args={[0.07, 0.22, 0.10]} />
          <meshStandardMaterial color={color} roughness={0.88} />
        </mesh>
        <mesh position={[0.20, headY - 0.06, 0.03]}>
          <boxGeometry args={[0.07, 0.22, 0.10]} />
          <meshStandardMaterial color={color} roughness={0.88} />
        </mesh>
      </group>
    );
  }
  // bun
  return (
    <group>
      <mesh position={[0, headY + 0.03, -0.02]}>
        <sphereGeometry args={[0.222, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <mesh position={[0, headY + 0.22, -0.10]}>
        <sphereGeometry args={[0.068, 7, 6]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
    </group>
  );
}

// ─── Full articulated body ────────────────────────────────────────────────────

interface BodyProps {
  skinColor: string;
  outfit: OutfitColors;
  hair: HairConfig;
  watchColor: string;
  headRef: React.RefObject<THREE.Mesh>;
  leftArmRef: React.RefObject<THREE.Group>;
  rightArmRef: React.RefObject<THREE.Group>;
  leftLegRef?: React.RefObject<THREE.Group>;
  rightLegRef?: React.RefObject<THREE.Group>;
}

function ArticulatedBody({ skinColor, outfit, hair, watchColor, headRef, leftArmRef, rightArmRef, leftLegRef, rightLegRef }: BodyProps) {
  const shoeColor = "#0a0a10";

  return (
    <group>
      {/* ── Feet ── */}
      <mesh position={[-0.115, 0.055, 0.07]} castShadow>
        <boxGeometry args={[0.18, 0.09, 0.30]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0.115, 0.055, 0.07]} castShadow>
        <boxGeometry args={[0.18, 0.09, 0.30]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* ── Right leg ── */}
      <group ref={rightLegRef} position={[0.115, 0.78, 0]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.190, 0.36, 0.195]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.098, 0.098, 0.09, 8]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.24, 0]} castShadow>
          <boxGeometry args={[0.178, 0.42, 0.185]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
      </group>

      {/* ── Left leg ── */}
      <group ref={leftLegRef} position={[-0.115, 0.78, 0]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.190, 0.36, 0.195]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.098, 0.098, 0.09, 8]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.24, 0]} castShadow>
          <boxGeometry args={[0.178, 0.42, 0.185]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
      </group>

      {/* ── Torso (tapered) ── */}
      <mesh position={[0, 1.10, 0]} castShadow>
        <boxGeometry args={[0.44, 0.28, 0.265]} />
        <meshStandardMaterial color={outfit.jacket} roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.30, 0]} castShadow>
        <boxGeometry args={[0.50, 0.20, 0.275]} />
        <meshStandardMaterial color={outfit.jacket} roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.46, 0]} castShadow>
        <boxGeometry args={[0.54, 0.18, 0.280]} />
        <meshStandardMaterial color={outfit.jacket} roughness={0.62} />
      </mesh>

      {/* ── Shirt front + lapels ── */}
      <mesh position={[0, 1.22, 0.138]}>
        <boxGeometry args={[0.16, 0.52, 0.03]} />
        <meshStandardMaterial color={outfit.shirt} roughness={0.38} />
      </mesh>
      <mesh position={[-0.07, 1.50, 0.134]}>
        <boxGeometry args={[0.065, 0.10, 0.03]} />
        <meshStandardMaterial color={outfit.shirt} roughness={0.38} />
      </mesh>
      <mesh position={[0.07, 1.50, 0.134]}>
        <boxGeometry args={[0.065, 0.10, 0.03]} />
        <meshStandardMaterial color={outfit.shirt} roughness={0.38} />
      </mesh>

      {/* ── Right arm ── */}
      <group ref={rightArmRef} position={[0.36, 1.44, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.160, 0.30, 0.185]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.30, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.07, 7]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.48, 0]} castShadow>
          <boxGeometry args={[0.145, 0.30, 0.168]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[0.160, 0.075, 0.183]} />
          <meshStandardMaterial color="#f4f4f8" roughness={0.36} />
        </mesh>
        <mesh position={[0, -0.76, 0.02]}>
          <sphereGeometry args={[0.072, 7, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.70} />
        </mesh>
      </group>

      {/* ── Left arm ── */}
      <group ref={leftArmRef} position={[-0.36, 1.44, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.160, 0.30, 0.185]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.30, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.07, 7]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.48, 0]} castShadow>
          <boxGeometry args={[0.145, 0.30, 0.168]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[0.160, 0.075, 0.183]} />
          <meshStandardMaterial color="#f4f4f8" roughness={0.36} />
        </mesh>
        {/* watch on left wrist */}
        <mesh position={[0, -0.64, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.175, 8]} />
          <meshStandardMaterial color={watchColor} roughness={0.25} metalness={0.85} />
        </mesh>
        <mesh position={[0, -0.76, 0.02]}>
          <sphereGeometry args={[0.072, 7, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.70} />
        </mesh>
      </group>

      {/* ── Neck ── */}
      <mesh position={[0, 1.60, 0]}>
        <cylinderGeometry args={[0.092, 0.100, 0.18, 7]} />
        <meshStandardMaterial color={skinColor} roughness={0.70} />
      </mesh>

      {/* ── Head ── */}
      <mesh ref={headRef} position={[0, 1.88, 0]} scale={[1, 1.06, 0.98]} castShadow>
        <sphereGeometry args={[0.218, 9, 7]} />
        <meshStandardMaterial color={skinColor} roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.96, 0.198]}>
        <boxGeometry args={[0.27, 0.032, 0.028]} />
        <meshStandardMaterial color={skinColor} roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.87, 0.218]}>
        <boxGeometry args={[0.052, 0.065, 0.040]} />
        <meshStandardMaterial color={skinColor} roughness={0.65} />
      </mesh>
      <mesh position={[0, 1.80, 0.208]}>
        <boxGeometry args={[0.092, 0.020, 0.022]} />
        <meshStandardMaterial color={skinColor} roughness={0.55} />
      </mesh>
      <mesh position={[-0.082, 1.93, 0.192]}>
        <sphereGeometry args={[0.046, 6, 5]} />
        <meshStandardMaterial color="#f2f2f6" roughness={0.22} />
      </mesh>
      <mesh position={[0.082, 1.93, 0.192]}>
        <sphereGeometry args={[0.046, 6, 5]} />
        <meshStandardMaterial color="#f2f2f6" roughness={0.22} />
      </mesh>
      <mesh position={[-0.082, 1.93, 0.214]}>
        <sphereGeometry args={[0.029, 5, 4]} />
        <meshStandardMaterial color="#080810" roughness={0.18} />
      </mesh>
      <mesh position={[0.082, 1.93, 0.214]}>
        <sphereGeometry args={[0.029, 5, 4]} />
        <meshStandardMaterial color="#080810" roughness={0.18} />
      </mesh>

      <HairMesh style={hair.style} color={hair.color} headY={1.88} />
    </group>
  );
}

// ─── Wander zones ─────────────────────────────────────────────────────────────

type NPCBehavior = "working" | "aware" | "nearby";

// Wander zones — open floor areas verified NOT inside any desk collision box
const WANDER_ZONES: [number, number, number][] = [
  [ -5,  0,  -2],  // reception corridor
  [ -8,  0,   0],  // ops pod approach (clear of row z=0.9..2.05)
  [ -3,  0,   6],  // compliance corridor entrance
  [  6,  0,  -2],  // analytics/engineering gap
  [  3,  0,  -6],  // analytics west approach
  [  0,  0,   7],  // compliance room front
  [-12,  0,   8],  // coffee area
  [ 14,  0,   3],  // exec zone
  [  5,  0,  -7],  // analytics south front
  [ -8,  0,  -3],  // ops south approach
];

// ─── Main component ────────────────────────────────────────────────────────────

export function NPCCharacter({ character, isNearby }: NPCCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef  = useRef<THREE.Mesh>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef  = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  // All random init values as refs — never causes re-renders
  const bobOffsetRef  = useRef(Math.random() * Math.PI * 2);
  const lookOffsetRef = useRef(Math.random() * Math.PI * 2);
  const walkSpeedRef  = useRef(1.8 + Math.random() * 0.8);
  const seatedOffsetRef = useRef(0);

  // Wander state as ref — mutations inside useFrame don't trigger re-renders
  const wanderStateRef = useRef<"desk" | "walking">(
    Math.random() < 0.65 ? "desk" : "walking"
  );
  const wanderTarget = useRef(new THREE.Vector3(...character.position));
  const wanderTimer  = useRef(8 + Math.random() * 20);
  const currentPos   = useRef(new THREE.Vector3(...character.position));
  // Scratch vectors — reused every frame to avoid per-frame GC allocations
  const _scratchTarget = useRef(new THREE.Vector3());
  const _scratchDir    = useRef(new THREE.Vector3());

  // Only subscribe to speech bubble — changes rarely; playerPosition read inside useFrame
  const speechBubble = useGameStore((s) => s.speechBubbles[character.id]);

  // Derived visual config — stable per component instance
  const outfit      = getOutfit(character.id);
  const hair        = NAMED_HAIR[character.id] ?? getHairConfig(character.id);
  const watchColor  = getWatchColor(character.id);
  const heightScale = HEIGHT_SCALES[character.id] ?? 1.0;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Read store state — no subscription, no re-renders
    const { playerPosition, activeDialogue, dialogueCharacter } = useGameStore.getState();

    // Freeze entirely when this NPC is in dialogue, or when player is nearby
    // (so the NPC stops naturally before the player presses E)
    const isInDialogue = activeDialogue !== null && dialogueCharacter === character.id;
    const shouldFreeze = isInDialogue || isNearby;

    // ── Wander timer (paused while frozen) ───────────────────────────────────
    if (!shouldFreeze) {
      wanderTimer.current -= delta;
      if (wanderTimer.current <= 0) {
        if (wanderStateRef.current === "desk") {
          const zone = WANDER_ZONES[Math.floor(Math.random() * WANDER_ZONES.length)];
          wanderTarget.current.set(zone[0], 0, zone[2]);
          wanderStateRef.current = "walking";
          wanderTimer.current = 6 + Math.random() * 10;
        } else {
          wanderTarget.current.set(character.position[0], 0, character.position[2]);
          wanderStateRef.current = "desk";
          wanderTimer.current = 15 + Math.random() * 25;
        }
      }
    }

    // ── Movement (frozen while nearby or in dialogue) ─────────────────────────
    // Both "walking" (wander) and "desk" (return-to-spawn) use the same
    // walk-speed stepping so the NPC never teleports.
    if (!shouldFreeze) {
      // Determine the current movement target (reuse scratch to avoid allocation)
      const target = wanderStateRef.current === "walking"
        ? wanderTarget.current
        : _scratchTarget.current.set(character.position[0], 0, character.position[2]);

      const dir  = _scratchDir.current.copy(target).sub(currentPos.current);
      const dist = dir.length();
      const arrivalThreshold = wanderStateRef.current === "walking" ? 0.3 : 0.25;

      if (dist > arrivalThreshold) {
        dir.normalize();
        const mx = dir.x * walkSpeedRef.current * delta;
        const mz = dir.z * walkSpeedRef.current * delta;
        if (!checkNPCWall(currentPos.current.x + mx, currentPos.current.z))
          currentPos.current.x += mx;
        if (!checkNPCWall(currentPos.current.x, currentPos.current.z + mz))
          currentPos.current.z += mz;
      } else if (wanderStateRef.current === "walking") {
        // Reached wander target — return to desk
        wanderTarget.current.set(character.position[0], 0, character.position[2]);
        wanderStateRef.current = "desk";
        wanderTimer.current = 15 + Math.random() * 25;
      }
      // (If "desk" and dist <= 0.25 the NPC is at its spawn — just stand still)

      // ── Light NPC-to-NPC separation (avoid walking through each other) ───────
      let sepX = 0, sepZ = 0;
      for (const [otherId, otherPos] of NPC_POSITIONS) {
        if (otherId === character.id) continue;
        const dx = currentPos.current.x - otherPos.x;
        const dz = currentPos.current.z - otherPos.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < 0.9 && distSq > 0.001) {
          const d = Math.sqrt(distSq);
          const f = (0.95 - d) * 0.5;
          sepX += (dx / d) * f;
          sepZ += (dz / d) * f;
        }
      }
      if (Math.abs(sepX) > 0.001 || Math.abs(sepZ) > 0.001) {
        const nx = currentPos.current.x + sepX * delta;
        const nz = currentPos.current.z + sepZ * delta;
        if (!checkNPCWall(nx, currentPos.current.z)) currentPos.current.x = nx;
        if (!checkNPCWall(currentPos.current.x, nz)) currentPos.current.z = nz;
      }
    }

    // ── Publish live position to shared registry (read by PlayerController) ──
    let reg = NPC_POSITIONS.get(character.id);
    if (!reg) { reg = new THREE.Vector3(); NPC_POSITIONS.set(character.id, reg); }
    reg.set(currentPos.current.x, 0, currentPos.current.z);

    // ── Behaviour tier ────────────────────────────────────────────────────────
    const dx = playerPosition[0] - currentPos.current.x;
    const dz = playerPosition[2] - currentPos.current.z;
    const distToPlayer = Math.sqrt(dx * dx + dz * dz);

    const behavior: NPCBehavior =
      shouldFreeze ? "nearby" : distToPlayer < 7 ? "aware" : "working";

    seatedOffsetRef.current += (0 - seatedOffsetRef.current) * Math.min(1, 4 * delta);

    // ── Group position ────────────────────────────────────────────────────────
    if (groupRef.current) {
      groupRef.current.position.x = currentPos.current.x;
      groupRef.current.position.z = currentPos.current.z;
      groupRef.current.position.y =
        character.position[1] +
        seatedOffsetRef.current +
        Math.sin(t * 1.1 + bobOffsetRef.current) * (behavior === "working" ? 0.005 : 0.012);
    }

    // ── Head ──────────────────────────────────────────────────────────────────
    if (headRef.current) {
      if (behavior === "working") {
        headRef.current.rotation.x = 0.28 + Math.sin(t * 0.5 + lookOffsetRef.current) * 0.04;
        headRef.current.rotation.y = Math.sin(t * 0.3 + lookOffsetRef.current) * 0.08;
      } else if (behavior === "aware") {
        headRef.current.rotation.x = 0.05;
        headRef.current.rotation.y = Math.sin(t * 0.55 + bobOffsetRef.current) * 0.22;
      } else {
        // nearby or in dialogue — face player
        const angle = Math.atan2(dx, dz);
        if (bodyRef.current) bodyRef.current.rotation.y = angle;
        headRef.current.rotation.x = 0;
        headRef.current.rotation.y = Math.sin(t * 0.4 + bobOffsetRef.current) * 0.12;
      }
    }

    // ── Face movement direction whenever actively walking (wander OR return) ───
    const spawnDist = Math.sqrt(
      (character.position[0] - currentPos.current.x) ** 2 +
      (character.position[2] - currentPos.current.z) ** 2
    );
    const isActivelyWalking =
      !shouldFreeze &&
      ((wanderStateRef.current === "walking" && wanderTarget.current.distanceTo(currentPos.current) > 0.3) ||
       (wanderStateRef.current === "desk"    && spawnDist > 0.25));

    if (isActivelyWalking && bodyRef.current) {
      // Reuse scratch dir (already points desk→spawn or pos→wander target)
      const movDir = _scratchDir.current.set(
        wanderStateRef.current === "walking"
          ? wanderTarget.current.x - currentPos.current.x
          : character.position[0] - currentPos.current.x,
        0,
        wanderStateRef.current === "walking"
          ? wanderTarget.current.z - currentPos.current.z
          : character.position[2] - currentPos.current.z
      );
      if (movDir.length() > 0.1) {
        const targetYaw = Math.atan2(movDir.x, movDir.z);
        let df = targetYaw - (bodyRef.current.rotation.y || 0);
        while (df > Math.PI)  df -= Math.PI * 2;
        while (df < -Math.PI) df += Math.PI * 2;
        bodyRef.current.rotation.y =
          (bodyRef.current.rotation.y || 0) + df * Math.min(1, 6 * delta);
      }
    }

    // ── Arm swing ─────────────────────────────────────────────────────────────
    if (leftArmRef.current && rightArmRef.current) {
      if (behavior === "working") {
        const type = Math.sin(t * 4.5 + bobOffsetRef.current) * 0.22;
        leftArmRef.current.rotation.x  = -0.42 + type;
        rightArmRef.current.rotation.x = -0.42 - type;
      } else if (behavior === "aware") {
        const swing = Math.sin(t * 1.8 + bobOffsetRef.current) * 0.08;
        leftArmRef.current.rotation.x  = -0.1 + swing;
        rightArmRef.current.rotation.x = -0.1 - swing;
      } else {
        const swing = Math.sin(t * 2.2 + bobOffsetRef.current) * 0.15;
        leftArmRef.current.rotation.x  = -0.25 + swing;
        rightArmRef.current.rotation.x = -0.25 - swing;
      }
    }

    // ── Leg swing — animate whenever actively walking; decelerate to rest otherwise
    if (leftLegRef.current && rightLegRef.current) {
      if (isActivelyWalking) {
        const step = Math.sin(t * 4.5 + bobOffsetRef.current) * 0.32;
        leftLegRef.current.rotation.x  =  step;
        rightLegRef.current.rotation.x = -step;
      } else {
        leftLegRef.current.rotation.x  *= 0.85;
        rightLegRef.current.rotation.x *= 0.85;
      }
    }
  });

  return (
    <group ref={groupRef} position={character.position}>
      <group ref={bodyRef} scale={[1, heightScale, 1]}>
        {/* Floor shadow */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.32, 16]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.18} />
        </mesh>

        <ArticulatedBody
          skinColor={character.skinColor}
          outfit={outfit}
          hair={hair}
          watchColor={watchColor}
          headRef={headRef as React.RefObject<THREE.Mesh>}
          leftArmRef={leftArmRef as React.RefObject<THREE.Group>}
          rightArmRef={rightArmRef as React.RefObject<THREE.Group>}
          leftLegRef={leftLegRef as React.RefObject<THREE.Group>}
          rightLegRef={rightLegRef as React.RefObject<THREE.Group>}
        />
      </group>

      {/* Name tag */}
      <Billboard position={[0, 2.6, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.145}
          color={isNearby ? character.color : "#94a3b8"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#000000"
        >
          {character.name}
        </Text>
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.1}
          color={isNearby ? "#94a3b8" : "#475569"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#000000"
        >
          {character.role}
        </Text>
        {isNearby && (
          <Text
            position={[0, -0.38, 0]}
            fontSize={0.085}
            color="#6366f1"
            anchorX="center"
            anchorY="middle"
          >
            [E] Talk
          </Text>
        )}
      </Billboard>

      {/* Speech bubble */}
      {speechBubble && (
        <Billboard position={[0, 3.4, 0]} follow lockX={false} lockY={false} lockZ={false}>
          <SpeechBubble text={speechBubble} color={character.color} />
        </Billboard>
      )}

      {/* Interaction ring */}
      {isNearby && <InteractionRing color={character.color} />}
    </group>
  );
}

function SpeechBubble({ text, color }: { text: string; color: string }) {
  const maxLen = 120;
  const display = text.length > maxLen ? text.slice(0, maxLen) + "…" : text;

  return (
    <group>
      <mesh position={[-1.0, 0.5, -0.012]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.96} />
      </mesh>
      <mesh position={[1.0, 0.48, -0.012]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.96} />
      </mesh>
      <mesh position={[0, 0.1, -0.012]}>
        <planeGeometry args={[2.2, 0.56]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.96} />
      </mesh>
      <mesh position={[0, 0.1, -0.015]}>
        <planeGeometry args={[2.24, 0.60]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      <Text
        position={[0, 0.08, 0]}
        fontSize={0.12}
        color="#0a0a1a"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.1}
        textAlign="center"
        outlineWidth={0.003}
        outlineColor="#cccccc"
      >
        {display}
      </Text>
      <mesh position={[0, -0.22, -0.012]}>
        <coneGeometry args={[0.065, 0.15, 3]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function InteractionRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += 0.025;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4.5) * 0.07;
      ringRef.current.scale.set(scale, 1, scale);
    }
  });

  return (
    <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.38, 0.44, 28]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.2}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}

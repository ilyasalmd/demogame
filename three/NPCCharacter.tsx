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
      <mesh position={[-0.115, 0.055, 0.07]}>
        <boxGeometry args={[0.18, 0.09, 0.30]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0.115, 0.055, 0.07]}>
        <boxGeometry args={[0.18, 0.09, 0.30]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* ── Right leg ── */}
      <group ref={rightLegRef} position={[0.115, 0.78, 0]}>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.190, 0.36, 0.195]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.098, 0.098, 0.09, 8]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.178, 0.42, 0.185]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
      </group>

      {/* ── Left leg ── */}
      <group ref={leftLegRef} position={[-0.115, 0.78, 0]}>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.190, 0.36, 0.195]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.098, 0.098, 0.09, 8]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.178, 0.42, 0.185]} />
          <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
        </mesh>
      </group>

      {/* ── Torso (tapered) ── */}
      <mesh position={[0, 1.10, 0]}>
        <boxGeometry args={[0.44, 0.28, 0.265]} />
        <meshStandardMaterial color={outfit.jacket} roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.30, 0]}>
        <boxGeometry args={[0.50, 0.20, 0.275]} />
        <meshStandardMaterial color={outfit.jacket} roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.46, 0]}>
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
        <mesh position={[0, -0.14, 0]}>
          <boxGeometry args={[0.160, 0.30, 0.185]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.30, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.07, 7]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.48, 0]}>
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
        <mesh position={[0, -0.14, 0]}>
          <boxGeometry args={[0.160, 0.30, 0.185]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.30, 0]}>
          <cylinderGeometry args={[0.082, 0.082, 0.07, 7]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.48, 0]}>
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
      <mesh ref={headRef} position={[0, 1.88, 0]} scale={[1, 1.06, 0.98]}>
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
      {/* Eyes — smaller almond-shaped sclera, iris/pupil */}
      <mesh position={[-0.074, 1.932, 0.196]} scale={[1.05, 0.72, 0.55]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color="#e8e8f2" roughness={0.20} />
      </mesh>
      <mesh position={[0.074, 1.932, 0.196]} scale={[1.05, 0.72, 0.55]}>
        <sphereGeometry args={[0.028, 8, 6]} />
        <meshStandardMaterial color="#e8e8f2" roughness={0.20} />
      </mesh>
      <mesh position={[-0.074, 1.932, 0.214]} scale={[0.62, 0.62, 0.38]}>
        <sphereGeometry args={[0.020, 7, 5]} />
        <meshStandardMaterial color="#0e0808" roughness={0.15} />
      </mesh>
      <mesh position={[0.074, 1.932, 0.214]} scale={[0.62, 0.62, 0.38]}>
        <sphereGeometry args={[0.020, 7, 5]} />
        <meshStandardMaterial color="#0e0808" roughness={0.15} />
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
  // Obstacle-avoidance steering — rotates the travel direction when stuck
  const stuckTimerRef  = useRef(0);
  const steerAngleRef  = useRef(0);

  // Wander state — 3-phase: sitting → walking → returning → sitting …
  // Always start seated so characters begin at their desks.
  const wanderStateRef = useRef<"sitting" | "walking" | "returning">("sitting");
  // Blend 0 = standing, 1 = fully seated — lerped each frame for smooth transition
  const seatBlendRef   = useRef(1);
  const wanderTarget   = useRef(new THREE.Vector3(...character.position));
  // How long to sit before standing up (first stand is slightly randomised so
  // all characters don't get up at the same time)
  const wanderTimer    = useRef(8 + Math.random() * 22);
  const currentPos     = useRef(new THREE.Vector3(...character.position));
  // Scratch vectors — reused every frame to avoid per-frame GC allocations
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

    // ── Wander state machine ─────────────────────────────────────────────────
    // sitting → walking → returning → sitting …
    // Characters are ALWAYS moving when walking or returning; they only stop
    // when seated. They freeze in place (shouldFreeze) while player is nearby.
    if (!shouldFreeze) {
      wanderTimer.current -= delta;

      if (wanderStateRef.current === "sitting" && wanderTimer.current <= 0) {
        // Stand up — pick a random wander zone
        const zone = WANDER_ZONES[Math.floor(Math.random() * WANDER_ZONES.length)];
        wanderTarget.current.set(zone[0], 0, zone[2]);
        wanderStateRef.current = "walking";
        wanderTimer.current = 8 + Math.random() * 12; // safety timeout

      } else if (wanderStateRef.current === "walking") {
        const dist = _scratchDir.current
          .copy(wanderTarget.current).sub(currentPos.current).length();
        if (dist < 0.3 || wanderTimer.current <= 0) {
          // Arrived (or timed out) — head back to spawn
          wanderTarget.current.set(character.position[0], 0, character.position[2]);
          wanderStateRef.current = "returning";
          wanderTimer.current = 999;
        }

      } else if (wanderStateRef.current === "returning") {
        const spawnDist = Math.sqrt(
          (character.position[0] - currentPos.current.x) ** 2 +
          (character.position[2] - currentPos.current.z) ** 2
        );
        if (spawnDist < 0.25) {
          // Back at desk — sit down
          wanderStateRef.current = "sitting";
          wanderTimer.current = 15 + Math.random() * 30;
        }
      }
    }

    // ── Seat-blend lerp ───────────────────────────────────────────────────────
    // 1 = fully seated, 0 = standing upright.
    // Stand up when: frozen (player nearby/dialogue) or not in sitting state.
    const seatTarget = (wanderStateRef.current === "sitting" && !shouldFreeze) ? 1 : 0;
    seatBlendRef.current += (seatTarget - seatBlendRef.current) * Math.min(1, 3 * delta);

    // ── Movement ─────────────────────────────────────────────────────────────
    const isMoving =
      !shouldFreeze &&
      (wanderStateRef.current === "walking" || wanderStateRef.current === "returning");

    if (isMoving) {
      const dir  = _scratchDir.current.copy(wanderTarget.current).sub(currentPos.current);
      const dist = dir.length();
      if (dist > 0.1) {
        dir.normalize();
        // Apply steering rotation when avoiding obstacles
        const sa  = steerAngleRef.current;
        const cos = Math.cos(sa), sin = Math.sin(sa);
        const sdx = dir.x * cos - dir.z * sin;
        const sdz = dir.x * sin + dir.z * cos;
        const mx = sdx * walkSpeedRef.current * delta;
        const mz = sdz * walkSpeedRef.current * delta;
        const blockedX = checkNPCWall(currentPos.current.x + mx, currentPos.current.z);
        const blockedZ = checkNPCWall(currentPos.current.x, currentPos.current.z + mz);
        if (!blockedX) currentPos.current.x += mx;
        if (!blockedZ) currentPos.current.z += mz;
        // Preemptive look-ahead: check 0.9 units ahead and start steering before impact
        const LOOK = 0.9;
        const lookBlocked = checkNPCWall(
          currentPos.current.x + sdx * LOOK,
          currentPos.current.z + sdz * LOOK
        );
        // Both axes blocked → increment stuck timer, then rotate steer angle 45°
        if (blockedX && blockedZ) {
          stuckTimerRef.current += delta;
          if (stuckTimerRef.current > 0.4) {
            steerAngleRef.current += Math.PI / 4;
            stuckTimerRef.current = 0;
            if (steerAngleRef.current >= Math.PI * 2) {
              // Tried all 8 directions — abandon target and pick a fresh wander zone
              steerAngleRef.current = 0;
              const zone = WANDER_ZONES[Math.floor(Math.random() * WANDER_ZONES.length)];
              wanderTarget.current.set(zone[0], 0, zone[2]);
            }
          }
        } else if (lookBlocked && Math.abs(steerAngleRef.current) < 0.18) {
          // Preemptive: obstacle ahead within look-ahead distance → begin gradual nudge
          steerAngleRef.current += Math.PI / 8 * delta * 4;
          stuckTimerRef.current = 0;
        } else {
          // Moving freely — reset stuck timer and decay steering back to zero
          stuckTimerRef.current = 0;
          steerAngleRef.current *= (1 - Math.min(1, 2 * delta));
          if (Math.abs(steerAngleRef.current) < 0.05) steerAngleRef.current = 0;
        }
      }

      // Light NPC-to-NPC separation while walking
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

    // ── Player repulsion — treat player as a soft obstacle ──────────────────
    if (isMoving) {
      const pdx = currentPos.current.x - playerPosition[0];
      const pdz = currentPos.current.z - playerPosition[2];
      const playerDistSq = pdx * pdx + pdz * pdz;
      const PLAYER_R = 0.75;
      if (playerDistSq < PLAYER_R * PLAYER_R && playerDistSq > 0.0001) {
        const pd = Math.sqrt(playerDistSq);
        const overlap = PLAYER_R - pd;
        const rx = (pdx / pd) * overlap * 0.6;
        const rz = (pdz / pd) * overlap * 0.6;
        if (!checkNPCWall(currentPos.current.x + rx, currentPos.current.z)) currentPos.current.x += rx;
        if (!checkNPCWall(currentPos.current.x, currentPos.current.z + rz)) currentPos.current.z += rz;
      }
    }

    // ── Hard office boundary — never leave the building ──────────────────────
    currentPos.current.x = Math.max(-18.0, Math.min(23.0, currentPos.current.x));
    currentPos.current.z = Math.max(-18.5, Math.min(18.5, currentPos.current.z));

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

    // ── Group position ────────────────────────────────────────────────────────
    if (groupRef.current) {
      groupRef.current.position.x = currentPos.current.x;
      groupRef.current.position.z = currentPos.current.z;
      groupRef.current.position.y =
        character.position[1]
        - seatBlendRef.current * 0.35   // lower body when seated
        + Math.sin(t * 1.1 + bobOffsetRef.current) * (behavior === "working" ? 0.005 : 0.012);
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
    const isActivelyWalking = isMoving && (
      wanderTarget.current.distanceTo(currentPos.current) > 0.3
    );

    if (isActivelyWalking && bodyRef.current) {
      // Reuse scratch dir — points toward current wanderTarget, then apply steering rotation
      const movDir = _scratchDir.current.set(
        wanderTarget.current.x - currentPos.current.x,
        0,
        wanderTarget.current.z - currentPos.current.z
      );
      if (movDir.length() > 0.1) {
        movDir.normalize();
        const sa = steerAngleRef.current;
        if (Math.abs(sa) > 0.01) {
          const cos = Math.cos(sa), sin = Math.sin(sa);
          const rx = movDir.x * cos - movDir.z * sin;
          const rz = movDir.x * sin + movDir.z * cos;
          movDir.set(rx, 0, rz);
        }
        const targetYaw = Math.atan2(movDir.x, movDir.z);
        let df = targetYaw - (bodyRef.current.rotation.y || 0);
        while (df > Math.PI)  df -= Math.PI * 2;
        while (df < -Math.PI) df += Math.PI * 2;
        bodyRef.current.rotation.y =
          (bodyRef.current.rotation.y || 0) + df * Math.min(1, 6 * delta);
      }
    }

    // ── Snap to desk direction when seated ───────────────────────────────────
    // When seated and not walking, lerp body to face the character's seatFacing.
    if (
      wanderStateRef.current === "sitting" &&
      !isActivelyWalking &&
      !shouldFreeze &&
      character.seatFacing !== undefined &&
      bodyRef.current
    ) {
      let df = character.seatFacing - (bodyRef.current.rotation.y || 0);
      while (df > Math.PI)  df -= Math.PI * 2;
      while (df < -Math.PI) df += Math.PI * 2;
      bodyRef.current.rotation.y =
        (bodyRef.current.rotation.y || 0) + df * Math.min(1, 2.5 * delta);
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

    // ── Leg animation — walk swing, seated fold, or idle rest ────────────────
    if (leftLegRef.current && rightLegRef.current) {
      if (isActivelyWalking) {
        // Full stride animation when walking
        const step = Math.sin(t * 4.5 + bobOffsetRef.current) * 0.32;
        leftLegRef.current.rotation.x  =  step;
        rightLegRef.current.rotation.x = -step;
      } else if (seatBlendRef.current > 0.05) {
        // Smoothly fold legs forward as character sits down
        const seatAngle = -1.1 * seatBlendRef.current;
        leftLegRef.current.rotation.x  +=
          (seatAngle - leftLegRef.current.rotation.x)  * Math.min(1, 4 * delta);
        rightLegRef.current.rotation.x +=
          (seatAngle - rightLegRef.current.rotation.x) * Math.min(1, 4 * delta);
      } else {
        // Standing idle — dampen any residual rotation
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

      {/* Interaction glow — subtle floor disc, no spinning ring */}
      {isNearby && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.40, 20]} />
          <meshStandardMaterial color={character.color} emissive={character.color}
            emissiveIntensity={0.6} transparent opacity={0.28} />
        </mesh>
      )}
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


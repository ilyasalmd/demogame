"use client";
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import { CHARACTERS, INTERACTABLE_OBJECTS } from "@/game/data";
import { playFootstep } from "@/game/audio";
import { NPC_POSITIONS } from "@/game/npcRegistry";
import { mouseSensitivity } from "@/game/settings";

const MOVE_SPEED = 6.0;
const SPRINT_SPEED = 10.0;
const INTERACTION_RADIUS = 2.8;
const DOOR_RADIUS = 2.5;
const PLAYER_RADIUS = 0.45;
const WALK_STEP_INTERVAL = 0.48;   // ~2 steps/sec — natural office walking pace
const SPRINT_STEP_INTERVAL = 0.30; // ~3.3 steps/sec — brisk sprint cadence

const DOOR_POSITIONS = [
  { id: "door_eng",        x: 11,   z: 14,    label: "Engineering Sync" },
  { id: "door_compliance", x: -2.5, z: 10,    label: "Compliance Review" },
  { id: "door_boardroom",  x: 13,   z: -10.25, label: "Boardroom" },
];

const DOOR_COLLISION_WALLS: { doorId: string; wall: [number, number, number, number] }[] = [
  { doorId: "door_compliance", wall: [-3.25, 9.7,    -1.75, 10.1]  },
  { doorId: "door_eng",        wall: [10.25, 14.0,   11.75, 14.3]  },
  { doorId: "door_boardroom",  wall: [12.25, -10.5,  13.75, -9.7]  },
];

const CAM_DIST_DEFAULT = 5.5;
const CAM_DIST_MIN = 2.5;
const CAM_DIST_MAX = 9.0;
const CAM_SHOULDER = 0.52;
const CAM_SPRING = 0.14;
const CAM_LOOK_SPRING = 0.18;
const PITCH_MIN = -0.18;

// Module-level scratch vectors — allocated once, reused every frame.
// Eliminates ~360 short-lived Vector3 allocations/sec that trigger GC pauses.
const _fwd  = new THREE.Vector3();
const _rgt  = new THREE.Vector3();
const _up   = new THREE.Vector3(0, 1, 0);
const _tVel = new THREE.Vector3();
const _move = new THREE.Vector3();
const _camR = new THREE.Vector3();
const _tCam = new THREE.Vector3();
const _look = new THREE.Vector3();
const PITCH_MAX = 0.68;
const SENSITIVITY = 0.007;

interface PlayerControllerProps {
  walls: number[][];
}

export function PlayerController({ walls }: PlayerControllerProps) {
  const { camera } = useThree();

  const keysRef = useRef<Set<string>>(new Set());
  const playerPosRef = useRef(new THREE.Vector3(-15, 0, 0));
  const velocityRef = useRef(new THREE.Vector3());
  const cameraYawRef = useRef(Math.PI / 2);
  const cameraPitchRef = useRef(0.32);
  const cameraDist = useRef(CAM_DIST_DEFAULT);
  const isPointerLocked = useRef(false);
  const footstepTimerRef = useRef(0);
  const isMovingRef = useRef(false);
  const isSprintingRef = useRef(false);
  const walkCycleRef = useRef(0);
  const walkBlendRef = useRef(0); // 0=idle, 1=full walk — lerped for smooth start/stop
  const hadDialogueRef = useRef(false);
  const prevDialogueRef = useRef<boolean>(false);
  const prevDocRef      = useRef<boolean>(false);

  // Throttle refs — only push to Zustand when value actually changes
  const lastReportedPos = useRef({ x: 0, z: 0 });
  const prevNearbyRef   = useRef<string | null>(null);
  const prevDoorRef     = useRef<string | null>(null);

  const camLookRef = useRef(new THREE.Vector3(-15, 1.2, 0));
  const bodyYawRef = useRef(0);

  const meshRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const { setNearbyInteractable, setNearbyDoor, stage, cameraMode, activeDialogue, ambienceUnlocked, setPlayerPosition } = useGameStore();
  // Track document open/close separately so we can exit/re-enter pointer lock around it
  const activeDocumentOpen = useGameStore((s) => !!s.activeDocument);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const tryLock = () => {
      if (!document.pointerLockElement && !useGameStore.getState().activeDialogue) {
        canvas.requestPointerLock();
      }
    };
    const t = setTimeout(tryLock, 300);
    canvas.addEventListener("click", tryLock);
    return () => {
      clearTimeout(t);
      canvas.removeEventListener("click", tryLock);
    };
  }, []);

  useEffect(() => {
    if (activeDialogue) {
      hadDialogueRef.current = true;
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (prevDialogueRef.current && hadDialogueRef.current) {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        const t = setTimeout(() => {
          if (!useGameStore.getState().activeDialogue && !useGameStore.getState().activeDocument) {
            canvas.requestPointerLock();
          }
        }, 150);
        return () => clearTimeout(t);
      }
    }
    prevDialogueRef.current = !!activeDialogue;
  }, [activeDialogue]);

  // ── Document / presentation pointer-lock management ───────────────────────
  // When a document opens: free the mouse so the user can scroll/read.
  // When it closes: automatically recapture so the player can move right away.
  useEffect(() => {
    if (activeDocumentOpen) {
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (prevDocRef.current) {
      // Document just closed — re-enter game pointer lock after the exit animation
      const canvas = document.querySelector("canvas");
      if (canvas) {
        const t = setTimeout(() => {
          if (!useGameStore.getState().activeDialogue && !useGameStore.getState().activeDocument) {
            canvas.requestPointerLock();
          }
        }, 250);
        return () => clearTimeout(t);
      }
    }
    prevDocRef.current = activeDocumentOpen;
  }, [activeDocumentOpen]);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const onLockChange = () => { isPointerLocked.current = !!document.pointerLockElement; };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;
      if (!useGameStore.getState().ambienceUnlocked) return;
      cameraYawRef.current -= e.movementX * mouseSensitivity;
      cameraPitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, cameraPitchRef.current + e.movementY * mouseSensitivity)
      );
    };

    const onWheel = (e: WheelEvent) => {
      cameraDist.current = Math.max(
        CAM_DIST_MIN,
        Math.min(CAM_DIST_MAX, cameraDist.current + e.deltaY * 0.008)
      );
    };

    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // Re-acquire pointer lock when player presses a movement key after returning from another
  // tab or app — browsers auto-exit pointer lock on focus loss, so this re-enters it.
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const MOVE_KEYS = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
    const onMovementKey = (e: KeyboardEvent) => {
      if (!MOVE_KEYS.has(e.key.toLowerCase())) return;
      if (document.pointerLockElement) return; // already locked
      const state = useGameStore.getState();
      if (!state.ambienceUnlocked) return;      // still in intro
      if (state.activeDialogue || state.activeDocument) return; // UI open
      canvas.requestPointerLock();
    };
    window.addEventListener("keydown", onMovementKey);
    return () => window.removeEventListener("keydown", onMovementKey);
  }, []);

  // T key — toggle nearest door
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "t") return;
      const state = useGameStore.getState();
      if (state.nearbyDoor) state.toggleDoor(state.nearbyDoor);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // Block all movement until receptionist finishes intro dialogue
    if (!ambienceUnlocked) return;
    if (activeDialogue) return;

    const keys = keysRef.current;
    const pos = playerPosRef.current;

    isSprintingRef.current = keys.has("shift");
    const speed = isSprintingRef.current ? SPRINT_SPEED : MOVE_SPEED;

    const yaw = cameraYawRef.current;
    _fwd.set(Math.sin(yaw), 0, Math.cos(yaw));
    // right = camera-relative right (what the player sees as right on screen)
    _rgt.crossVectors(_fwd, _up).normalize();

    // Detect pure backward movement (S only, no W/A/D)
    const wDown = keys.has("w") || keys.has("arrowup");
    const sDown = keys.has("s") || keys.has("arrowdown");
    const aDown = keys.has("a") || keys.has("arrowleft");
    const dDown = keys.has("d") || keys.has("arrowright");
    const isBackingUp = sDown && !wDown && !aDown && !dDown;

    _tVel.set(0, 0, 0);
    if (wDown) _tVel.add(_fwd);
    if (sDown) _tVel.sub(_fwd);
    if (aDown) _tVel.sub(_rgt);  // A = screen-left  (A/D now match visual expectation)
    if (dDown) _tVel.add(_rgt);  // D = screen-right
    if (_tVel.lengthSq() > 0) {
      _tVel.normalize().multiplyScalar(isBackingUp ? speed * 0.55 : speed);
    }

    velocityRef.current.lerp(_tVel, Math.min(1, 9 * dt));
    isMovingRef.current = velocityRef.current.lengthSq() > 0.06;

    if (isMovingRef.current) {
      _move.copy(velocityRef.current).multiplyScalar(dt);
      if (!checkCollision(pos.x + _move.x, pos.z, walls)) pos.x += _move.x;
      if (!checkCollision(pos.x, pos.z + _move.z, walls)) pos.z += _move.z;
      pos.x = Math.max(-24, Math.min(24, pos.x));
      pos.z = Math.max(-19, Math.min(19, pos.z));

      // NPC body collision — push player away from all registered NPCs (main + background)
      const NPC_BODY_R = 0.55;
      for (const [, npcVec] of NPC_POSITIONS) {
        const ndx = pos.x - npcVec.x;
        const ndz = pos.z - npcVec.z;
        const distSq = ndx * ndx + ndz * ndz;
        if (distSq < NPC_BODY_R * NPC_BODY_R && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = NPC_BODY_R - dist;
          pos.x += (ndx / dist) * overlap;
          pos.z += (ndz / dist) * overlap;
        }
      }

      footstepTimerRef.current += dt;
      const stepInterval = isSprintingRef.current ? SPRINT_STEP_INTERVAL : WALK_STEP_INTERVAL;
      if (footstepTimerRef.current >= stepInterval) {
        footstepTimerRef.current = 0;
        playFootstep(isSprintingRef.current);
      }
    } else {
      footstepTimerRef.current = 0;
    }

    let targetBodyYaw: number;
    if (isMovingRef.current && velocityRef.current.lengthSq() > 0.5) {
      if (isBackingUp) {
        // Walking backwards — keep character facing the camera direction (no 180° spin)
        targetBodyYaw = yaw;
      } else {
        targetBodyYaw = Math.atan2(velocityRef.current.x, velocityRef.current.z);
      }
    } else {
      targetBodyYaw = yaw;
    }
    bodyYawRef.current = lerpAngle(bodyYawRef.current, targetBodyYaw, 10 * dt);
    if (bodyRef.current) bodyRef.current.rotation.y = bodyYawRef.current;

    const LL = leftLegRef.current;
    const RL = rightLegRef.current;
    const LA = leftArmRef.current;
    const RA = rightArmRef.current;

    if (LL && RL && LA && RA) {
      // Smooth blend: 0 = idle, 1 = full walk — lerped for seamless start/stop
      walkBlendRef.current = THREE.MathUtils.lerp(
        walkBlendRef.current,
        isMovingRef.current ? 1 : 0,
        Math.min(1, 10 * dt)
      );
      const blend = walkBlendRef.current;
      if (blend > 0.01) {
        const freq = isSprintingRef.current ? 11 : 7.5;
        walkCycleRef.current += dt * freq;
      }
      const sw = Math.sin(walkCycleRef.current);
      const amp = (isSprintingRef.current ? 0.50 : 0.40) * blend;
      LL.rotation.x = sw * amp;
      RL.rotation.x = -sw * amp;
      LA.rotation.x = -sw * (amp * 0.6);
      RA.rotation.x = sw * (amp * 0.6);
    }

    if (meshRef.current) {
      meshRef.current.position.set(
        pos.x,
        isMovingRef.current ? Math.abs(Math.sin(walkCycleRef.current * 2)) * 0.028 : 0,
        pos.z
      );
    }

    // Only push position to Zustand when moved > 0.08 units — avoids re-renders every frame
    const lp = lastReportedPos.current;
    const rpDx = pos.x - lp.x, rpDz = pos.z - lp.z;
    if (rpDx * rpDx + rpDz * rpDz > 0.0064) {
      lp.x = pos.x; lp.z = pos.z;
      setPlayerPosition([pos.x, 0, pos.z]);
    }

    if (cameraMode === "third") {
      const dist = cameraDist.current;
      const pitch = cameraPitchRef.current;

      _camR.set(Math.cos(yaw), 0, -Math.sin(yaw));

      const idealCamX = pos.x - Math.sin(yaw) * dist * Math.cos(pitch) + _camR.x * CAM_SHOULDER;
      const idealCamY = pos.y + 1.1 + Math.sin(pitch) * dist + pitch * 0.5;
      const idealCamZ = pos.z - Math.cos(yaw) * dist * Math.cos(pitch) + _camR.z * CAM_SHOULDER;

      _tCam.set(
        Math.max(-23, Math.min(23, idealCamX)),
        Math.max(1.1, Math.min(6.0, idealCamY)),
        Math.max(-18, Math.min(18, idealCamZ)),
      );

      camera.position.lerp(_tCam, CAM_SPRING);

      _look.set(
        pos.x + _camR.x * CAM_SHOULDER * 0.4,
        pos.y + 1.35,
        pos.z + _camR.z * CAM_SHOULDER * 0.4,
      );
      camLookRef.current.lerp(_look, CAM_LOOK_SPRING);
      camera.lookAt(camLookRef.current);

    } else {
      camera.position.set(pos.x, 1.6, pos.z);
      camera.lookAt(
        pos.x + Math.sin(yaw),
        1.6 - cameraPitchRef.current * 0.5,
        pos.z + Math.cos(yaw),
      );
    }

    // Only update interactable/door in Zustand when the value actually changes
    const nextInteractable = findNearbyCharacter(pos) ?? findNearbyObject(pos, stage) ?? null;
    if (nextInteractable !== prevNearbyRef.current) {
      prevNearbyRef.current = nextInteractable;
      setNearbyInteractable(nextInteractable);
    }

    // Door proximity — throttled
    let closestDoor: string | null = null;
    let closestDoorDist = DOOR_RADIUS;
    for (const door of DOOR_POSITIONS) {
      const ddx = door.x - pos.x;
      const ddz = door.z - pos.z;
      const dist = Math.sqrt(ddx * ddx + ddz * ddz);
      if (dist < closestDoorDist) { closestDoorDist = dist; closestDoor = door.id; }
    }
    if (closestDoor !== prevDoorRef.current) {
      prevDoorRef.current = closestDoor;
      setNearbyDoor(closestDoor);
    }

    trackZone(pos);
  });

  return (
    <group ref={meshRef} position={[-15, 0, 0]}>
      <group ref={bodyRef} scale={[1, 1.0, 1]}>
        {cameraMode === "third" && (
          <>
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.32, 16]} />
              <meshStandardMaterial color="#000000" transparent opacity={0.15} />
            </mesh>

            <group ref={leftLegRef} position={[-0.12, 0.87, 0]}>
              <mesh position={[0, -0.41, 0]} castShadow>
                <boxGeometry args={[0.21, 0.82, 0.2]} />
                <meshStandardMaterial color="#1e2a4a" roughness={0.8} />
              </mesh>
              {/* Oxford loafer — polished dark leather sole */}
              <mesh position={[0, -0.845, 0.08]} castShadow>
                <boxGeometry args={[0.19, 0.065, 0.38]} />
                <meshStandardMaterial color="#180800" roughness={0.07} metalness={0.38} />
              </mesh>
              {/* Heel block */}
              <mesh position={[0, -0.835, -0.12]} castShadow>
                <boxGeometry args={[0.16, 0.09, 0.1]} />
                <meshStandardMaterial color="#100500" roughness={0.1} metalness={0.3} />
              </mesh>
              {/* Toe cap (broguing detail line) */}
              <mesh position={[0, -0.845, 0.21]} castShadow>
                <boxGeometry args={[0.175, 0.018, 0.07]} />
                <meshStandardMaterial color="#0c0400" roughness={0.05} metalness={0.45} />
              </mesh>
            </group>

            <group ref={rightLegRef} position={[0.12, 0.87, 0]}>
              <mesh position={[0, -0.41, 0]} castShadow>
                <boxGeometry args={[0.21, 0.82, 0.2]} />
                <meshStandardMaterial color="#1e2a4a" roughness={0.8} />
              </mesh>
              {/* Oxford loafer — polished dark leather sole */}
              <mesh position={[0, -0.845, 0.08]} castShadow>
                <boxGeometry args={[0.19, 0.065, 0.38]} />
                <meshStandardMaterial color="#180800" roughness={0.07} metalness={0.38} />
              </mesh>
              {/* Heel block */}
              <mesh position={[0, -0.835, -0.12]} castShadow>
                <boxGeometry args={[0.16, 0.09, 0.1]} />
                <meshStandardMaterial color="#100500" roughness={0.1} metalness={0.3} />
              </mesh>
              {/* Toe cap (broguing detail line) */}
              <mesh position={[0, -0.845, 0.21]} castShadow>
                <boxGeometry args={[0.175, 0.018, 0.07]} />
                <meshStandardMaterial color="#0c0400" roughness={0.05} metalness={0.45} />
              </mesh>
            </group>

            {/* ── Navy suit jacket ── */}
            <mesh position={[0, 1.18, 0]} castShadow>
              <boxGeometry args={[0.58, 0.75, 0.3]} />
              <meshStandardMaterial color="#1e2a4a" roughness={0.65} />
            </mesh>
            {/* Lapels */}
            <mesh position={[-0.12, 1.44, 0.148]}>
              <boxGeometry args={[0.11, 0.22, 0.02]} />
              <meshStandardMaterial color="#1a2540" roughness={0.6} />
            </mesh>
            <mesh position={[0.12, 1.44, 0.148]}>
              <boxGeometry args={[0.11, 0.22, 0.02]} />
              <meshStandardMaterial color="#1a2540" roughness={0.6} />
            </mesh>
            {/* Breast pocket */}
            <mesh position={[-0.2, 1.38, 0.151]}>
              <boxGeometry args={[0.07, 0.04, 0.02]} />
              <meshStandardMaterial color="#f8f8fa" roughness={0.35} />
            </mesh>

            {/* ── White dress shirt front ── */}
            <mesh position={[0, 1.12, 0.145]}>
              <boxGeometry args={[0.18, 0.55, 0.03]} />
              <meshStandardMaterial color="#f4f4f8" roughness={0.4} />
            </mesh>

            {/* ── Tie: dark burgundy ── */}
            <mesh position={[0, 1.05, 0.16]}>
              <boxGeometry args={[0.07, 0.42, 0.02]} />
              <meshStandardMaterial color="#8b1a1a" roughness={0.45} />
            </mesh>
            <mesh position={[0, 1.3, 0.164]}>
              <boxGeometry args={[0.09, 0.07, 0.03]} />
              <meshStandardMaterial color="#8b1a1a" roughness={0.45} />
            </mesh>

            <mesh position={[-0.06, 1.5, 0.13]}>
              <boxGeometry args={[0.07, 0.1, 0.04]} />
              <meshStandardMaterial color="#f4f4f8" roughness={0.4} />
            </mesh>
            <mesh position={[0.06, 1.5, 0.13]}>
              <boxGeometry args={[0.07, 0.1, 0.04]} />
              <meshStandardMaterial color="#f4f4f8" roughness={0.4} />
            </mesh>

            <group ref={leftArmRef} position={[-0.38, 1.49, 0]}>
              <mesh position={[0, -0.32, 0]} castShadow>
                <boxGeometry args={[0.17, 0.64, 0.2]} />
                <meshStandardMaterial color="#1e2a4a" roughness={0.65} />
              </mesh>
              <mesh position={[0, -0.655, 0]}>
                <boxGeometry args={[0.19, 0.09, 0.22]} />
                <meshStandardMaterial color="#f4f4f8" roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.73, 0.04]}>
                <sphereGeometry args={[0.085, 8, 6]} />
                <meshStandardMaterial color="#fdbcb4" roughness={0.7} />
              </mesh>
            </group>

            <group ref={rightArmRef} position={[0.38, 1.49, 0]}>
              <mesh position={[0, -0.32, 0]} castShadow>
                <boxGeometry args={[0.17, 0.64, 0.2]} />
                <meshStandardMaterial color="#1e2a4a" roughness={0.65} />
              </mesh>
              <mesh position={[0, -0.655, 0]}>
                <boxGeometry args={[0.19, 0.09, 0.22]} />
                <meshStandardMaterial color="#f4f4f8" roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.73, 0.04]}>
                <sphereGeometry args={[0.085, 8, 6]} />
                <meshStandardMaterial color="#fdbcb4" roughness={0.7} />
              </mesh>
            </group>

            <mesh position={[0, 1.64, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.2, 6]} />
              <meshStandardMaterial color="#fdbcb4" roughness={0.7} />
            </mesh>

            <mesh position={[0, 1.9, 0]} castShadow>
              <sphereGeometry args={[0.22, 8, 6]} />
              <meshStandardMaterial color="#fdbcb4" roughness={0.6} />
            </mesh>

            <mesh position={[-0.085, 1.94, 0.195]}>
              <sphereGeometry args={[0.05, 5, 4]} />
              <meshStandardMaterial color="#f2f2f6" roughness={0.25} />
            </mesh>
            <mesh position={[0.085, 1.94, 0.195]}>
              <sphereGeometry args={[0.05, 5, 4]} />
              <meshStandardMaterial color="#f2f2f6" roughness={0.25} />
            </mesh>
            <mesh position={[-0.085, 1.94, 0.218]}>
              <sphereGeometry args={[0.032, 5, 4]} />
              <meshStandardMaterial color="#080810" roughness={0.2} />
            </mesh>
            <mesh position={[0.085, 1.94, 0.218]}>
              <sphereGeometry args={[0.032, 5, 4]} />
              <meshStandardMaterial color="#080810" roughness={0.2} />
            </mesh>

            <mesh position={[0, 2.05, -0.04]}>
              <sphereGeometry args={[0.225, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color="#1a0a00" roughness={0.9} />
            </mesh>

          </>
        )}
      </group>
    </group>
  );
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(1, t);
}

function checkCollision(x: number, z: number, walls: number[][]): boolean {
  for (const [minX, minZ, maxX, maxZ] of walls) {
    if (
      x + PLAYER_RADIUS > minX && x - PLAYER_RADIUS < maxX &&
      z + PLAYER_RADIUS > minZ && z - PLAYER_RADIUS < maxZ
    ) return true;
  }
  // Dynamic door walls — only block when the door is closed
  const { openDoors } = useGameStore.getState();
  for (const { doorId, wall: [minX, minZ, maxX, maxZ] } of DOOR_COLLISION_WALLS) {
    if (openDoors.includes(doorId)) continue;
    if (x + PLAYER_RADIUS > minX && x - PLAYER_RADIUS < maxX &&
        z + PLAYER_RADIUS > minZ && z - PLAYER_RADIUS < maxZ) return true;
  }
  return false;
}

function findNearbyCharacter(pos: THREE.Vector3): string | null {
  let closest: string | null = null;
  let closestDist = INTERACTION_RADIUS;
  for (const char of CHARACTERS) {
    // Use live wandering position from registry; fall back to static spawn if not yet registered
    const npcPos = NPC_POSITIONS.get(char.id);
    const nx = npcPos ? npcPos.x : char.position[0];
    const nz = npcPos ? npcPos.z : char.position[2];
    const dx = nx - pos.x;
    const dz = nz - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < closestDist) { closestDist = dist; closest = char.id; }
  }
  return closest;
}

function findNearbyObject(pos: THREE.Vector3, stage: string): string | null {
  for (const obj of INTERACTABLE_OBJECTS) {
    const dx = obj.position[0] - pos.x;
    const dz = obj.position[2] - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < INTERACTION_RADIUS && obj.requiredStage === stage) return obj.id;
  }
  return null;
}

function trackZone(pos: THREE.Vector3) {
  const { trackZone: tz } = useGameStore.getState();
  if (pos.x < -15) tz("lift_lobby");
  else if (pos.x < -5 && pos.z < 2) tz("reception");
  else if (pos.z < -6 && pos.x < 7) tz("analytics_pod");
  else if (pos.x > 6 && pos.z > 0 && pos.x < 15) tz("engineering_area");
  else if (pos.x < -4 && pos.z > 8) tz("coffee_area");
  else if (pos.z > 8 && pos.x > -5 && pos.x < 5) tz("compliance_pod");
  else if (pos.x > 14 && pos.z < 0) tz("executive_zone");
  else if (pos.x > 10 && pos.z < -8) tz("meeting_room");
}

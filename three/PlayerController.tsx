"use client";
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import { CHARACTERS, INTERACTABLE_OBJECTS } from "@/game/data";
import { playFootstep } from "@/game/audio";

const MOVE_SPEED = 5.5;
const SPRINT_SPEED = 8.5;
const INTERACTION_RADIUS = 2.8;
const PLAYER_RADIUS = 0.45;
const FOOTSTEP_INTERVAL = 0.38;

interface PlayerControllerProps {
  walls: number[][];
}

export function PlayerController({ walls }: PlayerControllerProps) {
  const { camera } = useThree();

  const keysRef = useRef<Set<string>>(new Set());
  // Y = 0 so feet sit on floor, matching all NPC positions
  const playerPosRef = useRef(new THREE.Vector3(-20, 0, 0));
  const velocityRef = useRef(new THREE.Vector3());
  const cameraYawRef = useRef(0);
  const cameraPitchRef = useRef(0.35);
  const isPointerLocked = useRef(false);
  const footstepTimerRef = useRef(0);
  const isMovingRef = useRef(false);
  const isSprintingRef = useRef(false);
  const walkCycleRef = useRef(0);
  const hadDialogueRef = useRef(false);
  const prevDialogueRef = useRef<boolean>(false);

  // Scene graph refs
  const meshRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const { setNearbyInteractable, stage, cameraMode, activeDialogue, setPlayerPosition } = useGameStore();

  // Exit pointer lock on dialogue open; re-acquire automatically when it closes
  useEffect(() => {
    if (activeDialogue) {
      hadDialogueRef.current = true;
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (prevDialogueRef.current && hadDialogueRef.current) {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        const t = setTimeout(() => {
          if (!useGameStore.getState().activeDialogue) canvas.requestPointerLock();
        }, 120);
        return () => clearTimeout(t);
      }
    }
    prevDialogueRef.current = !!activeDialogue;
  }, [activeDialogue]);

  // Pointer lock + mouse look
  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const onLockChange = () => { isPointerLocked.current = !!document.pointerLockElement; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;
      cameraYawRef.current -= e.movementX * 0.0022;
      cameraPitchRef.current = Math.max(0.08, Math.min(0.48, cameraPitchRef.current + e.movementY * 0.0022));
    };
    const onClick = () => {
      if (!document.pointerLockElement && !useGameStore.getState().activeDialogue) canvas.requestPointerLock();
    };

    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  // Keyboard
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

  useFrame((_, delta) => {
    if (activeDialogue) return;

    const keys = keysRef.current;
    const pos = playerPosRef.current;

    isSprintingRef.current = keys.has("shift");
    const speed = isSprintingRef.current ? SPRINT_SPEED : MOVE_SPEED;

    const forward = new THREE.Vector3(Math.sin(cameraYawRef.current), 0, Math.cos(cameraYawRef.current));
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

    const targetVel = new THREE.Vector3();
    if (keys.has("w") || keys.has("arrowup"))    targetVel.add(forward);
    if (keys.has("s") || keys.has("arrowdown"))  targetVel.sub(forward);
    if (keys.has("a") || keys.has("arrowleft"))  targetVel.sub(right);
    if (keys.has("d") || keys.has("arrowright")) targetVel.add(right);
    if (targetVel.lengthSq() > 0) targetVel.normalize().multiplyScalar(speed);

    // Smooth acceleration
    velocityRef.current.lerp(targetVel, Math.min(1, 7 * delta));
    isMovingRef.current = velocityRef.current.lengthSq() > 0.08;

    if (isMovingRef.current) {
      const move = velocityRef.current.clone().multiplyScalar(delta);
      if (!checkCollision(pos.x + move.x, pos.z, walls)) pos.x += move.x;
      if (!checkCollision(pos.x, pos.z + move.z, walls)) pos.z += move.z;
      pos.x = Math.max(-24, Math.min(24, pos.x));
      pos.z = Math.max(-19, Math.min(19, pos.z));

      if (bodyRef.current && (Math.abs(move.x) > 0.0001 || Math.abs(move.z) > 0.0001)) {
        bodyRef.current.rotation.y = Math.atan2(move.x, move.z);
      }

      footstepTimerRef.current += delta;
      if (footstepTimerRef.current >= FOOTSTEP_INTERVAL) {
        footstepTimerRef.current = 0;
        playFootstep();
      }
    } else {
      footstepTimerRef.current = 0;
    }

    // Walking animation
    const LL = leftLegRef.current;
    const RL = rightLegRef.current;
    const LA = leftArmRef.current;
    const RA = rightArmRef.current;

    if (LL && RL && LA && RA) {
      if (isMovingRef.current) {
        const freq = isSprintingRef.current ? 10 : 7;
        walkCycleRef.current += delta * freq;
        const sw = Math.sin(walkCycleRef.current);
        LL.rotation.x = sw * 0.40;
        RL.rotation.x = -sw * 0.40;
        LA.rotation.x = -sw * 0.24;
        RA.rotation.x = sw * 0.24;
      } else {
        // Smooth return to idle
        LL.rotation.x *= 0.82;
        RL.rotation.x *= 0.82;
        LA.rotation.x *= 0.82;
        RA.rotation.x *= 0.82;
      }
    }

    // Sync mesh — add subtle vertical bob when walking
    if (meshRef.current) {
      meshRef.current.position.set(
        pos.x,
        isMovingRef.current ? Math.abs(Math.sin(walkCycleRef.current * 2)) * 0.025 : 0,
        pos.z
      );
    }

    setPlayerPosition([pos.x, 0, pos.z]);

    // Camera (third-person)
    if (cameraMode === "third") {
      const camDist = 5.0;
      const targetCamX = pos.x - Math.sin(cameraYawRef.current) * camDist;
      const targetCamZ = pos.z - Math.cos(cameraYawRef.current) * camDist;
      const targetCamY = 1.5 + cameraPitchRef.current * camDist * 0.7;
      camera.position.lerp(
        new THREE.Vector3(
          Math.max(-23, Math.min(23, targetCamX)),
          Math.max(1.2, Math.min(4.8, targetCamY)),
          Math.max(-18, Math.min(18, targetCamZ)),
        ),
        0.14,
      );
      camera.lookAt(pos.x, 1.2, pos.z);
    } else {
      camera.position.set(pos.x, 1.6, pos.z);
      camera.lookAt(
        pos.x + Math.sin(cameraYawRef.current),
        1.6 - cameraPitchRef.current * 0.5,
        pos.z + Math.cos(cameraYawRef.current),
      );
    }

    setNearbyInteractable(findNearbyCharacter(pos) ?? findNearbyObject(pos, stage) ?? null);
    trackZone(pos);
  });

  return (
    <group ref={meshRef} position={[-20, 0, 0]}>
      <group ref={bodyRef} scale={[1, 1.08, 1]}>
        {cameraMode === "third" && (
          <>
            {/* Floor shadow */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.32, 16]} />
              <meshStandardMaterial color="#000000" transparent opacity={0.15} />
            </mesh>

            {/* LEFT LEG — pivot at hip (y = 0.87) */}
            <group ref={leftLegRef} position={[-0.12, 0.87, 0]}>
              <mesh position={[0, -0.41, 0]} castShadow>
                <boxGeometry args={[0.21, 0.82, 0.2]} />
                <meshStandardMaterial color="#1e2a4a" roughness={0.8} />
              </mesh>
              {/* Shoe attached to leg so it swings with it */}
              <mesh position={[0, -0.82, 0.06]} castShadow>
                <boxGeometry args={[0.2, 0.11, 0.32]} />
                <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.3} />
              </mesh>
            </group>

            {/* RIGHT LEG — pivot at hip */}
            <group ref={rightLegRef} position={[0.12, 0.87, 0]}>
              <mesh position={[0, -0.41, 0]} castShadow>
                <boxGeometry args={[0.21, 0.82, 0.2]} />
                <meshStandardMaterial color="#1e2a4a" roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.82, 0.06]} castShadow>
                <boxGeometry args={[0.2, 0.11, 0.32]} />
                <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.3} />
              </mesh>
            </group>

            {/* Jacket body */}
            <mesh position={[0, 1.18, 0]} castShadow>
              <boxGeometry args={[0.58, 0.75, 0.3]} />
              <meshStandardMaterial color="#6366f1" roughness={0.6} />
            </mesh>

            {/* Shirt */}
            <mesh position={[0, 1.12, 0.145]}>
              <boxGeometry args={[0.18, 0.55, 0.03]} />
              <meshStandardMaterial color="#f4f4f8" roughness={0.4} />
            </mesh>

            {/* Tie */}
            <mesh position={[0, 1.05, 0.16]}>
              <boxGeometry args={[0.07, 0.42, 0.02]} />
              <meshStandardMaterial color="#4f46e5" roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.3, 0.164]}>
              <boxGeometry args={[0.09, 0.07, 0.03]} />
              <meshStandardMaterial color="#4f46e5" roughness={0.5} />
            </mesh>

            {/* Collar */}
            <mesh position={[-0.06, 1.5, 0.13]}>
              <boxGeometry args={[0.07, 0.1, 0.04]} />
              <meshStandardMaterial color="#f4f4f8" roughness={0.4} />
            </mesh>
            <mesh position={[0.06, 1.5, 0.13]}>
              <boxGeometry args={[0.07, 0.1, 0.04]} />
              <meshStandardMaterial color="#f4f4f8" roughness={0.4} />
            </mesh>

            {/* LEFT ARM — pivot at shoulder (y = 1.49) */}
            <group ref={leftArmRef} position={[-0.38, 1.49, 0]}>
              <mesh position={[0, -0.32, 0]} castShadow>
                <boxGeometry args={[0.17, 0.64, 0.2]} />
                <meshStandardMaterial color="#6366f1" roughness={0.6} />
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

            {/* RIGHT ARM — pivot at shoulder */}
            <group ref={rightArmRef} position={[0.38, 1.49, 0]}>
              <mesh position={[0, -0.32, 0]} castShadow>
                <boxGeometry args={[0.17, 0.64, 0.2]} />
                <meshStandardMaterial color="#6366f1" roughness={0.6} />
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

            {/* Neck */}
            <mesh position={[0, 1.64, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.2, 10]} />
              <meshStandardMaterial color="#fdbcb4" roughness={0.7} />
            </mesh>

            {/* Head */}
            <mesh position={[0, 1.9, 0]} castShadow>
              <sphereGeometry args={[0.22, 14, 10]} />
              <meshStandardMaterial color="#fdbcb4" roughness={0.6} />
            </mesh>

            {/* Eyes */}
            <mesh position={[-0.085, 1.94, 0.195]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color="#f2f2f6" roughness={0.25} />
            </mesh>
            <mesh position={[0.085, 1.94, 0.195]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color="#f2f2f6" roughness={0.25} />
            </mesh>
            <mesh position={[-0.085, 1.94, 0.218]}>
              <sphereGeometry args={[0.032, 6, 6]} />
              <meshStandardMaterial color="#080810" roughness={0.2} />
            </mesh>
            <mesh position={[0.085, 1.94, 0.218]}>
              <sphereGeometry args={[0.032, 6, 6]} />
              <meshStandardMaterial color="#080810" roughness={0.2} />
            </mesh>

            {/* Hair */}
            <mesh position={[0, 2.05, -0.04]}>
              <sphereGeometry args={[0.225, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color="#1a0a00" roughness={0.9} />
            </mesh>

            <pointLight color="#6366f1" intensity={2} distance={3} decay={2} />
          </>
        )}
      </group>
    </group>
  );
}

function checkCollision(x: number, z: number, walls: number[][]): boolean {
  for (const [minX, minZ, maxX, maxZ] of walls) {
    if (
      x + PLAYER_RADIUS > minX && x - PLAYER_RADIUS < maxX &&
      z + PLAYER_RADIUS > minZ && z - PLAYER_RADIUS < maxZ
    ) return true;
  }
  return false;
}

function findNearbyCharacter(pos: THREE.Vector3): string | null {
  let closest: string | null = null;
  let closestDist = INTERACTION_RADIUS;
  for (const char of CHARACTERS) {
    const dx = char.position[0] - pos.x;
    const dz = char.position[2] - pos.z;
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

"use client";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { CharacterDef } from "@/game/types";
import { useGameStore } from "@/store/gameStore";

interface NPCCharacterProps {
  character: CharacterDef;
  isNearby: boolean;
}

const TIE_COLORS: Record<string, string> = {
  maya: "#4f46e5",
  theo: "#0369a1",
  oliver: "#b45309",
  priya: "#047857",
  amara: "#be185d",
};

const HAIR_COLORS: Record<string, string> = {
  maya: "#1a0800",
  theo: "#4a2800",
  oliver: "#8b5e0a",
  priya: "#0a0404",
  amara: "#0a0404",
};

const IS_FEMALE: Record<string, boolean> = {
  maya: true,
  priya: true,
  amara: true,
};

// Jacket color brightened slightly for female blazers
const BLOUSE_COLORS: Record<string, string> = {
  maya: "#e8e8f8",
  priya: "#e8f4ee",
  amara: "#fce8f2",
};

type NPCBehavior = "working" | "aware" | "nearby";

export function NPCCharacter({ character, isNearby }: NPCCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const [bobOffset] = useState(() => Math.random() * Math.PI * 2);
  const [lookOffset] = useState(() => Math.random() * Math.PI * 2);
  const seatedOffsetRef = useRef(0);

  const speechBubble = useGameStore((s) => s.speechBubbles[character.id]);
  const playerPosition = useGameStore((s) => s.playerPosition);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    const dx = playerPosition[0] - character.position[0];
    const dz = playerPosition[2] - character.position[2];
    const distToPlayer = Math.sqrt(dx * dx + dz * dz);

    const behavior: NPCBehavior =
      isNearby ? "nearby" : distToPlayer < 7 ? "aware" : "working";

    // Smooth sit/stand transition — seated when working at desk, stand up when player approaches
    const targetSeat = behavior === "working" ? -0.42 : 0;
    seatedOffsetRef.current += (targetSeat - seatedOffsetRef.current) * Math.min(1, 4 * delta);

    if (groupRef.current) {
      groupRef.current.position.y =
        character.position[1] + seatedOffsetRef.current +
        Math.sin(t * 1.1 + bobOffset) * (behavior === "working" ? 0.005 : 0.012);
    }

    if (headRef.current) {
      if (behavior === "working") {
        headRef.current.rotation.x = 0.28 + Math.sin(t * 0.5 + lookOffset) * 0.04;
        headRef.current.rotation.y = Math.sin(t * 0.3 + lookOffset) * 0.08;
      } else if (behavior === "aware") {
        headRef.current.rotation.x = 0.05;
        headRef.current.rotation.y = Math.sin(t * 0.55 + bobOffset) * 0.22;
      } else {
        const angle = Math.atan2(dx, dz);
        if (bodyRef.current) {
          bodyRef.current.rotation.y = angle;
        }
        headRef.current.rotation.x = 0;
        headRef.current.rotation.y = Math.sin(t * 0.4 + bobOffset) * 0.12;
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (behavior === "working") {
        const type = Math.sin(t * 4.5 + bobOffset) * 0.22;
        leftArmRef.current.rotation.x = -0.42 + type;
        rightArmRef.current.rotation.x = -0.42 - type;
      } else if (behavior === "aware") {
        const swing = Math.sin(t * 1.8 + bobOffset) * 0.08;
        leftArmRef.current.rotation.x = -0.1 + swing;
        rightArmRef.current.rotation.x = -0.1 - swing;
      } else {
        const swing = Math.sin(t * 2.2 + bobOffset) * 0.15;
        leftArmRef.current.rotation.x = -0.25 + swing;
        rightArmRef.current.rotation.x = -0.25 - swing;
      }
    }
  });

  const skinColor = character.skinColor;
  const jacketColor = character.color;
  const tieColor = TIE_COLORS[character.id] ?? "#444488";
  const hairColor = HAIR_COLORS[character.id] ?? "#1a0800";
  const isFemale = IS_FEMALE[character.id] ?? false;
  const blouseColor = BLOUSE_COLORS[character.id] ?? "#f0f0f8";
  const trouserColor = isFemale ? "#1a1f3a" : "#1e2a4a";

  return (
    <group ref={groupRef} position={character.position}>
      {/* Taller scale for more realistic proportions */}
      <group ref={bodyRef} scale={[1, 1.08, 1]}>
        {/* Floor shadow */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.32, 16]} />
          <meshStandardMaterial color="#000000" transparent opacity={0.18} />
        </mesh>

        {/* Shoes */}
        <mesh position={[-0.12, 0.07, 0.06]} castShadow>
          <boxGeometry args={[0.2, 0.11, 0.32]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0.12, 0.07, 0.06]} castShadow>
          <boxGeometry args={[0.2, 0.11, 0.32]} />
          <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.3} />
        </mesh>

        {/* Trousers / lower body */}
        <mesh position={[-0.12, 0.48, 0]} castShadow>
          <boxGeometry args={[0.21, 0.82, 0.2]} />
          <meshStandardMaterial color={trouserColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.12, 0.48, 0]} castShadow>
          <boxGeometry args={[0.21, 0.82, 0.2]} />
          <meshStandardMaterial color={trouserColor} roughness={0.8} />
        </mesh>

        {/* Jacket / blazer body */}
        <mesh position={[0, 1.18, 0]} castShadow>
          <boxGeometry args={[isFemale ? 0.52 : 0.58, 0.75, 0.3]} />
          <meshStandardMaterial color={jacketColor} roughness={0.6} />
        </mesh>

        {/* Shirt / blouse */}
        {isFemale ? (
          // V-neck blouse
          <mesh position={[0, 1.14, 0.14]}>
            <boxGeometry args={[0.16, 0.5, 0.04]} />
            <meshStandardMaterial color={blouseColor} roughness={0.35} />
          </mesh>
        ) : (
          // White dress shirt
          <mesh position={[0, 1.12, 0.14]}>
            <boxGeometry args={[0.18, 0.55, 0.04]} />
            <meshStandardMaterial color="#f4f4f8" roughness={0.4} />
          </mesh>
        )}

        {/* Tie (males only) */}
        {!isFemale && (
          <>
            <mesh position={[0, 1.05, 0.158]}>
              <boxGeometry args={[0.07, 0.42, 0.02]} />
              <meshStandardMaterial color={tieColor} roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.3, 0.162]}>
              <boxGeometry args={[0.09, 0.07, 0.03]} />
              <meshStandardMaterial color={tieColor} roughness={0.5} />
            </mesh>
          </>
        )}

        {/* Collar */}
        <mesh position={[-0.06, 1.5, 0.13]}>
          <boxGeometry args={[0.07, 0.1, 0.04]} />
          <meshStandardMaterial color={isFemale ? blouseColor : "#f4f4f8"} roughness={0.4} />
        </mesh>
        <mesh position={[0.06, 1.5, 0.13]}>
          <boxGeometry args={[0.07, 0.1, 0.04]} />
          <meshStandardMaterial color={isFemale ? blouseColor : "#f4f4f8"} roughness={0.4} />
        </mesh>

        {/* Left arm */}
        <mesh ref={leftArmRef} position={[isFemale ? -0.34 : -0.38, 1.17, 0]} castShadow>
          <boxGeometry args={[0.17, 0.64, 0.2]} />
          <meshStandardMaterial color={jacketColor} roughness={0.6} />
        </mesh>
        {/* Left cuff */}
        <mesh position={[isFemale ? -0.34 : -0.38, 0.82, 0]}>
          <boxGeometry args={[0.19, 0.09, 0.22]} />
          <meshStandardMaterial color={isFemale ? blouseColor : "#f4f4f8"} roughness={0.4} />
        </mesh>

        {/* Right arm */}
        <mesh ref={rightArmRef} position={[isFemale ? 0.34 : 0.38, 1.17, 0]} castShadow>
          <boxGeometry args={[0.17, 0.64, 0.2]} />
          <meshStandardMaterial color={jacketColor} roughness={0.6} />
        </mesh>
        {/* Right cuff */}
        <mesh position={[isFemale ? 0.34 : 0.38, 0.82, 0]}>
          <boxGeometry args={[0.19, 0.09, 0.22]} />
          <meshStandardMaterial color={isFemale ? blouseColor : "#f4f4f8"} roughness={0.4} />
        </mesh>

        {/* Hands */}
        <mesh position={[isFemale ? -0.34 : -0.38, 0.75, 0.04]}>
          <sphereGeometry args={[0.085, 8, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[isFemale ? 0.34 : 0.38, 0.75, 0.04]}>
          <sphereGeometry args={[0.085, 8, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.64, 0]}>
          <cylinderGeometry args={[isFemale ? 0.09 : 0.1, isFemale ? 0.09 : 0.1, 0.2, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>

        {/* Head */}
        <mesh ref={headRef} position={[0, 1.9, 0]} castShadow>
          <sphereGeometry args={[0.22, 14, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.6} />
        </mesh>

        {/* Eye whites */}
        <mesh position={[-0.085, 1.94, 0.195]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#f2f2f6" roughness={0.25} />
        </mesh>
        <mesh position={[0.085, 1.94, 0.195]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#f2f2f6" roughness={0.25} />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.085, 1.94, 0.218]}>
          <sphereGeometry args={[0.032, 6, 6]} />
          <meshStandardMaterial color="#080810" roughness={0.2} />
        </mesh>
        <mesh position={[0.085, 1.94, 0.218]}>
          <sphereGeometry args={[0.032, 6, 6]} />
          <meshStandardMaterial color="#080810" roughness={0.2} />
        </mesh>

        {/* Hair */}
        {isFemale ? (
          <>
            {/* Top cap — fuller coverage */}
            <mesh position={[0, 2.07, -0.02]}>
              <sphereGeometry args={[0.225, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.68]} />
              <meshStandardMaterial color={hairColor} roughness={0.88} />
            </mesh>
            {/* Long hair flowing down back */}
            <mesh position={[0, 1.62, -0.17]}>
              <boxGeometry args={[0.3, 0.64, 0.07]} />
              <meshStandardMaterial color={hairColor} roughness={0.88} />
            </mesh>
            {/* Side hair panels */}
            <mesh position={[-0.2, 1.86, 0.04]}>
              <boxGeometry args={[0.08, 0.28, 0.12]} />
              <meshStandardMaterial color={hairColor} roughness={0.88} />
            </mesh>
            <mesh position={[0.2, 1.86, 0.04]}>
              <boxGeometry args={[0.08, 0.28, 0.12]} />
              <meshStandardMaterial color={hairColor} roughness={0.88} />
            </mesh>
          </>
        ) : (
          /* Male short hair */
          <mesh position={[0, 2.05, -0.04]}>
            <sphereGeometry args={[0.225, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </mesh>
        )}
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
      {/* Cloud puff left */}
      <mesh position={[-1.0, 0.5, -0.012]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.96} />
      </mesh>
      {/* Cloud puff right */}
      <mesh position={[1.0, 0.48, -0.012]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.96} />
      </mesh>
      {/* Background */}
      <mesh position={[0, 0.1, -0.012]}>
        <planeGeometry args={[2.2, 0.56]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.96} />
      </mesh>
      {/* Coloured border */}
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
      {/* Tail */}
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

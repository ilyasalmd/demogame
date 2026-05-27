"use client";
import { useRef, useState, useCallback, useEffect, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

interface BgNPC {
  id: string;
  position: [number, number, number];
  color: string;
  skinColor: string;
  isFemale?: boolean;
}

// Waypoint paths for all 20 background NPCs
const WALK_PATHS: Record<string, [number, number, number][]> = {
  bg1:  [[-3, 0, -7],  [-3, 0, 0],   [-10, 0, 2],  [-10, 0, -4], [-3, 0, -7]],
  bg2:  [[5, 0, -12],  [5, 0, -7],   [0, 0, -5],   [-3, 0, -7],  [5, 0, -12]],
  bg3:  [[-5, 0, 4],   [-5, 0, 9],   [-10, 0, 12], [-8, 0, 7],   [-5, 0, 4]],
  bg4:  [[11, 0, -3],  [11, 0, 2],   [8, 0, 5],    [5, 0, 2],    [11, 0, -3]],
  bg5:  [[-10, 0, 3],  [-15, 0, 5],  [-15, 0, -3], [-10, 0, -2], [-10, 0, 3]],
  bg6:  [[4, 0, 11],   [4, 0, 16],   [-2, 0, 14],  [-2, 0, 11],  [4, 0, 11]],
  bg7:  [[-6, 0, -11], [-6, 0, -6],  [0, 0, -6],   [0, 0, -11],  [-6, 0, -11]],
  bg8:  [[7, 0, -11],  [12, 0, -8],  [12, 0, -4],  [7, 0, -6],   [7, 0, -11]],
  bg9:  [[-14, 0, -5], [-14, 0, 0],  [-19, 0, 0],  [-19, 0, -5], [-14, 0, -5]],
  bg10: [[16, 0, 6],   [16, 0, 2],   [11, 0, 2],   [11, 0, 6],   [16, 0, 6]],
  bg11: [[-7, 0, 15],  [-10, 0, 14], [-13, 0, 16], [-10, 0, 17], [-7, 0, 15]],
  bg12: [[3, 0, 15],   [3, 0, 11],   [-2, 0, 11],  [-2, 0, 15],  [3, 0, 15]],
  bg13: [[0, 0, -14],  [4, 0, -13],  [4, 0, -9],   [0, 0, -10],  [0, 0, -14]],
  bg14: [[14, 0, -5],  [18, 0, -4],  [18, 0, -10], [14, 0, -9],  [14, 0, -5]],
  bg15: [[-8, 0, 8],   [-8, 0, 13],  [-12, 0, 13], [-12, 0, 8],  [-8, 0, 8]],
  bg16: [[6, 0, 6],    [6, 0, 2],    [9, 0, 1],    [9, 0, 6],    [6, 0, 6]],
  bg17: [[-3, 0, 14],  [-3, 0, 18],  [-8, 0, 18],  [-8, 0, 14],  [-3, 0, 14]],
  bg18: [[10, 0, 14],  [10, 0, 18],  [14, 0, 18],  [14, 0, 13],  [10, 0, 14]],
  bg19: [[-13, 0, 10], [-13, 0, 14], [-17, 0, 14], [-17, 0, 10], [-13, 0, 10]],
  bg20: [[17, 0, -2],  [17, 0, 3],   [20, 0, 3],   [20, 0, -2],  [17, 0, -2]],
};

const DESK_POSITIONS: Record<string, [number, number, number]> = {
  bg1: [-3, 0, -7],  bg2: [5, 0, -12],  bg3: [-5, 0, 4],   bg4: [11, 0, -3],
  bg5: [-10, 0, 3],  bg6: [4, 0, 11],   bg7: [-6, 0, -11], bg8: [7, 0, -11],
  bg9: [-14, 0, -5], bg10: [16, 0, 6],  bg11: [-7, 0, 15], bg12: [3, 0, 15],
  bg13: [0, 0, -14], bg14: [14, 0, -5], bg15: [-8, 0, 8],  bg16: [6, 0, 6],
  bg17: [-3, 0, 14], bg18: [10, 0, 14], bg19: [-13, 0, 10],bg20: [17, 0, -2],
};

const BG_VOICE_CONFIGS: Record<string, { lang: string; pitch: number; rate: number; baseVol: number }> = {
  bg1:  { lang: "en-GB", pitch: 1.1,  rate: 1.05, baseVol: 0.60 },
  bg2:  { lang: "en-GB", pitch: 0.85, rate: 0.98, baseVol: 0.58 },
  bg3:  { lang: "en-IN", pitch: 1.0,  rate: 1.02, baseVol: 0.58 },
  bg4:  { lang: "en-AU", pitch: 0.9,  rate: 1.05, baseVol: 0.56 },
  bg5:  { lang: "en-GB", pitch: 1.2,  rate: 1.1,  baseVol: 0.62 },
  bg6:  { lang: "en-US", pitch: 0.95, rate: 1.0,  baseVol: 0.56 },
  bg7:  { lang: "en-GB", pitch: 0.8,  rate: 0.95, baseVol: 0.58 },
  bg8:  { lang: "en-US", pitch: 1.05, rate: 1.05, baseVol: 0.56 },
  bg9:  { lang: "en-IN", pitch: 1.15, rate: 1.02, baseVol: 0.58 },
  bg10: { lang: "en-AU", pitch: 0.88, rate: 1.0,  baseVol: 0.56 },
  bg11: { lang: "en-GB", pitch: 1.3,  rate: 1.15, baseVol: 0.60 },
  bg12: { lang: "en-US", pitch: 0.92, rate: 1.02, baseVol: 0.56 },
  bg13: { lang: "en-GB", pitch: 1.18, rate: 1.08, baseVol: 0.58 },
  bg14: { lang: "en-US", pitch: 0.9,  rate: 1.0,  baseVol: 0.56 },
  bg15: { lang: "en-IN", pitch: 1.12, rate: 1.1,  baseVol: 0.60 },
  bg16: { lang: "en-AU", pitch: 0.95, rate: 1.05, baseVol: 0.56 },
  bg17: { lang: "en-GB", pitch: 1.22, rate: 1.12, baseVol: 0.58 },
  bg18: { lang: "en-US", pitch: 0.88, rate: 0.98, baseVol: 0.56 },
  bg19: { lang: "en-IN", pitch: 1.08, rate: 1.0,  baseVol: 0.58 },
  bg20: { lang: "en-GB", pitch: 0.82, rate: 0.95, baseVol: 0.56 },
};

// Proximity volume: full at ≤4 units, silent at ≥18 units
function proximityVolume(baseVol: number, dist: number): number {
  const minDist = 4;
  const maxDist = 18;
  if (dist <= minDist) return baseVol;
  if (dist >= maxDist) return 0;
  return baseVol * (1 - (dist - minDist) / (maxDist - minDist));
}

const WORK_CHATTER = [
  "the pipeline's still running, give it five",
  "anyone got the Jira link for that ticket?",
  "demo's in an hour, yeah no pressure",
  "mate the build's broken again",
  "have you actually read the spec?",
  "coffee's fresh, get in there",
  "I reckon we ship it and see",
  "Oliver's been on three calls already",
  "Maya flagged something dodgy in the data",
  "this is the third standup today, genuinely",
  "my PR's been sitting there for two days",
  "client wants it by Friday, classic",
  "the tests are passing locally, so...",
  "anyone else think the dashboard looks off?",
  "Theo hasn't moved from his desk since nine",
  "yeah no, that number looks wrong to me",
  "I'll ping you on Slack in a sec",
  "the server's being weird again",
  "right, let's wrap this up shall we",
  "honestly couldn't tell you what that metric means",
  "did we actually sign off on this last week?",
  "just needs a quick sanity check before we push",
  "is Amara in yet? she'll want to know about this",
  "I've been in three back-to-backs already and it's only ten",
  "who approved the deadline? nobody told me",
  "these numbers can't be right, can they",
  "can you loop me into that thread?",
  "the client's coming at eleven, just so you know",
  "I'm not saying it's wrong, I'm just saying — check it",
  "someone's going to have to own this conversation",
];

const ARGUMENT_LINES = [
  "You should have flagged this yesterday!",
  "I DID flag it — nobody listened!",
  "That's not how the process works—",
  "Then what IS the process? Because nobody told me!",
  "Lower your voice, we're in an open plan office",
  "Maybe people should actually read their emails then",
  "I'm trying to fix it right now if you'd just—",
  "This is exactly what happened last quarter!",
  "We had a whole meeting about this!",
  "Did anyone actually read the brief?",
];

const JOKE_LINES = [
  "no but seriously though, who wrote this code",
  "hahaha — did you see his face when it crashed",
  "I'm putting that in the team newsletter",
  "mate I nearly spat my coffee out",
  "right that's going in the standup",
  "brilliant, absolutely brilliant",
  "couldn't make this up if you tried",
  "same time next quarter then, yeah?",
];

type NPCState = "working" | "walking" | "coffee" | "chat";

// ─── background speech queue ──────────────────────────────────────────────────
type BgSpeechItem = { text: string; lang: string; pitch: number; rate: number; volume: number };
let bgSpeechQueue: BgSpeechItem[] = [];
let bgSpeaking = false;

function enqueueBgSpeech(text: string, cfg: typeof BG_VOICE_CONFIGS[string], distVol: number) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const vol = proximityVolume(cfg.baseVol, distVol < 0 ? 0 : distVol);
  if (vol < 0.02) return; // too far — skip entirely
  bgSpeechQueue.push({ text, lang: cfg.lang, pitch: cfg.pitch, rate: cfg.rate, volume: vol });
  if (!bgSpeaking) drainBgQueue();
}

function drainBgQueue() {
  if (bgSpeechQueue.length === 0) { bgSpeaking = false; return; }
  bgSpeaking = true;
  const item = bgSpeechQueue.shift()!;
  const utt = new SpeechSynthesisUtterance(item.text);
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang.startsWith(item.lang)) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
  if (voice) utt.voice = voice;
  utt.pitch = item.pitch;
  utt.rate = item.rate;
  utt.volume = item.volume;
  utt.onend = () => setTimeout(drainBgQueue, 600);
  utt.onerror = () => setTimeout(drainBgQueue, 300);
  window.speechSynthesis.speak(utt);
}

// ─── Shared body mesh helper ──────────────────────────────────────────────────

function HumanBody({
  color, skinColor, isFemale = false,
  leftArmRef, rightArmRef, headRef,
}: {
  color: string; skinColor: string; isFemale?: boolean;
  leftArmRef: RefObject<THREE.Mesh>;
  rightArmRef: RefObject<THREE.Mesh>;
  headRef: RefObject<THREE.Mesh>;
}) {
  const trouserColor = isFemale ? "#1a1f3a" : "#2a3450";
  const shirtColor = isFemale ? "#e8e8f4" : "#f0f0f0";

  return (
    <group scale={[1, 1.08, 1]}>
      {/* Shoes */}
      <mesh position={[-0.12, 0.07, 0.06]}>
        <boxGeometry args={[0.19, 0.1, 0.3]} />
        <meshStandardMaterial color="#111118" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0.12, 0.07, 0.06]}>
        <boxGeometry args={[0.19, 0.1, 0.3]} />
        <meshStandardMaterial color="#111118" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Trousers */}
      <mesh position={[-0.12, 0.46, 0]}>
        <boxGeometry args={[0.2, 0.78, 0.19]} />
        <meshStandardMaterial color={trouserColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.12, 0.46, 0]}>
        <boxGeometry args={[0.2, 0.78, 0.19]} />
        <meshStandardMaterial color={trouserColor} roughness={0.8} />
      </mesh>

      {/* Jacket body */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[isFemale ? 0.5 : 0.54, 0.7, 0.29]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
      {/* Collar / shirt strip */}
      <mesh position={[0, 1.38, 0.13]}>
        <boxGeometry args={[0.17, 0.15, 0.04]} />
        <meshStandardMaterial color={shirtColor} roughness={0.4} />
      </mesh>

      {/* Left arm */}
      <mesh ref={leftArmRef} position={[-0.35, 1.12, 0]}>
        <boxGeometry args={[0.17, 0.6, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
      {/* Right arm */}
      <mesh ref={rightArmRef} position={[0.35, 1.12, 0]}>
        <boxGeometry args={[0.17, 0.6, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>

      {/* Hands */}
      <mesh position={[-0.35, 0.75, 0.04]}>
        <sphereGeometry args={[0.085, 7, 6]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      <mesh position={[0.35, 0.75, 0.04]}>
        <sphereGeometry args={[0.085, 7, 6]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.58, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.18, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>

      {/* Head */}
      <mesh ref={headRef} position={[0, 1.78, 0]}>
        <sphereGeometry args={[0.21, 12, 9]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 1.82, 0.19]}>
        <sphereGeometry args={[0.045, 6, 5]} />
        <meshStandardMaterial color="#f0f0f4" />
      </mesh>
      <mesh position={[0.08, 1.82, 0.19]}>
        <sphereGeometry args={[0.045, 6, 5]} />
        <meshStandardMaterial color="#f0f0f4" />
      </mesh>
      <mesh position={[-0.08, 1.82, 0.21]}>
        <sphereGeometry args={[0.028, 5, 4]} />
        <meshStandardMaterial color="#080810" />
      </mesh>
      <mesh position={[0.08, 1.82, 0.21]}>
        <sphereGeometry args={[0.028, 5, 4]} />
        <meshStandardMaterial color="#080810" />
      </mesh>

      {/* Hair */}
      {isFemale ? (
        <>
          <mesh position={[0, 1.93, -0.02]}>
            <sphereGeometry args={[0.215, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
            <meshStandardMaterial color="#1a0800" roughness={0.88} />
          </mesh>
          <mesh position={[0, 1.56, -0.15]}>
            <boxGeometry args={[0.28, 0.52, 0.07]} />
            <meshStandardMaterial color="#1a0800" roughness={0.88} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 1.92, -0.03]}>
          <sphereGeometry args={[0.215, 9, 7, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
          <meshStandardMaterial color="#1a0a00" roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

// ─── Standard walking NPC ─────────────────────────────────────────────────────

function BgNPCMesh({ npc }: { npc: BgNPC }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const [offset] = useState(() => Math.random() * Math.PI * 2);
  const [npcState, setNpcState] = useState<NPCState>(() =>
    Math.random() > 0.4 ? "working" : "walking"
  );
  const [chatText, setChatText] = useState<string | null>(null);
  const [waypointIdx, setWaypointIdx] = useState(0);

  const stateTimer = useRef(0);
  const chatTimer = useRef(5 + Math.random() * 14);
  const walkSpeed = useRef(1.5 + Math.random() * 1.0);
  const posRef = useRef(new THREE.Vector3(...npc.position));

  const paths = WALK_PATHS[npc.id] ?? null;
  const voiceConfig = BG_VOICE_CONFIGS[npc.id];

  const nextState = useCallback(() => {
    const r = Math.random();
    if (r < 0.45) setNpcState("working");
    else if (r < 0.85) setNpcState("walking");
    else setNpcState("coffee");
    stateTimer.current = 8 + Math.random() * 18;
  }, []);

  useEffect(() => { stateTimer.current = 4 + Math.random() * 12; }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    stateTimer.current -= delta;
    if (stateTimer.current <= 0) nextState();

    chatTimer.current -= delta;
    if (chatTimer.current <= 0) {
      const text = WORK_CHATTER[Math.floor(Math.random() * WORK_CHATTER.length)];
      setChatText(text);
      chatTimer.current = 12 + Math.random() * 20;

      if (voiceConfig) {
        const pp = useGameStore.getState().playerPosition;
        const dx = pp[0] - posRef.current.x;
        const dz = pp[2] - posRef.current.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        enqueueBgSpeech(text, voiceConfig, dist);
      }
      setTimeout(() => setChatText(null), 4200);
    }

    const pos = posRef.current;

    if (npcState === "walking" && paths) {
      const target = new THREE.Vector3(...paths[waypointIdx]);
      const dir = target.clone().sub(pos);
      const dist = dir.length();

      if (dist < 0.3) {
        setWaypointIdx((i) => (i + 1) % paths.length);
      } else {
        dir.normalize().multiplyScalar(walkSpeed.current * delta);
        pos.add(dir);
        if (bodyRef.current) bodyRef.current.rotation.y = Math.atan2(dir.x, dir.z);
        if (leftArmRef.current && rightArmRef.current) {
          const swing = Math.sin(t * 6 + offset) * 0.42;
          leftArmRef.current.rotation.x = swing;
          rightArmRef.current.rotation.x = -swing;
        }
        if (groupRef.current) {
          groupRef.current.position.set(pos.x, npc.position[1] + Math.abs(Math.sin(t * 6 + offset)) * 0.04, pos.z);
        }
      }
    } else {
      if (groupRef.current) {
        groupRef.current.position.set(pos.x, npc.position[1] + Math.sin(t * 1.1 + offset) * 0.01, pos.z);
      }
      if (leftArmRef.current && rightArmRef.current) {
        const type = Math.sin(t * 3.5 + offset) * 0.18;
        leftArmRef.current.rotation.x = -0.38 + type;
        rightArmRef.current.rotation.x = -0.38 - type;
      }
      if (npcState === "working") {
        const desk = DESK_POSITIONS[npc.id];
        if (desk) pos.lerp(new THREE.Vector3(...desk), delta * 2);
      }
    }

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4 + offset) * 0.15;
      headRef.current.rotation.x = npcState === "working" ? 0.25 : 0;
    }
    if (groupRef.current && npcState !== "walking") {
      groupRef.current.position.set(pos.x, groupRef.current.position.y, pos.z);
    }
  });

  return (
    <group ref={groupRef} position={npc.position}>
      <group ref={bodyRef}>
        <HumanBody
          color={npc.color}
          skinColor={npc.skinColor}
          isFemale={npc.isFemale}
          leftArmRef={leftArmRef as RefObject<THREE.Mesh>}
          rightArmRef={rightArmRef as RefObject<THREE.Mesh>}
          headRef={headRef as RefObject<THREE.Mesh>}
        />
      </group>

      {chatText && (
        <Billboard position={[0, 2.6, 0]} follow lockX={false} lockY={false} lockZ={false}>
          {/* Chat bubble */}
          <mesh position={[0, 0.1, -0.012]}>
            <planeGeometry args={[1.5, 0.32]} />
            <meshBasicMaterial color="#f8f8ff" transparent opacity={0.93} />
          </mesh>
          <mesh position={[0, 0.1, -0.016]}>
            <planeGeometry args={[1.54, 0.36]} />
            <meshBasicMaterial color={npc.color} transparent opacity={0.28} />
          </mesh>
          <Text position={[0, 0.1, 0]} fontSize={0.075} color="#111128"
            anchorX="center" anchorY="middle" maxWidth={1.38} textAlign="center">
            {chatText}
          </Text>
          <mesh position={[0, -0.08, -0.012]}>
            <coneGeometry args={[0.055, 0.1, 3]} />
            <meshBasicMaterial color="#f8f8ff" />
          </mesh>
        </Billboard>
      )}

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 12]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

// ─── Argument NPC ─────────────────────────────────────────────────────────────

interface ArgNPCProps {
  position: [number, number, number];
  color: string;
  skinColor: string;
  facingAngle: number;
  argLineOffset: number;
  voiceLang: string;
  voicePitch: number;
}

function ArgumentNPC({ position, color, skinColor, facingAngle, argLineOffset, voiceLang, voicePitch }: ArgNPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const [offset] = useState(() => argLineOffset);
  const [chatText, setChatText] = useState<string | null>(null);
  const lineIdx = useRef(argLineOffset % ARGUMENT_LINES.length);
  const argTimer = useRef(2 + argLineOffset * 3.5);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    argTimer.current -= delta;
    if (argTimer.current <= 0) {
      const text = ARGUMENT_LINES[lineIdx.current % ARGUMENT_LINES.length];
      lineIdx.current++;
      setChatText(text);
      argTimer.current = 3.5 + Math.random() * 2.5;

      if (typeof window !== "undefined" && window.speechSynthesis) {
        const pp = useGameStore.getState().playerPosition;
        const dx = pp[0] - position[0];
        const dz = pp[2] - position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        const vol = proximityVolume(0.70, dist);
        if (vol > 0.02) {
          const utt = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const voice = voices.find((v) => v.lang.startsWith(voiceLang)) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
          if (voice) utt.voice = voice;
          utt.pitch = voicePitch;
          utt.rate = 1.05 + Math.random() * 0.2;
          utt.volume = vol;
          window.speechSynthesis.speak(utt);
        }
      }
      setTimeout(() => setChatText(null), 3200);
    }

    if (groupRef.current) {
      groupRef.current.position.set(
        position[0] + Math.sin(t * 4 + offset) * 0.04,
        position[1] + Math.abs(Math.sin(t * 5 + offset)) * 0.03,
        position[2] + Math.cos(t * 3.5 + offset) * 0.03
      );
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 3 + offset) * 0.25;
      headRef.current.rotation.x = Math.sin(t * 2.5 + offset) * 0.08;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -0.3 + Math.sin(t * 4 + offset) * 0.55;
      leftArmRef.current.rotation.z = Math.sin(t * 3 + offset) * 0.3;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.cos(t * 4 + offset) * 0.4;
      rightArmRef.current.rotation.z = -Math.cos(t * 3.5 + offset) * 0.25;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, facingAngle, 0]}>
      <HumanBody
        color={color}
        skinColor={skinColor}
        leftArmRef={leftArmRef as RefObject<THREE.Mesh>}
        rightArmRef={rightArmRef as RefObject<THREE.Mesh>}
        headRef={headRef as RefObject<THREE.Mesh>}
      />

      {chatText && (
        <Billboard position={[0, 2.6, 0]} follow lockX={false} lockY={false} lockZ={false}>
          <mesh position={[0, 0.1, -0.012]}>
            <planeGeometry args={[1.7, 0.34]} />
            <meshBasicMaterial color="#fff0f0" transparent opacity={0.95} />
          </mesh>
          <mesh position={[0, 0.1, -0.016]}>
            <planeGeometry args={[1.74, 0.38]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.3} />
          </mesh>
          <Text position={[0, 0.1, 0]} fontSize={0.078} color="#7f1d1d"
            anchorX="center" anchorY="middle" maxWidth={1.6} textAlign="center">
            {chatText}
          </Text>
          <mesh position={[0, -0.09, -0.012]}>
            <coneGeometry args={[0.055, 0.1, 3]} />
            <meshBasicMaterial color="#fff0f0" />
          </mesh>
        </Billboard>
      )}

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 12]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

// ─── Laughing / jokey NPC ─────────────────────────────────────────────────────

function LaughingNPC({ position, color, skinColor, jokeOffset }: {
  position: [number, number, number]; color: string; skinColor: string; jokeOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const [chatText, setChatText] = useState<string | null>(null);
  const jokeTimer = useRef(jokeOffset * 4.5);
  const jIdx = useRef(jokeOffset % JOKE_LINES.length);
  const [offset] = useState(() => jokeOffset);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    jokeTimer.current -= delta;
    if (jokeTimer.current <= 0) {
      const text = JOKE_LINES[jIdx.current % JOKE_LINES.length];
      jIdx.current++;
      setChatText(text);
      jokeTimer.current = 5 + Math.random() * 6;
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const pp = useGameStore.getState().playerPosition;
        const dx = pp[0] - position[0];
        const dz = pp[2] - position[2];
        const dist = Math.sqrt(dx * dx + dz * dz);
        const vol = proximityVolume(0.65, dist);
        if (vol > 0.02) {
          const utt = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const voice = voices.find((v) => v.lang.startsWith("en-GB")) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
          if (voice) utt.voice = voice;
          utt.pitch = 1.15;
          utt.rate = 1.05;
          utt.volume = vol;
          window.speechSynthesis.speak(utt);
        }
      }
      setTimeout(() => setChatText(null), 4000);
    }

    if (groupRef.current) {
      groupRef.current.position.set(
        position[0],
        position[1] + Math.sin(t * 2.5 + offset) * 0.02,
        position[2]
      );
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.2 + offset) * 0.22;
      headRef.current.rotation.x = -0.08 + Math.sin(t * 2.5 + offset) * 0.06;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 2 + offset) * 0.18;
      leftArmRef.current.rotation.z = 0.1;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.cos(t * 2.2 + offset) * 0.18;
      rightArmRef.current.rotation.z = -0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <HumanBody
        color={color}
        skinColor={skinColor}
        leftArmRef={leftArmRef as RefObject<THREE.Mesh>}
        rightArmRef={rightArmRef as RefObject<THREE.Mesh>}
        headRef={headRef as RefObject<THREE.Mesh>}
      />

      {chatText && (
        <Billboard position={[0, 2.6, 0]} follow lockX={false} lockY={false} lockZ={false}>
          <mesh position={[0, 0.1, -0.012]}>
            <planeGeometry args={[1.55, 0.32]} />
            <meshBasicMaterial color="#f0fff4" transparent opacity={0.93} />
          </mesh>
          <mesh position={[0, 0.1, -0.016]}>
            <planeGeometry args={[1.59, 0.36]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.25} />
          </mesh>
          <Text position={[0, 0.1, 0]} fontSize={0.075} color="#064e3b"
            anchorX="center" anchorY="middle" maxWidth={1.44} textAlign="center">
            {chatText}
          </Text>
          <mesh position={[0, -0.08, -0.012]}>
            <coneGeometry args={[0.055, 0.1, 3]} />
            <meshBasicMaterial color="#f0fff4" />
          </mesh>
        </Billboard>
      )}

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 12]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

// ─── Coffee delivery NPC ─────────────────────────────────────────────────────

const COFFEE_LINES = [
  "flat white for you",
  "one espresso, here you go",
  "your oat latte",
  "got your coffee",
  "chai latte, extra shot",
  "black coffee, no sugar",
  "almond milk cortado",
  "cappuccino, hot",
];

interface CoffeeRoute {
  id: string;
  station: [number, number, number];
  desk: [number, number, number];
  color: string;
  skinColor: string;
  isFemale?: boolean;
  voiceLang: string;
  voicePitch: number;
  startDelay: number;
}

function CoffeeCarrierNPC({ route }: { route: CoffeeRoute }) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef  = useRef<THREE.Group>(null);
  const headRef  = useRef<THREE.Mesh>(null);
  const leftArmRef  = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  const [carrying, setCarrying] = useState(true);
  const [chatText, setChatText] = useState<string | null>(null);
  const [offset] = useState(() => Math.random() * Math.PI * 2);
  const posRef   = useRef(new THREE.Vector3(...route.station));
  const phase    = useRef<"toDesk" | "waiting" | "toStation">("toDesk");
  const waitTimer = useRef(0);
  const startTimer = useRef(route.startDelay);
  const walkSpeed = 1.4;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Delayed start
    if (startTimer.current > 0) {
      startTimer.current -= delta;
      return;
    }

    const pos = posRef.current;
    const target = phase.current === "toDesk"
      ? new THREE.Vector3(...route.desk)
      : new THREE.Vector3(...route.station);

    if (phase.current === "waiting") {
      waitTimer.current -= delta;
      if (waitTimer.current <= 0) {
        phase.current = "toStation";
        setCarrying(false);
      }
    } else {
      const dir  = target.clone().sub(pos);
      const dist = dir.length();
      if (dist < 0.35) {
        if (phase.current === "toDesk") {
          phase.current = "waiting";
          waitTimer.current = 3.5 + Math.random() * 2;
          setCarrying(true);

          const text = COFFEE_LINES[Math.floor(Math.random() * COFFEE_LINES.length)];
          setChatText(text);
          setTimeout(() => setChatText(null), 3500);

          if (typeof window !== "undefined" && window.speechSynthesis) {
            const pp   = useGameStore.getState().playerPosition;
            const ddx  = pp[0] - pos.x;
            const ddz  = pp[2] - pos.z;
            const ddist = Math.sqrt(ddx * ddx + ddz * ddz);
            const vol  = proximityVolume(0.60, ddist);
            if (vol > 0.02) {
              const utt = new SpeechSynthesisUtterance(text);
              const voices = window.speechSynthesis.getVoices();
              const voice  = voices.find((v) => v.lang.startsWith(route.voiceLang)) ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
              if (voice) utt.voice = voice;
              utt.pitch  = route.voicePitch;
              utt.rate   = 0.95;
              utt.volume = vol;
              window.speechSynthesis.speak(utt);
            }
          }
        } else {
          phase.current = "toDesk";
          setCarrying(true);
          startTimer.current = 6 + Math.random() * 10;
        }
      } else {
        dir.normalize().multiplyScalar(walkSpeed * delta);
        pos.add(dir);
        if (bodyRef.current) bodyRef.current.rotation.y = Math.atan2(dir.x, dir.z);
        if (leftArmRef.current && rightArmRef.current) {
          if (phase.current === "toDesk") {
            // Right arm extended forward holding coffee
            rightArmRef.current.rotation.x = -0.8;
            leftArmRef.current.rotation.x  = Math.sin(t * 6 + offset) * 0.3;
          } else {
            const sw = Math.sin(t * 6 + offset);
            leftArmRef.current.rotation.x  = sw * 0.38;
            rightArmRef.current.rotation.x = -sw * 0.38;
          }
        }
      }
    }

    if (groupRef.current) {
      const isWalking = phase.current !== "waiting";
      groupRef.current.position.set(
        pos.x, pos.y + (isWalking ? Math.abs(Math.sin(t * 6 + offset)) * 0.035 : Math.sin(t * 1.2 + offset) * 0.01), pos.z,
      );
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5 + offset) * 0.12;
      headRef.current.rotation.x = phase.current === "waiting" ? 0.2 : 0;
    }
  });

  return (
    <group ref={groupRef} position={route.station}>
      <group ref={bodyRef}>
        <HumanBody
          color={route.color}
          skinColor={route.skinColor}
          isFemale={route.isFemale}
          leftArmRef={leftArmRef as RefObject<THREE.Mesh>}
          rightArmRef={rightArmRef as RefObject<THREE.Mesh>}
          headRef={headRef as RefObject<THREE.Mesh>}
        />
        {/* Coffee cup on right hand */}
        {carrying && (
          <group position={[0.34, 0.74, 0.1]}>
            <mesh>
              <cylinderGeometry args={[0.055, 0.045, 0.14, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.058, 0.058, 0.018, 8]} />
              <meshStandardMaterial color="#d0d0d0" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.048, 0.038, 0.1, 8]} />
              <meshStandardMaterial color="#6b3a2a" roughness={0.6} />
            </mesh>
          </group>
        )}
      </group>

      {chatText && (
        <Billboard position={[0, 2.6, 0]} follow lockX={false} lockY={false} lockZ={false}>
          <mesh position={[0, 0.1, -0.012]}>
            <planeGeometry args={[1.4, 0.3]} />
            <meshBasicMaterial color="#fff8f0" transparent opacity={0.93} />
          </mesh>
          <mesh position={[0, 0.1, -0.016]}>
            <planeGeometry args={[1.44, 0.34]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.22} />
          </mesh>
          <Text position={[0, 0.1, 0]} fontSize={0.072} color="#7c2d12"
            anchorX="center" anchorY="middle" maxWidth={1.3} textAlign="center">
            {chatText}
          </Text>
          <mesh position={[0, -0.07, -0.012]}>
            <coneGeometry args={[0.05, 0.09, 3]} />
            <meshBasicMaterial color="#fff8f0" />
          </mesh>
        </Billboard>
      )}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.26, 12]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.10} />
      </mesh>
    </group>
  );
}

const COFFEE_ROUTES: CoffeeRoute[] = [
  {
    id: "c1",
    station: [-11, 0, 15.5],
    desk:    [-8,  0, 3.5],
    color: "#374151", skinColor: "#fdbcb4",
    voiceLang: "en-GB", voicePitch: 1.05,
    startDelay: 3,
  },
  {
    id: "c2",
    station: [-11, 0, 16.5],
    desk:    [6,   0, -9],
    color: "#1e3a5f", skinColor: "#d4a574",
    isFemale: true,
    voiceLang: "en-US", voicePitch: 1.2,
    startDelay: 9,
  },
  {
    id: "c3",
    station: [-9, 0, 15.5],
    desk:    [11, 0, 2],
    color: "#2d1b4e", skinColor: "#8d5524",
    voiceLang: "en-IN", voicePitch: 0.95,
    startDelay: 16,
  },
];

// ─── Main export ──────────────────────────────────────────────────────────────

export function BackgroundNPCs({ npcs }: { npcs: BgNPC[] }) {
  return (
    <>
      {npcs.map((npc) => (
        <BgNPCMesh key={npc.id} npc={npc} />
      ))}

      {/* Coffee delivery team */}
      {COFFEE_ROUTES.map((route) => (
        <CoffeeCarrierNPC key={route.id} route={route} />
      ))}

      {/* Drama cluster — arguing near the coffee area */}
      <ArgumentNPC
        position={[-12, 0, 10]}
        color="#7c3aed"
        skinColor="#fdbcb4"
        facingAngle={0.3}
        argLineOffset={0}
        voiceLang="en-GB"
        voicePitch={1.0}
      />
      <ArgumentNPC
        position={[-10.5, 0, 10.8]}
        color="#4338ca"
        skinColor="#d4a574"
        facingAngle={Math.PI + 0.3}
        argLineOffset={4}
        voiceLang="en-GB"
        voicePitch={0.85}
      />

      {/* Comedy cluster — joking near the lobby */}
      <LaughingNPC
        position={[-16, 0, 4]}
        color="#0369a1"
        skinColor="#f3c5a0"
        jokeOffset={0}
      />
      <LaughingNPC
        position={[-14.5, 0, 3.2]}
        color="#0e7490"
        skinColor="#8d5524"
        jokeOffset={3}
      />
    </>
  );
}

"use client";
import { useRef, useState, useCallback, useEffect, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";
import { COLLISION_WALLS } from "@/game/collisionWalls";
import { NPC_POSITIONS } from "@/game/npcRegistry";

// ─── NPC wall collision ───────────────────────────────────────────────────────
const BG_NPC_RADIUS = 0.28;
function checkBgWall(x: number, z: number): boolean {
  for (const [minX, minZ, maxX, maxZ] of COLLISION_WALLS) {
    if (
      x + BG_NPC_RADIUS > minX && x - BG_NPC_RADIUS < maxX &&
      z + BG_NPC_RADIUS > minZ && z - BG_NPC_RADIUS < maxZ
    ) return true;
  }
  return false;
}

// Hard inner boundary — keeps NPCs well away from glass walls (office: -25..25 x, -20..20 z)
const NPC_MIN_X = -22.5, NPC_MAX_X = 22.5;
const NPC_MIN_Z = -18.0, NPC_MAX_Z = 18.0;

function clampNPCBounds(pos: { x: number; z: number }) {
  pos.x = Math.max(NPC_MIN_X, Math.min(NPC_MAX_X, pos.x));
  pos.z = Math.max(NPC_MIN_Z, Math.min(NPC_MAX_Z, pos.z));
}

interface BgNPC {
  id: string;
  position: [number, number, number];
  facing?: number;
  color: string;
  skinColor: string;
  isFemale?: boolean;
  isWalker?: boolean;
  chatLine?: string;
}

// ─── Deterministic outfit / hair helpers ─────────────────────────────────────

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface OutfitColors {
  jacket: string;
  trouser: string;
  shirt: string;
  sleeveColor: string;
}

function getOutfit(id: string): OutfitColors {
  const idx = strHash(id) % 4;
  switch (idx) {
    case 0:
      // Navy business suit
      return { jacket: "#1a2a4a", trouser: "#111828", shirt: "#f4f4f8", sleeveColor: "#1a2a4a" };
    case 1:
      // Charcoal/black suit
      return { jacket: "#2a2a3a", trouser: "#18181e", shirt: "#f4f4f8", sleeveColor: "#2a2a3a" };
    case 2:
      // Dark brown suit
      return { jacket: "#3a2010", trouser: "#2a1a0a", shirt: "#f4f4f8", sleeveColor: "#3a2010" };
    default:
      // Business casual / dark crew
      return { jacket: "#1a1a2a", trouser: "#1a2010", shirt: "#1a1a2a", sleeveColor: "#1a1a2a" };
  }
}

interface HairConfig {
  style: "short" | "mid" | "bun" | "bald";
  color: string;
}

const HAIR_PALETTE = ["#0a0600", "#1a0a00", "#2a1500", "#3a2510", "#0a0a14", "#5a3820", "#c0a060"];

function getHairConfig(id: string, isFemale?: boolean): HairConfig {
  const h = strHash(id);
  const femaleStyles: HairConfig["style"][] = ["bun", "mid", "mid", "short"];
  const maleStyles: HairConfig["style"][] = ["short", "short", "mid", "bald"];
  const styleArr = isFemale ? femaleStyles : maleStyles;
  const styleIdx = h % styleArr.length;
  const colorIdx = (h >> 3) % HAIR_PALETTE.length;
  return { style: styleArr[styleIdx], color: HAIR_PALETTE[colorIdx] };
}

function getWatchColor(id: string): string {
  return strHash(id) % 2 === 0 ? "#c9a827" : "#c0c0c8";
}

// Height scale per NPC (deterministic, range 0.92–1.10)
function getHeightScale(id: string): number {
  const h = strHash(id);
  return 0.92 + (h % 19) * (0.18 / 18);
}

// ─── Waypoint paths for walker NPCs ──────────────────────────────────────────

const WALK_PATHS: Record<string, [number, number, number][]> = {
  // bg36: moved [-10,-8] → [-10,-6.5] (was inside west analytics row 1: z=-8.6..-7.55)
  bg36: [[-4, 0, -4], [-10, 0, -6.5], [-10, 0, -4], [-4, 0, 0], [-4, 0, -4]],
  bg37: [[2, 0, -7], [5, 0, -12], [0, 0, -12], [-2, 0, -7], [2, 0, -7]],
  bg38: [[-3, 0, 2], [-8, 0, 4], [-8, 0, 0], [-4, 0, -3], [-3, 0, 2]],
  // bg39: moved [12,1] → [12,2.5] (was inside engineering row 0: z=0.9..2.05)
  bg39: [[7, 0, -3], [12, 0, -4], [12, 0, 2.5], [7, 0, 3], [7, 0, -3]],
};

// ─── Voice config ─────────────────────────────────────────────────────────────

const BG_VOICE_CONFIGS: Record<string, { lang: string; pitch: number; rate: number; baseVol: number }> = {
  bg1:  { lang: "en-GB", pitch: 1.22, rate: 1.10, baseVol: 0.42 },
  bg2:  { lang: "en-GB", pitch: 0.88, rate: 1.05, baseVol: 0.40 },
  bg3:  { lang: "en-GB", pitch: 1.15, rate: 1.08, baseVol: 0.40 },
  bg4:  { lang: "en-GB", pitch: 0.92, rate: 1.06, baseVol: 0.38 },
  bg5:  { lang: "en-GB", pitch: 1.28, rate: 1.12, baseVol: 0.42 },
  bg6:  { lang: "en-GB", pitch: 0.95, rate: 1.05, baseVol: 0.38 },
  bg7:  { lang: "en-GB", pitch: 0.85, rate: 1.00, baseVol: 0.40 },
  bg8:  { lang: "en-GB", pitch: 1.18, rate: 1.10, baseVol: 0.40 },
  bg9:  { lang: "en-GB", pitch: 1.25, rate: 1.08, baseVol: 0.40 },
  bg10: { lang: "en-GB", pitch: 0.90, rate: 1.02, baseVol: 0.38 },
  bg11: { lang: "en-GB", pitch: 1.32, rate: 1.15, baseVol: 0.42 },
  bg12: { lang: "en-GB", pitch: 0.92, rate: 1.05, baseVol: 0.38 },
  bg13: { lang: "en-GB", pitch: 1.20, rate: 1.10, baseVol: 0.40 },
  bg14: { lang: "en-GB", pitch: 0.94, rate: 1.04, baseVol: 0.38 },
  bg15: { lang: "en-GB", pitch: 1.15, rate: 1.12, baseVol: 0.42 },
  bg16: { lang: "en-GB", pitch: 0.98, rate: 1.06, baseVol: 0.38 },
  bg17: { lang: "en-GB", pitch: 1.24, rate: 1.12, baseVol: 0.40 },
  bg18: { lang: "en-GB", pitch: 0.88, rate: 1.00, baseVol: 0.38 },
  bg19: { lang: "en-GB", pitch: 1.10, rate: 1.04, baseVol: 0.40 },
  bg20: { lang: "en-GB", pitch: 0.86, rate: 0.98, baseVol: 0.38 },
  bg21: { lang: "en-GB", pitch: 1.02, rate: 1.05, baseVol: 0.38 },
  bg22: { lang: "en-GB", pitch: 0.94, rate: 1.00, baseVol: 0.40 },
  bg23: { lang: "en-GB", pitch: 1.16, rate: 1.08, baseVol: 0.42 },
  bg24: { lang: "en-GB", pitch: 1.26, rate: 1.12, baseVol: 0.40 },
  bg25: { lang: "en-GB", pitch: 0.90, rate: 1.02, baseVol: 0.38 },
  bg26: { lang: "en-GB", pitch: 1.06, rate: 0.98, baseVol: 0.40 },
  bg27: { lang: "en-GB", pitch: 0.96, rate: 1.06, baseVol: 0.38 },
  bg28: { lang: "en-GB", pitch: 1.12, rate: 1.05, baseVol: 0.42 },
  bg29: { lang: "en-GB", pitch: 0.94, rate: 1.02, baseVol: 0.38 },
  bg30: { lang: "en-GB", pitch: 1.20, rate: 1.08, baseVol: 0.40 },
  bg31: { lang: "en-GB", pitch: 0.96, rate: 1.04, baseVol: 0.38 },
  bg34: { lang: "en-GB", pitch: 0.90, rate: 1.00, baseVol: 0.40 },
  bg35: { lang: "en-GB", pitch: 1.04, rate: 1.02, baseVol: 0.38 },
  bg36: { lang: "en-GB", pitch: 1.14, rate: 1.08, baseVol: 0.42 },
  bg37: { lang: "en-GB", pitch: 0.96, rate: 1.06, baseVol: 0.40 },
  bg38: { lang: "en-GB", pitch: 1.22, rate: 1.12, baseVol: 0.42 },
  bg39: { lang: "en-GB", pitch: 0.92, rate: 1.04, baseVol: 0.38 },
  bg40: { lang: "en-GB", pitch: 1.18, rate: 1.10, baseVol: 0.40 },
  bg41: { lang: "en-GB", pitch: 1.30, rate: 1.12, baseVol: 0.42 },
  bg42: { lang: "en-GB", pitch: 0.94, rate: 1.06, baseVol: 0.40 },
  bg43: { lang: "en-GB", pitch: 0.86, rate: 1.04, baseVol: 0.39 },
  bg44: { lang: "en-GB", pitch: 1.26, rate: 1.08, baseVol: 0.41 },
  bg45: { lang: "en-GB", pitch: 1.32, rate: 1.14, baseVol: 0.40 },
};

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

type NPCState = "working" | "errand" | "returning" | "walking" | "coffee" | "chat";

// ─── Global chat slot limiter (~5% of NPCs chatting simultaneously) ───────────
const MAX_ACTIVE_CHATTERS = 2;
const activeChatSlots = new Set<string>();
function acquireChatSlot(id: string): boolean {
  if (activeChatSlots.has(id)) return false; // already has slot counted (bug guard)
  if (activeChatSlots.size >= MAX_ACTIVE_CHATTERS) return false;
  activeChatSlots.add(id);
  return true;
}
function releaseChatSlot(id: string) { activeChatSlots.delete(id); }

// ─── Background speech queue ──────────────────────────────────────────────────
type BgSpeechItem = { text: string; lang: string; pitch: number; rate: number; volume: number };
let bgSpeechQueue: BgSpeechItem[] = [];
let bgSpeaking = false;

function enqueueBgSpeech(text: string, cfg: typeof BG_VOICE_CONFIGS[string], distVol: number) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!useGameStore.getState().ambienceUnlocked) return;
  if (useGameStore.getState().activeDialogue) return;
  const vol = proximityVolume(cfg.baseVol * 0.55, distVol < 0 ? 0 : distVol);
  if (vol < 0.02) return;
  bgSpeechQueue.push({ text, lang: cfg.lang, pitch: cfg.pitch, rate: cfg.rate, volume: vol });
  if (!bgSpeaking) drainBgQueue();
}

function drainBgQueue() {
  if (bgSpeechQueue.length === 0) { bgSpeaking = false; return; }
  bgSpeaking = true;
  const item = bgSpeechQueue.shift()!;
  const utt = new SpeechSynthesisUtterance(item.text);
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang.startsWith(item.lang)) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null;
  if (voice) utt.voice = voice;
  utt.pitch = item.pitch;
  utt.rate = item.rate;
  utt.volume = item.volume;
  utt.onend = () => setTimeout(drainBgQueue, 600);
  utt.onerror = () => setTimeout(drainBgQueue, 300);
  window.speechSynthesis.speak(utt);
}

// ─── Hair sub-component ───────────────────────────────────────────────────────

function HairMesh({ style, color, headY }: { style: HairConfig["style"]; color: string; headY: number }) {
  if (style === "bald") return null;
  if (style === "short") {
    return (
      <mesh position={[0, headY + 0.015, -0.02]}>
        <sphereGeometry args={[0.218, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial color={color} roughness={0.90} />
      </mesh>
    );
  }
  if (style === "mid") {
    return (
      <group>
        <mesh position={[0, headY + 0.015, -0.02]}>
          <sphereGeometry args={[0.220, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.60]} />
          <meshStandardMaterial color={color} roughness={0.88} />
        </mesh>
        <mesh position={[-0.19, headY - 0.06, 0.02]}>
          <boxGeometry args={[0.065, 0.20, 0.10]} />
          <meshStandardMaterial color={color} roughness={0.88} />
        </mesh>
        <mesh position={[0.19, headY - 0.06, 0.02]}>
          <boxGeometry args={[0.065, 0.20, 0.10]} />
          <meshStandardMaterial color={color} roughness={0.88} />
        </mesh>
      </group>
    );
  }
  // bun
  return (
    <group>
      <mesh position={[0, headY + 0.015, -0.02]}>
        <sphereGeometry args={[0.216, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <mesh position={[0, headY + 0.20, -0.095]}>
        <sphereGeometry args={[0.062, 7, 5]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
    </group>
  );
}

// ─── Shared articulated body component ───────────────────────────────────────

function HumanBody({
  npcId,
  skinColor,
  isFemale = false,
  leftArmRef,
  rightArmRef,
  headRef,
}: {
  npcId: string;
  skinColor: string;
  isFemale?: boolean;
  leftArmRef: RefObject<THREE.Group>;
  rightArmRef: RefObject<THREE.Group>;
  headRef: RefObject<THREE.Mesh>;
}) {
  const outfit = getOutfit(npcId);
  const hair = getHairConfig(npcId, isFemale);
  const watchColor = getWatchColor(npcId);
  const shoeColor = "#0a0a10";

  // Head Y inside this group (scale applied by caller)
  const headY = 1.86;

  return (
    <group>
      {/* ── Feet ── */}
      <mesh position={[-0.112, 0.052, 0.068]}>
        <boxGeometry args={[0.175, 0.088, 0.285]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0.112, 0.052, 0.068]}>
        <boxGeometry args={[0.175, 0.088, 0.285]} />
        <meshStandardMaterial color={shoeColor} roughness={0.45} metalness={0.35} />
      </mesh>

      {/* ── Right leg (upper + knee + lower) ── */}
      {/* lower leg */}
      <mesh position={[0.112, 0.30, 0]}>
        <boxGeometry args={[0.170, 0.38, 0.178]} />
        <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
      </mesh>
      {/* knee cylinder */}
      <mesh position={[0.112, 0.52, 0]}>
        <cylinderGeometry args={[0.090, 0.090, 0.080, 7]} />
        <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
      </mesh>
      {/* upper leg */}
      <mesh position={[0.112, 0.74, 0]}>
        <boxGeometry args={[0.180, 0.36, 0.182]} />
        <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
      </mesh>

      {/* ── Left leg ── */}
      <mesh position={[-0.112, 0.30, 0]}>
        <boxGeometry args={[0.170, 0.38, 0.178]} />
        <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
      </mesh>
      <mesh position={[-0.112, 0.52, 0]}>
        <cylinderGeometry args={[0.090, 0.090, 0.080, 7]} />
        <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
      </mesh>
      <mesh position={[-0.112, 0.74, 0]}>
        <boxGeometry args={[0.180, 0.36, 0.182]} />
        <meshStandardMaterial color={outfit.trouser} roughness={0.82} />
      </mesh>

      {/* ── Torso (3 stacked segments, tapered) ── */}
      {/* waist */}
      <mesh position={[0, 1.04, 0]}>
        <boxGeometry args={[0.42, 0.26, 0.255]} />
        <meshStandardMaterial color={outfit.jacket} roughness={0.64} />
      </mesh>
      {/* mid */}
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[0.47, 0.18, 0.262]} />
        <meshStandardMaterial color={outfit.jacket} roughness={0.64} />
      </mesh>
      {/* chest */}
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[0.51, 0.16, 0.268]} />
        <meshStandardMaterial color={outfit.jacket} roughness={0.64} />
      </mesh>

      {/* shirt strip at chest centre */}
      <mesh position={[0, 1.18, 0.132]}>
        <boxGeometry args={[0.15, 0.48, 0.028]} />
        <meshStandardMaterial color={outfit.shirt} roughness={0.38} />
      </mesh>
      {/* lapels */}
      <mesh position={[-0.068, 1.43, 0.128]}>
        <boxGeometry args={[0.060, 0.09, 0.026]} />
        <meshStandardMaterial color={outfit.shirt} roughness={0.38} />
      </mesh>
      <mesh position={[0.068, 1.43, 0.128]}>
        <boxGeometry args={[0.060, 0.09, 0.026]} />
        <meshStandardMaterial color={outfit.shirt} roughness={0.38} />
      </mesh>

      {/* ── Right arm (shoulder pivot = 1.38) ── */}
      <group ref={rightArmRef} position={[0.345, 1.38, 0]}>
        {/* upper arm */}
        <mesh position={[0, -0.13, 0]}>
          <boxGeometry args={[0.150, 0.28, 0.172]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.64} />
        </mesh>
        {/* elbow */}
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.076, 0.076, 0.065, 7]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.64} />
        </mesh>
        {/* forearm */}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.136, 0.27, 0.155]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.64} />
        </mesh>
        {/* cuff */}
        <mesh position={[0, -0.60, 0]}>
          <boxGeometry args={[0.150, 0.068, 0.168]} />
          <meshStandardMaterial color="#f4f4f8" roughness={0.36} />
        </mesh>
        {/* hand */}
        <mesh position={[0, -0.71, 0.018]}>
          <sphereGeometry args={[0.068, 7, 5]} />
          <meshStandardMaterial color={skinColor} roughness={0.70} />
        </mesh>
      </group>

      {/* ── Left arm (shoulder pivot = 1.38) ── */}
      <group ref={leftArmRef} position={[-0.345, 1.38, 0]}>
        {/* upper arm */}
        <mesh position={[0, -0.13, 0]}>
          <boxGeometry args={[0.150, 0.28, 0.172]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.64} />
        </mesh>
        {/* elbow */}
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.076, 0.076, 0.065, 7]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.64} />
        </mesh>
        {/* forearm */}
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.136, 0.27, 0.155]} />
          <meshStandardMaterial color={outfit.sleeveColor} roughness={0.64} />
        </mesh>
        {/* cuff */}
        <mesh position={[0, -0.60, 0]}>
          <boxGeometry args={[0.150, 0.068, 0.168]} />
          <meshStandardMaterial color="#f4f4f8" roughness={0.36} />
        </mesh>
        {/* watch on left wrist */}
        <mesh position={[0, -0.60, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.020, 0.020, 0.162, 8]} />
          <meshStandardMaterial color={watchColor} roughness={0.24} metalness={0.85} />
        </mesh>
        {/* hand */}
        <mesh position={[0, -0.71, 0.018]}>
          <sphereGeometry args={[0.068, 7, 5]} />
          <meshStandardMaterial color={skinColor} roughness={0.70} />
        </mesh>
      </group>

      {/* ── Neck ── */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.086, 0.094, 0.16, 7]} />
        <meshStandardMaterial color={skinColor} roughness={0.70} />
      </mesh>

      {/* ── Head (slightly elongated on Y) ── */}
      <mesh ref={headRef} position={[0, headY, 0]} scale={[1, 1.06, 0.97]}>
        <sphereGeometry args={[0.210, 9, 7]} />
        <meshStandardMaterial color={skinColor} roughness={0.62} />
      </mesh>

      {/* brow ridge */}
      <mesh position={[0, headY + 0.075, 0.192]}>
        <boxGeometry args={[0.258, 0.030, 0.026]} />
        <meshStandardMaterial color={skinColor} roughness={0.65} />
      </mesh>
      {/* nose */}
      <mesh position={[0, headY - 0.015, 0.208]}>
        <boxGeometry args={[0.048, 0.060, 0.036]} />
        <meshStandardMaterial color={skinColor} roughness={0.65} />
      </mesh>
      {/* lips */}
      <mesh position={[0, headY - 0.088, 0.200]}>
        <boxGeometry args={[0.086, 0.018, 0.020]} />
        <meshStandardMaterial color={skinColor} roughness={0.55} />
      </mesh>

      {/* Eye whites */}
      <mesh position={[-0.078, headY + 0.052, 0.186]}>
        <sphereGeometry args={[0.043, 6, 5]} />
        <meshStandardMaterial color="#f2f2f6" roughness={0.22} />
      </mesh>
      <mesh position={[0.078, headY + 0.052, 0.186]}>
        <sphereGeometry args={[0.043, 6, 5]} />
        <meshStandardMaterial color="#f2f2f6" roughness={0.22} />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.078, headY + 0.052, 0.205]}>
        <sphereGeometry args={[0.027, 5, 4]} />
        <meshStandardMaterial color="#080810" roughness={0.18} />
      </mesh>
      <mesh position={[0.078, headY + 0.052, 0.205]}>
        <sphereGeometry args={[0.027, 5, 4]} />
        <meshStandardMaterial color="#080810" roughness={0.18} />
      </mesh>

      {/* Hair */}
      <HairMesh style={hair.style} color={hair.color} headY={headY} />
    </group>
  );
}

// ─── Standard BG NPC (seated or walker) ──────────────────────────────────────

function BgNPCMesh({ npc }: { npc: BgNPC }) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  // Frame staggering — seated NPCs far from the player skip visual updates on
  // 2 out of every 3 frames (≈20 fps effective for distant drones).
  // Each NPC gets a deterministic slot so they don't all skip the same frame.
  const frameCounter = useRef(0);
  const frameSlot = strHash(npc.id) % 3;

  const [offset] = useState(() => Math.random() * Math.PI * 2);
  const [npcState, setNpcState] = useState<NPCState>(() =>
    npc.isWalker ? "walking" : "working"
  );
  const [chatText, setChatText] = useState<string | null>(null);
  const [waypointIdx, setWaypointIdx] = useState(0);

  const stateTimer = useRef(0);
  const chatTimer = useRef(18 + Math.random() * 28); // longer initial delay = less burst at load
  const chatLineTimer = useRef(20 + Math.random() * 15);
  const walkSpeed = useRef(1.4 + Math.random() * 0.8);
  const posRef = useRef(new THREE.Vector3(npc.position[0], npc.position[1], npc.position[2]));

  // Pre-allocated Vector3 reusables — avoid GC in useFrame
  const homePosRef = useRef(new THREE.Vector3(npc.position[0], npc.position[1], npc.position[2]));
  const wanderTargetRef = useRef(new THREE.Vector3());
  const dirScratch = useRef(new THREE.Vector3());
  const walkerTargetRef = useRef(new THREE.Vector3());
  // Track current state in a ref to avoid stale closure in useFrame
  const npcStateRef = useRef<NPCState>(npc.isWalker ? "walking" : "working");
  // Stuck detection — reset when NPC moves, fires unstick logic when blocked too long
  const stuckTimerRef = useRef(0);

  const paths = WALK_PATHS[npc.id] ?? null;
  const voiceConfig = BG_VOICE_CONFIGS[npc.id];
  const heightScale = getHeightScale(npc.id);

  const nextState = useCallback(() => {
    const cur = npcStateRef.current;
    if (npc.isWalker) {
      const s = Math.random() < 0.80 ? "walking" as const : "coffee" as const;
      npcStateRef.current = s; setNpcState(s);
      stateTimer.current = 10 + Math.random() * 20;
    } else if (cur === "errand") {
      // Errand done — walk home
      npcStateRef.current = "returning"; setNpcState("returning");
      stateTimer.current = 999; // proximity handles transition
    } else if (cur === "returning") {
      // Shouldn't normally fire, but reset to working if it does
      npcStateRef.current = "working"; setNpcState("working");
      stateTimer.current = 50 + Math.random() * 80;
    } else {
      // From "working" or "coffee"
      const r = Math.random();
      if (r < 0.82) {
        npcStateRef.current = "working"; setNpcState("working");
        stateTimer.current = 55 + Math.random() * 80;
      } else {
        // Go on an errand — pick a random spot that isn't inside a wall or desk
        let picked = false;
        for (let attempt = 0; attempt < 12; attempt++) {
          const ox = npc.position[0] + (Math.random() - 0.5) * 16;
          const oz = npc.position[2] + (Math.random() - 0.5) * 16;
          const cx = Math.max(-21, Math.min(21, ox));
          const cz = Math.max(-17, Math.min(17, oz));
          if (!checkBgWall(cx, cz)) {
            wanderTargetRef.current.set(cx, 0, cz);
            picked = true;
            break;
          }
        }
        if (!picked) {
          npcStateRef.current = "working"; setNpcState("working");
          stateTimer.current = 30 + Math.random() * 40;
          return;
        }
        npcStateRef.current = "errand"; setNpcState("errand");
        stateTimer.current = 20 + Math.random() * 18;
      }
    }
  }, [npc.isWalker, npc.position]);

  // Start with a longer idle period so NPCs appear seated at game start
  useEffect(() => { stateTimer.current = 50 + Math.random() * 90; }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    frameCounter.current++;

    // Always tick timers regardless of LOD — ensures state transitions fire on time
    if (npcStateRef.current !== "returning") {
      stateTimer.current -= delta;
      if (stateTimer.current <= 0) nextState();
    }

    // ── Chat limiter: only ~5% of NPCs chatting at once ───────────────────────
    chatTimer.current -= delta;
    if (chatTimer.current <= 0) {
      chatTimer.current = 16 + Math.random() * 24;
      if (acquireChatSlot(npc.id)) {
        const text = WORK_CHATTER[Math.floor(Math.random() * WORK_CHATTER.length)];
        setChatText(text);
        if (voiceConfig) {
          const pp = useGameStore.getState().playerPosition;
          const dx = pp[0] - posRef.current.x, dz = pp[2] - posRef.current.z;
          enqueueBgSpeech(text, voiceConfig, Math.sqrt(dx * dx + dz * dz));
        }
        setTimeout(() => { setChatText(null); releaseChatSlot(npc.id); }, 4000);
      }
    }
    if (npc.chatLine) {
      chatLineTimer.current -= delta;
      if (chatLineTimer.current <= 0) {
        chatLineTimer.current = 18 + Math.random() * 12;
        if (acquireChatSlot(npc.id)) {
          setChatText(npc.chatLine);
          if (voiceConfig) {
            const pp = useGameStore.getState().playerPosition;
            const dx = pp[0] - posRef.current.x, dz = pp[2] - posRef.current.z;
            enqueueBgSpeech(npc.chatLine, voiceConfig, Math.sqrt(dx * dx + dz * dz));
          }
          setTimeout(() => { setChatText(null); releaseChatSlot(npc.id); }, 4800);
        }
      }
    }

    const pos = posRef.current;
    const home = homePosRef.current;

    // ── Distance-based LOD: skip detailed arm/head animations if NPC is far ───
    const pp = useGameStore.getState().playerPosition;
    const distSq = (pp[0] - pos.x) ** 2 + (pp[2] - pos.z) ** 2;
    const inRange = distSq < 900; // animate fully within 30 m

    // ── Frame staggering: seated NPCs >15 m away update at ~20 fps (skip 2/3) ─
    const isSeatedFar =
      !npc.isWalker &&
      npcStateRef.current === "working" &&
      distSq > 225; // 15 m²
    if (isSeatedFar && frameCounter.current % 3 !== frameSlot) return;

    // Moving NPCs >20 m away: only update every 2nd frame (still smooth at ~30fps)
    if (npcStateRef.current !== "working" && distSq > 400 && frameCounter.current % 2 !== frameSlot % 2) return;

    // ── Walker NPC (uses predefined path) ────────────────────────────────────
    if (npcState === "walking" && paths) {
      walkerTargetRef.current.set(paths[waypointIdx][0], paths[waypointIdx][1], paths[waypointIdx][2]);
      dirScratch.current.copy(walkerTargetRef.current).sub(pos);
      const dist = dirScratch.current.length();
      if (dist < 0.3) {
        setWaypointIdx((i) => (i + 1) % paths.length);
      } else {
        dirScratch.current.normalize();
        if (bodyRef.current) bodyRef.current.rotation.y = Math.atan2(dirScratch.current.x, dirScratch.current.z);
        const wmx = dirScratch.current.x * walkSpeed.current * dt;
        const wmz = dirScratch.current.z * walkSpeed.current * dt;
        // Preemptive look-ahead: steer perpendicular when a wall is 0.9 units ahead
        const LOOK_W = 0.9;
        if (checkBgWall(pos.x + dirScratch.current.x * LOOK_W, pos.z + dirScratch.current.z * LOOK_W)) {
          const nx = -dirScratch.current.z * walkSpeed.current * dt;
          const nz =  dirScratch.current.x * walkSpeed.current * dt;
          if      (!checkBgWall(pos.x + nx, pos.z + nz)) { pos.x += nx; pos.z += nz; }
          else if (!checkBgWall(pos.x - nx, pos.z - nz)) { pos.x -= nx; pos.z -= nz; }
        }
        const preMX = pos.x, preMZ = pos.z;
        if (!checkBgWall(pos.x + wmx, pos.z)) pos.x += wmx;
        if (!checkBgWall(pos.x, pos.z + wmz)) pos.z += wmz;
        clampNPCBounds(pos);
        // Stuck: advance to next waypoint so walker never freezes against a wall
        if ((pos.x - preMX) ** 2 + (pos.z - preMZ) ** 2 < 4e-6) {
          stuckTimerRef.current += dt;
          if (stuckTimerRef.current > 0.35) {
            stuckTimerRef.current = 0;
            setWaypointIdx(i => (i + 1) % paths.length);
          }
        } else { stuckTimerRef.current = 0; }
        if (inRange && leftArmRef.current && rightArmRef.current) {
          const swing = Math.sin(t * 6 + offset) * 0.42;
          leftArmRef.current.rotation.x = swing;
          rightArmRef.current.rotation.x = -swing;
        }
        if (groupRef.current) groupRef.current.position.set(pos.x, Math.abs(Math.sin(t * 6 + offset)) * 0.04, pos.z);
      }

    // ── Errand: walk to random destination then return ────────────────────────
    } else if (npcState === "errand") {
      dirScratch.current.copy(wanderTargetRef.current).sub(pos);
      const dist = dirScratch.current.length();
      if (dist < 0.55) {
        // Arrived — stand idle (stateTimer will fire → "returning")
        if (groupRef.current) groupRef.current.position.set(pos.x, Math.sin(t * 1.1 + offset) * 0.01, pos.z);
        if (inRange) {
          if (headRef.current) { headRef.current.rotation.x = 0.05; headRef.current.rotation.y = Math.sin(t * 0.4 + offset) * 0.2; }
          if (leftArmRef.current) leftArmRef.current.rotation.x = -0.15 + Math.sin(t * 1.4 + offset) * 0.07;
          if (rightArmRef.current) rightArmRef.current.rotation.x = -0.15 - Math.sin(t * 1.4 + offset) * 0.07;
        }
      } else {
        // Walk toward errand target — axis-separated wall collision with look-ahead
        dirScratch.current.normalize();
        if (bodyRef.current) bodyRef.current.rotation.y = Math.atan2(dirScratch.current.x, dirScratch.current.z);
        const emx = dirScratch.current.x * walkSpeed.current * dt;
        const emz = dirScratch.current.z * walkSpeed.current * dt;
        // Preemptive look-ahead: nudge sideways before hitting wall
        const LOOK_E = 0.9;
        if (checkBgWall(pos.x + dirScratch.current.x * LOOK_E, pos.z + dirScratch.current.z * LOOK_E)) {
          const en = -dirScratch.current.z * walkSpeed.current * dt;
          const ez =  dirScratch.current.x * walkSpeed.current * dt;
          if      (!checkBgWall(pos.x + en, pos.z + ez)) { pos.x += en; pos.z += ez; }
          else if (!checkBgWall(pos.x - en, pos.z - ez)) { pos.x -= en; pos.z -= ez; }
        }
        const preEX = pos.x, preEZ = pos.z;
        if (!checkBgWall(pos.x + emx, pos.z)) pos.x += emx;
        if (!checkBgWall(pos.x, pos.z + emz)) pos.z += emz;
        clampNPCBounds(pos);
        // Stuck: rotate heading ±90° and try a new nearby target to navigate around obstacle
        if ((pos.x - preEX) ** 2 + (pos.z - preEZ) ** 2 < 4e-6) {
          stuckTimerRef.current += dt;
          if (stuckTimerRef.current > 0.3) {
            stuckTimerRef.current = 0;
            const baseAngle = Math.atan2(dirScratch.current.x, dirScratch.current.z);
            const escDist = 3 + Math.random() * 3;
            for (let att = 0; att < 8; att++) {
              const a = baseAngle + (att % 2 === 0 ? 1 : -1) * (Math.PI / 2 + att * 0.4);
              const nx = Math.max(-21, Math.min(21, pos.x + Math.sin(a) * escDist));
              const nz = Math.max(-17, Math.min(17, pos.z + Math.cos(a) * escDist));
              if (!checkBgWall(nx, nz)) { wanderTargetRef.current.set(nx, 0, nz); break; }
            }
          }
        } else { stuckTimerRef.current = 0; }
        if (inRange && leftArmRef.current && rightArmRef.current) {
          const swing = Math.sin(t * 6 + offset) * 0.42;
          leftArmRef.current.rotation.x = swing;
          rightArmRef.current.rotation.x = -swing;
        }
        if (groupRef.current) groupRef.current.position.set(pos.x, Math.abs(Math.sin(t * 6 + offset)) * 0.04, pos.z);
      }

    // ── Returning: walk slowly back to desk seat ──────────────────────────────
    } else if (npcState === "returning") {
      dirScratch.current.copy(home).sub(pos);
      const dist = dirScratch.current.length();
      if (dist < 0.4) {
        // Arrived home — sit back down
        pos.copy(home);
        npcStateRef.current = "working"; setNpcState("working");
        stateTimer.current = 55 + Math.random() * 80;
      } else {
        dirScratch.current.normalize();
        if (bodyRef.current) bodyRef.current.rotation.y = Math.atan2(dirScratch.current.x, dirScratch.current.z);
        const rmx = dirScratch.current.x * 1.25 * dt;
        const rmz = dirScratch.current.z * 1.25 * dt;
        // Preemptive look-ahead: nudge sideways before hitting wall while returning
        const LOOK_R = 0.9;
        if (checkBgWall(pos.x + dirScratch.current.x * LOOK_R, pos.z + dirScratch.current.z * LOOK_R)) {
          const rn = -dirScratch.current.z * 1.25 * dt;
          const rz =  dirScratch.current.x * 1.25 * dt;
          if      (!checkBgWall(pos.x + rn, pos.z + rz)) { pos.x += rn; pos.z += rz; }
          else if (!checkBgWall(pos.x - rn, pos.z - rz)) { pos.x -= rn; pos.z -= rz; }
        }
        const preRX = pos.x, preRZ = pos.z;
        if (!checkBgWall(pos.x + rmx, pos.z)) pos.x += rmx;
        if (!checkBgWall(pos.x, pos.z + rmz)) pos.z += rmz;
        clampNPCBounds(pos);
        // Stuck returning: sidestep perpendicular to current heading to route around obstacle
        if ((pos.x - preRX) ** 2 + (pos.z - preRZ) ** 2 < 4e-6) {
          stuckTimerRef.current += dt;
          if (stuckTimerRef.current > 0.3) {
            stuckTimerRef.current = 0;
            const perpAngle = Math.atan2(dirScratch.current.x, dirScratch.current.z) + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
            const sx = Math.max(-21, Math.min(21, pos.x + Math.sin(perpAngle) * 2));
            const sz = Math.max(-17, Math.min(17, pos.z + Math.cos(perpAngle) * 2));
            if (!checkBgWall(sx, sz)) { pos.x = sx; pos.z = sz; }
          }
        } else { stuckTimerRef.current = 0; }
        if (inRange && leftArmRef.current && rightArmRef.current) {
          const swing = Math.sin(t * 5.5 + offset) * 0.38;
          leftArmRef.current.rotation.x = swing;
          rightArmRef.current.rotation.x = -swing;
        }
        if (groupRef.current) groupRef.current.position.set(pos.x, Math.abs(Math.sin(t * 5.5 + offset)) * 0.035, pos.z);
      }

    // ── Working (seated at desk) ──────────────────────────────────────────────
    } else if (npcState === "working") {
      // NPC is already at home (walked here in "returning"); just sit and animate
      if (groupRef.current) groupRef.current.position.set(home.x, -0.35 + Math.sin(t * 0.5 + offset) * 0.003, home.z);
      pos.set(home.x, home.y, home.z); // keep posRef in sync
      if (bodyRef.current) {
        const targetFacing = npc.facing ?? 0;
        let df = targetFacing - bodyRef.current.rotation.y;
        while (df > Math.PI) df -= Math.PI * 2;
        while (df < -Math.PI) df += Math.PI * 2;
        bodyRef.current.rotation.y += df * Math.min(1, 6 * dt);
      }
      if (inRange) {
        if (headRef.current) {
          headRef.current.rotation.x = 0.30 + Math.sin(t * 0.35 + offset) * 0.03;
          headRef.current.rotation.y = Math.sin(t * 0.22 + offset) * 0.06;
        }
        if (leftArmRef.current && rightArmRef.current) {
          const type = Math.sin(t * 4.2 + offset) * 0.10;
          leftArmRef.current.rotation.x = -0.68 + type;
          rightArmRef.current.rotation.x = -0.68 - type;
        }
      }

    // ── Coffee / other idle state ─────────────────────────────────────────────
    } else {
      if (groupRef.current) groupRef.current.position.set(pos.x, Math.sin(t * 1.2 + offset) * 0.01, pos.z);
      if (bodyRef.current) bodyRef.current.rotation.y += ((npc.facing ?? 0) - bodyRef.current.rotation.y) * Math.min(1, 3 * dt);
      if (inRange) {
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = -0.18 + Math.sin(t * 1.6 + offset) * 0.08;
          rightArmRef.current.rotation.x = -0.18 - Math.sin(t * 1.6 + offset) * 0.08;
        }
        if (headRef.current) { headRef.current.rotation.x = 0.05; headRef.current.rotation.y = Math.sin(t * 0.4 + offset) * 0.18; }
      }
    }

    // Register position for player-NPC collision — only moving NPCs need it
    // (seated NPCs stay at desk; player can't reach desk interiors anyway)
    if (npcStateRef.current !== "working") {
      let reg = NPC_POSITIONS.get(npc.id);
      if (!reg) { reg = new THREE.Vector3(); NPC_POSITIONS.set(npc.id, reg); }
      reg.set(pos.x, 0, pos.z);
    } else {
      NPC_POSITIONS.delete(npc.id);
    }
  });

  return (
    <group ref={groupRef} position={npc.position}>
      <group ref={bodyRef} scale={[1, heightScale, 1]}>
        <HumanBody
          npcId={npc.id}
          skinColor={npc.skinColor}
          isFemale={npc.isFemale}
          leftArmRef={leftArmRef as RefObject<THREE.Group>}
          rightArmRef={rightArmRef as RefObject<THREE.Group>}
          headRef={headRef as RefObject<THREE.Mesh>}
        />
      </group>

      {chatText && (
        <Billboard position={[0, 2.6, 0]} follow lockX={false} lockY={false} lockZ={false}>
          <mesh position={[0, 0.1, -0.012]}>
            <planeGeometry args={[1.5, 0.32]} />
            <meshBasicMaterial color="#f8f8ff" transparent opacity={0.93} />
          </mesh>
          <mesh position={[0, 0.1, -0.016]}>
            <planeGeometry args={[1.54, 0.36]} />
            <meshBasicMaterial color={npc.color} transparent opacity={0.28} />
          </mesh>
          <Text
            position={[0, 0.1, 0]}
            fontSize={0.075}
            color="#111128"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.38}
            textAlign="center"
          >
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

function ArgumentNPC({
  position,
  color,
  skinColor,
  facingAngle,
  argLineOffset,
  voiceLang,
  voicePitch,
}: ArgNPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const [offset] = useState(() => argLineOffset);
  const [chatText, setChatText] = useState<string | null>(null);
  const lineIdx = useRef(argLineOffset % ARGUMENT_LINES.length);
  const argTimer = useRef(2 + argLineOffset * 3.5);

  // Deterministic visual based on position hash
  const posId = `arg_${position[0]}_${position[2]}`;
  const outfit = getOutfit(posId);
  const hair = getHairConfig(posId);
  const watchColor = getWatchColor(posId);
  const heightScale = getHeightScale(posId);

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
        const vol = proximityVolume(0.70, Math.sqrt(dx * dx + dz * dz));
        const st = useGameStore.getState();
        if (vol > 0.02 && !st.activeDialogue && st.ambienceUnlocked) {
          const utt = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const voice =
            voices.find((v) => v.lang.startsWith("en-GB")) ??
            voices.find((v) => v.lang.startsWith("en")) ??
            null;
          if (voice) utt.voice = voice;
          utt.pitch = voicePitch;
          utt.rate = 1.05 + Math.random() * 0.2;
          utt.volume = vol * 0.40;
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
      <group scale={[1, heightScale, 1]}>
        <HumanBody
          npcId={posId}
          skinColor={skinColor}
          leftArmRef={leftArmRef as RefObject<THREE.Group>}
          rightArmRef={rightArmRef as RefObject<THREE.Group>}
          headRef={headRef as RefObject<THREE.Mesh>}
        />
      </group>

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
          <Text
            position={[0, 0.1, 0]}
            fontSize={0.078}
            color="#7f1d1d"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.6}
            textAlign="center"
          >
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

// ─── Laughing NPC ─────────────────────────────────────────────────────────────

function LaughingNPC({
  position,
  color,
  skinColor,
  jokeOffset,
}: {
  position: [number, number, number];
  color: string;
  skinColor: string;
  jokeOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const [chatText, setChatText] = useState<string | null>(null);
  const jokeTimer = useRef(jokeOffset * 4.5);
  const jIdx = useRef(jokeOffset % JOKE_LINES.length);
  const [offset] = useState(() => jokeOffset);

  const posId = `laugh_${position[0]}_${position[2]}`;
  const heightScale = getHeightScale(posId);

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
        const vol = proximityVolume(0.65, Math.sqrt(dx * dx + dz * dz));
        const st = useGameStore.getState();
        if (vol > 0.02 && !st.activeDialogue && st.ambienceUnlocked) {
          const utt = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const voice =
            voices.find((v) => v.lang.startsWith("en-GB")) ??
            voices.find((v) => v.lang.startsWith("en")) ??
            null;
          if (voice) utt.voice = voice;
          utt.pitch = 1.22;
          utt.rate = 1.10;
          utt.volume = vol * 0.40;
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
      <group scale={[1, heightScale, 1]}>
        <HumanBody
          npcId={posId}
          skinColor={skinColor}
          leftArmRef={leftArmRef as RefObject<THREE.Group>}
          rightArmRef={rightArmRef as RefObject<THREE.Group>}
          headRef={headRef as RefObject<THREE.Mesh>}
        />
      </group>

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
          <Text
            position={[0, 0.1, 0]}
            fontSize={0.075}
            color="#064e3b"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.44}
            textAlign="center"
          >
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

// ─── Coffee delivery NPC ──────────────────────────────────────────────────────

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
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const [carrying, setCarrying] = useState(true);
  const [chatText, setChatText] = useState<string | null>(null);
  const [offset] = useState(() => Math.random() * Math.PI * 2);
  const posRef = useRef(new THREE.Vector3(...route.station));
  const phase = useRef<"toDesk" | "waiting" | "toStation">("toDesk");
  const waitTimer = useRef(0);
  const startTimer = useRef(route.startDelay);
  const walkSpeed = 1.4;

  // Pre-allocated scratch vectors — avoids 2 new THREE.Vector3() allocations per frame
  const deskTargetRef    = useRef(new THREE.Vector3(...route.desk));
  const stationTargetRef = useRef(new THREE.Vector3(...route.station));
  const coffeDirScratch  = useRef(new THREE.Vector3());

  const heightScale = getHeightScale(route.id);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (startTimer.current > 0) {
      startTimer.current -= delta;
      return;
    }

    const pos = posRef.current;
    const target = phase.current === "toDesk" ? deskTargetRef.current : stationTargetRef.current;

    if (phase.current === "waiting") {
      waitTimer.current -= delta;
      if (waitTimer.current <= 0) {
        phase.current = "toStation";
        setCarrying(false);
      }
    } else {
      const dir = coffeDirScratch.current.copy(target).sub(pos);
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
            const pp = useGameStore.getState().playerPosition;
            const dx = pp[0] - pos.x;
            const dz = pp[2] - pos.z;
            const vol = proximityVolume(0.60, Math.sqrt(dx * dx + dz * dz));
            const st = useGameStore.getState();
            if (vol > 0.02 && !st.activeDialogue && st.ambienceUnlocked) {
              const utt = new SpeechSynthesisUtterance(text);
              const voices = window.speechSynthesis.getVoices();
              const voice =
                voices.find((v) => v.lang.startsWith("en-GB")) ??
                voices.find((v) => v.lang.startsWith("en")) ??
                null;
              if (voice) utt.voice = voice;
              utt.pitch = route.voicePitch;
              utt.rate = 1.05;
              utt.volume = vol * 0.40;
              window.speechSynthesis.speak(utt);
            }
          }
        } else {
          phase.current = "toDesk";
          setCarrying(true);
          startTimer.current = 6 + Math.random() * 10;
        }
      } else {
        dir.normalize().multiplyScalar(walkSpeed * delta); // dir = coffeDirScratch — safe to mutate
        pos.add(dir);
        clampNPCBounds(pos);
        if (bodyRef.current) bodyRef.current.rotation.y = Math.atan2(dir.x, dir.z);
        if (leftArmRef.current && rightArmRef.current) {
          if (phase.current === "toDesk") {
            rightArmRef.current.rotation.x = -0.8;
            leftArmRef.current.rotation.x = Math.sin(t * 6 + offset) * 0.3;
          } else {
            const sw = Math.sin(t * 6 + offset);
            leftArmRef.current.rotation.x = sw * 0.38;
            rightArmRef.current.rotation.x = -sw * 0.38;
          }
        }
      }
    }

    if (groupRef.current) {
      const isWalking = phase.current !== "waiting";
      groupRef.current.position.set(
        pos.x,
        pos.y + (isWalking ? Math.abs(Math.sin(t * 6 + offset)) * 0.035 : Math.sin(t * 1.2 + offset) * 0.01),
        pos.z
      );
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.5 + offset) * 0.12;
      headRef.current.rotation.x = phase.current === "waiting" ? 0.2 : 0;
    }
  });

  return (
    <group ref={groupRef} position={route.station}>
      <group ref={bodyRef} scale={[1, heightScale, 1]}>
        <HumanBody
          npcId={route.id}
          skinColor={route.skinColor}
          isFemale={route.isFemale}
          leftArmRef={leftArmRef as RefObject<THREE.Group>}
          rightArmRef={rightArmRef as RefObject<THREE.Group>}
          headRef={headRef as RefObject<THREE.Mesh>}
        />
        {/* Coffee cup on right hand (offset relative to body group, not arm group) */}
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
          <Text
            position={[0, 0.1, 0]}
            fontSize={0.072}
            color="#7c2d12"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.3}
            textAlign="center"
          >
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
    desk: [-8, 0, 3.5],
    color: "#374151",
    skinColor: "#fdbcb4",
    voiceLang: "en-GB",
    voicePitch: 1.05,
    startDelay: 3,
  },
  {
    id: "c2",
    station: [-11, 0, 16.5],
    desk: [6, 0, -9],
    color: "#1e3a5f",
    skinColor: "#d4a574",
    isFemale: true,
    voiceLang: "en-US",
    voicePitch: 1.2,
    startDelay: 9,
  },
  {
    id: "c3",
    station: [-9, 0, 15.5],
    desk: [11, 0, 2],
    color: "#2d1b4e",
    skinColor: "#8d5524",
    voiceLang: "en-IN",
    voicePitch: 0.95,
    startDelay: 16,
  },
];

// ─── Lift NPC — arrives / departs via animated lift doors ────────────────────
// Phase offsets must mirror AnimatedLiftDoor in OfficeScene.tsx:
//   lift z=-4 → phaseOffset=0   lift z=4 → phaseOffset=7

function LiftNPC({
  liftPos,
  phaseOffset,
  npcId,
  skinColor,
  isFemale,
  startInLobby = false,
}: {
  liftPos: [number, number, number];
  phaseOffset: number;
  npcId: string;
  skinColor: string;
  isFemale?: boolean;
  startInLobby?: boolean;
}) {
  const groupRef   = useRef<THREE.Group>(null);
  const bodyRef    = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef= useRef<THREE.Group>(null);
  const headRef    = useRef<THREE.Mesh>(null);

  // Mirror AnimatedLiftDoor cycle constants
  const CYCLE    = 14;
  const OPEN_DUR = 1.1;
  const STAY_DUR = 3.2;

  const [swingOffset] = useState(() => phaseOffset * 1.3 + 0.7);

  const LOBBY_X = -22.0;
  // Vary Z per NPC so two NPCs from the same lift don't stack on each other
  const _idHash = strHash(npcId);
  const LOBBY_Z = liftPos[2] * 0.45 + ((_idHash % 7) - 3) * 0.38;

  const posRef      = useRef(
    startInLobby
      ? new THREE.Vector3(LOBBY_X, 0, LOBBY_Z)
      : new THREE.Vector3(...liftPos)
  );
  const liftTimer   = useRef(phaseOffset % CYCLE);
  const npcPhase    = useRef<"inside" | "exiting" | "lobby" | "returning">(
    startInLobby ? "lobby" : "inside"
  );
  const dwellTimer  = useRef(startInLobby ? 2 + Math.random() * 4 : 0);
  const dirScratch  = useRef(new THREE.Vector3());
  const targetRef   = useRef(new THREE.Vector3());

  const WALK_SPEED = 1.6;
  const heightScale = getHeightScale(npcId);

  useFrame((state, delta) => {
    const t  = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    liftTimer.current = (liftTimer.current + delta) % CYCLE;
    const lt       = liftTimer.current;
    const liftOpen = lt >= OPEN_DUR && lt < OPEN_DUR + STAY_DUR;

    const ph = npcPhase.current;

    // ── Inside: wait for doors to open ────────────────────────────────────
    if (ph === "inside") {
      if (liftOpen) {
        npcPhase.current = "exiting";
        posRef.current.set(liftPos[0] + 0.5, 0, liftPos[2]);
        targetRef.current.set(LOBBY_X, 0, LOBBY_Z);
        if (groupRef.current) {
          groupRef.current.position.set(posRef.current.x, 0, posRef.current.z);
          groupRef.current.visible = true;
        }
      }
      return; // invisible, skip animations
    }

    // ── Exiting: walk into lobby ───────────────────────────────────────────
    if (ph === "exiting") {
      dirScratch.current.copy(targetRef.current).sub(posRef.current);
      const dist = dirScratch.current.length();
      if (dist < 0.45) {
        npcPhase.current = "lobby";
        dwellTimer.current = 9 + Math.random() * 9;
      } else {
        dirScratch.current.normalize();
        if (bodyRef.current)
          bodyRef.current.rotation.y = Math.atan2(dirScratch.current.x, dirScratch.current.z);
        posRef.current.addScaledVector(dirScratch.current, WALK_SPEED * dt);
        clampNPCBounds(posRef.current);
        if (leftArmRef.current && rightArmRef.current) {
          const sw = Math.sin(t * 6 + swingOffset) * 0.42;
          leftArmRef.current.rotation.x  =  sw;
          rightArmRef.current.rotation.x = -sw;
        }
      }
      if (groupRef.current)
        groupRef.current.position.set(
          posRef.current.x,
          Math.abs(Math.sin(t * 6 + swingOffset)) * 0.04,
          posRef.current.z
        );
    }

    // ── Lobby: standing idle ───────────────────────────────────────────────
    if (ph === "lobby") {
      dwellTimer.current -= dt;
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.45 + swingOffset) * 0.28;
        headRef.current.rotation.x = 0.05;
      }
      if (leftArmRef.current)
        leftArmRef.current.rotation.x  = -0.12 + Math.sin(t * 1.4 + swingOffset) * 0.07;
      if (rightArmRef.current)
        rightArmRef.current.rotation.x = -0.12 - Math.sin(t * 1.4 + swingOffset) * 0.07;
      if (groupRef.current)
        groupRef.current.position.set(
          posRef.current.x,
          Math.sin(t * 1.0 + swingOffset) * 0.01,
          posRef.current.z
        );
      if (dwellTimer.current <= 0) {
        npcPhase.current = "returning";
        targetRef.current.set(liftPos[0] + 0.4, 0, liftPos[2]);
      }
    }

    // ── Returning: walk back and enter lift ────────────────────────────────
    if (ph === "returning") {
      dirScratch.current.copy(targetRef.current).sub(posRef.current);
      const dist = dirScratch.current.length();
      if (dist < 0.55) {
        // "Entered" — hide and reset for next opening
        if (groupRef.current) groupRef.current.visible = false;
        npcPhase.current = "inside";
        posRef.current.set(liftPos[0], 0, liftPos[2]);
        liftTimer.current = phaseOffset % CYCLE;
      } else {
        dirScratch.current.normalize();
        if (bodyRef.current)
          bodyRef.current.rotation.y = Math.atan2(dirScratch.current.x, dirScratch.current.z);
        posRef.current.addScaledVector(dirScratch.current, WALK_SPEED * dt);
        clampNPCBounds(posRef.current);
        if (leftArmRef.current && rightArmRef.current) {
          const sw = Math.sin(t * 6 + swingOffset) * 0.42;
          leftArmRef.current.rotation.x  =  sw;
          rightArmRef.current.rotation.x = -sw;
        }
      }
      if (groupRef.current)
        groupRef.current.position.set(
          posRef.current.x,
          Math.abs(Math.sin(t * 6 + swingOffset)) * 0.04,
          posRef.current.z
        );
    }
  });

  return (
    <group ref={groupRef} position={liftPos} visible={startInLobby}>
      <group ref={bodyRef} scale={[1, heightScale, 1]}>
        <HumanBody
          npcId={npcId}
          skinColor={skinColor}
          isFemale={isFemale}
          leftArmRef={leftArmRef as RefObject<THREE.Group>}
          rightArmRef={rightArmRef as RefObject<THREE.Group>}
          headRef={headRef  as RefObject<THREE.Mesh>}
        />
      </group>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 12]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

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

      {/* Lift arrival / departure NPCs — one per lift, cycle-synced */}
      {/* Lift A (z=-4, phaseOffset=0): starts inside, exits when doors open */}
      <LiftNPC
        liftPos={[-24.5, 0, -4]}
        phaseOffset={0}
        npcId="liftA"
        skinColor="#fdbcb4"
      />
      {/* Lift B (z=4, phaseOffset=7): starts already in lobby so scene isn't empty at load */}
      <LiftNPC
        liftPos={[-24.5, 0, 4]}
        phaseOffset={7}
        npcId="liftB"
        skinColor="#8d5524"
        isFemale
        startInLobby
      />
      {/* Second pair — different skin tones, opposite start states */}
      <LiftNPC
        liftPos={[-24.5, 0, 4]}
        phaseOffset={7}
        npcId="liftC"
        skinColor="#d4a574"
        startInLobby
      />
      <LiftNPC
        liftPos={[-24.5, 0, -4]}
        phaseOffset={0}
        npcId="liftD"
        skinColor="#c68642"
        isFemale
      />
    </>
  );
}

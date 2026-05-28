import * as THREE from "three";
// Module-level map of current NPC world positions.
// Updated every frame by NPCCharacter; read by PlayerController for live proximity detection.
// Using a plain Map (not React state) avoids re-render churn — pure mutable shared data.
export const NPC_POSITIONS: Map<string, THREE.Vector3> = new Map();

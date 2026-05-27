# INCIDENT: First Day Protocol

A premium browser-based 3D situational judgement game built with **Next.js 14**, **React Three Fiber**, **Tailwind CSS**, **Framer Motion**, and **Zustand**.

You play as a new analyst at Asterion Labs on your first day — right in the middle of a live data crisis. Talk to five colleagues, gather information, make decisions. Your choices drive one of five endings, and a Chess.com-style AI coach review breaks down every move afterwards.

---

## Quick start

**Requirements:** Node.js 18+ (LTS recommended)

```bash
# 1. Clone
git clone <your-repo-url>
cd incident

# 2. Install
npm install

# 3. Run in dev mode
npm run dev
```

Open **http://localhost:3000** in your browser.

> The game uses the **Web Speech API** for NPC voices (built into Chrome, Edge, Safari). Firefox has limited support. Chrome is recommended for the best experience.

---

## Production build

```bash
npm run build
npm start
```

---

## Project structure

```
incident/
├── app/
│   ├── game/page.tsx       # Game route (SSR-disabled via next/dynamic)
│   ├── layout.tsx          # Root layout + Google Fonts
│   └── globals.css         # Tailwind base styles
│
├── IncidentGame.tsx         # Top-level game component (screen router)
│
├── components/              # 2D overlay UI
│   ├── StartScreen.tsx
│   ├── LoadingScreen.tsx
│   ├── GameHUD.tsx          # Objective + minimap HUD
│   ├── MiniMap.tsx          # Tactical map (click to fullscreen + zoom)
│   ├── DialoguePanel.tsx    # Conversation UI with portraits + SPACE prompt
│   ├── DocumentViewer.tsx   # In-game document viewer
│   ├── EndingScreen.tsx     # Cinematic ending reveal
│   └── ReviewScreen.tsx     # AI coach review + walkthrough mode
│
├── three/                   # 3D scene (React Three Fiber)
│   ├── OfficeScene.tsx      # Scene root + collision walls
│   ├── OfficeProps.tsx      # Desks, monitors, chairs, whiteboards, props
│   ├── PlayerController.tsx # WASD + mouse-look + walk animation
│   ├── NPCCharacter.tsx     # Named NPC characters with speech bubbles
│   ├── BackgroundNPCs.tsx   # 20 background NPCs + coffee carriers
│   └── LondonExterior.tsx   # City skyline outside the glass walls
│
├── game/                    # Game logic
│   ├── data.ts              # Characters, dialogue trees, decisions
│   ├── types.ts             # TypeScript interfaces
│   ├── scoring.ts           # Skill scoring engine
│   ├── review.ts            # AI coach review generator
│   ├── audio.ts             # Ambient audio / footsteps
│   ├── voiceSynthesis.ts    # Web Speech API wrapper with emotion modifiers
│   └── documents.ts         # In-game readable documents
│
└── store/
    └── gameStore.ts         # Zustand global state
```

---

## Controls

| Action | Key |
|---|---|
| Move | `W A S D` or `↑ ↓ ← →` |
| Sprint | Hold `Shift` |
| Look around | Mouse (click canvas to lock pointer) |
| Interact with NPC | Walk up close → `E` |
| Advance dialogue | `Space` |
| Open full map | Click the minimap (top-left) |

---

## Tech stack

| Package | Version | Purpose |
|---|---|---|
| Next.js | 14.2 | App framework + routing |
| React Three Fiber | 8.17 | Three.js React renderer |
| @react-three/drei | 9.109 | R3F helpers (Billboard, Text, etc.) |
| Three.js | 0.167 | 3D engine |
| Framer Motion | 11.3 | UI animations |
| Zustand | 4.5 | Global game state |
| Tailwind CSS | 3.4 | Utility-first styling |
| TypeScript | 5 | Type safety |

---

## Browser compatibility

| Browser | Status |
|---|---|
| Chrome / Edge (v110+) | ✅ Full support (recommended) |
| Safari (v16+) | ✅ Supported |
| Firefox | ⚠ Works but NPC voices silent (Web Speech API not fully supported) |

---

## License

MIT — free to use, modify, and distribute.

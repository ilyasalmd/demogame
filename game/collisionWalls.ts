// Shared static collision wall data — used by PlayerController, NPCCharacter, BackgroundNPCs.
// Format: [minX, minZ, maxX, maxZ]  (Y is ignored — all walls are infinite height)

export const COLLISION_WALLS: number[][] = [
  // ── Outer boundary ────────────────────────────────────────────────
  [-25, -20, 25, -19.5],    // south glass wall
  [-25, 19.5, 25, 20],      // north glass wall
  [-25, -20, -24.5, 20],    // west glass wall
  [24.5, -20, 25, 20],      // east glass wall

  // ── Lift lobby dividing wall — 6-unit door gap at z=0 for entry ──
  [-18.3, -9, -18, -3],     // south portion
  [-18.3, 3, -18, 9],       // north portion

  // ── Boardroom (fully enclosed glass box) ─────────────────────────
  [7.7, -19.5, 8, -10.5],   // west wall
  [7.7, -10.5, 12.25, -9.7],   // north wall (west of boardroom door)
  [13.75, -10.5, 18, -9.7],    // north wall (east of boardroom door)
  [18, -10.5, 18.3, -19.5], // east wall
  // south wall = outer boundary at z=-19.5

  // ── Huddle room A — west / north / east / south walls with door ──
  [7.7, 7.2, 8, 14],
  [7.7, 14, 14, 14.3],
  [14, 7.2, 14.3, 14],
  [7.7, 6.95, 10.25, 7.25],   // south-west panel (door gap: x 10.25–11.75)
  [11.75, 6.95, 14.3, 7.25],  // south-east panel

  // ── Huddle room B — west / north / east / south walls with door ──
  [-7, 9.7, -7.3, 18],       // west wall
  [-7, 18, 2, 18.3],         // north wall
  [2, 9.7, 2.3, 18],         // east wall
  [-7.3, 9.7, -3.25, 10.1],  // south-west panel (door gap: x -3.25 to -1.75)
  [-1.75, 9.7, 2.3, 10.1],   // south-east panel

  // ── Server room (fully enclosed) ─────────────────────────────────
  [20, 7, 24.5, 19.5],

  // ── Desk cluster collision boxes — per-row, tight in Z for walkable aisles ──
  // Manual analytics front row (z=-9, x=-1..4) — chairs north, leave north clear
  [-1.9, -9.6, 4.9, -8.55],

  // West analytics pods (cx=-6 & cx=-10 merged, cz=-10, spacingZ=4.0)
  [-12.0, -12.6, -4.0, -11.55],  // row z=-12
  [-12.0,  -8.6, -4.0,  -7.55],  // row z=-8

  // Engineering pod (cx=9, cz=3.5, spacingZ=4.0)
  [5.9, 0.9, 12.1, 2.05],   // row z=1.5
  [5.9, 4.9, 12.1, 6.05],   // row z=5.5

  // Ops pod (cx=-8.5, cz=3.5, spacingZ=4.0)
  [-10.5, 0.9, -6.5, 2.05],  // row z=1.5
  [-10.5, 4.9, -6.5, 6.05],  // row z=5.5

  // Central open-plan pod (cx=1, cz=0, rows=3, spacingZ=4.0)
  [-2.1, -4.6, 4.1, -3.55],  // row z=-4
  [-2.1, -0.6, 4.1,  0.45],  // row z=0
  [-2.1,  3.4, 4.1,  4.45],  // row z=4

  // Extra rows
  [-3.1, -14.45, 3.1, -13.3],
  [-3.1, -17.45, 3.1, -16.3],

  // ── Reception desk (pos [-20.5,0,0], size 1.6×3.8) ───────────────
  [-21.3, -2.0, -19.7, 2.0],

  // ── Lobby visitor seating clusters (near west wall, x≈-22.5) ─────
  [-23.2, -7.6, -21.8, -5.4],   // south pair
  [-23.2,  5.4, -21.8,  7.6],   // north pair

  // ── Coffee station counter + fridge (pos [-10,0,14.5], 4×1.2) ────
  [-12.1, 13.8, -7.7, 15.3],

  // ── Coffee station bar stools (z≈13.6, x -11.4 to -9.3) ─────────
  [-11.7, 13.0, -8.7, 14.1],

  // ── Lounge sofa (cx=-15, cz=14) ──────────────────────────────────
  [-17.0, 12.8, -16.0, 15.2],
  // ── Lounge coffee table (r=0.7) ──────────────────────────────────
  [-15.8, 13.2, -14.2, 14.8],

  // ── Filing cabinets — west wall cluster 1 (z=4.5..9.05, x=-23.5) ─
  [-23.9, 4.2, -23.1, 9.4],

  // ── Filing cabinets — west wall cluster 2 (z=-5..-3.05, x=-23.5) ─
  [-23.9, -5.3, -23.1, -2.7],

  // ── Filing cabinets — west wall cluster 3 (z=-14..-12.05, x=-23.5)
  [-23.9, -14.3, -23.1, -11.7],

  // ── Filing cabinets — north wall cluster 1 (x=-16..-10.4, z=19.1) ─
  [-16.3, 18.7, -10.1, 19.5],

  // ── Filing cabinets — north wall cluster 2 (x=6..8.1, z=19.1) ───
  [5.7, 18.7, 8.4, 19.5],

  // ── Filing cabinets — east wall (z=2..5.9, x=23.5) ──────────────
  [23.1, 1.7, 23.9, 6.2],

  // ── Filing cabinets — compliance/coffee area (x=-7.0..-4.4, z=9.1)
  [-7.4, 8.7, -4.1, 9.5],

  // ── Executive suite desks — north row (z≈-2, x=16-20.5) ─────────
  [15.0, -2.7, 21.0, -0.8],

  // ── Executive suite desks — south row (z≈-7.5, x=16-18.5) ───────
  [15.0, -8.2, 19.5, -6.7],

  // ── Exec chair — far south (pos [20.5, 0, -8]) ───────────────────
  [19.5, -8.6, 21.5, -7.3],

  // ── Exec single desk (x=20.5, z=-5) ─────────────────────────────
  [19.5, -5.6, 21.5, -4.2],

  // ── Compliance pod — back desk row (z≈13) ────────────────────────
  [-4.1, 12.5, 0.6, 13.5],

  // ── Priya meeting table + chairs (SmallMeetingRoom cx=-2.5, cz=15)
  [-4.1, 13.4, -0.9, 16.6],

  // ── Standing desk (pos [13.5, 0, 4]) ─────────────────────────────
  [12.7, 3.6, 14.3, 4.4],

  // ── Printer stations ─────────────────────────────────────────────
  [-4.5, 0.2, -3.5, 0.9],
  [5.1, -6.9, 5.9, -6.2],

  // ── Engineering north extension (cx=5, cz=8) rows ────────────────
  [2.9, 5.9, 7.1, 7.05],   // row z=6
  [2.9, 9.9, 7.1, 11.05],  // row z=10
];

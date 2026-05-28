// Shared runtime settings — write from GameHUD, read from PlayerController
// Module-level variable so changes propagate instantly without re-renders.
export let mouseSensitivity = 0.0065; // default — tuned for average laptop trackpad
export function setMouseSensitivity(s: number) {
  mouseSensitivity = Math.max(0.001, Math.min(0.020, s));
}

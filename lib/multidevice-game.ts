import type { CalibrationData } from "./force-device-service";

export const PLAYER_COLORS = [
  "#fbbf24",
  "#38bdf8",
  "#fb7185",
  "#a78bfa",
  "#4ade80",
  "#fb923c",
];
export function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export function calculateCalibration(forces: number[]): CalibrationData | null {
  const sorted = forces
    .filter((force) => Number.isFinite(force) && force >= 0)
    .sort((a, b) => b - a);
  if (!sorted.length) return null;
  const top = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.2)));
  const maxForce = top.reduce((sum, force) => sum + force, 0) / top.length;
  if (maxForce <= 0) return null;
  return {
    maxForce,
    lowZone: maxForce * 0.33,
    mediumZone: maxForce * 0.66,
    highZone: maxForce,
  };
}

export function getBirdX(
  index: number,
  count: number,
  width: number,
  birdSize: number,
): number {
  // Keep every bird visible on narrow screens, even with several players.
  return (
    50 +
    index *
      Math.min(
        birdSize + 12,
        Math.max(0, width - birdSize - 70) / Math.max(1, count - 1),
      )
  );
}

export function getBirdTargetY(
  force: number,
  maxForce: number,
  height: number,
  size: number,
): number {
  const percent = Math.max(
    0,
    Math.min(1, force / (maxForce > 0 ? maxForce : 20)),
  );
  const bottom = height - size - 50;
  return bottom - percent * (bottom - 50);
}

export function shouldAutoCalibrate(
  scanning: boolean,
  connecting: boolean,
  found: number,
  connected: number,
): boolean {
  return !scanning && !connecting && found === 1 && connected === 1;
}

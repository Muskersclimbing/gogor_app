import { describe, expect, it } from "vitest";
import {
  calculateCalibration,
  getBirdTargetY,
  getBirdX,
  shouldAutoCalibrate,
} from "../lib/multidevice-game";

describe("device selection", () => {
  it("continues automatically after connecting the only discovered device", () => {
    expect(shouldAutoCalibrate(false, false, 1, 1)).toBe(true);
  });
  it.each([
    [true, false, 1, 1],
    [false, true, 1, 1],
    [false, false, 1, 0],
    [false, false, 2, 1],
    [false, false, 2, 2],
    [false, false, 0, 0],
  ] as const)(
    "waits for manual selection or connection (%s, %s, %s, %s)",
    (scanning, connecting, found, connected) => {
      expect(shouldAutoCalibrate(scanning, connecting, found, connected)).toBe(
        false,
      );
    },
  );
});

describe("independent calibration and birds", () => {
  it("calculates the top 20 percent separately for devices with different strengths", () => {
    const first = calculateCalibration([0, 1, 2, 4, 10, 12, 14, 16, 18, 20]);
    const second = calculateCalibration([0, 5, 10, 15, 30]);
    expect(first).toEqual({
      maxForce: 19,
      lowZone: 19 * 0.33,
      mediumZone: 19 * 0.66,
      highZone: 19,
    });
    expect(second?.maxForce).toBe(30);
  });
  it.each([
    { samples: [] },
    { samples: [0, 0, 0] },
    { samples: [NaN, Infinity, -2] },
  ])("rejects unusable calibration samples %j", ({ samples }) => {
    expect(calculateCalibration(samples)).toBeNull();
  });
  it("maps equal relative force to equal altitude despite different calibrations", () => {
    expect(getBirdTargetY(10, 20, 800, 75)).toBe(
      getBirdTargetY(25, 50, 800, 75),
    );
    expect(getBirdTargetY(20, 20, 800, 75)).toBe(50);
    expect(getBirdTargetY(0, 50, 800, 75)).toBe(675);
    expect(getBirdTargetY(10, 20, 800, 75)).not.toBe(
      getBirdTargetY(0, 50, 800, 75),
    );
  });
  it("keeps a single bird in its original position and multiple birds visible", () => {
    expect(getBirdX(0, 1, 375, 75)).toBe(50);
    for (const count of [2, 4, 8]) {
      const positions = Array.from({ length: count }, (_, index) =>
        getBirdX(index, count, 375, 75),
      );
      expect(new Set(positions).size).toBe(count);
      expect(positions.at(-1)! + 75).toBeLessThanOrEqual(375);
    }
  });
});

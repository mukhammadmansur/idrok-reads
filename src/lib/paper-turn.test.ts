import { describe, expect, it } from "vitest";
import { paperGeometry, PAPER_STRIPS } from "./paper-turn";
describe("flexible paper geometry", () => {
  it("starts flat at full width and finishes flat on the other side of the spine", () => {
    for (const p of [0, 1]) {
      const strips = paperGeometry(p, 520);
      expect(strips).toHaveLength(PAPER_STRIPS);
      for (const strip of strips) {
        expect(strip.z).toBeCloseTo(0);
        expect(strip.angle).toBeCloseTo(p * Math.PI);
        expect(strip.width).toBe(520 / PAPER_STRIPS);
      }
      const last = strips.at(-1)!;
      expect(last.x + Math.cos(last.angle) * last.width).toBeCloseTo(
        p === 0 ? 520 : -520,
      );
    }
  });
  it("bends connected strips without shrinking or tearing the paper", () => {
    for (const width of [288, 358, 519])
      for (const progress of [0.1, 0.25, 0.5, 0.75, 0.9]) {
        const strips = paperGeometry(progress, width);
        expect(
          new Set(strips.map((s) => s.angle.toFixed(4))).size,
        ).toBeGreaterThan(1);
        expect(strips.some((s) => s.z > 0)).toBe(true);
        expect(strips.reduce((sum, s) => sum + s.width, 0)).toBeCloseTo(width);
        for (let i = 1; i < strips.length; i++) {
          const previous = strips[i - 1],
            current = strips[i];
          expect(current.x).toBeCloseTo(
            previous.x + Math.cos(previous.angle) * previous.width,
          );
          expect(current.z).toBeCloseTo(
            previous.z + Math.sin(previous.angle) * previous.width,
          );
        }
      }
  });
  it("reverses portrait turns and clamps out-of-range frame timestamps", () => {
    expect(paperGeometry(0, 358, true)).toEqual(paperGeometry(1, 358));
    expect(paperGeometry(1, 358, true)).toEqual(paperGeometry(0, 358));
    expect(paperGeometry(-1, 358)).toEqual(paperGeometry(0, 358));
    expect(paperGeometry(2, 358)).toEqual(paperGeometry(1, 358));
  });
});

import { describe, expect, it } from "vitest";

function formatReadingTime(seconds: number, isCompleted: boolean): string {
  if (isCompleted && (!seconds || seconds <= 0)) {
    return "Tugatilgan";
  }
  if (!seconds || seconds <= 0) {
    return "—";
  }
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours} soat${mins ? ` ${mins} daqiqa` : ""}`;
  }
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)} daqiqa`;
  }
  return `${seconds} soniya`;
}

describe("formatReadingTime - 0 soniya bug fix", () => {
  it("formats 0 seconds on completed book as 'Tugatilgan'", () => {
    expect(formatReadingTime(0, true)).toBe("Tugatilgan");
  });

  it("formats 0 seconds on unstarted book as '—'", () => {
    expect(formatReadingTime(0, false)).toBe("—");
  });

  it("formats minutes and hours accurately", () => {
    expect(formatReadingTime(125, false)).toBe("2 daqiqa");
    expect(formatReadingTime(3660, true)).toBe("1 soat 1 daqiqa");
  });
});

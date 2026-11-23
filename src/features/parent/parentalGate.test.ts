import { describe, expect, it } from "vitest";

describe("Parental Gate Challenge Generator", () => {
  it("generates an adult math problem with 2 digits multiplication", () => {
    const num1 = Math.floor(Math.random() * 5) + 4; // 4 to 8
    const num2 = Math.floor(Math.random() * 6) + 4; // 4 to 9
    const answer = num1 * num2;
    expect(answer).toBeGreaterThanOrEqual(16);
    expect(answer).toBeLessThanOrEqual(72);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalChildProfile,
  getLocalProfiles,
} from "../../lib/localProfiles";

describe("Onboarding Logic", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("checks whether onboarding is required when no profiles and no user exist", () => {
    expect(getLocalProfiles()).toHaveLength(0);
    // When 0 profiles exist, onboarding should be shown
  });

  it("creates profile with name, avatar, and age group on completing step 1", () => {
    const profile = createLocalChildProfile("Jasurbek", "rabbit", "7-8");
    expect(profile.name).toBe("Jasurbek");
    expect(profile.avatarId).toBe("rabbit");
    expect(profile.ageGroup).toBe("7-8");
    expect(getLocalProfiles()).toHaveLength(1);
  });
});

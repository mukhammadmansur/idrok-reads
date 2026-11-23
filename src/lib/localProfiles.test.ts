import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalChildProfile,
  getActiveLocalProfile,
  getActiveLocalProfileId,
  getLocalProfiles,
  setActiveLocalProfileId,
  updateActiveProfileProgress,
  addActiveReadingSeconds,
  deleteLocalProfile,
  markProfilesSynced,
} from "./localProfiles";

describe("localProfiles - Local-First Multi-Child Support", () => {
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

  it("creates a local child profile and sets it as active by default if first", () => {
    const profile = createLocalChildProfile("Ali", "cat", "7-8");
    expect(profile.name).toBe("Ali");
    expect(profile.avatarId).toBe("cat");
    expect(profile.ageGroup).toBe("7-8");
    expect(profile.activeReadingSeconds).toBe(0);
    expect(profile.progress.version).toBe(1);

    const list = getLocalProfiles();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(profile.id);

    expect(getActiveLocalProfileId()).toBe(profile.id);
    expect(getActiveLocalProfile()?.name).toBe("Ali");
  });

  it("supports multiple children with isolated progress", () => {
    const ali = createLocalChildProfile("Ali", "cat");
    const madina = createLocalChildProfile("Madina", "rabbit");

    expect(getLocalProfiles()).toHaveLength(2);

    // Switch to Ali and update progress
    setActiveLocalProfileId(ali.id);
    updateActiveProfileProgress((p) => ({
      ...p,
      reading: {
        "oy-dosti": { page: 3, startedAt: "2026-11-23T10:00:00Z" },
      },
    }));
    addActiveReadingSeconds(120);

    // Switch to Madina
    setActiveLocalProfileId(madina.id);
    expect(getActiveLocalProfile()?.name).toBe("Madina");
    expect(getActiveLocalProfile()?.progress.reading["oy-dosti"]).toBeUndefined();
    expect(getActiveLocalProfile()?.activeReadingSeconds).toBe(0);

    // Switch back to Ali
    setActiveLocalProfileId(ali.id);
    expect(getActiveLocalProfile()?.progress.reading["oy-dosti"]?.page).toBe(3);
    expect(getActiveLocalProfile()?.activeReadingSeconds).toBe(120);
  });

  it("marks profiles as synced to a parent account", () => {
    createLocalChildProfile("Ali", "sun");
    createLocalChildProfile("Madina", "star");

    markProfilesSynced("parent-user-123");

    const list = getLocalProfiles();
    expect(list.every((p) => p.syncedToParentId === "parent-user-123")).toBe(true);
  });

  it("allows deleting a profile and updates active profile if deleted", () => {
    const ali = createLocalChildProfile("Ali", "sun");
    const madina = createLocalChildProfile("Madina", "star");

    setActiveLocalProfileId(ali.id);
    deleteLocalProfile(ali.id);

    const list = getLocalProfiles();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(madina.id);
    expect(getActiveLocalProfileId()).toBe(madina.id);
  });
});

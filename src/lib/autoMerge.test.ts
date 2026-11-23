import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalChildProfile,
  getLocalProfiles,
  saveLocalProfiles,
  setActiveLocalProfileId,
  updateActiveProfileProgress,
} from "./localProfiles";
import { executeBackgroundAutoMerge } from "./autoMerge";
import type { AccountSession, ChildProfile, ProgressEvent, ServerProgress } from "./api";

describe("executeBackgroundAutoMerge - Background Auto-Merge Engine", () => {
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

  it("handles Case 1: placeholder replacement when server has default 'Kitobxon' profile", async () => {
    // Local profile with custom name "Ali"
    const ali = createLocalChildProfile("Ali", "cat");
    setActiveLocalProfileId(ali.id);
    updateActiveProfileProgress((p) => ({
      ...p,
      reading: {
        "oy-dosti": { page: 2, startedAt: "2026-11-23T10:00:00Z", completedAt: "2026-11-23T10:15:00Z" },
      },
    }));

    const mockUpdateChild = vi.fn().mockResolvedValue({
      user: { id: "p1", email: "parent@test.com" },
      children: [{ id: "srv-1", name: "Ali", avatar: "cat", createdAt: "" }],
      selectedChildId: "srv-1",
      parent: null,
    });
    const mockEvents = vi.fn().mockResolvedValue({ revision: 1, progress: {} });
    const mockCreateChild = vi.fn();
    const mockSelectChild = vi.fn();

    const apiClient = {
      updateChild: mockUpdateChild,
      createChild: mockCreateChild,
      selectChild: mockSelectChild,
      events: mockEvents,
      progress: vi.fn(),
    };

    const serverSession: AccountSession = {
      user: { id: "p1", email: "parent@test.com" },
      children: [{ id: "srv-1", name: "Kitobxon", avatar: "sun", createdAt: "" }],
      selectedChildId: "srv-1",
      parent: null,
    };

    const result = await executeBackgroundAutoMerge(serverSession, apiClient as any);

    expect(mockUpdateChild).toHaveBeenCalledWith("srv-1", { name: "Ali", avatar: "cat" });
    expect(mockEvents).toHaveBeenCalled();
    expect(result.toastMessage).toContain("Ali");
    expect(result.mergedProfilesCount).toBe(1);

    const localList = getLocalProfiles();
    expect(localList[0].syncedToParentId).toBe("p1");
  });

  it("handles Case 2: name match merging progress into existing child", async () => {
    const ali = createLocalChildProfile("Ali", "sun");
    setActiveLocalProfileId(ali.id);
    updateActiveProfileProgress((p) => ({
      ...p,
      reading: {
        "oy-dosti": { page: 3, startedAt: "2026-11-23T10:00:00Z" },
      },
      quizzes: {
        "oy-dosti": { score: 3, total: 3, attempts: 1, attemptedAt: "2026-11-23T10:05:00Z" },
      },
    }));

    const mockEvents = vi.fn().mockResolvedValue({ revision: 1, progress: {} });
    const mockCreateChild = vi.fn();

    const apiClient = {
      updateChild: vi.fn(),
      createChild: mockCreateChild,
      selectChild: vi.fn(),
      events: mockEvents,
      progress: vi.fn(),
    };

    const serverSession: AccountSession = {
      user: { id: "p1", email: "parent@test.com" },
      children: [{ id: "srv-ali", name: "ali", avatar: "sun", createdAt: "" }],
      selectedChildId: "srv-ali",
      parent: null,
    };

    const result = await executeBackgroundAutoMerge(serverSession, apiClient as any);

    expect(mockCreateChild).not.toHaveBeenCalled();
    expect(mockEvents).toHaveBeenCalledWith("srv-ali", expect.any(Array));
    expect(result.mergedProfilesCount).toBe(1);
  });

  it("handles Case 3: creates new child row on server when sibling does not exist", async () => {
    createLocalChildProfile("Madina", "rabbit", "5-6");

    const mockCreateChild = vi.fn().mockResolvedValue({
      user: { id: "p1", email: "parent@test.com" },
      children: [
        { id: "srv-ali", name: "Ali", avatar: "sun", createdAt: "" },
        { id: "srv-madina", name: "Madina", avatar: "rabbit", createdAt: "" },
      ],
      selectedChildId: "srv-madina",
      parent: null,
    });
    const mockEvents = vi.fn().mockResolvedValue({ revision: 1, progress: {} });

    const apiClient = {
      updateChild: vi.fn(),
      createChild: mockCreateChild,
      selectChild: vi.fn(),
      events: mockEvents,
      progress: vi.fn(),
    };

    const serverSession: AccountSession = {
      user: { id: "p1", email: "parent@test.com" },
      children: [{ id: "srv-ali", name: "Ali", avatar: "sun", createdAt: "" }],
      selectedChildId: "srv-ali",
      parent: null,
    };

    const result = await executeBackgroundAutoMerge(serverSession, apiClient as any);

    expect(mockCreateChild).toHaveBeenCalledWith("Madina", "rabbit");
    expect(result.mergedProfilesCount).toBe(1);
    expect(result.toastMessage).toContain("Madina");
  });

  it("is idempotent: skips already synced profiles", async () => {
    const profile = createLocalChildProfile("Ali", "sun");
    saveLocalProfiles([{ ...profile, syncedToParentId: "p1" }]);

    const mockCreateChild = vi.fn();
    const mockEvents = vi.fn();

    const apiClient = {
      updateChild: vi.fn(),
      createChild: mockCreateChild,
      selectChild: vi.fn(),
      events: mockEvents,
      progress: vi.fn(),
    };

    const serverSession: AccountSession = {
      user: { id: "p1", email: "parent@test.com" },
      children: [{ id: "srv-ali", name: "Ali", avatar: "sun", createdAt: "" }],
      selectedChildId: "srv-ali",
      parent: null,
    };

    const result = await executeBackgroundAutoMerge(serverSession, apiClient as any);
    expect(result.mergedProfilesCount).toBe(0);
    expect(mockCreateChild).not.toHaveBeenCalled();
    expect(mockEvents).not.toHaveBeenCalled();
  });
});

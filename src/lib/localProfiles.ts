import type { ProfileProgress } from "../content/types";
import { emptyProgress, STORAGE_KEY } from "./progress";

export type StorybookAvatarId =
  | "lion"
  | "owl"
  | "bear"
  | "wolf"
  | "falcon"
  | "fox"
  | "whale"
  | "cat"
  | "rabbit"
  | "rocket"
  | "star"
  | "sun"
  | "moon"
  | "cloud"
  | "leaf"
  | "snow";

export interface LocalChildProfile {
  id: string;
  name: string;
  avatarId: StorybookAvatarId;
  ageGroup?: "5-6" | "7-8" | "9-11";
  createdAt: string;
  progress: ProfileProgress;
  activeReadingSeconds: number;
  syncedToParentId?: string;
}

export const LOCAL_PROFILES_KEY = "iqro.local_profiles.v1";
export const ACTIVE_LOCAL_PROFILE_KEY = "iqro.active_local_profile_id.v1";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `child_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getLocalProfiles(): LocalChildProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalProfiles(profiles: LocalChildProfile[]): void {
  try {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // Gracefully handle storage errors
  }
}

export function getActiveLocalProfileId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_LOCAL_PROFILE_KEY);
  } catch {
    return null;
  }
}

export function setActiveLocalProfileId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_LOCAL_PROFILE_KEY, id);
  } catch {
    // Gracefully handle storage errors
  }
}

export function getActiveLocalProfile(): LocalChildProfile | null {
  const profiles = getLocalProfiles();
  if (profiles.length === 0) return null;
  const activeId = getActiveLocalProfileId();
  const found = profiles.find((p) => p.id === activeId);
  return found || profiles[0];
}

export function createLocalChildProfile(
  name: string,
  avatarId: StorybookAvatarId = "sun",
  ageGroup?: "5-6" | "7-8" | "9-11",
): LocalChildProfile {
  const profiles = getLocalProfiles();
  const trimmed = name.trim() || "Kitobxon";
  const newProfile: LocalChildProfile = {
    id: generateId(),
    name: trimmed,
    avatarId,
    ageGroup,
    createdAt: new Date().toISOString(),
    progress: emptyProgress(),
    activeReadingSeconds: 0,
  };

  const nextProfiles = [...profiles, newProfile];
  saveLocalProfiles(nextProfiles);

  if (profiles.length === 0 || !getActiveLocalProfileId()) {
    setActiveLocalProfileId(newProfile.id);
  }

  return newProfile;
}

export function updateActiveProfileProgress(
  change: (p: ProfileProgress) => ProfileProgress,
): ProfileProgress {
  const profiles = getLocalProfiles();
  const activeId = getActiveLocalProfileId();
  const index = profiles.findIndex((p) => p.id === activeId);

  if (index === -1) {
    // If no active profile, fallback to legacy STORAGE_KEY
    try {
      const legacyRaw = localStorage.getItem(STORAGE_KEY);
      const current = legacyRaw ? JSON.parse(legacyRaw) : emptyProgress();
      const updated = change(current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return emptyProgress();
    }
  }

  const currentProfile = profiles[index];
  const nextProgress = change(currentProfile.progress || emptyProgress());
  profiles[index] = {
    ...currentProfile,
    progress: nextProgress,
    syncedToParentId: undefined,
  };
  saveLocalProfiles(profiles);

  // Sync to legacy STORAGE_KEY so components reading it remain consistent
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
  } catch {
    // ignore
  }

  return nextProgress;
}

export function addActiveReadingSeconds(seconds: number): void {
  if (seconds <= 0) return;
  const profiles = getLocalProfiles();
  const activeId = getActiveLocalProfileId();
  const index = profiles.findIndex((p) => p.id === activeId);
  if (index === -1) return;

  profiles[index] = {
    ...profiles[index],
    activeReadingSeconds: (profiles[index].activeReadingSeconds || 0) + seconds,
  };
  saveLocalProfiles(profiles);
}

export function deleteLocalProfile(id: string): void {
  const profiles = getLocalProfiles();
  const next = profiles.filter((p) => p.id !== id);
  saveLocalProfiles(next);

  if (getActiveLocalProfileId() === id) {
    if (next.length > 0) {
      setActiveLocalProfileId(next[0].id);
    } else {
      localStorage.removeItem(ACTIVE_LOCAL_PROFILE_KEY);
    }
  }
}

export function markProfilesSynced(parentId: string): void {
  const profiles = getLocalProfiles();
  const updated = profiles.map((p) => ({
    ...p,
    syncedToParentId: parentId,
  }));
  saveLocalProfiles(updated);
}

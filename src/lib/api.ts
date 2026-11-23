import type { ProfileProgress } from "../content/types";
import type { StorybookAvatarId } from "./localProfiles";
export interface ParentAccount {
  id: string;
  email: string;
}
export interface ChildProfile {
  id: string;
  name: string;
  avatar: StorybookAvatarId;
  createdAt: string;
}
export interface ParentAccess {
  unlocked: boolean;
  pinSet: boolean;
  canUsePassword: boolean;
  googleLinked: boolean;
}
export interface FamilyChild {
  profile: ChildProfile;
  progress: ProfileProgress;
  metrics: {
    started: number;
    completed: number;
    quizAttempts: number;
    accuracy: number | null;
    todaySeconds: number;
    weekSeconds: number;
    totalSeconds: number;
    lastActiveAt: string | null;
  };
  week: {
    date: string;
    seconds: number;
    readingEvents: number;
    quizAttempts: number;
  }[];
  recent: {
    type: "reading" | "completed" | "quiz";
    storyId: string;
    page: number | null;
    score: number | null;
    total: number | null;
    at: string;
  }[];
}
export interface FamilyOverview {
  generatedAt: string;
  children: FamilyChild[];
}
export interface AccountSession {
  user: ParentAccount | null;
  children: ChildProfile[];
  selectedChildId: string | null;
  parent: ParentAccess | null;
}
export interface ServerProgress {
  revision: number;
  progress: ProfileProgress;
}
export interface StoryVideoOverride {
  url: string;
  title: string;
  updatedAt: string;
}
export type StoryVideoMap = Record<string, StoryVideoOverride>;
export type ProgressEvent =
  | { id: string; type: "theme"; theme: ProfileProgress["theme"] }
  | {
      id: string;
      type: "reading";
      storyId: string;
      page: number;
      complete: boolean;
    }
  | { id: string; type: "quiz"; quizId: string; answers: number[] };
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "request_failed",
  ) {
    super(message);
  }
}
async function request<T>(
  path: string,
  body?: unknown,
  keepalive = false,
  method?: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      credentials: "same-origin",
      signal: AbortSignal.timeout(15000),
      keepalive,
      headers:
        body === undefined
          ? {}
          : { "Content-Type": "application/json", "X-WBooks-Client": "web" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(
      0,
      "Serverga ulanib bo‘lmadi. Internetni tekshiring.",
      "network_error",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "Server hozir javob bermayapti.",
      "server_unavailable",
    );
  }
  if (!response.ok)
    throw new ApiError(
      response.status,
      result.error ?? "So‘rov bajarilmadi.",
      result.code,
    );
  return result as T;
}
export const api = {
  authOptions: () =>
    request<{ googleClientId: string; nonce: string | null }>("/auth/options"),
  google: (credential: string) =>
    request<AccountSession>("/auth/google", { credential }),
  linkGoogle: (credential: string) =>
    request<{ linked: boolean }>("/auth/google", { credential, link: true }),
  parentStatus: () => request<ParentAccess>("/parent/status"),
  parentUnlock: (method: "pin" | "password", secret: string) =>
    request<ParentAccess>("/parent/unlock", { method, secret }),
  parentLock: () => request<ParentAccess>("/parent/lock", {}),
  setParentPin: (pin: string) => request<ParentAccess>("/parent/pin", { pin }),
  family: () => request<FamilyOverview>("/parent/overview"),
  videos: () => request<{ videos: StoryVideoMap }>("/videos"),
  parentVideos: () => request<{ videos: StoryVideoMap }>("/parent/videos"),
  saveStoryVideo: (storyId: string, url: string, title: string) =>
    request<{ video: StoryVideoOverride & { storyId: string } }>(
      "/parent/videos",
      { storyId, url, title },
    ),
  removeStoryVideo: (storyId: string) =>
    request<{ ok: boolean }>("/parent/videos/remove", { storyId }),
  activity: (
    id: string,
    body: {
      streamId: string;
      storyId: string;
      phase: "start" | "pulse" | "stop";
    },
    keepalive = false,
  ) =>
    request<{ ok: boolean; creditedSeconds: number }>(
      `/children/${id}/activity`,
      body,
      keepalive,
    ),
  session: () => request<AccountSession>("/session"),
  register: (email: string, password: string) =>
    request<AccountSession>("/auth/register", { email, password }),
  login: (email: string, password: string) =>
    request<AccountSession>("/auth/login", { email, password }),
  logout: () => request<{ ok: boolean }>("/auth/logout", {}),
  createChild: (name: string, avatar: ChildProfile["avatar"]) =>
    request<AccountSession>("/children", { name, avatar }),
  updateChild: (
    id: string,
    updates: { name?: string; avatar?: ChildProfile["avatar"] },
  ) => request<AccountSession>(`/children/${id}`, updates, false, "PATCH"),
  deleteChild: (id: string) =>
    request<AccountSession>(`/children/${id}`, {}, false, "DELETE"),
  selectChild: (id: string) =>
    request<AccountSession>(`/children/${id}/select`, {}),
  progress: (id: string) => request<ServerProgress>(`/children/${id}/progress`),
  events: (id: string, events: ProgressEvent[]) =>
    request<ServerProgress>(`/children/${id}/events`, { events }),
};

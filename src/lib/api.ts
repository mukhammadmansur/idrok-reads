import type { ProfileProgress } from "../data/types";
export interface ParentAccount {
  id: string;
  email: string;
}
export interface ChildProfile {
  id: string;
  name: string;
  avatar: "sun" | "leaf" | "snow" | "rocket";
  createdAt: string;
}
export interface AccountSession {
  user: ParentAccount | null;
  children: ChildProfile[];
  selectedChildId: string | null;
}
export interface ServerProgress {
  revision: number;
  progress: ProfileProgress;
}
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
async function request<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      method: body === undefined ? "GET" : "POST",
      credentials: "same-origin",
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
  session: () => request<AccountSession>("/session"),
  register: (email: string, password: string) =>
    request<AccountSession>("/auth/register", { email, password }),
  login: (email: string, password: string) =>
    request<AccountSession>("/auth/login", { email, password }),
  logout: () => request<{ ok: boolean }>("/auth/logout", {}),
  createChild: (name: string, avatar: ChildProfile["avatar"]) =>
    request<AccountSession>("/children", { name, avatar }),
  selectChild: (id: string) =>
    request<AccountSession>(`/children/${id}/select`, {}),
  progress: (id: string) => request<ServerProgress>(`/children/${id}/progress`),
  events: (id: string, events: ProgressEvent[]) =>
    request<ServerProgress>(`/children/${id}/events`, { events }),
};

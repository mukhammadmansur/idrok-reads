import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  emptyProgress,
  readProgress,
  STORAGE_KEY,
  recordQuiz,
} from "./progress";
import type { ProfileProgress } from "../data/types";
import {
  api,
  ApiError,
  type AccountSession,
  type ChildProfile,
  type ProgressEvent,
  type ServerProgress,
} from "./api";
import {
  applyPending,
  eventId,
  outboxKey,
  progressEvents,
  quizScore,
  readOutbox,
  saveOutbox,
} from "./outbox";
export type SyncState =
  "local" | "loading" | "saving" | "saved" | "offline" | "error";
interface State extends AccountSession {
  progress: ProfileProgress;
  remote: ProfileProgress;
  revision: number;
  accountLoading: boolean;
  profileError: string;
  sync: SyncState;
  syncError: string;
  storageError: boolean;
}
interface ProgressContext extends State {
  update: (change: (p: ProfileProgress) => ProfileProgress) => void;
  answerQuiz: (id: string, answers: number[]) => void;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createChild: (name: string, avatar: ChildProfile["avatar"]) => Promise<void>;
  selectChild: (id: string) => Promise<void>;
  retrySync: () => void;
  importGuest: () => void;
  guestReadingCount: number;
}
const Context = createContext<ProgressContext | null>(null);
const anonymous: AccountSession = {
  user: null,
  children: [],
  selectedChildId: null,
  parent: null,
};
function guestData() {
  try {
    return readProgress(localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyProgress();
  }
}
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [guestSnapshot, setGuestSnapshot] = useState(guestData);
  const guest = useRef<ProfileProgress>(guestSnapshot);
  const initial: State = {
    ...anonymous,
    progress: guestSnapshot,
    remote: emptyProgress(),
    revision: 0,
    accountLoading: true,
    profileError: "",
    sync: "local",
    syncError: "",
    storageError: false,
  };
  const live = useRef(initial);
  const [state, setState] = useState(initial);
  const generation = useRef(0);
  const flushing = useRef(false);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const volatile = useRef(new Map<string, ProgressEvent[]>());
  const publish = useCallback((next: State) => {
    live.current = next;
    setState(next);
  }, []);
  const pending = useCallback(
    (key: string) => [
      ...new Map(
        [...(volatile.current.get(key) ?? []), ...readOutbox(key)].map(
          (event) => [event.id, event],
        ),
      ).values(),
    ],
    [],
  );
  const persist = useCallback((key: string, events: ProgressEvent[]) => {
    volatile.current.set(key, events);
    try {
      saveOutbox(key, events);
      return false;
    } catch {
      return true;
    }
  }, []);
  const actorKey = (value: State) =>
    value.user && value.selectedChildId
      ? outboxKey(value.user.id, value.selectedChildId)
      : null;
  const expire = useCallback(() => {
    generation.current++;
    publish({
      ...live.current,
      ...anonymous,
      progress: guest.current,
      remote: emptyProgress(),
      revision: 0,
      accountLoading: false,
      profileError: "",
      sync: "local",
      syncError: "Sessiya tugadi. Akkauntga qayta kiring.",
    });
  }, [publish]);
  const refresh = useCallback(async () => {
    const value = live.current,
      key = actorKey(value),
      stamp = generation.current;
    if (!key || !value.selectedChildId || value.accountLoading) return;
    try {
      const result = await api.progress(value.selectedChildId);
      if (stamp !== generation.current) return;
      const current = live.current;
      if (result.revision < current.revision) return;
      const queue = pending(key);
      publish({
        ...current,
        remote: result.progress,
        revision: result.revision,
        progress: applyPending(result.progress, queue),
        profileError: "",
        sync: queue.length ? "saving" : "saved",
        syncError: "",
      });
    } catch (error) {
      if (stamp !== generation.current) return;
      if (error instanceof ApiError && error.status === 401) expire();
      else
        publish({
          ...live.current,
          sync: "offline",
          syncError: "Serverga ulanilmadi. Qayta urinib ko‘ring.",
        });
    }
  }, [pending, publish, expire]);
  const flush = useCallback(async () => {
    if (flushing.current) return;
    const value = live.current,
      key = actorKey(value),
      stamp = generation.current;
    if (
      !key ||
      !value.selectedChildId ||
      value.accountLoading ||
      value.profileError
    )
      return;
    const batch = pending(key).slice(0, 50);
    if (!batch.length) return;
    flushing.current = true;
    let success = false;
    try {
      const result = await api.events(value.selectedChildId, batch);
      success = true;
      const ids = new Set(batch.map((event) => event.id));
      const remaining = pending(key).filter((event) => !ids.has(event.id));
      const storageError = persist(key, remaining);
      if (stamp === generation.current) {
        const current = live.current;
        const newer = result.revision >= current.revision;
        const remote = newer ? result.progress : current.remote;
        publish({
          ...current,
          remote,
          revision: Math.max(result.revision, current.revision),
          progress: applyPending(remote, remaining),
          sync: remaining.length ? "saving" : "saved",
          syncError: "",
          storageError,
        });
      }
    } catch (error) {
      if (stamp === generation.current) {
        if (error instanceof ApiError && error.status === 401) expire();
        else
          publish({
            ...live.current,
            sync:
              error instanceof ApiError && error.status > 0
                ? "error"
                : "offline",
            syncError:
              error instanceof Error ? error.message : "Natijalar saqlanmadi.",
          });
      }
    } finally {
      flushing.current = false;
      if (success || stamp !== generation.current)
        queueMicrotask(() => void flushRef.current());
    }
  }, [pending, persist, publish, expire]);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);
  const hydrate = useCallback(
    async (view: AccountSession) => {
      const stamp = ++generation.current;
      if (!view.user) {
        publish({
          ...live.current,
          ...anonymous,
          progress: guest.current,
          remote: emptyProgress(),
          revision: 0,
          accountLoading: false,
          profileError: "",
          sync: "local",
          syncError: "",
        });
        return;
      }
      publish({
        ...live.current,
        ...view,
        progress: emptyProgress(),
        remote: emptyProgress(),
        revision: 0,
        accountLoading: !!view.selectedChildId,
        profileError: "",
        sync: "loading",
        syncError: "",
      });
      if (!view.selectedChildId) {
        publish({ ...live.current, accountLoading: false });
        return;
      }
      try {
        const result: ServerProgress = await api.progress(view.selectedChildId);
        if (stamp !== generation.current) return;
        const key = outboxKey(view.user.id, view.selectedChildId),
          queue = pending(key);
        publish({
          ...live.current,
          remote: result.progress,
          revision: result.revision,
          progress: applyPending(result.progress, queue),
          accountLoading: false,
          sync: queue.length ? "saving" : "saved",
        });
        queueMicrotask(() => void flushRef.current());
      } catch (error) {
        if (stamp !== generation.current) return;
        if (error instanceof ApiError && error.status === 401) expire();
        else
          publish({
            ...live.current,
            accountLoading: false,
            profileError:
              "Profil yuklanmadi. Internetni tekshirib, qayta urinib ko‘ring.",
            sync: "error",
          });
      }
    },
    [pending, publish, expire],
  );
  useEffect(() => {
    let active = true;
    void api
      .session()
      .then((view) => {
        if (active) void hydrate(view);
      })
      .catch(() => {
        if (active) void hydrate(anonymous);
      });
    return () => {
      active = false;
    };
  }, [hydrate]);
  useEffect(() => {
    document.documentElement.dataset.theme = state.progress.theme;
    document.documentElement.style.colorScheme =
      state.progress.theme === "holo" ? "dark" : "light";
  }, [state.progress.theme]);
  useEffect(() => {
    const reconnect = () => {
      if (live.current.profileError) void hydrate(live.current);
      else {
        void flushRef.current();
        void refresh();
      }
    };
    const visible = () => {
      if (document.visibilityState === "visible") reconnect();
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("focus", reconnect);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("online", reconnect);
      window.removeEventListener("focus", reconnect);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [hydrate, refresh]);
  const commit = useCallback(
    (progress: ProfileProgress, events: ProgressEvent[]) => {
      const current = live.current;
      if (current.accountLoading || current.profileError) return;
      const key = actorKey(current);
      if (!current.user) {
        guest.current = progress;
        setGuestSnapshot(progress);
        let storageError = false;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch {
          storageError = true;
        }
        publish({ ...current, progress, storageError });
      } else if (key) {
        const queue = [...pending(key), ...events],
          storageError = events.length
            ? persist(key, queue)
            : current.storageError;
        publish({
          ...current,
          progress,
          storageError,
          sync: queue.length ? "saving" : current.sync,
        });
        if (events.length) queueMicrotask(() => void flushRef.current());
      }
    },
    [pending, persist, publish],
  );
  const update = useCallback(
    (change: (p: ProfileProgress) => ProfileProgress) => {
      const previous = live.current.progress;
      const next = change(previous);
      commit(next, progressEvents(previous, next));
    },
    [commit],
  );
  const answerQuiz = useCallback(
    (id: string, answers: number[]) => {
      const { score, total } = quizScore(id, answers);
      commit(recordQuiz(live.current.progress, id, score, total), [
        { id: eventId(), type: "quiz", quizId: id, answers: [...answers] },
      ]);
    },
    [commit],
  );
  const login = useCallback(
    async (email: string, password: string) =>
      hydrate(await api.login(email, password)),
    [hydrate],
  );
  const googleLogin = useCallback(
    async (credential: string) => hydrate(await api.google(credential)),
    [hydrate],
  );
  const register = useCallback(
    async (email: string, password: string) =>
      hydrate(await api.register(email, password)),
    [hydrate],
  );
  const logout = useCallback(async () => {
    await api.logout();
    await hydrate(anonymous);
    navigate("/account");
  }, [hydrate]);
  const createChild = useCallback(
    async (name: string, avatar: ChildProfile["avatar"]) =>
      hydrate(await api.createChild(name, avatar)),
    [hydrate],
  );
  const selectChild = useCallback(
    async (id: string) => hydrate(await api.selectChild(id)),
    [hydrate],
  );
  const retrySync = useCallback(() => {
    if (live.current.profileError) void hydrate(live.current);
    else {
      void flushRef.current();
      void refresh();
    }
  }, [hydrate, refresh]);
  const importGuest = useCallback(() => {
    if (!live.current.user || !live.current.selectedChildId) return;
    const events: ProgressEvent[] = [];
    for (const [storyId, record] of Object.entries(guest.current.reading)) {
      if (!["oy-dosti", "bulut-kemasi", "dengiz-siri"].includes(storyId))
        continue;
      const page = Math.min(7, record.page);
      if (record.completedAt)
        events.push({
          id: eventId(),
          type: "reading",
          storyId,
          page: 7,
          complete: true,
        });
      if (!record.completedAt || page !== 7)
        events.push({
          id: eventId(),
          type: "reading",
          storyId,
          page,
          complete: false,
        });
    }
    if (events.length)
      commit(applyPending(live.current.progress, events), events);
  }, [commit]);
  return (
    <Context.Provider
      value={{
        ...state,
        update,
        answerQuiz,
        login,
        register,
        googleLogin,
        logout,
        createChild,
        selectChild,
        retrySync,
        importGuest,
        guestReadingCount: Object.keys(guestSnapshot.reading).length,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useProgress() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing progress provider");
  return context;
}
export function navigate(path: string) {
  window.location.hash = path;
}
export function useRoute() {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || "/");
  useEffect(() => {
    const change = () => {
      setPath(window.location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  return path;
}

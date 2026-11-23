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
import type { ProfileProgress } from "../content/types";
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
import {
  createLocalChildProfile,
  deleteLocalProfile,
  getActiveLocalProfile,
  getActiveLocalProfileId,
  getLocalProfiles,
  saveLocalProfiles,
  setActiveLocalProfileId,
  updateActiveProfileProgress,
  type LocalChildProfile,
  type StorybookAvatarId,
} from "./localProfiles";
import { executeBackgroundAutoMerge } from "./autoMerge";

export type SyncState =
  | "local"
  | "loading"
  | "saving"
  | "saved"
  | "offline"
  | "error";

interface State extends AccountSession {
  progress: ProfileProgress;
  remote: ProfileProgress;
  revision: number;
  accountLoading: boolean;
  profileError: string;
  sessionError: string;
  sync: SyncState;
  syncError: string;
  storageError: boolean;
  toastMessage: string | null;
}

interface ProgressContext extends State {
  update: (change: (p: ProfileProgress) => ProfileProgress) => void;
  answerQuiz: (id: string, answers: number[]) => void;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createChild: (name: string, avatar: ChildProfile["avatar"]) => Promise<void>;
  updateChild: (
    id: string,
    updates: { name?: string; avatar?: StorybookAvatarId },
  ) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  selectChild: (id: string) => Promise<void>;
  retrySync: () => void;
  clearToast: () => void;
  setToast: (msg: string | null) => void;
}

const Context = createContext<ProgressContext | null>(null);

const anonymous: AccountSession = {
  user: null,
  children: [],
  selectedChildId: null,
  parent: null,
};

function initialGuestProgress(): ProfileProgress {
  const localActive = getActiveLocalProfile();
  if (localActive) return localActive.progress;
  try {
    return readProgress(localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyProgress();
  }
}

function localToChildProfiles(locals: LocalChildProfile[]): ChildProfile[] {
  return locals.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatarId,
    createdAt: p.createdAt,
  }));
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const initialLocalProfiles = getLocalProfiles();
  const initialActive = getActiveLocalProfile();

  const initial: State = {
    ...anonymous,
    children: localToChildProfiles(initialLocalProfiles),
    selectedChildId: initialActive?.id ?? null,
    progress: initialGuestProgress(),
    remote: emptyProgress(),
    revision: 0,
    accountLoading: true,
    profileError: "",
    sessionError: "",
    sync: "local",
    syncError: "",
    storageError: false,
    toastMessage: null,
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
    const locals = getLocalProfiles();
    const active = getActiveLocalProfile();
    publish({
      ...live.current,
      ...anonymous,
      children: localToChildProfiles(locals),
      selectedChildId: active?.id ?? null,
      progress: active?.progress ?? emptyProgress(),
      remote: emptyProgress(),
      revision: 0,
      accountLoading: false,
      profileError: "",
      sessionError: "",
      sync: "local",
      syncError: "Sessiya tugadi. Akkauntga qayta kiring.",
      toastMessage: null,
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
        sessionError: "",
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
        const locals = getLocalProfiles();
        const active = getActiveLocalProfile();
        publish({
          ...live.current,
          ...anonymous,
          children: localToChildProfiles(locals),
          selectedChildId: active?.id ?? null,
          progress: active?.progress ?? emptyProgress(),
          remote: emptyProgress(),
          revision: 0,
          accountLoading: false,
          profileError: "",
          sessionError: "",
          sync: "local",
          syncError: "",
        });
        return;
      }

      // Execute background auto-merge if there are unsynced local profiles
      try {
        const mergeResult = await executeBackgroundAutoMerge(view, api);
        if (mergeResult.mergedProfilesCount > 0) {
          view = await api.session();
          if (mergeResult.toastMessage) {
            setToastMessage(mergeResult.toastMessage);
          }
        }
      } catch {
        // Continue even if auto-merge hits a temporary error
      }

      publish({
        ...live.current,
        ...view,
        progress: emptyProgress(),
        remote: emptyProgress(),
        revision: 0,
        accountLoading: !!view.selectedChildId,
        profileError: "",
        sessionError: "",
        sync: "loading",
        syncError: "",
      });

      if (!view.user || !view.selectedChildId) {
        publish({ ...live.current, accountLoading: false });
        return;
      }
      const user = view.user;
      const childId = view.selectedChildId;

      try {
        const result: ServerProgress = await api.progress(childId);
        if (stamp !== generation.current) return;
        const key = outboxKey(user.id, childId),
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

  const sessionPending = useRef(false);
  const loadSession = useCallback(async () => {
    if (sessionPending.current) return;
    sessionPending.current = true;
    const stamp = generation.current;
    publish({ ...live.current, accountLoading: true, sessionError: "" });
    try {
      const view = await api.session();
      if (stamp === generation.current) await hydrate(view);
    } catch {
      if (stamp === generation.current)
        publish({
          ...live.current,
          accountLoading: false,
          sessionError:
            "Akkaunt holatini tekshirib bo‘lmadi. Internet yoki server ulanishini tekshirib, qayta urinib ko‘ring.",
        });
    } finally {
      sessionPending.current = false;
    }
  }, [hydrate, publish]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.progress.theme;
    document.documentElement.style.colorScheme =
      state.progress.theme === "holo" ? "dark" : "light";
  }, [state.progress.theme]);

  useEffect(() => {
    const reconnect = () => {
      if (live.current.sessionError) void loadSession();
      else if (live.current.profileError) void hydrate(live.current);
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
  }, [hydrate, loadSession, refresh]);

  const commit = useCallback(
    (progress: ProfileProgress, events: ProgressEvent[]) => {
      const current = live.current;
      if (current.accountLoading || current.profileError) return;
      const key = actorKey(current);

      if (!current.user) {
        updateActiveProfileProgress(() => progress);
        publish({ ...current, progress, storageError: false });
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
    try {
      await api.logout();
    } catch {
      // ignore
    }
    const locals = getLocalProfiles();
    const active = getActiveLocalProfile();
    publish({
      ...live.current,
      ...anonymous,
      children: localToChildProfiles(locals),
      selectedChildId: active?.id ?? null,
      progress: active?.progress ?? emptyProgress(),
      accountLoading: false,
      sync: "local",
      syncError: "",
      toastMessage: null,
    });
  }, [publish]);

  const createChild = useCallback(
    async (name: string, avatar: ChildProfile["avatar"]) => {
      if (!live.current.user) {
        const created = createLocalChildProfile(name, avatar);
        const locals = getLocalProfiles();
        publish({
          ...live.current,
          children: localToChildProfiles(locals),
          selectedChildId: created.id,
          progress: created.progress,
        });
      } else {
        await hydrate(await api.createChild(name, avatar));
      }
    },
    [hydrate, publish],
  );

  const updateChild = useCallback(
    async (
      id: string,
      updates: { name?: string; avatar?: StorybookAvatarId },
    ) => {
      if (!live.current.user) {
        const list = getLocalProfiles();
        const idx = list.findIndex((p) => p.id === id);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            ...(updates.name ? { name: updates.name.trim() } : {}),
            ...(updates.avatar ? { avatarId: updates.avatar } : {}),
          };
          saveLocalProfiles(list);
          const active = getActiveLocalProfile();
          publish({
            ...live.current,
            children: localToChildProfiles(list),
            progress: active?.progress ?? live.current.progress,
          });
        }
      } else {
        await hydrate(await api.updateChild(id, updates as any));
      }
    },
    [hydrate, publish],
  );

  const deleteChild = useCallback(
    async (id: string) => {
      if (!live.current.user) {
        deleteLocalProfile(id);
        const locals = getLocalProfiles();
        const active = getActiveLocalProfile();
        publish({
          ...live.current,
          children: localToChildProfiles(locals),
          selectedChildId: active?.id ?? null,
          progress: active?.progress ?? emptyProgress(),
        });
      } else {
        await hydrate(await api.deleteChild(id));
      }
    },
    [hydrate, publish],
  );

  const selectChild = useCallback(
    async (id: string) => {
      if (!live.current.user) {
        setActiveLocalProfileId(id);
        const active = getActiveLocalProfile();
        if (active) {
          publish({
            ...live.current,
            selectedChildId: active.id,
            progress: active.progress,
          });
        }
      } else {
        await hydrate(await api.selectChild(id));
      }
    },
    [hydrate, publish],
  );

  const retrySync = useCallback(() => {
    if (live.current.sessionError) void loadSession();
    else if (live.current.profileError) void hydrate(live.current);
    else {
      void flushRef.current();
      void refresh();
    }
  }, [hydrate, loadSession, refresh]);

  return (
    <Context.Provider
      value={{
        ...state,
        toastMessage,
        clearToast: () => setToastMessage(null),
        setToast: (msg: string | null) => setToastMessage(msg),
        update,
        answerQuiz,
        login,
        register,
        googleLogin,
        logout,
        createChild,
        updateChild,
        deleteChild,
        selectChild,
        retrySync,
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

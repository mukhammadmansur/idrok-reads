import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { emptyProgress, readProgress, STORAGE_KEY } from "./progress";
import type { ProfileProgress } from "../data/types";
type ProgressContext = {
  progress: ProfileProgress;
  update: (change: (p: ProfileProgress) => ProfileProgress) => void;
  storageError: boolean;
};
const Context = createContext<ProgressContext | null>(null);
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(() => {
    try {
      return readProgress(localStorage.getItem(STORAGE_KEY));
    } catch {
      return emptyProgress();
    }
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = progress.theme;
    document.documentElement.style.colorScheme =
      progress.theme === "holo" ? "dark" : "light";
  }, [progress.theme]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [progress]);
  return (
    <Context.Provider value={{ progress, update: setProgress, storageError }}>
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

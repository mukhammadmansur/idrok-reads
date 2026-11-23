import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { api, type ParentAccess } from "../../lib/api";
import { useProgress } from "../../lib/context";
import {
  ParentalGateModal,
  isParentSessionUnlocked,
  setParentSessionUnlocked,
} from "./ParentalGateModal";

const Access = createContext<{
  status: ParentAccess | null;
  refresh: () => Promise<void>;
} | null>(null);

export const useParentAccess = () => useContext(Access);

export function ParentGate() {
  const navigate = useNavigate();
  const { user } = useProgress();
  const [status, setStatus] = useState<ParentAccess | null>(null);
  const [localUnlocked, setLocalUnlocked] = useState(isParentSessionUnlocked);

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus(null);
      return;
    }
    try {
      const s = await api.parentStatus();
      setStatus(s);
      if (s.unlocked) {
        setParentSessionUnlocked(true);
        setLocalUnlocked(true);
      }
    } catch {
      setStatus(null);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh, user]);

  const isUnlocked = Boolean(status?.unlocked || localUnlocked);

  if (isUnlocked) {
    return (
      <Access.Provider value={{ status, refresh }}>
        <Outlet />
      </Access.Provider>
    );
  }

  return (
    <ParentalGateModal
      isOpen={true}
      parentStatus={status}
      onClose={() => navigate("/")}
      onSuccess={() => {
        setParentSessionUnlocked(true);
        setLocalUnlocked(true);
        void refresh();
      }}
    />
  );
}

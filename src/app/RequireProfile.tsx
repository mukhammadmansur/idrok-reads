import { useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useProgress } from "../lib/context";
import { LoadingScreen } from "./LoadingScreen";
import { OnboardingModal } from "../features/onboarding/OnboardingModal";

export function RequireProfile({ children }: { children: ReactNode }) {
  const { user, selectedChildId, children: profileList, accountLoading } = useProgress();
  const [, setForceUpdate] = useState(0);

  if (accountLoading) return <LoadingScreen />;

  // First-time guest visitor without any local child profile
  if (!user && profileList.length === 0) {
    return <OnboardingModal onComplete={() => setForceUpdate((v) => v + 1)} />;
  }

  if (user && !selectedChildId) return <Navigate to="/parent" replace />;

  return <>{children}</>;
}

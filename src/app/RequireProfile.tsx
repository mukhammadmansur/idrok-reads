import { useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useProgress } from "../lib/context";
import { LoadingScreen } from "./LoadingScreen";
import { OnboardingModal } from "../features/onboarding/OnboardingModal";

export function RequireProfile({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user, selectedChildId, children: profileList, accountLoading } = useProgress();
  const [, setForceUpdate] = useState(0);

  if (accountLoading) return <LoadingScreen />;

  // Sign-in and sign-up must stay reachable for guests, and a parent who
  // just registered needs this page to create the first child profile.
  if (/^\/account(?:\/(?:login|register))?\/?$/.test(pathname)) {
    return <>{children}</>;
  }

  // First-time guest visitor without any local child profile
  if (!user && profileList.length === 0) {
    return <OnboardingModal onComplete={() => setForceUpdate((v) => v + 1)} />;
  }

  if (user && !selectedChildId) return <Navigate to="/parent" replace />;

  return <>{children}</>;
}

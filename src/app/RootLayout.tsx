import { useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "../design-system/Button";
import { api } from "../lib/api";
import { useProgress } from "../lib/context";
import { isDarkTheme } from "../content/themes";
import { WorldStage } from "../features/theme/WorldStage";
import { LoadingScreen } from "./LoadingScreen";
import styles from "./RootLayout.module.css";

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    progress,
    accountLoading,
    profileError,
    sessionError,
    retrySync,
    logout,
    user,
  } = useProgress();
  const userId = user?.id;
  // Everything outside the parent area and the parent's account page is child
  // mode. Entering it closes parent controls on the server, so a child cannot
  // walk back into the dashboard or switch profiles with the parent's unlock.
  const childMode = !/^\/(?:parent|account)(?:\/|$)/.test(location.pathname);

  useEffect(() => {
    if (!userId || !childMode) return;
    void api.parentLock().catch(() => undefined);
  }, [userId, childMode]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = progress.theme;
    root.style.colorScheme = isDarkTheme(progress.theme) ? "dark" : "light";
  }, [progress.theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const main =
      document.getElementById("main-content") ??
      document.getElementById("parent-main");
    main?.focus({ preventScroll: true });
  }, [location.pathname]);

  if (accountLoading) return <LoadingScreen />;

  if (profileError || sessionError)
    return (
      <main className={styles.error}>
        <span className={styles.icon}>
          <RefreshCw size={28} />
        </span>
        <h1>{sessionError ? "Serverga ulanilmadi" : "Profil yuklanmadi"}</h1>
        <p role="alert">{sessionError || profileError}</p>
        <div className={styles.actions}>
          <Button onClick={retrySync} icon={<RefreshCw size={18} />}>
            Qayta urinish
          </Button>
          {!sessionError && (
            <Button
              variant="secondary"
              onClick={() =>
                void logout()
                  .then(() => navigate("/account", { replace: true }))
                  .catch(() => retrySync())
              }
            >
              Akkauntdan chiqish
            </Button>
          )}
        </div>
      </main>
    );

  return (
    <>
      <WorldStage />
      <div key={location.pathname} className={styles.routeView}>
        <Outlet />
      </div>
    </>
  );
}

import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../auth/AuthCard";
import { LoadingScreen } from "../../app/LoadingScreen";
import { useProgress } from "../../lib/context";
import styles from "./ParentLogin.module.css";

export function ParentLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, accountLoading } = useProgress();
  const mode = location.pathname.endsWith("/register") ? "register" : "login";

  if (accountLoading) return <LoadingScreen />;
  if (user) return <Navigate to="/parent" replace />;

  return (
    <div className={styles.page}>
      <AuthCard
        mode={mode}
        parent
        onMode={(next) =>
          navigate(next === "register" ? "/parent/register" : "/parent/login")
        }
      />
    </div>
  );
}

import {
  ArrowRight,
  BookOpen,
  Check,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../design-system/Button";
import { useProgress } from "../../lib/context";
import { GoogleButton } from "./GoogleButton";
import styles from "./AuthCard.module.css";

export function AuthCard({
  mode,
  onMode,
  parent = false,
}: {
  mode: "login" | "register";
  onMode: (mode: "login" | "register") => void;
  parent?: boolean;
}) {
  const navigate = useNavigate();
  const { login, register, googleLogin, syncError } = useProgress();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (mode === "register" && password !== confirm) {
      setError("Parollar bir xil bo‘lsin.");
      return;
    }
    setBusy(true);
    try {
      await (mode === "login" ? login : register)(email.trim(), password);
      setPassword("");
      setConfirm("");
      navigate(parent ? "/parent" : "/account");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.aside}>
        <span className={styles.asideIcon}>
          <ShieldCheck size={30} />
        </span>
        <span className={styles.eyebrow}>
          {parent ? "OTA-ONALAR PANELI" : "OTA-ONALAR UCHUN"}
        </span>
        <h1>
          {parent
            ? "Farzandingizning o‘qish yo‘lini birga kuzatamiz."
            : "O‘qish sayohati saqlanib qolsin."}
        </h1>
        <p>
          Akkaunt ota-ona uchun. Farzandingizga e-mail yoki parol kerak emas —
          faqat ismi va belgisi.
        </p>
        <ul className={styles.benefits}>
          <li>
            <Check size={17} />
            Har bir farzandga alohida profil
          </li>
          <li>
            <Check size={17} />
            O‘qish va savol natijalari bir joyda
          </li>
          <li>
            <Check size={17} />
            Boshqa qurilmada davom ettirish
          </li>
        </ul>
      </aside>

      <section className={styles.panel} aria-labelledby="auth-title">
        <div className={styles.tabs} role="group" aria-label="Akkaunt usuli">
          <button
            type="button"
            aria-pressed={mode === "login"}
            className={mode === "login" ? styles.tabActive : ""}
            onClick={() => onMode("login")}
          >
            Kirish
          </button>
          <button
            type="button"
            aria-pressed={mode === "register"}
            className={mode === "register" ? styles.tabActive : ""}
            onClick={() => onMode("register")}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        <div className={styles.heading}>
          <span className={styles.headingIcon}>
            <UserRound size={20} />
          </span>
          <div>
            <h2 id="auth-title">
              {mode === "login" ? "Akkauntga kirish" : "Yangi akkaunt yaratish"}
            </h2>
            <p>
              {mode === "login"
                ? "E-mail va parolingizni kiriting."
                : "Kamida 12 belgili parol o‘ylab toping."}
            </p>
          </div>
        </div>

        <GoogleButton
          onAvailable={setGoogleAvailable}
          onCredential={async (credential) => {
            await googleLogin(credential);
            navigate(parent ? "/parent" : "/account");
          }}
        />

        {googleAvailable && (
          <div className={styles.divider}>
            <span>yoki e-mail orqali</span>
          </div>
        )}

        <form className={styles.form} onSubmit={(event) => void submit(event)}>
          <label htmlFor="auth-email">Ota-onaning e-maili</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="auth-password">Parol</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "register" ? 12 : 1}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {mode === "register" && (
            <>
              <label htmlFor="auth-confirm">Parolni qayta kiriting</label>
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
              <p className={styles.hint}>
                Kamida 12 belgi. Parolni hech kimga bermang.
              </p>
            </>
          )}
          <Button size="lg" type="submit" disabled={busy} full>
            <span>
              {busy
                ? "Kutilmoqda…"
                : mode === "login"
                  ? "Akkauntga kirish"
                  : "Akkaunt yaratish"}
            </span>
            <ArrowRight size={19} />
          </Button>
          {(error || syncError) && (
            <p className={styles.error} role="alert">
              {error || syncError}
            </p>
          )}
        </form>

        <div className={styles.help}>
          <BookOpen size={18} />
          <p>
            Bolaga akkaunt kerak emas. U faqat ismi va belgisi bilan kiradi.
          </p>
        </div>

        <button
          type="button"
          className={styles.guest}
          onClick={() => navigate("/")}
        >
          Hozircha mehmon bo‘lib o‘qish
          <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}

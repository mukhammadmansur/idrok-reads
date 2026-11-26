import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api";
import { useProgress } from "../../lib/context";
import { GoogleButton } from "../auth/GoogleButton";
import { useParentAccess } from "./ParentGate";
import styles from "./ParentSettingsTab.module.css";

export function ParentSettingsTab() {
  const navigate = useNavigate();
  const { user, logout, login, register, googleLogin } = useProgress();
  const parentAccess = useParentAccess();

  // PIN state
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinMsg, setPinMsg] = useState("");
  const [pinError, setPinError] = useState("");

  // Auth form state if guest
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleSetPin = async (e: FormEvent) => {
    e.preventDefault();
    setPinMsg("");
    setPinError("");
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError("PIN-kod aynan 4 ta raqamdan iborat bo‘lsin.");
      return;
    }
    if (pin !== pinConfirm) {
      setPinError("PIN-kodlar mos kelmadi.");
      return;
    }
    setPinBusy(true);
    try {
      if (user) {
        await api.setParentPin(pin);
        await parentAccess?.refresh();
      } else {
        localStorage.setItem("iqro.guest_pin.v1", pin);
      }
      setPinMsg("4 xonali PIN-kod muvaffaqiyatli saqlandi.");
      setPin("");
      setPinConfirm("");
    } catch (cause) {
      setPinError(
        cause instanceof Error ? cause.message : "PIN-kod saqlanmadi.",
      );
    } finally {
      setPinBusy(false);
    }
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    try {
      if (authMode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      setEmail("");
      setPassword("");
    } catch (cause) {
      setAuthError(
        cause instanceof Error ? cause.message : "Akkauntga ulanmadi.",
      );
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>SOZLAMALAR</span>
        <h1>Hisob va xavfsizlik</h1>
      </header>

      {/* 1. PARENT ACCOUNT */}
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <ShieldCheck size={24} style={{ color: "var(--accent)" }} />
          <div>
            <h2>Ota-ona akkaunti</h2>
            <p>
              {user
                ? `Ulangan akkaunt: ${user.email}`
                : "Natijalar boshqa qurilmalarda ham ko‘rinishi uchun hisobingizni ulang."}
            </p>
          </div>
        </div>

        {user ? (
          <div>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={async () => {
                await logout();
                navigate("/");
              }}
            >
              <LogOut size={18} />
              <span>Akkauntdan chiqish</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <GoogleButton onCredential={googleLogin} />

            {authError && <p className={styles.error}>{authError}</p>}

            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  style={{
                    flex: 1,
                    minHeight: 38,
                    borderRadius: 10,
                    border: "1.5px solid var(--line)",
                    background: authMode === "register" ? "var(--accent)" : "transparent",
                    color: authMode === "register" ? "#fff" : "var(--text)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Yangi hisob
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  style={{
                    flex: 1,
                    minHeight: 38,
                    borderRadius: 10,
                    border: "1.5px solid var(--line)",
                    background: authMode === "login" ? "var(--accent)" : "transparent",
                    color: authMode === "login" ? "#fff" : "var(--text)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Mavjud hisob
                </button>
              </div>

              <div className={styles.field}>
                <label htmlFor="settings-email" className={styles.label}>
                  E-mail
                </label>
                <input
                  id="settings-email"
                  type="email"
                  required
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="settings-pass" className={styles.label}>
                  Parol
                </label>
                <input
                  id="settings-pass"
                  type="password"
                  required
                  minLength={12}
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={styles.addBtn}
                disabled={authBusy || !email || password.length < 12}
              >
                <span>
                  {authBusy
                    ? "Ulanyapti…"
                    : authMode === "login"
                      ? "Kirish va ulash"
                      : "Akkaunt yaratish va ulash"}
                </span>
              </button>
            </form>
          </div>
        )}
      </section>

      {/* 2. PARENT PIN PROTECTION */}
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <KeyRound size={24} style={{ color: "var(--accent)" }} />
          <div>
            <h2>Ota-onalar paneli PIN-kodi</h2>
            <p>
              Ota-onalar panelini bolalar kirishidan himoyalash uchun 4 xonali
              PIN-kod yarating yoki o‘zgartiring.
            </p>
          </div>
        </div>

        {pinMsg && <p className={styles.message}>{pinMsg}</p>}
        {pinError && <p className={styles.error}>{pinError}</p>}

        <form onSubmit={handleSetPin} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className={styles.field}>
            <label htmlFor="pin-input" className={styles.label}>
              Yangi 4 xonali PIN-kod
            </label>
            <input
              id="pin-input"
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              className={styles.input}
              placeholder="Masalan, 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="pin-confirm" className={styles.label}>
              PIN-kodni tasdiqlang
            </label>
            <input
              id="pin-confirm"
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              className={styles.input}
              placeholder="Qayta kiriting"
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={styles.addBtn}
            disabled={pinBusy || pin.length !== 4 || pin !== pinConfirm}
          >
            <span>{pinBusy ? "Saqlanmoqda…" : "PIN-kodni saqlash"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { api, type ParentAccess } from "../lib/api";
import { useProgress } from "../lib/context";
import GoogleButton from "./GoogleButton";
const Access = createContext<{
  status: ParentAccess;
  refresh: () => Promise<void>;
} | null>(null);
export const useParentAccess = () => useContext(Access);
export default function ParentGate({ children }: { children: ReactNode }) {
  const { googleLogin, logout } = useProgress();
  const [status, setStatus] = useState<ParentAccess | null>(null),
    [error, setError] = useState(""),
    [secret, setSecret] = useState(""),
    [usePassword, setUsePassword] = useState(false),
    [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setStatus(await api.parentStatus());
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : "Qayta urinib ko‘ring.");
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  const method = status?.pinSet && !usePassword ? "pin" : "password";
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setStatus(await api.parentUnlock(method, secret));
      setSecret("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  };
  if (status?.unlocked)
    return (
      <Access.Provider value={{ status, refresh }}>{children}</Access.Provider>
    );
  return (
    <div className="page parent-gate-page">
      <section className="account-panel auth-card parent-gate">
        <span className="gate-symbol">
          <LockKeyhole size={30} />
        </span>
        <span className="eyebrow">OTA-ONALAR UCHUN</span>
        <h1>Bu bo‘lim faqat ota-onalar uchun</h1>
        {!status && !error ? (
          <p role="status">Himoya tekshirilyapti…</p>
        ) : (
          <>
            <p>
              {method === "pin"
                ? "Davom etish uchun o‘zingiz belgilagan 6 xonali kodni kiriting."
                : status?.canUsePassword
                  ? "Davom etish uchun akkauntingiz parolini kiriting."
                  : "Google akkauntingiz bilan qayta tasdiqlang."}
            </p>
            {status && (status.pinSet || status.canUsePassword) && (
              <form className="auth-form" onSubmit={(e) => void submit(e)}>
                <label htmlFor="parent-secret">
                  {method === "pin"
                    ? "6 xonali ota-ona kodi"
                    : "Akkaunt paroli"}
                </label>
                <input
                  key={method}
                  id="parent-secret"
                  type="password"
                  inputMode={method === "pin" ? "numeric" : undefined}
                  pattern={method === "pin" ? "[0-9]{6}" : undefined}
                  minLength={method === "pin" ? 6 : 1}
                  maxLength={method === "pin" ? 6 : 128}
                  autoComplete={method === "pin" ? "off" : "current-password"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                  autoFocus
                  className={method === "pin" ? "pin-input" : ""}
                />
                <button className="button" disabled={busy}>
                  {busy ? "Tekshirilyapti…" : "Bo‘limni ochish"}
                  <ShieldCheck size={18} />
                </button>
              </form>
            )}
            {status?.pinSet && status.canUsePassword && (
              <button
                className="text-link gate-alternative"
                onClick={() => {
                  setUsePassword(!usePassword);
                  setSecret("");
                  setError("");
                }}
              >
                {usePassword
                  ? "6 xonali kod bilan ochish"
                  : "Kodni unutdingizmi? Parol bilan ochish"}
              </button>
            )}
            {status && !status.canUsePassword && (
              <GoogleButton
                label="Google orqali tasdiqlash"
                onCredential={async (credential) => {
                  await googleLogin(credential);
                  await refresh();
                }}
              />
            )}
            {error && (
              <p className="account-error" role="alert">
                {error}
              </p>
            )}
            {!status && error && (
              <button className="button" onClick={() => void refresh()}>
                Qayta urinish
              </button>
            )}
          </>
        )}
        <a href="#/" className="text-link gate-back">
          <ArrowLeft size={16} /> Kitoblarga qaytish
        </a>
        <button
          className="text-link"
          onClick={() => void logout().catch((e) => setError(e.message))}
        >
          Boshqa akkauntga kirish
        </button>
      </section>
    </div>
  );
}
export function ChildArea({ children }: { children: ReactNode }) {
  const { user } = useProgress();
  useEffect(() => {
    if (user) void api.parentLock().catch(() => {});
  }, [user]);
  return children;
}
export function ParentSecurity() {
  const access = useParentAccess();
  const [pin, setPin] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (pin !== confirm) {
      setError("Ikkala kod bir xil bo‘lsin.");
      return;
    }
    setBusy(true);
    try {
      await api.setParentPin(pin);
      setPin("");
      setConfirm("");
      setSaved(true);
      await access?.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kod saqlanmadi.");
      await access?.refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <details className="account-panel parent-security">
      <summary>
        <ShieldCheck size={20} />
        <span>Ota-onalar himoyasi</span>
        <small>
          {access?.status.pinSet
            ? "6 xonali kod yoqilgan"
            : access?.status.canUsePassword
              ? "Parol bilan himoyalangan · kod qo‘shish"
              : "Google bilan himoyalangan · kod qo‘shish"}
        </small>
      </summary>
      <p>
        Kitoblarga qaytganda bu bo‘lim qulflanadi. Uni akkaunt paroli yoki 6
        xonali kod bilan ochasiz.
      </p>
      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        <label htmlFor="new-parent-pin">
          {access?.status.pinSet
            ? "Yangi 6 xonali kod"
            : "6 xonali kod yarating"}
        </label>
        <input
          id="new-parent-pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{6}"
          minLength={6}
          maxLength={6}
          autoComplete="new-password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
        />
        <label htmlFor="confirm-parent-pin">Kodni qayta kiriting</label>
        <input
          id="confirm-parent-pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{6}"
          minLength={6}
          maxLength={6}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button className="button" disabled={busy}>
          {busy ? "Saqlanyapti…" : "Kodni saqlash"}
        </button>
        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}
        {saved && <p role="status">Ota-ona kodi saqlandi.</p>}
      </form>
      <div className="google-link">
        <h3>Google akkauntini ulash</h3>
        <p>Akkauntingizdagi e-mailga mos Google akkauntini ulang.</p>
        {access?.status.googleLinked ? (
          <p role="status">Google akkauntingiz ulangan.</p>
        ) : (
          <GoogleButton
            onCredential={async (c) => {
              await api.linkGoogle(c);
              await access?.refresh();
            }}
          />
        )}
        {saved && <small>O‘zgarish saqlandi.</small>}
      </div>
    </details>
  );
}

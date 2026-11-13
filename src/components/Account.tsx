import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Cloud,
  CloudOff,
  Leaf,
  LogOut,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Snowflake,
  Sun,
  UserRound,
} from "lucide-react";
import { useProgress, navigate } from "../lib/context";
import type { ChildProfile } from "../lib/api";
const avatars = { sun: Sun, leaf: Leaf, snow: Snowflake, rocket: Rocket };
export function ChildAvatar({
  avatar = "sun",
  size = 24,
}: {
  avatar?: ChildProfile["avatar"];
  size?: number;
}) {
  const Icon = avatars[avatar] ?? Sun;
  return <Icon size={size} aria-hidden="true" />;
}
export function SyncStatus() {
  const { sync, syncError, retrySync, selectedChildId } = useProgress();
  if (!selectedChildId) return null;
  return (
    <div className={`account-sync sync-${sync}`} role="status">
      {sync === "saved" ? (
        <Cloud size={18} />
      ) : sync === "offline" || sync === "error" ? (
        <CloudOff size={18} />
      ) : (
        <RefreshCw size={18} />
      )}
      <span>
        {sync === "saved"
          ? "Serverga saqlandi"
          : sync === "saving"
            ? "Natijalar saqlanyapti…"
            : sync === "offline"
              ? "Internet qaytganda saqlanadi"
              : sync === "error"
                ? syncError
                : "Profil yuklanyapti…"}
      </span>
      {(sync === "offline" || sync === "error") && (
        <button className="text-link" onClick={retrySync}>
          Qayta urinish
        </button>
      )}
    </div>
  );
}
export function AccountPanel() {
  const {
    user,
    children,
    selectedChildId,
    selectChild,
    createChild,
    logout,
    importGuest,
    guestReadingCount,
  } = useProgress();
  const [creating, setCreating] = useState(false),
    [name, setName] = useState(""),
    [avatar, setAvatar] = useState<ChildProfile["avatar"]>("sun"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [imported, setImported] = useState(false);
  if (!user) return null;
  const action = async (fn: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  };
  const add = (event: FormEvent) => {
    event.preventDefault();
    void action(async () => {
      await createChild(name.trim(), avatar);
      setName("");
      setCreating(false);
    });
  };
  return (
    <section className="account-panel" aria-label="Ota-ona akkaunti">
      <div className="account-heading">
        <div>
          <span className="eyebrow">OTA-ONA AKKAUNTI</span>
          <p className="account-email">{user.email}</p>
        </div>
        <button
          className="text-link"
          disabled={busy}
          onClick={() => void action(logout)}
        >
          <LogOut size={17} /> Chiqish
        </button>
      </div>
      <h2>
        {children.length
          ? "Kim kitob o‘qiydi?"
          : "Birinchi bola profilini qo‘shing"}
      </h2>
      <p className="account-explanation">
        Har bir bolaning kitoblari va natijalari alohida saqlanadi.
      </p>
      <div className="child-picker">
        {children.map((child) => (
          <button
            key={child.id}
            className={`child-choice ${selectedChildId === child.id ? "selected" : ""}`}
            aria-pressed={selectedChildId === child.id}
            disabled={busy}
            onClick={() =>
              void action(async () => {
                await selectChild(child.id);
                setImported(false);
              })
            }
          >
            <span className="child-symbol">
              <ChildAvatar avatar={child.avatar} />
            </span>
            <strong>{child.name}</strong>
            {selectedChildId === child.id && <Check size={17} />}
          </button>
        ))}
      </div>
      {children.length > 0 && children.length < 6 && !creating && (
        <button
          className="text-link add-profile"
          onClick={() => setCreating(true)}
        >
          <Plus size={18} /> Bola qo‘shish
        </button>
      )}
      {(creating || children.length === 0) && (
        <form className="child-form" onSubmit={add}>
          <label htmlFor="child-name">Bolaning taxallusi</label>
          <input
            id="child-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            required
            autoComplete="off"
            placeholder="Masalan, Kitobxon"
          />
          <p>To‘liq ism va tug‘ilgan sana kerak emas.</p>
          <fieldset className="avatar-options">
            <legend>Belgi tanlang</legend>
            {(Object.keys(avatars) as ChildProfile["avatar"][]).map(
              (value, index) => (
                <button
                  key={value}
                  type="button"
                  aria-label={
                    ["Quyosh", "Barg", "Qor parchasi", "Raketa"][index]
                  }
                  aria-pressed={avatar === value}
                  className={avatar === value ? "selected" : ""}
                  onClick={() => setAvatar(value)}
                >
                  <ChildAvatar avatar={value} />
                </button>
              ),
            )}
          </fieldset>
          <div className="account-actions">
            <button className="button" disabled={busy || !name.trim()}>
              {busy ? "Saqlanyapti…" : "Profilni yaratish"}
              <Plus size={18} />
            </button>
            {children.length > 0 && (
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() => setCreating(false)}
              >
                Bekor qilish
              </button>
            )}
          </div>
        </form>
      )}
      <SyncStatus />
      {selectedChildId && (
        <div className="account-actions">
          <a className="button" href="#/">
            Kitob o‘qish <ArrowRight size={18} />
          </a>
          <a className="text-link" href="#/parent">
            Natijalarni ko‘rish
          </a>
        </div>
      )}
      {selectedChildId && guestReadingCount > 0 && !imported && (
        <div className="guest-transfer">
          <p>
            Shu brauzerda {guestReadingCount} ta kitob bo‘yicha mahalliy natija
            bor.
          </p>
          <button
            className="text-link"
            disabled={busy}
            onClick={() => {
              importGuest();
              setImported(true);
            }}
          >
            Mahalliy o‘qishlarni shu profilga qo‘shish
          </button>
          <small>
            Savol natijalarini saqlash uchun ularni akkauntda qayta ishlang.
          </small>
        </div>
      )}
      {error && (
        <p className="account-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
export default function Account() {
  const { user, login, register, syncError } = useProgress();
  const [mode, setMode] = useState<"login" | "register">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await (mode === "login" ? login : register)(email.trim(), password);
      setPassword("");
      navigate("/account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="page account-page">
      <div className="page-intro">
        <div className="greeting">
          <ShieldCheck size={18} /> OTA-ONALAR UCHUN
        </div>
        <h1>
          {user
            ? "Oilamizning kutubxonasi"
            : "O‘qish sayohati saqlanib qolsin."}
        </h1>
        <p>
          {user
            ? "Profilni tanlang va o‘qishni davom ettiring."
            : "Akkauntga kiring. Farzandingiz boshqa qurilmada ham davom ettira oladi."}
        </p>
      </div>
      {user ? (
        <AccountPanel />
      ) : (
        <section className="account-panel auth-card">
          <div
            className="account-tabs"
            role="group"
            aria-label="Akkauntga kirish usuli"
          >
            <button
              aria-pressed={mode === "login"}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Kirish
            </button>
            <button
              aria-pressed={mode === "register"}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Ro‘yxatdan o‘tish
            </button>
          </div>
          <h2>
            {mode === "login"
              ? "Yana xush kelibsiz"
              : "Ota-ona akkauntini oching"}
          </h2>
          <form className="auth-form" onSubmit={(event) => void submit(event)}>
            <label htmlFor="parent-email">Ota-onaning e-maili</label>
            <input
              id="parent-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="parent-password">Parol</label>
            <input
              id="parent-password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "register" ? 12 : 1}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "register" && (
              <p>Kamida 12 belgi. Parolni boshqa odamga bermang.</p>
            )}
            <button className="button" disabled={busy}>
              {busy
                ? "Kutilmoqda…"
                : mode === "login"
                  ? "Akkauntga kirish"
                  : "Akkaunt yaratish"}
              <ArrowRight size={18} />
            </button>
            {(error || syncError) && (
              <p role="alert" className="account-error">
                {error || syncError}
              </p>
            )}
          </form>
          <div className="account-help">
            <UserRound size={19} />
            <p>Akkaunt ota-ona uchun. Bolaga e-mail yoki parol kerak emas.</p>
          </div>
          <a className="text-link" href="#/">
            Hozircha mehmon bo‘lib o‘qish
          </a>
        </section>
      )}
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  KeyRound,
  LogOut,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { Avatar, STORYBOOK_AVATARS, type AvatarId } from "../../design-system/Avatar";
import { api } from "../../lib/api";
import { useProgress } from "../../lib/context";
import { GoogleButton } from "../auth/GoogleButton";
import { useParentAccess } from "./ParentGate";
import styles from "./ParentSettingsTab.module.css";

export function ParentSettingsTab() {
  const navigate = useNavigate();
  const {
    user,
    children: profiles,
    createChild,
    deleteChild,
    logout,
    login,
    register,
    googleLogin,
  } = useProgress();
  const parentAccess = useParentAccess();

  // PIN state
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinMsg, setPinMsg] = useState("");
  const [pinError, setPinError] = useState("");

  // Child creation state
  const [childName, setChildName] = useState("");
  const [childAvatar, setChildAvatar] = useState<AvatarId>("cat");
  const [childBusy, setChildBusy] = useState(false);
  const [childMsg, setChildMsg] = useState("");
  const [childError, setChildError] = useState("");

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

  const handleAddChild = async (e: FormEvent) => {
    e.preventDefault();
    setChildMsg("");
    setChildError("");
    if (!childName.trim()) return;
    setChildBusy(true);
    try {
      await createChild(childName.trim(), childAvatar);
      setChildMsg(`${childName.trim()} profili qo‘shildi.`);
      setChildName("");
    } catch (cause) {
      setChildError(
        cause instanceof Error ? cause.message : "Profil qo‘shilmadi.",
      );
    } finally {
      setChildBusy(false);
    }
  };

  const handleDeleteChild = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham ${name} profilini o‘chirmoqchimisiz?`)) return;
    try {
      await deleteChild(id);
      setChildMsg(`${name} profili o‘chirildi.`);
    } catch (cause) {
      setChildError(
        cause instanceof Error ? cause.message : "Profil o‘chirilmadi.",
      );
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
        <span className={styles.eyebrow}>SOZLAMALAR VA XAVFSIZLIK</span>
        <h1>Hisob va PIN</h1>
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

      {/* 3. MANAGE CHILDREN */}
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <Users size={24} style={{ color: "var(--accent)" }} />
          <div>
            <h2>Farzandlar profillari</h2>
            <p>Oila hisobida {profiles.length} / 6 profil mavjud.</p>
          </div>
        </div>

        {childMsg && <p className={styles.message}>{childMsg}</p>}
        {childError && <p className={styles.error}>{childError}</p>}

        <div className={styles.childrenList}>
          {profiles.map((p) => (
            <div key={p.id} className={styles.childItem}>
              <div className={styles.childInfo}>
                <Avatar avatar={p.avatar} size={42} />
                <span className={styles.childName}>{p.name}</span>
              </div>
              <div className={styles.childActions}>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteChild(p.id, p.name)}
                  >
                    <Trash2 size={16} />
                    <span>O‘chirish</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {profiles.length < 6 && (
          <form onSubmit={handleAddChild} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", margin: "0.25rem 0" }}>
              Yangi farzand qo‘shish
            </h3>
            <div className={styles.field}>
              <label htmlFor="new-child-name" className={styles.label}>
                Ismi
              </label>
              <input
                id="new-child-name"
                type="text"
                required
                maxLength={20}
                className={styles.input}
                placeholder="Masalan, Madina"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Belgisi</span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {STORYBOOK_AVATARS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    style={{
                      border: childAvatar === a.id ? "2px solid var(--accent)" : "1px solid var(--line)",
                      background: childAvatar === a.id ? "var(--accent-soft)" : "transparent",
                      borderRadius: "50%",
                      padding: 4,
                      cursor: "pointer",
                    }}
                    onClick={() => setChildAvatar(a.id)}
                    aria-label={a.label}
                  >
                    <Avatar avatar={a.id} size={36} />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className={styles.addBtn}
              disabled={childBusy || !childName.trim()}
            >
              <Plus size={18} />
              <span>{childBusy ? "Qo‘shilmoqda…" : "Profil qo‘shish"}</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

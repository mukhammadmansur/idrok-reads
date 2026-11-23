import {
  ArrowRight,
  BookOpen,
  Check,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Avatar, type AvatarId, STORYBOOK_AVATARS } from "../../design-system/Avatar";
import { Button, buttonClass } from "../../design-system/Button";
import { PageIntro } from "../../design-system/PageIntro";
import { api, ApiError, type ParentAccess } from "../../lib/api";
import { useProgress } from "../../lib/context";
import { AuthCard } from "../auth/AuthCard";
import { GoogleButton } from "../auth/GoogleButton";
import { LoadingScreen } from "../../app/LoadingScreen";
import styles from "./AccountPage.module.css";

const avatarChoices = STORYBOOK_AVATARS;

export function AccountPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, accountLoading } = useProgress();
  const mode = location.pathname.endsWith("/register") ? "register" : "login";

  if (accountLoading) return <LoadingScreen />;
  if (!user)
    return (
      <div className={styles.page}>
        <AuthCard
          mode={mode}
          onMode={(next) =>
            navigate(
              next === "register" ? "/account/register" : "/account/login",
            )
          }
        />
      </div>
    );
  return <AccountHome />;
}

function AccountHome() {
  const navigate = useNavigate();
  const {
    user,
    children: profiles,
    selectedChildId,
    selectChild,
    createChild,
    logout,
  } = useProgress();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("sun");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("");

  const run = async (key: string, action: () => Promise<void>) => {
    setError("");
    setLocked(false);
    setMessage("");
    setBusy(key);
    try {
      await action();
    } catch (cause) {
      setLocked(cause instanceof ApiError && cause.code === "parent_locked");
      setError(
        cause instanceof Error ? cause.message : "Qayta urinib ko‘ring.",
      );
    } finally {
      setBusy("");
    }
  };

  const addChild = (event: FormEvent) => {
    event.preventDefault();
    const first = profiles.length === 0;
    void run("create", async () => {
      await createChild(name.trim(), avatar);
      setName("");
      setCreating(false);
      setMessage("Yangi profil qo‘shildi.");
      if (first) navigate("/");
    });
  };

  const choose = (id: string) => {
    if (id === selectedChildId) return;
    void run(id, async () => {
      await selectChild(id);
      setMessage("Profil almashtirildi.");
    });
  };

  return (
    <div className={styles.page}>
      <PageIntro
        eyebrow="OTA-ONA AKKAUNTI"
        title="Oilamizning kutubxonasi"
        description={user?.email}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              void run("logout", async () => {
                await logout();
                navigate("/");
              })
            }
            disabled={!!busy}
            icon={<LogOut size={17} />}
          >
            Chiqish
          </Button>
        }
      />

      {error && (
        <div className={styles.securityFeedback}>
          <p className={styles.error} role="alert">
            {error}
          </p>
          {locked && (
            <Link
              to="/parent"
              className={buttonClass({ variant: "secondary", size: "sm" })}
            >
              Ota-onalar bo‘limini ochish
            </Link>
          )}
        </div>
      )}
      {message && (
        <p className={styles.success} role="status">
          {message}
        </p>
      )}

      <section className={styles.panel} aria-labelledby="children-title">
        <div className={styles.panelHead}>
          <div>
            <span className={styles.eyebrow}>PROFILLAR</span>
            <h2 id="children-title">
              {profiles.length
                ? "Kim kitob o‘qiydi?"
                : "Birinchi profilni qo‘shing"}
            </h2>
            <p>Har bir bolaning kitoblari va natijalari alohida saqlanadi.</p>
          </div>
          <span className={styles.count}>{profiles.length} / 6 profil</span>
        </div>

        <div className={styles.children}>
          {profiles.map((child) => {
            const active = child.id === selectedChildId;
            return (
              <button
                key={child.id}
                type="button"
                className={`${styles.child} ${active ? styles.childActive : ""}`}
                aria-pressed={active}
                disabled={!!busy}
                onClick={() => choose(child.id)}
              >
                <Avatar avatar={child.avatar} size={46} />
                <span>
                  <strong>{child.name}</strong>
                  <small>
                    {active ? "Hozirgi profil" : "Profilni tanlash"}
                  </small>
                </span>
                {active ? (
                  <Check size={18} className={styles.childCheck} />
                ) : busy === child.id ? (
                  <RefreshCw size={17} className={styles.spin} />
                ) : null}
              </button>
            );
          })}

          {profiles.length < 6 && !creating && (
            <button
              type="button"
              className={styles.addChild}
              onClick={() => setCreating(true)}
            >
              <span>
                <Plus size={20} />
              </span>
              <strong>Bola qo‘shish</strong>
            </button>
          )}
        </div>

        {(creating || profiles.length === 0) && (
          <form className={styles.form} onSubmit={addChild}>
            <div className={styles.formHead}>
              <span className={styles.formIcon}>
                <UserRound size={20} />
              </span>
              <div>
                <h3>Yangi bola profili</h3>
                <p>
                  Faqat ism va belgi. Familiya yoki tug‘ilgan sana kerak emas.
                </p>
              </div>
            </div>
            <label htmlFor="child-name">Bolaning ismi</label>
            <input
              id="child-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={30}
              required
              autoComplete="off"
              placeholder="Masalan, Azizbek"
            />
            <fieldset className={styles.avatars}>
              <legend>Belgi tanlang</legend>
              {avatarChoices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className={avatar === choice.id ? styles.avatarActive : ""}
                  aria-pressed={avatar === choice.id}
                  aria-label={choice.label}
                  onClick={() => setAvatar(choice.id)}
                >
                  <Avatar avatar={choice.id} size={30} />
                </button>
              ))}
            </fieldset>
            <div className={styles.formActions}>
              <Button
                type="submit"
                size="lg"
                disabled={!!busy || !name.trim()}
                icon={<Plus size={18} />}
              >
                {busy === "create" ? "Saqlanyapti…" : "Profilni yaratish"}
              </Button>
              {profiles.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setCreating(false)}
                  disabled={!!busy}
                >
                  Bekor qilish
                </Button>
              )}
            </div>
          </form>
        )}

        {selectedChildId && (
          <div className={styles.actions}>
            <Link to="/" className={buttonClass({ size: "lg" })}>
              <BookOpen size={19} />
              <span>Kitob o‘qish</span>
            </Link>
            <Link
              to="/parent"
              className={buttonClass({ variant: "secondary", size: "lg" })}
            >
              Natijalar paneli
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>

      <ParentSecurity />
    </div>
  );
}

function ParentSecurity() {
  const [statusLoad, setStatusLoad] = useState<
    | { state: "loading" }
    | { state: "error"; message: string; locked: boolean }
    | { state: "ready"; access: ParentAccess }
  >({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secret, setSecret] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const status = statusLoad.state === "ready" ? statusLoad.access : null;
  const locked =
    (statusLoad.state === "error" && statusLoad.locked) ||
    (status !== null && !status.unlocked);
  const method = status?.canUsePassword && usePassword ? "password" : "pin";

  const load = () => {
    setStatusLoad({ state: "loading" });
    setError("");
    setSaved(false);
    setSecret("");
    setAttempt((value) => value + 1);
  };

  useEffect(() => {
    let active = true;
    void api.parentStatus().then(
      (access) => {
        if (active) setStatusLoad({ state: "ready", access });
      },
      (cause) => {
        if (active)
          setStatusLoad({
            state: "error",
            message:
              cause instanceof Error
                ? cause.message
                : "Himoya holatini tekshirib bo‘lmadi. Qayta urinib ko‘ring.",
            locked: cause instanceof ApiError && cause.code === "parent_locked",
          });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!status?.unlocked || busy) return;
    setError("");
    setSaved(false);
    if (pin !== confirm) {
      setError("Ikkala kod bir xil bo‘lsin.");
      return;
    }
    setBusy(true);
    try {
      if (status.pinSet) {
        const access = await api.parentUnlock(method, secret);
        setSecret("");
        setStatusLoad({ state: "ready", access });
        if (!access.unlocked) return;
      }
      setStatusLoad({ state: "ready", access: await api.setParentPin(pin) });
      setPin("");
      setConfirm("");
      setSecret("");
      setSaved(true);
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : "Kod saqlanmadi.";
      setSecret("");
      if (cause instanceof ApiError && cause.code === "parent_locked") {
        setPin("");
        setConfirm("");
        setStatusLoad({ state: "error", message, locked: true });
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className={styles.security}>
      <summary>
        <span className={styles.securityIcon}>
          <ShieldCheck size={20} />
        </span>
        <span>
          <strong>Ota-onalar himoyasi</strong>
          <small>
            {statusLoad.state === "loading"
              ? "Holat tekshirilyapti…"
              : locked
                ? "Ota-ona kirishi qulflangan"
                : statusLoad.state === "error"
                  ? "Himoya holati aniqlanmadi"
                  : status?.pinSet
                    ? "6 xonali kod yoqilgan"
                    : status?.canUsePassword
                      ? "Parol bilan himoyalangan"
                      : status?.googleLinked
                        ? "Google bilan himoyalangan"
                        : "Ota-ona kodi sozlanmagan"}
          </small>
        </span>
        <span className={styles.securityHint}>Sozlash</span>
      </summary>
      <div className={styles.securityBody}>
        <p>
          Ota-onalar paneli parol, 6 xonali kod yoki ulangan Google akkaunti
          bilan ochiladi. Kodni farzandingizga aytmang.
        </p>
        {statusLoad.state === "loading" && (
          <div className={styles.securityLoading} role="status">
            <RefreshCw size={18} className={styles.spin} aria-hidden="true" />
            Himoya holati tekshirilyapti…
          </div>
        )}
        {statusLoad.state === "error" && (
          <div className={styles.securityFeedback}>
            <p className={styles.error} role="alert">
              {statusLoad.message}
            </p>
            <Button type="button" variant="secondary" size="sm" onClick={load}>
              Qayta urinish
            </Button>
          </div>
        )}
        {locked && (
          <div className={styles.securityFeedback}>
            <p className={styles.note}>
              Kodni sozlashdan oldin ota-ona kirishini tasdiqlang. Panelni
              ochgach, bu sahifaga qaytib holatni qayta tekshiring.
            </p>
            <Link
              to="/parent"
              className={buttonClass({ variant: "secondary", size: "sm" })}
            >
              Ota-onalar bo‘limini ochish
            </Link>
            {status && (
              <Button type="button" variant="ghost" size="sm" onClick={load}>
                Holatni qayta tekshirish
              </Button>
            )}
          </div>
        )}
        {status?.unlocked && (
          <form
            className={styles.pinForm}
            onSubmit={(event) => void submit(event)}
          >
            {status.pinSet && (
              <>
                <label htmlFor="current-parent-secret">
                  {method === "pin" ? "Hozirgi 6 xonali kod" : "Akkaunt paroli"}
                </label>
                <input
                  key={method}
                  id="current-parent-secret"
                  type="password"
                  inputMode={method === "pin" ? "numeric" : undefined}
                  pattern={method === "pin" ? "[0-9]{6}" : undefined}
                  minLength={method === "pin" ? 6 : 1}
                  maxLength={method === "pin" ? 6 : 128}
                  autoComplete={method === "pin" ? "off" : "current-password"}
                  className={
                    method === "password" ? styles.passwordSecret : undefined
                  }
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                  disabled={busy}
                  required
                />
                {status.canUsePassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setUsePassword((value) => !value);
                      setSecret("");
                      setError("");
                    }}
                  >
                    {usePassword
                      ? "Hozirgi kod bilan tasdiqlash"
                      : "Parol bilan tasdiqlash"}
                  </Button>
                )}
              </>
            )}
            <label htmlFor="new-pin">
              {status.pinSet ? "Yangi 6 xonali kod" : "6 xonali kod yarating"}
            </label>
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              autoComplete="new-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              disabled={busy}
              required
            />
            <label htmlFor="confirm-pin">Kodni qayta kiriting</label>
            <input
              id="confirm-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              disabled={busy}
              required
            />
            <Button
              type="submit"
              disabled={busy}
              icon={<ShieldCheck size={18} />}
            >
              {busy ? "Saqlanyapti…" : "Kodni saqlash"}
            </Button>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            {saved && (
              <p className={styles.success} role="status">
                Ota-ona kodi saqlandi.
              </p>
            )}
          </form>
        )}
        {status && (
          <div className={styles.google}>
            <h3>Google akkaunti</h3>
            <p>
              Akkaunt e-mailiga mos Google akkauntini ulasangiz, panelni Google
              orqali ham ochish mumkin.
            </p>
            {status.googleLinked ? (
              <p className={styles.success} role="status">
                Google akkaunti ulangan.
              </p>
            ) : (
              <GoogleButton
                label="Google akkauntini ulash"
                onCredential={async (credential) => {
                  try {
                    await api.linkGoogle(credential);
                    load();
                  } catch (cause) {
                    if (
                      cause instanceof ApiError &&
                      cause.code === "parent_locked"
                    ) {
                      setStatusLoad({
                        state: "error",
                        message: cause.message,
                        locked: true,
                      });
                    }
                    throw cause;
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
    </details>
  );
}

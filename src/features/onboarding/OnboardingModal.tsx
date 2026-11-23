import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar, STORYBOOK_AVATARS, type AvatarId } from "../../design-system/Avatar";
import { useProgress } from "../../lib/context";
import { createLocalChildProfile } from "../../lib/localProfiles";
import { GoogleButton } from "../auth/GoogleButton";
import styles from "./OnboardingModal.module.css";

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { googleLogin, login, register, createChild, user } = useProgress();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("cat");
  const [ageGroup, setAgeGroup] = useState<"5-6" | "7-8" | "9-11" | undefined>(
    undefined,
  );

  // Step 2 Parent auth form states
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleStep1Submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setStep(2);
  };

  const finishWithoutParent = async () => {
    const trimmed = name.trim() || "Kitobxon";
    await createChild(trimmed, avatar);
    onComplete();
  };

  const handleParentAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    try {
      if (authMode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      // Save local profile first so auto-merge can immediately bind it to the new account
      const trimmed = name.trim() || "Kitobxon";
      createLocalChildProfile(trimmed, avatar, ageGroup);
      onComplete();
    } catch (cause) {
      setAuthError(
        cause instanceof Error ? cause.message : "Qayta urinib ko‘ring.",
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setAuthError("");
    setAuthBusy(true);
    try {
      await googleLogin(credential);
      const trimmed = name.trim() || "Kitobxon";
      createLocalChildProfile(trimmed, avatar, ageGroup);
      onComplete();
    } catch (cause) {
      setAuthError(
        cause instanceof Error ? cause.message : "Google orqali kirilmadi.",
      );
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div className={styles.card}>
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${styles.stepDotActive}`} />
          <div
            className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : ""}`}
          />
        </div>

        {step === 1 ? (
          <>
            <div className={styles.header}>
              <span className={styles.eyebrow}>
                <Sparkles size={14} style={{ display: "inline", marginRight: 4 }} />
                Salom! Tanishib olaylik
              </span>
              <h1 id="onboarding-modal-title">IdrokReads olamiga xush kelibsan!</h1>
              <p className={styles.subtitle}>
                Qahramoningni tanla va sehrli kitoblar sayohatini boshla.
              </p>
            </div>

            <form onSubmit={handleStep1Submit} className={styles.field}>
              <label htmlFor="onboarding-child-name" className={styles.label}>
                Isming nima?
              </label>
              <input
                id="onboarding-child-name"
                className={styles.input}
                type="text"
                autoFocus
                required
                minLength={2}
                maxLength={20}
                placeholder="Masalan, Ali"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className={styles.field} style={{ marginTop: "0.5rem" }}>
                <span className={styles.label}>Belgingni tanla</span>
                <div className={styles.avatarGrid}>
                  {STORYBOOK_AVATARS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.avatarOption} ${avatar === item.id ? styles.avatarActive : ""}`}
                      onClick={() => setAvatar(item.id)}
                    >
                      <Avatar avatar={item.id} size={42} />
                      <span className={styles.avatarLabel}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field} style={{ marginTop: "0.5rem" }}>
                <span className={styles.label}>Yoshing (ixtiyoriy)</span>
                <div className={styles.agePills}>
                  {(["5-6", "7-8", "9-11"] as const).map((group) => (
                    <button
                      key={group}
                      type="button"
                      className={`${styles.agePill} ${ageGroup === group ? styles.agePillActive : ""}`}
                      onClick={() =>
                        setAgeGroup(ageGroup === group ? undefined : group)
                      }
                    >
                      {group} yosh
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  type="submit"
                  className={styles.primaryCta}
                  disabled={name.trim().length < 2}
                >
                  <span>Davom etish</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <span className={styles.eyebrow}>
                <ShieldCheck size={14} style={{ display: "inline", marginRight: 4 }} />
                Ota-ona uchun — ixtiyoriy
              </span>
              <h1 id="onboarding-modal-title">Natijalar yo‘qolmasin</h1>
              <p className={styles.subtitle}>
                Farzandingizning natijalari yo‘qolib ketmasligi va boshqa
                qurilmalarda ham ko‘rinishi uchun hisob ulashingiz mumkin.
              </p>
            </div>

            <div className={styles.parentOptions}>
              <GoogleButton onCredential={handleGoogleCredential} />

              <div className={styles.authTabWrap}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
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
                {authError && (
                  <p
                    role="alert"
                    style={{ color: "var(--accent-warm, #c62828)", fontSize: "0.875rem" }}
                  >
                    {authError}
                  </p>
                )}

                <form onSubmit={handleParentAuthSubmit} className={styles.field}>
                  <label htmlFor="onboarding-email" className={styles.label}>
                    E-mail manzilingiz
                  </label>
                  <input
                    id="onboarding-email"
                    type="email"
                    required
                    className={styles.input}
                    placeholder="ota-ona@misol.uz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <label
                    htmlFor="onboarding-password"
                    className={styles.label}
                    style={{ marginTop: "0.25rem" }}
                  >
                    Parol (kamida 12 belgi)
                  </label>
                  <input
                    id="onboarding-password"
                    type="password"
                    required
                    minLength={12}
                    className={styles.input}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="submit"
                    className={styles.primaryCta}
                    style={{ marginTop: "0.5rem" }}
                    disabled={authBusy || !email || password.length < 12}
                  >
                    <span>
                      {authBusy
                        ? "Ulanyapti…"
                        : authMode === "register"
                          ? "Hisob yaratish va ulash"
                          : "Kirish va ulash"}
                    </span>
                  </button>
                </form>
              </div>

              <button
                type="button"
                className={styles.skipButton}
                onClick={finishWithoutParent}
              >
                Keyinroq (O‘qishni boshlash)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

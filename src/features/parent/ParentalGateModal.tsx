import { useEffect, useRef, useState } from "react";
import { Delete, LockKeyhole, ShieldCheck } from "lucide-react";
import { api, type ParentAccess } from "../../lib/api";
import { useProgress } from "../../lib/context";
import styles from "./ParentalGateModal.module.css";

interface ParentalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parentStatus?: ParentAccess | null;
}

const LOCAL_PARENT_UNLOCKED_KEY = "iqro.parent_session_unlocked.v1";
const GUEST_PIN_KEY = "iqro.guest_pin.v1";

export function isParentSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(LOCAL_PARENT_UNLOCKED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setParentSessionUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      sessionStorage.setItem(LOCAL_PARENT_UNLOCKED_KEY, "true");
    } else {
      sessionStorage.removeItem(LOCAL_PARENT_UNLOCKED_KEY);
    }
  } catch {
    // ignore
  }
}

export function ParentalGateModal({
  isOpen,
  onClose,
  onSuccess,
  parentStatus,
}: ParentalGateModalProps) {
  const { user } = useProgress();
  const guestPin = !user ? (typeof localStorage !== "undefined" ? localStorage.getItem(GUEST_PIN_KEY) : null) : null;
  const pinSet = Boolean(parentStatus?.pinSet || guestPin);
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const shakeTimer = useRef<number | undefined>(undefined);

  // Math challenge state for fallback when no PIN is set
  const [mathProblem, setMathProblem] = useState<{
    a: number;
    b: number;
    answer: number;
  }>({ a: 7, b: 8, answer: 56 });

  useEffect(() => {
    return () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setDigits("");
      setError("");
      setShaking(false);
      return;
    }

    if (!pinSet) {
      const a = Math.floor(Math.random() * 5) + 4; // 4..8
      const b = Math.floor(Math.random() * 6) + 4; // 4..9
      setMathProblem({ a, b, answer: a * b });
    }
    setDigits("");
    setError("");
  }, [isOpen, pinSet]);

  if (!isOpen) return null;

  const triggerError = (msg: string) => {
    setError(msg);
    setShaking(true);
    setDigits("");
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShaking(false), 500);
  };

  const handleVerify = async (code: string) => {
    if (busy) return;
    setBusy(true);

    if (pinSet) {
      if (guestPin) {
        if (code === guestPin) {
          setParentSessionUnlocked(true);
          setBusy(false);
          onSuccess();
        } else {
          setBusy(false);
          triggerError("PIN-kod noto‘g‘ri, qayta urinib ko‘ring.");
        }
      } else {
        try {
          await api.parentUnlock("pin", code);
          setParentSessionUnlocked(true);
          onSuccess();
        } catch {
          triggerError("PIN-kod noto‘g‘ri, qayta urinib ko‘ring.");
        } finally {
          setBusy(false);
        }
      }
    } else {
      // Math challenge verification
      if (parseInt(code, 10) === mathProblem.answer) {
        try {
          if (user) {
            await api.parentUnlock("math" as any, "ok");
          }
          setParentSessionUnlocked(true);
          onSuccess();
        } catch (cause) {
          triggerError(cause instanceof Error ? cause.message : "Xatolik yuz berdi.");
        } finally {
          setBusy(false);
        }
      } else {
        setBusy(false);
        triggerError("Noto‘g‘ri javob, qayta hisoblab ko‘ring.");
        // regenerate problem on error
        const a = Math.floor(Math.random() * 5) + 4;
        const b = Math.floor(Math.random() * 6) + 4;
        setMathProblem({ a, b, answer: a * b });
      }
    }
  };

  const handleKeyClick = (num: string) => {
    if (busy) return;
    setError("");

    if (pinSet) {
      if (digits.length >= 4) return;
      const next = digits + num;
      setDigits(next);
      if (next.length === 4) {
        void handleVerify(next);
      }
    } else {
      // Math challenge
      const expectedLen = mathProblem.answer.toString().length;
      if (digits.length >= expectedLen + 1) return;
      const next = digits + num;
      setDigits(next);
      if (next.length === expectedLen) {
        void handleVerify(next);
      }
    }
  };

  const handleBackspace = () => {
    if (busy) return;
    setDigits((prev) => prev.slice(0, -1));
    setError("");
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleKeyClick(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, digits, busy, pinSet, mathProblem, onClose]);

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-gate-title"
    >
      <div className={`${styles.card} ${shaking ? styles.shake : ""}`}>
        <div className={styles.iconWrap}>
          <ShieldCheck size={32} />
        </div>

        <div>
          <h2 id="parent-gate-title" className={styles.title}>
            Ota-onalar paneli
          </h2>
          <p className={styles.subtitle}>
            {pinSet
              ? "Davom etish uchun 4 xonali PIN-kodni kiriting"
              : "Kattalar uchun oddiy hisob-kitob"}
          </p>
        </div>

        {pinSet ? (
          <div className={styles.dotsRow} role="status" aria-label="PIN kodi">
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`${styles.dot} ${idx < digits.length ? styles.dotFilled : ""}`}
              />
            ))}
          </div>
        ) : (
          <div className={styles.mathQuestion}>
            {mathProblem.a} × {mathProblem.b} = {digits || "?"}
          </div>
        )}

        <p className={styles.error} role="alert">
          {error}
        </p>

        <div className={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              type="button"
              className={styles.keyBtn}
              onClick={() => handleKeyClick(String(n))}
              disabled={busy}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.keyBtn} ${styles.keyAction}`}
            onClick={() => setDigits("")}
            disabled={busy || !digits}
            aria-label="Tozalash"
          >
            C
          </button>
          <button
            type="button"
            className={styles.keyBtn}
            onClick={() => handleKeyClick("0")}
            disabled={busy}
          >
            0
          </button>
          <button
            type="button"
            className={`${styles.keyBtn} ${styles.keyAction}`}
            onClick={handleBackspace}
            disabled={busy || !digits}
            aria-label="Bitta o‘chirish"
          >
            <Delete size={22} />
          </button>
        </div>

        <div className={styles.footerActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Bekor qilish (Kutubxonaga qaytish)
          </button>
        </div>
      </div>
    </div>
  );
}

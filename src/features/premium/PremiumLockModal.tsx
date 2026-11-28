import { Gem, LockKeyhole, Sparkles, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import styles from "./PremiumLockModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  kind: "story" | "theme";
  title?: string;
}

export function PremiumLockModal({ open, onClose, kind, title }: Props) {
  if (!open) return null;
  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-lock-title"
      onClick={onClose}
    >
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Yopish"
        >
          <X size={18} />
        </button>
        <span className={styles.gemWrap}>
          <Gem size={40} />
          <Sparkles size={18} className={styles.spark1} />
          <Sparkles size={13} className={styles.spark2} />
        </span>
        <h2 id="premium-lock-title">Premium olam!</h2>
        <p>
          {kind === "story" ? (
            <>
              <strong>{title ?? "Bu kitob"}</strong> premium to‘plamga kiradi.
              Ota-onang obunani yoqsa, kitob darhol ochiladi!
            </>
          ) : (
            <>
              <strong>{title ?? "Bu olam"}</strong> premium dunyo. Ota-onang
              obunani yoqsa, butun ilova shu olamga aylanadi!
            </>
          )}
        </p>
        <div className={styles.actions}>
          <Link to="/parent/shop" className={styles.cta}>
            <LockKeyhole size={17} />
            Ota-onam bilan ochaman
          </Link>
          <button type="button" className={styles.dismiss} onClick={onClose}>
            Keyinroq
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function PremiumLockScreen({
  title,
  kind,
}: {
  title: string;
  kind: "story" | "theme";
}) {
  return (
    <main className={styles.screen}>
      <span className={styles.gemWrap}>
        <Gem size={52} />
        <Sparkles size={22} className={styles.spark1} />
        <Sparkles size={15} className={styles.spark2} />
      </span>
      <h1>{title} — Premium</h1>
      <p>
        {kind === "story"
          ? "Bu kitob premium to‘plamda. Ota-onang obunani yoqsa, sahifalar darhol ochiladi."
          : "Bu olam premium. Obuna faollashsa, butun ilova shu olamda porlaydi."}
      </p>
      <Link to="/parent/shop" className={styles.cta}>
        <LockKeyhole size={18} />
        Obunani ochish
      </Link>
      <Link to="/library" className={styles.dismiss}>
        Kutubxonaga qaytish
      </Link>
    </main>
  );
}

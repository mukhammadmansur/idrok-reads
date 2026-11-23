import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, X } from "lucide-react";
import styles from "./AhaMomentBanner.module.css";

interface AhaMomentBannerProps {
  childName: string;
}

const AHA_DISMISSED_KEY = "iqro.aha_dismissed.v1";

export function AhaMomentBanner({ childName }: AhaMomentBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(AHA_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(AHA_DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.banner} role="status">
      <div className={styles.content}>
        <ShieldCheck size={24} className={styles.icon} />
        <p className={styles.text}>
          Ajoyib! <strong>{childName}</strong>ning natijalari yo‘qolib
          ketmasligi uchun ota-ona hisobini ulang.
        </p>
      </div>
      <div className={styles.actions}>
        <Link to="/parent" className={styles.connectButton}>
          Ulash
        </Link>
        <button
          type="button"
          className={styles.dismissButton}
          onClick={handleDismiss}
          aria-label="Xabarni yopish"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

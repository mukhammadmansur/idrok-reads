import { useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import { Avatar, STORYBOOK_AVATARS, type AvatarId } from "../../design-system/Avatar";
import { useProgress } from "../../lib/context";
import { ApiError } from "../../lib/api";
import { ParentalGateModal } from "../parent/ParentalGateModal";
import styles from "./ProfileSwitcherModal.module.css";

interface ProfileSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSwitcherModal({
  isOpen,
  onClose,
}: ProfileSwitcherModalProps) {
  const {
    children: profiles,
    selectedChildId,
    selectChild,
    createChild,
    setToast,
  } = useProgress();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("lion");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showGate, setShowGate] = useState(false);

  if (!isOpen) return null;

  const handleSelect = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await selectChild(id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await createChild(name.trim(), avatar);
      const childName = name.trim();
      setName("");
      setCreating(false);
      onClose();
      setToast(`${childName} profili muvaffaqiyatli qo‘shildi ✓`);
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "parent_locked") {
        setShowGate(true);
      } else {
        setError(cause instanceof Error ? cause.message : "Profil qo‘shilmadi.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGateSuccess = async () => {
    setShowGate(false);
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createChild(name.trim(), avatar);
      const childName = name.trim();
      setName("");
      setCreating(false);
      onClose();
      setToast(`${childName} profili muvaffaqiyatli qo‘shildi ✓`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profil qo‘shilmadi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="switcher-modal-title"
    >
      <div className={styles.modal}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Yopish"
        >
          <X size={20} />
        </button>

        <div className={styles.header}>
          <h2 id="switcher-modal-title" className={styles.title}>
            Kim o‘qiydi?
          </h2>
          <p className={styles.subtitle}>
            O‘z qahramoningni tanla va sayohatni davom ettir.
          </p>
        </div>

        {!creating ? (
          <div className={styles.grid}>
            {profiles.map((profile) => {
              const active = profile.id === selectedChildId;
              return (
                <button
                  key={profile.id}
                  type="button"
                  className={`${styles.card} ${active ? styles.cardActive : ""}`}
                  onClick={() => void handleSelect(profile.id)}
                  aria-pressed={active}
                  disabled={busy}
                >
                  <Avatar avatar={profile.avatar} size={56} />
                  <span className={styles.name}>{profile.name}</span>
                  {active && (
                    <span className={styles.activeCheck} aria-label="Tanlangan">
                      <Check size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })}

            {profiles.length < 6 && (
              <button
                type="button"
                className={`${styles.card} ${styles.addCard}`}
                onClick={() => setCreating(true)}
                disabled={busy}
              >
                <span className={styles.addIcon}>
                  <Plus size={24} />
                </span>
                <span className={styles.addText}>Yangi kitobxon</span>
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreate} className={styles.createForm}>
            <div className={styles.formHead}>
              <span className={styles.formTitle}>Yangi kitobxon qo‘shish</span>
            </div>

            <label htmlFor="switcher-child-name" className="sr-only">
              Ism
            </label>
            <input
              id="switcher-child-name"
              className={styles.nameInput}
              type="text"
              required
              minLength={2}
              maxLength={20}
              placeholder="Bolaning ismi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            <div className={styles.avatarSelectRow}>
              {STORYBOOK_AVATARS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.avatarPickBtn} ${avatar === item.id ? styles.avatarPickActive : ""}`}
                  onClick={() => setAvatar(item.id)}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Avatar avatar={item.id} size={42} />
                </button>
              ))}
            </div>

            {error && <div className={styles.errorAlert}>{error}</div>}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setError("");
                  setCreating(false);
                }}
                disabled={busy}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={busy || name.trim().length < 2}
              >
                {busy ? "Saqlanmoqda…" : "Qo‘shish"}
              </button>
            </div>
          </form>
        )}

        <ParentalGateModal
          isOpen={showGate}
          onClose={() => setShowGate(false)}
          onSuccess={() => void handleGateSuccess()}
        />
      </div>
    </div>
  );
}

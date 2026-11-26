import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Avatar, STORYBOOK_AVATARS, type AvatarId } from "../../design-system/Avatar";
import { useProgress } from "../../lib/context";
import styles from "./ParentChildrenTab.module.css";

function formatDate(value: string) {
  try {
    const date = new Date(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}.${date.getFullYear()}`;
  } catch {
    return "";
  }
}

export function ParentChildrenTab() {
  const { children: profiles, createChild, deleteChild } = useProgress();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("lion");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      await createChild(name.trim(), avatar);
      setMessage(`${name.trim()} profili qo‘shildi. Endi kitob o‘qishni boshlashi mumkin ✓`);
      setName("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Profil qo‘shilmadi.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string, childName: string) => {
    if (!confirm(`Haqiqatan ham ${childName} profilini o‘chirmoqchimisiz? Barcha natijalari ham o‘chadi.`))
      return;
    setMessage("");
    setError("");
    try {
      await deleteChild(id);
      setMessage(`${childName} profili o‘chirildi.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Profil o‘chirilmadi.",
      );
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>OILAVIY PROFILLAR</span>
        <h1>Farzandlar</h1>
        <p>
          Har bir bola o‘z nomi va qahramoni bilan o‘qiydi. Bola ismi yoki
          qahramonini “Mening profilim” sahifasida o‘zi ham o‘zgartira oladi.
        </p>
      </header>

      {message && <p className={styles.message}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.card} aria-labelledby="children-title">
        <div className={styles.cardHead}>
          <Users size={22} style={{ color: "var(--accent)" }} />
          <div>
            <h2 id="children-title">Farzandlar ro‘yxati</h2>
            <p>Oila hisobida {profiles.length} / 6 profil mavjud.</p>
          </div>
        </div>

        <div className={styles.list}>
          {profiles.map((profile) => (
            <div key={profile.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <Avatar avatar={profile.avatar} size={46} />
                <div>
                  <strong>{profile.name}</strong>
                  <small>
                    {profile.createdAt
                      ? `${formatDate(profile.createdAt)} da qo‘shilgan`
                      : "Profil"}
                  </small>
                </div>
              </div>
              <div className={styles.itemActions}>
                <span className={styles.selfEditHint}>
                  <Pencil size={13} />
                  Bola o‘zi tahrirlay oladi
                </span>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => void handleDelete(profile.id, profile.name)}
                  >
                    <Trash2 size={15} />
                    O‘chirish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {profiles.length < 6 && (
        <form onSubmit={handleAdd} className={styles.card}>
          <div className={styles.cardHead}>
            <Plus size={22} style={{ color: "var(--accent)" }} />
            <div>
              <h2>Farzandingizni qo‘shing</h2>
              <p>Ismi va sevimli qahramonini tanlang — kitob sayohati boshlansin.</p>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="new-child-name" className={styles.label}>
              Farzandingizning ismi
            </label>
            <input
              id="new-child-name"
              type="text"
              required
              minLength={2}
              maxLength={20}
              className={styles.input}
              placeholder="Masalan, Madina"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Qahramonini tanlang</span>
            <div className={styles.avatarGrid}>
              {STORYBOOK_AVATARS.map((item) => {
                const active = avatar === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.avatarPick} ${active ? styles.avatarPickActive : ""}`}
                    onClick={() => setAvatar(item.id)}
                    aria-pressed={active}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <Avatar avatar={item.id} size={40} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={busy || name.trim().length < 2}
            >
              <Check size={17} />
              {busy ? "Qo‘shilmoqda…" : "Farzandni qo‘shish"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

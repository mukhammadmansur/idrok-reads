import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Plus, Save, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, STORYBOOK_AVATARS, type AvatarId } from "../../design-system/Avatar";
import { PageIntro } from "../../design-system/PageIntro";
import { ThemeGlyph } from "../theme/ThemeGlyph";
import { ProfileSwitcherModal } from "./ProfileSwitcherModal";
import { themes } from "../../content";
import { useProgress } from "../../lib/context";
import styles from "./MyProfilePage.module.css";

export function MyProfilePage() {
  const {
    children: profiles,
    selectedChildId,
    progress,
    updateChild,
    update,
    selectChild,
    setToast,
  } = useProgress();

  const child = profiles.find((profile) => profile.id === selectedChildId);

  const [name, setName] = useState(child?.name ?? "");
  const [avatar, setAvatar] = useState<AvatarId>(child?.avatar ?? "sun");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    setName(child?.name ?? "");
    setAvatar(child?.avatar ?? "sun");
    setSaved(false);
  }, [child?.id, child?.name, child?.avatar]);

  const handleSelect = async (id: string) => {
    if (id === selectedChildId || switching) return;
    setSwitching(id);
    try {
      await selectChild(id);
      setToast("Profil almashtirildi ✓");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Profil almashtirilmadi.",
      );
    } finally {
      setSwitching(null);
    }
  };

  const dirty =
    name.trim() !== (child?.name ?? "") || avatar !== (child?.avatar ?? "sun");

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!child || !name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await updateChild(child.id, { name: name.trim(), avatar });
      setToast("Profiling saqlandi ✓");
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Profil saqlanmadi.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>
        <ArrowLeft size={16} />
        Bosh sahifaga
      </Link>

      <PageIntro
        eyebrow="O‘Z QAHREMONINGNI YASA"
        title="Mening profilim"
        description="Isming, qahramoning va sevimli dunyong — hammasini o‘zing tanla."
      />

      <section className={styles.card} aria-labelledby="switch-title">
        <h2 id="switch-title" className={styles.cardTitle}>
          Kim o‘qiydi?
        </h2>
        <p className={styles.switchHint}>
          Boshqa profilga o‘tish uchun uning ustiga bosing.
        </p>
        <div className={styles.switchList}>
          {profiles.map((profile) => {
            const active = profile.id === selectedChildId;
            return (
              <button
                key={profile.id}
                type="button"
                className={`${styles.switchOption} ${active ? styles.switchActive : ""}`}
                onClick={() => void handleSelect(profile.id)}
                aria-pressed={active}
                disabled={switching !== null}
              >
                <Avatar avatar={profile.avatar} size={44} />
                <span className={styles.switchName}>{profile.name}</span>
                {active && (
                  <span className={styles.switchBadge}>
                    <Check size={12} strokeWidth={3} /> Joriy
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.addChildBtn}
          onClick={() => setSwitcherOpen(true)}
        >
          <Plus size={16} />
          Yangi profil qo‘shish
        </button>
      </section>

      <form onSubmit={handleSave} className={styles.form}>
        <section className={styles.card} aria-labelledby="avatar-title">
          <h2 id="avatar-title" className={styles.cardTitle}>
            Qahramoningni tanla
          </h2>
          <div className={styles.avatarGrid}>
            {STORYBOOK_AVATARS.map((item) => {
              const active = avatar === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.avatarOption} ${active ? styles.avatarActive : ""}`}
                  onClick={() => setAvatar(item.id)}
                  aria-pressed={active}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Avatar avatar={item.id} size={56} />
                  <span className={styles.avatarLabel}>{item.label}</span>
                  {active && (
                    <span className={styles.checkBadge} aria-hidden="true">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.card} aria-labelledby="name-title">
          <h2 id="name-title" className={styles.cardTitle}>
            Ismingni yoz
          </h2>
          <label htmlFor="profile-name" className="sr-only">
            Isming
          </label>
          <input
            id="profile-name"
            className={styles.input}
            type="text"
            required
            minLength={2}
            maxLength={20}
            placeholder="Masalan, Madina"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </section>

        <section className={styles.card} aria-labelledby="world-title">
          <h2 id="world-title" className={styles.cardTitle}>
            Sevimli dunyong
          </h2>
          <div className={styles.worldRow}>
            {themes.map((theme) => {
              const active = progress.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`${styles.worldOption} ${active ? styles.worldActive : ""}`}
                  onClick={() => update((value) => ({ ...value, theme: theme.id }))}
                  aria-pressed={active}
                >
                  <ThemeGlyph theme={theme.id} size={30} />
                  <span>{theme.short}</span>
                </button>
              );
            })}
          </div>
          <p className={styles.worldHint}>
            <Sparkles size={14} />
            Dunyo tanlaganing zahoti butun ilova bo‘ylab o‘zgaradi.
          </p>
        </section>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={busy || name.trim().length < 2 || !dirty}
          >
            <Save size={18} />
            {busy ? "Saqlanmoqda…" : saved ? "Saqlandi ✓" : "Saqlash"}
          </button>
        </div>
      </form>

      <ProfileSwitcherModal
        isOpen={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
      />
    </div>
  );
}

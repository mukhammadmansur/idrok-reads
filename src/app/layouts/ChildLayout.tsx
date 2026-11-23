import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  BookOpen,
  Medal,
  MessageCircleQuestion,
  Palette,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Avatar } from "../../design-system/Avatar";
import { ThemeSheet } from "../../features/theme/ThemeSheet";
import { ThemeGlyph } from "../../features/theme/ThemeGlyph";
import { ProfileSwitcherModal } from "../../features/profile/ProfileSwitcherModal";
import { themeById } from "../../content";
import { useProgress } from "../../lib/context";
import styles from "./ChildLayout.module.css";

// EXACT 3 PRIMARY NAV ITEMS for Child World
const navItems = [
  { to: "/", label: "Kutubxona", icon: BookOpen, end: true },
  { to: "/quiz", label: "Savol-javob", icon: MessageCircleQuestion },
  { to: "/rewards", label: "Yutuqlarim", icon: Medal },
];

function navClass({ isActive }: { isActive: boolean }) {
  return `${styles.navLink} ${isActive ? styles.active : ""}`;
}

export function ChildLayout() {
  const location = useLocation();
  const {
    children: profiles,
    selectedChildId,
    progress,
    toastMessage,
    clearToast,
  } = useProgress();

  const [themeOpen, setThemeOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const currentSection = location.pathname.startsWith("/story/")
    ? "/"
    : location.pathname;

  const child = profiles.find((profile) => profile.id === selectedChildId);
  const theme = themeById(progress.theme);

  useEffect(() => {
    setThemeOpen(false);
    setSwitcherOpen(false);
  }, [location.pathname]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const navigation = (size: number) =>
    navItems.map(({ to, label, icon: Icon, end }) => {
      const active = end
        ? currentSection === to
        : currentSection === to || currentSection.startsWith(`${to}/`);
      return (
        <Link
          key={to}
          to={to}
          className={navClass({ isActive: active })}
          aria-current={
            active
              ? location.pathname === to
                ? "page"
                : "location"
              : undefined
          }
        >
          <Icon size={size} strokeWidth={1.8} />
          <span>{label}</span>
        </Link>
      );
    });

  return (
    <div className={styles.shell}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Asosiy qismga o‘tish
      </a>

      {/* DESKTOP SIDEBAR - CHILD WORLD */}
      <aside className={styles.sidebar} aria-label="Kutubxona boshqaruvi">
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <BookOpen size={24} strokeWidth={1.8} />
          </span>
          <span>
            Idrok<span className={styles.brandReads}>Reads</span>
          </span>
        </Link>
        <p className={styles.brandNote}>Kichik kitobxonlar olami</p>

        {/* ONLY 3 ITEMS */}
        <nav className={styles.sideNav} aria-label="Asosiy menyu">
          {navigation(21)}
        </nav>

        <div className={styles.sideSpacer} />

        <p className={styles.sideLabel}>Muhit va oila</p>

        <button
          type="button"
          className={styles.sideAction}
          onClick={() => setThemeOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={themeOpen}
        >
          <Palette size={20} />
          <span>
            Muhit: <strong>{theme.short}</strong>
          </span>
        </button>

        <Link to="/parent" className={styles.sideAction}>
          <ShieldCheck size={20} />
          <span>Ota-onalar paneli</span>
        </Link>

        {/* ACTIVE CHILD PILL AT VERY BOTTOM */}
        <button
          type="button"
          className={styles.sideProfile}
          onClick={() => setSwitcherOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={switcherOpen}
        >
          <Avatar avatar={child?.avatar ?? "sun"} size={42} />
          <span className={styles.sideProfileCopy}>
            <strong>{child?.name ?? "Kitobxon"}</strong>
            <small>Profilni almashtirish</small>
          </span>
        </button>
      </aside>

      <div className={styles.mainWrap}>
        {/* MOBILE & TABLET HEADER */}
        <header className={styles.header}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark}>
              <BookOpen size={22} strokeWidth={1.8} />
            </span>
            <span>
              Idrok<span className={styles.brandReads}>Reads</span>
            </span>
          </Link>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.themeButton}
              onClick={() => setThemeOpen(true)}
              aria-label={`O‘qish muhiti: ${theme.short}. O‘zgartirish`}
            >
              <ThemeGlyph theme={progress.theme} size={19} />
              <span>{theme.short}</span>
            </button>

            {/* TOP-RIGHT PARENT LOCK FOR MOBILE */}
            <Link
              to="/parent"
              className={styles.parentLockBtn}
              aria-label="Ota-onalar paneli"
            >
              <ShieldCheck size={20} />
            </Link>

            <button
              type="button"
              className={styles.profileButton}
              onClick={() => setSwitcherOpen(true)}
              aria-label={`${child?.name ?? "Kitobxon"} — profilni almashtirish`}
              aria-haspopup="dialog"
            >
              <Avatar avatar={child?.avatar ?? "sun"} size={42} />
            </button>
          </div>
        </header>

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className={styles.toast} role="status">
            <span>{toastMessage}</span>
            <button
              type="button"
              className={styles.toastClose}
              onClick={clearToast}
              aria-label="Xabarni yopish"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>

        {/* MOBILE BOTTOM NAV - 4 ITEMS */}
        <nav className={styles.bottomNav} aria-label="Asosiy menyu">
          {navigation(24)}
          <button
            type="button"
            className={styles.navLink}
            onClick={() => setSwitcherOpen(true)}
            aria-label="Profilni almashtirish"
          >
            <UserRound size={24} strokeWidth={1.8} />
            <span>Profil</span>
          </button>
        </nav>
      </div>

      <ThemeSheet open={themeOpen} onClose={() => setThemeOpen(false)} />
      <ProfileSwitcherModal
        isOpen={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
      />
    </div>
  );
}

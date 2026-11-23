import { ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useProgress } from "../../lib/context";
import { api } from "../../lib/api";
import { setParentSessionUnlocked } from "./ParentalGateModal";
import styles from "./ParentLayout.module.css";

export function ParentLayout() {
  const { user } = useProgress();

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    const previousScheme = root.style.colorScheme;
    root.dataset.theme = "classic";
    root.style.colorScheme = "light";
    return () => {
      if (previousTheme) root.dataset.theme = previousTheme;
      else delete root.dataset.theme;
      root.style.colorScheme = previousScheme;
    };
  }, []);

  return (
    <div className={styles.layout}>
      <a
        className="skip-link"
        href="#parent-main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("parent-main")?.focus();
        }}
      >
        Asosiy qismga o‘tish
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/parent" className={styles.brand}>
            <span className={styles.mark}>
              <BookOpen size={22} strokeWidth={1.8} />
            </span>
            <span className={styles.brandText}>
              Idrok<span className={styles.brandReads}>Reads</span>
            </span>
            <span className={styles.badge}>
              <ShieldCheck size={13} />
              Ota-onalar
            </span>
          </Link>
          <nav className={styles.nav} aria-label="Ota-onalar menyusi">
            <NavLink to="/parent" end>
              Natijalar
            </NavLink>
            <NavLink to="/parent/videos">Videolar</NavLink>
            <NavLink to="/account">Akkaunt</NavLink>
            <Link
              to="/"
              className={styles.libraryLink}
              onClick={() => {
                setParentSessionUnlocked(false);
                void api.parentLock().catch(() => {});
              }}
            >
              <ArrowLeft size={16} />
              Kutubxonaga qaytish
            </Link>
          </nav>
        </div>
        {user && <p className={styles.email}>{user.email}</p>}
      </header>
      <main id="parent-main" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        Bu bo‘lim faqat ota-onalar uchun. Bolalar kutubxonasi alohida ochiladi.
      </footer>
    </div>
  );
}

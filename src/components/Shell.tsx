import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Compass,
  HelpCircle,
  Medal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { themes } from "../data/stories";
import { ThemeGlyph } from "./ThemeVisual";
import { useProgress } from "../lib/context";
const links = [
  { href: "/", label: "Kutubxona", icon: Compass },
  { href: "/quiz", label: "Savol-javob", icon: HelpCircle },
  { href: "/rewards", label: "Yutuqlarim", icon: Medal },
];
export default function Shell({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { storageError, progress } = useProgress();
  const current = path.startsWith("/quiz")
    ? "/quiz"
    : path === "/rewards"
      ? "/rewards"
      : path === "/parent"
        ? "/parent"
        : "/";
  return (
    <div className="app-shell" data-theme={progress.theme}>
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
      <aside className="sidebar">
        <a href="#/" className="brand" aria-label="Iqro bosh sahifa">
          <span className="brand-mark">
            <BookOpen size={25} strokeWidth={1.7} />
            <i />
          </span>
          <span>
            iqro<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="sidebar-label">KICHIK KITOBXONLAR OLAMI</div>
        <nav aria-label="Asosiy menyu">
          {links.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={`#${href}`}
              className={current === href ? "nav-link active" : "nav-link"}
              aria-current={current === href ? "page" : undefined}
            >
              <Icon size={21} />
              <span>{label}</span>
              {current === href && <span className="nav-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-spark">
            <Sparkles size={23} />
          </span>
          <p>
            Har bir kitob —<br />
            yangi bir olam.
          </p>
          <span>Bugun qayerga sayohat qilamiz?</span>
          <div className="note-line" />
        </div>
        <a
          href="#/parent"
          className={`parent-link ${current === "/parent" ? "selected" : ""}`}
        >
          <ShieldCheck size={20} />
          <span>Ota-onalar uchun</span>
          <ArrowUpRight size={16} />
        </a>
        <div className="sidebar-profile">
          <span className="avatar">K</span>
          <div>
            <strong>Kichik kitobxon</strong>
            <span>Bugun ham birga o‘qiymiz</span>
          </div>
          <span className="online-dot" />
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            Mening olamim <span>/</span>{" "}
            <strong>
              {current === "/quiz"
                ? "Savol-javob"
                : current === "/rewards"
                  ? "Yutuqlarim"
                  : current === "/parent"
                    ? "Ota-onalar uchun"
                    : "Kutubxona"}
            </strong>
          </span>
          <span className="topbar-note">
            <ThemeGlyph theme={progress.theme} size={19} />{" "}
            {themes.find((t) => t.id === progress.theme)?.label} olami
          </span>
          <span className="mobile-avatar">K</span>
        </header>
        {storageError && (
          <div className="storage-warning" role="alert">
            Brauzer xotirasiga saqlab bo‘lmadi. Sahifani yopsangiz, yangi
            natijalar yo‘qolishi mumkin.
          </div>
        )}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="footer">
          <a href="#/" className="footer-logo">
            iqro.
          </a>
          <span>O‘qi. Tasavvur qil. Kashf et.</span>
          <span>Mehr bilan, kichik kitobxonlar uchun.</span>
        </footer>
      </div>
    </div>
  );
}

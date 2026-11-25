import { useLocation } from "react-router-dom";
import { useProgress } from "../../lib/context";
import styles from "./WorldStage.module.css";

export function WorldStage() {
  const { progress } = useProgress();
  const { pathname } = useLocation();
  if (pathname.startsWith("/parent") || progress.theme === "classic") return null;

  return (
    <div className={styles.stage} data-world={progress.theme} aria-hidden="true">
      {progress.theme === "magic" && <MagicWorld />}
      {progress.theme === "cyber" && <CyberWorld />}
      {progress.theme === "pirate" && <PirateWorld />}
    </div>
  );
}

function MagicWorld() {
  return (
    <>
      <div className={styles.magicSky} />
      <div className={styles.moon} />
      <span className={`${styles.star} ${styles.starA}`} />
      <span className={`${styles.star} ${styles.starB}`} />
      <span className={`${styles.star} ${styles.starC}`} />
      <span className={`${styles.star} ${styles.starD}`} />
      <span className={`${styles.star} ${styles.starE}`} />
      <span className={styles.spark} />
      <span className={`${styles.spark} ${styles.sparkB}`} />
      <svg className={styles.owl} data-critter="owl" viewBox="0 0 120 90">
        <g className={styles.owlBody}>
          <ellipse cx="60" cy="52" rx="28" ry="24" fill="#f4e2b8" />
          <ellipse cx="60" cy="58" rx="16" ry="14" fill="#fff8ea" />
          <path d="M34 40c-16-18-8-34 8-28 4 8 2 16 0 22z" fill="#6b4428" />
          <path d="M86 40c16-18 8-34-8-28-4 8-2 16 0 22z" fill="#6b4428" />
          <circle cx="48" cy="48" r="10" fill="#fff" />
          <circle cx="72" cy="48" r="10" fill="#fff" />
          <circle cx="50" cy="49" r="4.5" fill="#1c1230" />
          <circle cx="74" cy="49" r="4.5" fill="#1c1230" />
          <path d="M56 58l4 6 4-6z" fill="#e08a3c" />
        </g>
        <g className={styles.wingLeft}>
          <ellipse cx="28" cy="54" rx="18" ry="10" fill="#c9843a" />
        </g>
        <g className={styles.wingRight}>
          <ellipse cx="92" cy="54" rx="18" ry="10" fill="#c9843a" />
        </g>
      </svg>
      <div className={styles.castle} />
    </>
  );
}

function CyberWorld() {
  return (
    <>
      <div className={styles.cyberGrid} />
      <span className={styles.streak} />
      <span className={`${styles.streak} ${styles.streakB}`} />
      <span className={styles.holoRing} />
      <div className={styles.skyline}>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </>
  );
}

function PirateWorld() {
  return (
    <>
      <div className={styles.sun} />
      <span className={styles.cloud} />
      <span className={`${styles.cloud} ${styles.cloudB}`} />
      <span className={styles.gull} />
      <span className={`${styles.gull} ${styles.gullB}`} />
      <svg className={styles.ship} viewBox="0 0 180 140">
        <path d="M88 18v78" stroke="#5c3a1e" strokeWidth="4" />
        <path d="M92 28l48 28H92z" fill="#fffaf0" />
        <path d="M84 36L36 70h48z" fill="#ffe7c2" />
        <path d="M28 96h124l-16 22H46z" fill="#8a4b24" />
        <path d="M46 108h88l-8 10H54z" fill="#c9843a" />
        <circle cx="70" cy="104" r="4" fill="#ffd56a" />
        <circle cx="92" cy="108" r="4" fill="#ffd56a" />
        <circle cx="112" cy="104" r="4" fill="#ffd56a" />
      </svg>
      <div className={styles.waves}>
        <span />
        <span />
      </div>
      <div className={styles.island} />
    </>
  );
}

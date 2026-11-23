import styles from "./ProgressBar.module.css";

export function ProgressBar({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
}) {
  const safeMax = Math.max(1, max);
  const safeValue = Math.min(Math.max(0, value), safeMax);
  const percent = (safeValue / safeMax) * 100;
  return (
    <div
      className={[styles.track, className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
    >
      <span className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}

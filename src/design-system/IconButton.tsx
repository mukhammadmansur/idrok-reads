import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./IconButton.module.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  size?: number;
  variant?: "ghost" | "solid";
}

export function IconButton({
  label,
  icon,
  size = 48,
  variant = "ghost",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[styles.button, styles[variant], className]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
      {...rest}
    >
      {icon}
    </button>
  );
}

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
}

export function buttonClass({
  variant = "primary",
  size = "md",
  full = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
} = {}) {
  return [styles.button, styles[variant], styles[size], full && styles.full]
    .filter(Boolean)
    .join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      icon,
      iconRight,
      full = false,
      className,
      children,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={[buttonClass({ variant, size, full }), className]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {icon}
        <span>{children}</span>
        {iconRight}
      </button>
    );
  },
);

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary-dark text-white hover:bg-primary-darker active:bg-primary-darker disabled:bg-disabled disabled:hover:bg-disabled",
  secondary:
    "border border-line bg-card text-dark hover:bg-background active:bg-background",
  ghost: "text-muted hover:bg-background active:bg-background",
};

/** Große Touch-Targets: die App wird mit Kind auf dem Arm bedient. */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 font-semibold transition ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

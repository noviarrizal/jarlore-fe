import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap select-none " +
  "transition-colors disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-action text-on-action hover:bg-action-hover active:bg-action-hover",
  secondary: "bg-sheet text-ink border border-rule hover:border-rule-strong active:bg-well",
  quiet: "text-ink-2 hover:text-ink hover:bg-well active:bg-well",
  danger: "bg-sheet text-danger border border-rule hover:border-danger active:bg-danger-wash",
};

// md = 44px (touch target), sm = 36px for dense desktop rows only
const sizes: Record<Size, string> = {
  md: "h-11 px-4 text-body",
  sm: "h-9 px-3 text-small",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cx(base, variants[variant], sizes[size], className);
}

type CommonProps = { variant?: Variant; size?: Size; icon?: ReactNode; className?: string; children?: ReactNode };

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  type = "button",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...props}>
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

/** Square icon-only button. `label` is required: it becomes the accessible name. */
export function IconButton({
  label,
  className,
  children,
  type = "button",
  ...props
}: { label: string } & ComponentProps<"button">) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex size-11 items-center justify-center rounded-control text-ink-2 transition-colors hover:bg-well hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

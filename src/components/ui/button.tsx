import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-55",
    variant === "primary" &&
      "bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] hover:-translate-y-px hover:bg-slate-900",
    variant === "secondary" &&
      "border border-slate-200/90 bg-white/95 text-slate-800 shadow-[0_6px_24px_rgba(15,23,42,0.05)] hover:border-slate-300 hover:bg-slate-50",
    variant === "ghost" && "bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-950",
    variant === "danger" &&
      "bg-rose-600 text-white shadow-[0_12px_30px_rgba(225,29,72,0.2)] hover:bg-rose-500",
    variant === "soft" &&
      "bg-blue-50 text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100",
    size === "sm" && "px-3.5 py-2 text-sm",
    size === "md" && "px-4.5 py-2.5 text-sm",
    size === "lg" && "px-6 py-3 text-base",
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leading,
  trailing,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
}

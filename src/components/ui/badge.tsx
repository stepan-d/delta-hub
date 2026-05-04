import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "brand" | "success" | "outline" | "accent";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        variant === "neutral" && "bg-slate-100 text-slate-600",
        variant === "brand" && "bg-blue-50 text-blue-700",
        variant === "success" && "bg-emerald-50 text-emerald-700",
        variant === "outline" && "border border-slate-200 bg-white/90 text-slate-600",
        variant === "accent" && "bg-amber-50 text-amber-700",
        className,
      )}
      {...props}
    />
  );
}

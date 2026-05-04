import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "error" | "success";

export function Alert({
  className,
  variant = "info",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      className={cn(
        "rounded-3xl border px-4 py-3 text-sm shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
        variant === "info" && "border-blue-200 bg-blue-50/90 text-blue-800",
        variant === "error" && "border-rose-200 bg-rose-50 text-rose-800",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        className,
      )}
      {...props}
    />
  );
}

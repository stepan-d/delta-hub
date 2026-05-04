import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { fieldClassName } from "@/components/ui/input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
      <textarea
        id={id}
        className={cn(
          fieldClassName,
          "min-h-28 resize-y",
          error && "border-rose-300 focus:ring-rose-100",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
    </label>
  );
}

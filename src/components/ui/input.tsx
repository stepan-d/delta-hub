import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const fieldClassName =
  "w-full rounded-2xl border border-slate-200/90 bg-white/95 px-4 py-3 text-sm text-slate-950 shadow-[0_4px_18px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    className,
    id,
    ...props
  },
  ref,
) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(fieldClassName, error && "border-rose-300 focus:ring-rose-100", className)}
        {...props}
      />
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
    </label>
  );
});

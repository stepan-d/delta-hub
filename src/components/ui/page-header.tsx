import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 max-w-3xl space-y-4">
        {eyebrow ? <Badge variant="brand">{eyebrow}</Badge> : null}
        <div className="space-y-2">
          <h1 className="break-words text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl lg:text-[2.7rem]">
            {title}
          </h1>
          {description ? (
            <p className="break-words text-base leading-7 text-slate-600 sm:text-[1.05rem]">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="min-w-0 flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

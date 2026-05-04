import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-slate-200/90 bg-white/70">
      <CardContent className="flex flex-col items-start gap-4 p-8 md:p-10">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-950">{title}</h3>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

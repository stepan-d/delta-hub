import { Card, CardContent } from "@/components/ui/card";

type LoadingStateProps = {
  title: string;
  description?: string;
};

export function LoadingState({ title, description }: LoadingStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
          <div className="h-2 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { MemeItem, readTagNames } from "@/components/memes/types";

type MemeCardProps = {
  meme: MemeItem;
  onLike?: (memeId: number) => void;
  likePending?: boolean;
  compact?: boolean;
};

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-900">{value}</span>
    </span>
  );
}

export function MemeCard({
  meme,
  onLike,
  likePending = false,
  compact = false,
}: MemeCardProps) {
  const tags = readTagNames(meme.tags);

  return (
    <Card className="group min-w-0 overflow-hidden border-white/80 bg-white/94 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
      <div
        className={
          compact
            ? "grid gap-0 md:grid-cols-[0.95fr_1.05fr]"
            : "grid gap-0 xl:grid-cols-[0.88fr_1.12fr]"
        }
      >
        <div className="relative min-h-[18rem] overflow-hidden bg-slate-100">
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4">
            <div className="flex flex-wrap gap-2">
              {meme.category ? (
                <Badge variant="brand" className="bg-white/92 text-sky-700 shadow-sm backdrop-blur">
                  {meme.category.name}
                </Badge>
              ) : null}
              <Badge variant="outline" className="border-white/70 bg-white/92 text-slate-700 shadow-sm backdrop-blur">
                @{meme.author.username}
              </Badge>
            </div>
            <Badge variant="neutral" className="bg-slate-950/80 text-white backdrop-blur">
              {formatDate(meme.createdAt)}
            </Badge>
          </div>
          <img
            src={meme.imageUrl}
            alt={meme.title || `Meme #${meme.memeId}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/45 via-slate-950/10 to-transparent" />
        </div>

        <CardContent className="flex min-w-0 h-full flex-col gap-5 p-6 md:p-7">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">Od @{meme.author.username}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{formatDate(meme.createdAt)}</span>
          </div>

          <div className="min-w-0 space-y-4">
            <Link href={`/memes/${meme.memeId}`} className="block">
              <h3 className="break-words text-2xl font-semibold tracking-tight text-slate-950 transition hover:text-sky-700">
                {meme.title || "Bez názvu"}
              </h3>
            </Link>
            <p className="max-w-2xl break-words text-sm leading-6 text-slate-600">
              Přehledný příspěvek s rychlým vstupem do detailu, reakcí a související diskuze.
            </p>
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, compact ? 3 : 5).map((tag) => (
                <Badge key={tag} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  #{tag}
                </Badge>
              ))}
              {tags.length > (compact ? 3 : 5) ? (
                <Badge variant="neutral" className="bg-slate-100 text-slate-500">
                  +{tags.length - (compact ? 3 : 5)}
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatPill label="Lajky" value={meme.likeCount} />
              <StatPill label="Komentáře" value={meme.commentCount} />
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Link
                  href={`/memes/${meme.memeId}`}
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  Otevřít detail
                </Link>
                <Link
                  href={`/memes/${meme.memeId}#comments`}
                  className={buttonStyles({ variant: "ghost", size: "sm" })}
                >
                  Diskuze
                </Link>
                <Link
                  href={`/memes/${meme.memeId}#report-form`}
                  className={buttonStyles({ variant: "ghost", size: "sm" })}
                >
                  Nahlásit
                </Link>
              </div>

              {onLike ? (
                <Button
                  type="button"
                  variant={meme.likedByCurrentUser ? "soft" : "secondary"}
                  size="sm"
                  onClick={() => onLike(meme.memeId)}
                  disabled={likePending}
                >
                  {likePending ? "Ukládám..." : meme.likedByCurrentUser ? "Odebrat like" : "Líbí se mi"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { MemeCard } from "@/components/memes/meme-card";
import {
  type MemeComment,
  type LikeResponse,
  type MemeCategory,
  type MemeItem,
  type MemeListResponse,
  type SessionUser,
  type UploadedImageResponse,
  readTagNames,
  tagsInputToObject,
  tagsObjectToInput,
} from "@/components/memes/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice, SuccessNotice } from "@/components/ui/feedback-notice";
import { Input, fieldClassName } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { normalizeClientError, type ErrorState } from "@/lib/client-error";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn, formatDate } from "@/lib/utils";

type MemeFilters = {
  search: string;
  sort: "newest" | "oldest" | "mostLiked";
  categoryId: string;
  tag: string;
};

type MemeListPanelProps = {
  initialFilters?: Partial<MemeFilters>;
};

type MemeDetailPanelProps = {
  memeId: number;
};

const defaultFilters: MemeFilters = {
  search: "",
  sort: "newest",
  categoryId: "",
  tag: "",
};

async function fetchCategories() {
  return apiGet<MemeCategory[]>("/api/categories", { cache: "no-store" });
}

async function fetchMemes(filters: MemeFilters) {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.tag.trim()) params.set("tag", filters.tag.trim());

  const query = params.toString();
  return apiGet<MemeListResponse>(query ? `/api/memes?${query}` : "/api/memes", {
    cache: "no-store",
  });
}

async function fetchMeme(memeId: number) {
  return apiGet<MemeItem>(`/api/memes/${memeId}`, { cache: "no-store" });
}

async function fetchComments(memeId: number) {
  return apiGet<MemeComment[]>(`/api/memes/${memeId}/comments`, { cache: "no-store" });
}

async function fetchCurrentUser() {
  return apiGet<SessionUser>("/api/auth/me", { cache: "no-store" });
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClassName, "appearance-none")}
      >
        {children}
      </select>
    </label>
  );
}

function MemePreview({ meme }: { meme: Pick<MemeItem, "imageUrl" | "title"> }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      {meme.imageUrl ? (
        <img
          src={meme.imageUrl}
          alt={meme.title || "Meme preview"}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center px-6 text-center text-sm text-slate-500">
          Preview obrázku se objeví po výběru lokálního souboru.
        </div>
      )}
    </div>
  );
}

function DetailStatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[24px] border px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]",
        tone === "accent"
          ? "border-sky-200 bg-sky-50/80"
          : "border-slate-200 bg-white",
      )}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 truncate text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MemeDetailHero({
  meme,
  onLike,
  onReport,
  pending,
}: {
  meme: MemeItem;
  onLike: () => void;
  onReport: () => void;
  pending: boolean;
}) {
  const tags = readTagNames(meme.tags);

  return (
    <Card className="min-w-0 overflow-hidden border-slate-200/90 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
      <div className="grid gap-0 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="relative min-h-[22rem] overflow-hidden bg-slate-100">
          <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-3 p-5">
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
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/55 via-slate-950/15 to-transparent" />
        </div>

        <CardContent className="flex min-w-0 flex-col gap-6 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">Přidal @{meme.author.username}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{formatDate(meme.createdAt)}</span>
          </div>

          <div className="min-w-0 space-y-4">
            <h2 className="break-words text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {meme.title || "Bez názvu"}
            </h2>
            <p className="max-w-2xl break-words text-sm leading-7 text-slate-600 md:text-base">
              Příspěvek je připravený pro rychlé reakce, komentáře a pohodlné čtení bez rušivých interních údajů.
            </p>
          </div>

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  #{tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <DetailStatCard label="Lajky" value={meme.likeCount} tone="accent" />
            <DetailStatCard label="Komentáře" value={meme.commentCount} />
            <DetailStatCard label="Autor" value={`@${meme.author.username}`} />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
            <Button
              type="button"
              onClick={onLike}
              disabled={pending}
              variant={meme.likedByCurrentUser ? "soft" : "primary"}
            >
              {pending ? "Ukládám..." : meme.likedByCurrentUser ? "Odebrat like" : "Líbí se mi"}
            </Button>
            <Link href="#comments" className={buttonStyles({ variant: "secondary" })}>
              Komentáře
            </Link>
            <button
              type="button"
              onClick={onReport}
              className={buttonStyles({ variant: "ghost" })}
            >
              Nahlásit
            </button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function CommentCard({
  comment,
  isOwnComment,
  isEditing,
  editingText,
  pending,
  onStartEdit,
  onCancelEdit,
  onEditTextChange,
  onSaveEdit,
  onDelete,
}: {
  comment: MemeComment;
  isOwnComment: boolean;
  isEditing: boolean;
  editingText: string;
  pending: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (value: string) => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">@{comment.author.username}</Badge>
            <Badge variant="neutral">{formatDate(comment.createdAt)}</Badge>
            {comment.updatedAt !== comment.createdAt ? (
              <Badge variant="accent">Upraveno</Badge>
            ) : null}
          </div>
        </div>

        {isOwnComment ? (
          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <>
                <Button type="button" variant="ghost" size="sm" onClick={onStartEdit}>
                  Upravit
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onDelete} disabled={pending}>
                  {pending ? "Mažu..." : "Smazat"}
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <Textarea
            id={`comment-edit-${comment.commentId}`}
            label="Upravit komentář"
            value={editingText}
            onChange={(event) => onEditTextChange(event.target.value)}
            placeholder="Uprav text komentáře"
          />
          <div className="flex flex-wrap gap-3">
            <Button type="button" size="sm" onClick={onSaveEdit} disabled={pending}>
              {pending ? "Ukládám..." : "Uložit"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onCancelEdit} disabled={pending}>
              Zrušit
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{comment.text}</p>
      )}
    </div>
  );
}

export function MemeListPanel({ initialFilters }: MemeListPanelProps) {
  const [filters, setFilters] = useState<MemeFilters>({ ...defaultFilters, ...initialFilters });
  const [categories, setCategories] = useState<MemeCategory[]>([]);
  const [memes, setMemes] = useState<MemeItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [likeMemeId, setLikeMemeId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const hasMountedSearchEffect = useRef(false);
  const latestFiltersRef = useRef(filters);
  const { notifyError } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [loadedCategories, loadedMemes] = await Promise.all([
          fetchCategories(),
          fetchMemes({ ...defaultFilters, ...initialFilters }),
        ]);

        if (!isMounted) return;

        setCategories(loadedCategories);
        setMemes(loadedMemes.memes);
        setMeta({
          total: loadedMemes.total,
          page: loadedMemes.page,
          totalPages: loadedMemes.totalPages,
        });
      } catch (loadError) {
        if (isMounted) {
          setError(normalizeClientError(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [initialFilters]);

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  function applyFilterResults(response: MemeListResponse) {
    setMemes(response.memes);
    setMeta({
      total: response.total,
      page: response.page,
      totalPages: response.totalPages,
    });
  }

  function submitFilters(nextFilters: MemeFilters) {
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetchMemes(nextFilters);
        applyFilterResults(response);
      } catch (submitError) {
        const normalizedError = normalizeClientError(submitError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      }
    });
  }

  useEffect(() => {
    if (!hasMountedSearchEffect.current) {
      hasMountedSearchEffect.current = true;
      return;
    }

    const latestFilters = latestFiltersRef.current;
    const normalizedDebouncedSearch = debouncedSearch.trim();
    const normalizedCurrentSearch = latestFilters.search.trim();

    if (normalizedDebouncedSearch !== normalizedCurrentSearch) {
      return;
    }

    submitFilters({ ...latestFilters, search: debouncedSearch });
  }, [debouncedSearch, notifyError]);

  function updateFilter<Key extends keyof MemeFilters>(key: Key, value: MemeFilters[Key]) {
    setFilters((currentState) => ({ ...currentState, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitFilters(filters);
  }

  function resetFilters() {
    setFilters(defaultFilters);
    submitFilters(defaultFilters);
  }

  function handleLike(memeId: number) {
    setError(null);
    setLikeMemeId(memeId);

    startTransition(async () => {
      try {
        const response = await apiPost<LikeResponse>(`/api/memes/${memeId}/like`);
        setMemes((currentMemes) =>
          currentMemes.map((meme) =>
            meme.memeId === memeId
              ? {
                  ...meme,
                  likeCount: response.likeCount,
                  likedByCurrentUser: response.liked,
                }
              : meme,
          ),
        );
      } catch (likeError) {
        const normalizedError = normalizeClientError(likeError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      } finally {
        setLikeMemeId(null);
      }
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow="Komunitní feed"
        title="Memes"
        description="Procházej feed, filtruj obsah a přecházej rovnou do detailu a diskuze."
        actions={
          <Link href="/memes/create" className={buttonStyles({ variant: "primary", size: "lg" })}>
            Přidat meme
          </Link>
        }
      />

      <Card className="min-w-0 border-white/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(248,250,252,0.92)_100%)]">
        <CardContent className="p-6 md:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[2fr_0.8fr_0.8fr]">
              <Input
                id="feed-search"
                label="Hledat"
                autoFocus
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Hledat podle názvu memu"
                hint="Vyhledávání se aplikuje automaticky po krátké prodlevě."
              />
              <FilterSelect
                label="Řazení"
                value={filters.sort}
                onChange={(value) => updateFilter("sort", value as MemeFilters["sort"])}
              >
                <option value="newest">Nejnovější</option>
                <option value="oldest">Nejstarší</option>
                <option value="mostLiked">Nejlajkovanější</option>
              </FilterSelect>
              <FilterSelect
                label="Kategorie"
                value={filters.categoryId}
                onChange={(value) => updateFilter("categoryId", value)}
              >
                <option value="">Všechny</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={String(category.categoryId)}>
                    {category.name}
                  </option>
                ))}
              </FilterSelect>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <Input
                id="feed-tag"
                label="Tag"
                value={filters.tag}
                onChange={(event) => updateFilter("tag", event.target.value)}
                placeholder="Např. skola"
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Načítám..." : "Použít filtry"}
                </Button>
                <Button type="button" variant="secondary" onClick={resetFilters} disabled={isPending}>
                  Vymazat filtry
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <ErrorNotice error={error} />

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral" className="bg-slate-950 text-white">
            {meta.total} příspěvků
          </Badge>
          <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
            Strana {meta.page} / {Math.max(meta.totalPages, 1)}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <LoadingState
          title="Načítám komunitní feed"
          description="Chvilku vydrž, připravuji nejnovější příspěvky komunity."
        />
      ) : memes.length === 0 ? (
        <EmptyState
          title="Ve feedu zatím nic není"
          description="Zkus upravit filtry, nebo přidej první meme a rozjeď komunitní stránku naplno."
          action={
            <Link href="/memes/create" className={buttonStyles({ variant: "primary", size: "sm" })}>
              Přidat meme
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5">
          {memes.map((meme) => (
            <MemeCard
              key={meme.memeId}
              meme={meme}
              onLike={handleLike}
              likePending={isPending && likeMemeId === meme.memeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MemeDetailPanel({ memeId }: MemeDetailPanelProps) {
  const router = useRouter();
  const [meme, setMeme] = useState<MemeItem | null>(null);
  const [categories, setCategories] = useState<MemeCategory[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [comments, setComments] = useState<MemeComment[]>([]);
  const [formState, setFormState] = useState({
    title: "",
    categoryId: "",
    tags: "",
  });
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [isDeleteMemeOpen, setIsDeleteMemeOpen] = useState(false);
  const [commentDeleteTarget, setCommentDeleteTarget] = useState<MemeComment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [commentError, setCommentError] = useState<ErrorState | null>(null);
  const [reportError, setReportError] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [commentSuccessMessage, setCommentSuccessMessage] = useState("");
  const [reportSuccessMessage, setReportSuccessMessage] = useState("");
  const [actionTargetId, setActionTargetId] = useState<number | null>(null);
  const [action, setAction] = useState<
    "like" | "save" | "delete" | "comment-create" | "comment-edit" | "comment-delete" | "report" | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const { notifyError, notifySuccess } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      setIsLoading(true);
      setError(null);
      setCommentError(null);
      setReportError(null);

      try {
        const [loadedMeme, loadedCategories, loadedComments, loadedUser] = await Promise.all([
          fetchMeme(memeId),
          fetchCategories(),
          fetchComments(memeId),
          fetchCurrentUser().catch((userError) => {
            if (userError instanceof ApiError && userError.status === 401) {
              return null;
            }

            throw userError;
          }),
        ]);

        if (!isMounted) return;

        setMeme(loadedMeme);
        setCategories(loadedCategories);
        setComments(loadedComments);
        setCurrentUser(loadedUser);
        setFormState({
          title: loadedMeme.title ?? "",
          categoryId: loadedMeme.categoryId ? String(loadedMeme.categoryId) : "",
          tags: tagsObjectToInput(loadedMeme.tags),
        });
      } catch (loadError) {
        if (isMounted) {
          setError(normalizeClientError(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [memeId]);

  function updateField<Key extends keyof typeof formState>(
    key: Key,
    value: (typeof formState)[Key],
  ) {
    setFormState((currentState) => ({ ...currentState, [key]: value }));
  }

  function applyActionError(
    setter: Dispatch<SetStateAction<ErrorState | null>>,
    sourceError: unknown,
  ) {
    const normalizedError = normalizeClientError(sourceError);
    setter(normalizedError);
    notifyError(normalizedError.message, normalizedError.details);
  }

  function handleLike() {
    setError(null);
    setSuccessMessage("");
    setActionTargetId(memeId);
    setAction("like");

    startTransition(async () => {
      try {
        const response = await apiPost<LikeResponse>(`/api/memes/${memeId}/like`);
        setMeme((currentMeme) =>
          currentMeme
            ? {
                ...currentMeme,
                likeCount: response.likeCount,
                likedByCurrentUser: response.liked,
              }
            : currentMeme,
        );
      } catch (likeError) {
        applyActionError(setError, likeError);
      } finally {
        setActionTargetId(null);
        setAction(null);
      }
    });
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage("");

    if (!formState.title.trim() && !formState.categoryId && !formState.tags.trim()) {
      setError({
        message: "Vyplň alespoň jedno pole, které chceš upravit.",
        details: [],
      });
      return;
    }

    setActionTargetId(memeId);
    setAction("save");

    startTransition(async () => {
      try {
        const updatedMeme = await apiPatch<MemeItem>(`/api/memes/${memeId}`, {
          title: formState.title.trim() || null,
          categoryId: formState.categoryId ? Number(formState.categoryId) : null,
          tags: tagsInputToObject(formState.tags),
        });

        setMeme(updatedMeme);
        setFormState({
          title: updatedMeme.title ?? "",
          categoryId: updatedMeme.categoryId ? String(updatedMeme.categoryId) : "",
          tags: tagsObjectToInput(updatedMeme.tags),
        });
        setSuccessMessage("Post byl úspěšně aktualizovaný.");
        notifySuccess("Post byl úspěšně aktualizovaný.");
      } catch (updateError) {
        applyActionError(setError, updateError);
      } finally {
        setActionTargetId(null);
        setAction(null);
      }
    });
  }

  function handleDelete() {
    setError(null);
    setSuccessMessage("");
    setActionTargetId(memeId);
    setAction("delete");

    startTransition(async () => {
      try {
        await apiDelete<void>(`/api/memes/${memeId}`);
        notifySuccess("Meme bylo smazané.");
        setIsDeleteMemeOpen(false);
        router.push("/memes");
      } catch (deleteError) {
        applyActionError(setError, deleteError);
      } finally {
        setActionTargetId(null);
        setAction(null);
      }
    });
  }

  function handleCreateComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCommentError(null);
    setCommentSuccessMessage("");

    if (!commentDraft.trim()) {
      setCommentError({ message: "Komentář nesmí být prázdný.", details: [] });
      return;
    }

    setAction("comment-create");
    setActionTargetId(memeId);

    startTransition(async () => {
      try {
        const createdComment = await apiPost<MemeComment>(`/api/memes/${memeId}/comments`, {
          text: commentDraft.trim(),
        });

        setComments((currentComments) => [...currentComments, createdComment]);
        setCommentDraft("");
        setCommentSuccessMessage("Komentář byl přidaný.");
        notifySuccess("Komentář byl přidaný.");
        setMeme((currentMeme) =>
          currentMeme
            ? { ...currentMeme, commentCount: currentMeme.commentCount + 1 }
            : currentMeme,
        );
      } catch (createError) {
        applyActionError(setCommentError, createError);
      } finally {
        setActionTargetId(null);
        setAction(null);
      }
    });
  }

  function startEditingComment(comment: MemeComment) {
    setCommentError(null);
    setCommentSuccessMessage("");
    setEditingCommentId(comment.commentId);
    setEditingCommentText(comment.text);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditingCommentText("");
  }

  function handleSaveComment(commentId: number) {
    setCommentError(null);
    setCommentSuccessMessage("");

    if (!editingCommentText.trim()) {
      setCommentError({ message: "Komentář nesmí být prázdný.", details: [] });
      return;
    }

    setAction("comment-edit");
    setActionTargetId(commentId);

    startTransition(async () => {
      try {
        const updatedComment = await apiPatch<MemeComment>(
          `/api/memes/${memeId}/comments/${commentId}`,
          {
            text: editingCommentText.trim(),
          },
        );

        setComments((currentComments) =>
          currentComments.map((comment) =>
            comment.commentId === commentId ? updatedComment : comment,
          ),
        );
        setEditingCommentId(null);
        setEditingCommentText("");
        setCommentSuccessMessage("Komentář byl upravený.");
        notifySuccess("Komentář byl upravený.");
      } catch (updateError) {
        applyActionError(setCommentError, updateError);
      } finally {
        setActionTargetId(null);
        setAction(null);
      }
    });
  }

  function handleDeleteComment(commentId: number) {
    setCommentError(null);
    setCommentSuccessMessage("");
    setAction("comment-delete");
    setActionTargetId(commentId);

    startTransition(async () => {
      try {
        await apiDelete<void>(`/api/memes/${memeId}/comments/${commentId}`);
        setComments((currentComments) =>
          currentComments.filter((comment) => comment.commentId !== commentId),
        );
        setCommentSuccessMessage("Komentář byl smazaný.");
        setEditingCommentId((currentEditingId) =>
          currentEditingId === commentId ? null : currentEditingId,
        );
        setEditingCommentText("");
        setMeme((currentMeme) =>
          currentMeme
            ? { ...currentMeme, commentCount: Math.max(0, currentMeme.commentCount - 1) }
            : currentMeme,
        );
        setCommentDeleteTarget(null);
        notifySuccess("Komentář byl smazaný.");
      } catch (deleteError) {
        applyActionError(setCommentError, deleteError);
      } finally {
        setActionTargetId(null);
        setAction(null);
      }
    });
  }

  function handleSubmitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReportError(null);
    setReportSuccessMessage("");

    if (!reportReason.trim()) {
      setReportError({ message: "Vyplň důvod nahlášení.", details: [] });
      return;
    }

    setAction("report");
    setActionTargetId(memeId);

    startTransition(async () => {
      try {
        await apiPost(`/api/memes/${memeId}/report`, { reason: reportReason.trim() });
        setReportReason("");
        setReportSuccessMessage("Post byl nahlášený moderaci.");
        notifySuccess("Post byl nahlášený moderaci.");
      } catch (submitError) {
        applyActionError(setReportError, submitError);
      } finally {
        setActionTargetId(null);
        setAction(null);
      }
    });
  }

  if (!Number.isFinite(memeId) || memeId <= 0) {
    return (
      <EmptyState
        title="Neplatný odkaz na post"
        description="Odkaz na detail neobsahuje platný příspěvek."
        action={
          <Link href="/memes" className={buttonStyles({ variant: "primary", size: "sm" })}>
            Zpět na feed
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow="Detail postu"
        title={meme?.title || "Detail postu"}
        description="Post, reakce komunity a navazující diskuze na jednom místě."
        actions={
          <Link href="/memes" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Zpět na feed
          </Link>
        }
      />

      <ErrorNotice error={error} />
      <SuccessNotice message={successMessage} />

      {isLoading ? (
        <LoadingState
          title="Načítám detail memu"
          description="Připravuji detail příspěvku, komentáře i dostupné kategorie."
        />
      ) : meme ? (
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
          <div className="min-w-0 space-y-6">
            <MemeDetailHero
              meme={meme}
              onLike={handleLike}
              onReport={() => {
                document.getElementById("report-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              pending={isPending && action === "like" && actionTargetId === memeId}
            />

            <Card id="comments" className="min-w-0 border-white/80 bg-white/92">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Diskuze</CardTitle>
                <CardDescription>
                  Reakce komunity přímo pod příspěvkem. Nové komentáře se po odeslání propíšou hned do rozhraní.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <ErrorNotice error={commentError} />
                <SuccessNotice message={commentSuccessMessage} />

                {currentUser ? (
                  <form
                    onSubmit={handleCreateComment}
                    className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50/90 p-5"
                  >
                    <Textarea
                      id="comment-draft"
                      label="Přidat komentář"
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder="Co si o tom myslíš?"
                      maxLength={1000}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="submit"
                        disabled={
                          isPending && action === "comment-create" && actionTargetId === memeId
                        }
                      >
                        {isPending && action === "comment-create" && actionTargetId === memeId
                          ? "Přidávám..."
                          : "Přidat komentář"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Alert variant="info">
                    Pro přidání komentáře se nejdřív{" "}
                    <Link href="/login" className="font-medium underline underline-offset-4">
                      přihlas
                    </Link>
                    .
                  </Alert>
                )}

                {comments.length === 0 ? (
                  <EmptyState
                    title="Zatím tu nejsou žádné komentáře"
                    description="Buď první, kdo pod tenhle post něco napíše a rozjede diskuzi."
                  />
                ) : (
                  <div className="min-w-0 space-y-4">
                    {comments.map((comment) => {
                      const isOwnComment = currentUser?.userId === comment.author.userId;
                      const isEditing = editingCommentId === comment.commentId;
                      const isCommentPending =
                        isPending && actionTargetId === comment.commentId;

                      return (
                        <CommentCard
                          key={comment.commentId}
                          comment={comment}
                          isOwnComment={Boolean(isOwnComment)}
                          isEditing={isEditing}
                          editingText={isEditing ? editingCommentText : comment.text}
                          pending={isCommentPending}
                          onStartEdit={() => startEditingComment(comment)}
                          onCancelEdit={cancelEditingComment}
                          onEditTextChange={setEditingCommentText}
                          onSaveEdit={() => handleSaveComment(comment.commentId)}
                          onDelete={() => setCommentDeleteTarget(comment)}
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 border-white/80 bg-white/92">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Upravit post</CardTitle>
                <CardDescription>
                  Uprav název, kategorii a tagy tak, aby příspěvek dobře zapadl do feedu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <form onSubmit={handleUpdate} className="space-y-4">
                  <Input
                    id="detail-title"
                    label="Název"
                    value={formState.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="Upravený title"
                    autoFocus
                  />

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Kategorie</span>
                    <select
                      value={formState.categoryId}
                      onChange={(event) => updateField("categoryId", event.target.value)}
                      className={cn(fieldClassName, "appearance-none")}
                    >
                      <option value="">Bez kategorie</option>
                      {categories.map((category) => (
                        <option key={category.categoryId} value={String(category.categoryId)}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Input
                    id="detail-tags"
                    label="Tagy"
                    value={formState.tags}
                    onChange={(event) => updateField("tags", event.target.value)}
                    placeholder="skola,matika"
                    hint="Tagy odděl čárkou, ať se příspěvek lépe filtruje."
                  />

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={isPending} variant="primary">
                      {isPending && action === "save" && actionTargetId === memeId
                        ? "Ukládám..."
                        : "Uložit změny"}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => setIsDeleteMemeOpen(true)}
                      disabled={isPending}
                    >
                      {isPending && action === "delete" && actionTargetId === memeId
                        ? "Mažu..."
                        : "Smazat meme"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card id="report-form" className="min-w-0 border-white/80 bg-white/92">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Nahlásit post</CardTitle>
                <CardDescription>
                  Pokud příspěvek nepatří do komunity, napiš stručný důvod a moderátor ho zkontroluje.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <ErrorNotice error={reportError} />
                <SuccessNotice message={reportSuccessMessage} />

                {!currentUser ? (
                  <Alert variant="info">
                    Nahlášení může odeslat jen přihlášený uživatel.{" "}
                    <Link href="/login" className="font-medium underline underline-offset-4">
                      Přejít na přihlášení
                    </Link>
                    .
                  </Alert>
                ) : (
                  <form onSubmit={handleSubmitReport} className="space-y-4">
                    <Textarea
                      id="report-reason"
                      label="Důvod nahlášení"
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      placeholder="Stručně popiš, proč by měl být příspěvek zkontrolovaný."
                      maxLength={500}
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="submit"
                        disabled={isPending && action === "report" && actionTargetId === memeId}
                      >
                        {isPending && action === "report" && actionTargetId === memeId
                          ? "Odesílám..."
                          : "Odeslat report"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setReportReason("");
                          setReportError(null);
                        }}
                        disabled={isPending && action === "report" && actionTargetId === memeId}
                      >
                        Vyčistit hlášení
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Post se nepodařilo načíst"
          description="Backend nevrátil detail memu, nebo k němu nemáš přístup."
          action={
            <Link href="/memes" className={buttonStyles({ variant: "primary", size: "sm" })}>
              Zpět na feed
            </Link>
          }
        />
      )}

      <ConfirmDialog
        open={isDeleteMemeOpen}
        title="Smazat meme?"
        description="Opravdu chceš odstranit tento post z feedu?"
        confirmLabel="Smazat meme"
        pending={isPending && action === "delete" && actionTargetId === memeId}
        onCancel={() => setIsDeleteMemeOpen(false)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={Boolean(commentDeleteTarget)}
        title="Smazat komentář?"
        description={
          commentDeleteTarget
            ? `Opravdu chceš smazat komentář od @${commentDeleteTarget.author.username}?`
            : ""
        }
        confirmLabel="Smazat komentář"
        pending={
          isPending &&
          action === "comment-delete" &&
          actionTargetId === commentDeleteTarget?.commentId
        }
        onCancel={() => setCommentDeleteTarget(null)}
        onConfirm={() => {
          if (commentDeleteTarget) {
            handleDeleteComment(commentDeleteTarget.commentId);
          }
        }}
      />
    </div>
  );
}

export function CreateMemePanel() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [categories, setCategories] = useState<MemeCategory[]>([]);
  const [formState, setFormState] = useState({
    title: "",
    categoryId: "",
    tags: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [createdMeme, setCreatedMeme] = useState<MemeItem | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitPhase, setSubmitPhase] = useState<"upload" | "create" | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { notifyError, notifySuccess } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setIsLoadingCategories(true);

      try {
        const loadedCategories = await fetchCategories();
        if (isMounted) {
          setCategories(loadedCategories);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(normalizeClientError(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField<Key extends keyof typeof formState>(
    key: Key,
    value: (typeof formState)[Key],
  ) {
    setFormState((currentState) => ({ ...currentState, [key]: value }));
  }

  useEffect(() => {
    if (!selectedImage) {
      setPreviewImageUrl(uploadedImageUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewImageUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage, uploadedImageUrl]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedImage(nextFile);
    setUploadedImageUrl("");
    setCreatedMeme(null);
    setSuccessMessage("");

    if (error) {
      setError(null);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage("");

    if (!selectedImage) {
      setError({ message: "Obrázek je povinný.", details: [] });
      return;
    }

    startTransition(async () => {
      try {
        setSubmitPhase("upload");
        const uploadPayload = new FormData();
        uploadPayload.set("file", selectedImage);

        const uploaded = await apiPost<UploadedImageResponse>("/api/uploads/image", uploadPayload);

        setSubmitPhase("create");
        const meme = await apiPost<MemeItem>("/api/memes", {
          title: formState.title.trim() || undefined,
          imageUrl: uploaded.imageUrl,
          categoryId: formState.categoryId ? Number(formState.categoryId) : undefined,
          tags: tagsInputToObject(formState.tags),
        });

        setCreatedMeme(meme);
        setUploadedImageUrl(uploaded.imageUrl);
        setSelectedImage(null);
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
        setSuccessMessage("Meme bylo úspěšně vytvořené.");
        setFormState({
          title: meme.title ?? "",
          categoryId: meme.categoryId ? String(meme.categoryId) : "",
          tags: tagsObjectToInput(meme.tags),
        });
        notifySuccess("Meme bylo úspěšně vytvořené.");
      } catch (submitError) {
        setCreatedMeme(null);
        const normalizedError = normalizeClientError(submitError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      } finally {
        setSubmitPhase(null);
      }
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow="Nový post"
        title="Přidat meme"
        description="Nahraj obrázek, doplň metadata a rovnou zkontroluj výsledný vzhled."
        actions={
          <Link href="/memes" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Zpět na feed
          </Link>
        }
      />

      <ErrorNotice error={error} />
      <SuccessNotice message={successMessage} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="min-w-0 border-white/80 bg-white/92">
          <CardHeader>
            <CardTitle>Nový meme post</CardTitle>
            <CardDescription>
              Vyplň název, obrázek a tagy tak, aby příspěvek působil přirozeně v komunitním feedu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="create-title"
                label="Název"
                autoFocus
                value={formState.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Např. Když si řekneš, že dáš jen jeden refresh"
              />

              <Input
                id="create-image-file"
                ref={imageInputRef}
                label="Obrázek"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff"
                onChange={handleImageChange}
                hint="Vyber obrázek z počítače. Po odeslání se převede do WebP a nahraje do úložiště."
                required
              />
              {selectedImage ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">{selectedImage.name}</p>
                  <p className="mt-1">
                    Velikost: {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="mt-1">Typ: {selectedImage.type || "Neznámý"}</p>
                </div>
              ) : null}

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Kategorie</span>
                <select
                  value={formState.categoryId}
                  onChange={(event) => updateField("categoryId", event.target.value)}
                  className={cn(fieldClassName, "appearance-none")}
                  disabled={isLoadingCategories}
                >
                  <option value="">Bez kategorie</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={String(category.categoryId)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                id="create-tags"
                label="Tagy"
                value={formState.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                placeholder="skola,matika"
                hint="Tagy odděl čárkou, ať se dají dobře filtrovat."
              />

              <Button type="submit" disabled={isPending} size="lg">
                {isPending
                  ? submitPhase === "upload"
                    ? "Nahrávám obrázek..."
                    : "Publikuji meme..."
                  : "Publikovat meme"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0 border-white/80 bg-white/92">
            <CardHeader>
              <CardTitle>Živý náhled</CardTitle>
              <CardDescription>
                Náhled se průběžně aktualizuje podle vyplněných údajů ještě před odesláním.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MemePreview
                meme={{
                  imageUrl: previewImageUrl,
                  title: formState.title || "Tvůj nový meme",
                }}
              />
              <div className="rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p className="break-words font-medium text-slate-900">{formState.title || "Tvůj nový meme"}</p>
                <p className="mt-1">
                  Kategorie:{" "}
                  {categories.find((category) => String(category.categoryId) === formState.categoryId)?.name ||
                    "Bez kategorie"}
                </p>
                <p className="mt-1 break-words">Tagy: {formState.tags || "žádné"}</p>
                <p className="mt-1">
                  Zdroj obrázku: {selectedImage ? "lokální soubor připravený k uploadu" : uploadedImageUrl ? "nahraný do úložiště" : "zatím nevybrán"}
                </p>
              </div>
            </CardContent>
          </Card>

          {createdMeme ? (
            <Card>
              <CardHeader>
                <CardTitle>Post byl vytvořen</CardTitle>
                <CardDescription>
                  Příspěvek je hotový a můžeš rovnou pokračovat na detail nebo zpět do feedu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MemeCard meme={createdMeme} compact />
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => router.push(`/memes/${createdMeme.memeId}`)}>
                    Otevřít detail
                  </Button>
                  <Link href="/memes" className={buttonStyles({ variant: "secondary" })}>
                    Zobrazit feed
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="Po vytvoření se tady ukáže nový post"
              description="Po úspěšném odeslání tady uvidíš hotový výsledek a můžeš rovnou pokračovat na detail."
            />
          )}
        </div>
      </div>
    </div>
  );
}

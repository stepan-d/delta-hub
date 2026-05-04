"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { normalizeClientError, type ErrorState } from "@/lib/client-error";

type Category = {
  categoryId: number;
  name: string;
  description?: string | null;
};

export function CategoriesPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [action, setAction] = useState<"create" | "save" | "delete" | null>(null);
  const [actionTargetId, setActionTargetId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { notifyError, notifySuccess } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      setIsLoading(true);
      setError(null);

      try {
        const loadedCategories = await apiGet<Category[]>("/api/categories", {
          cache: "no-store",
        });

        if (isMounted) {
          setCategories(loadedCategories);
        }
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

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  function beginEdit(category: Category) {
    setEditingId(category.categoryId);
    setEditForm({
      name: category.name,
      description: category.description ?? "",
    });
    setError(null);
    setSuccessMessage("");
  }

  function resetEdit() {
    setEditingId(null);
    setEditForm({ name: "", description: "" });
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage("");

    if (!createForm.name.trim()) {
      setError({ message: "Název kategorie je povinný.", details: [] });
      return;
    }

    setAction("create");
    setActionTargetId(null);

    startTransition(async () => {
      try {
        const createdCategory = await apiPost<Category>("/api/categories", {
          name: createForm.name.trim(),
          description: createForm.description.trim() || undefined,
        });

        setCategories((currentCategories) =>
          [...currentCategories, createdCategory].sort((a, b) =>
            a.name.localeCompare(b.name, "cs"),
          ),
        );
        setCreateForm({ name: "", description: "" });
        setSuccessMessage("Kategorie byla vytvořená.");
        notifySuccess("Kategorie byla vytvořená.");
      } catch (createError) {
        const normalizedError = normalizeClientError(createError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      } finally {
        setAction(null);
      }
    });
  }

  function handleSave(categoryId: number) {
    setError(null);
    setSuccessMessage("");

    if (!editForm.name.trim()) {
      setError({ message: "Název kategorie je povinný.", details: [] });
      return;
    }

    setAction("save");
    setActionTargetId(categoryId);

    startTransition(async () => {
      try {
        const updatedCategory = await apiPatch<Category>(
          `/api/categories/${categoryId}`,
          {
            name: editForm.name.trim(),
            description: editForm.description.trim() || null,
          },
        );

        setCategories((currentCategories) =>
          currentCategories
            .map((category) =>
              category.categoryId === categoryId ? updatedCategory : category,
            )
            .sort((a, b) => a.name.localeCompare(b.name, "cs")),
        );
        resetEdit();
        setSuccessMessage("Kategorie byla upravená.");
        notifySuccess("Kategorie byla upravená.");
      } catch (saveError) {
        const normalizedError = normalizeClientError(saveError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      } finally {
        setAction(null);
        setActionTargetId(null);
      }
    });
  }

  function handleDelete(categoryId: number) {
    setError(null);
    setSuccessMessage("");
    setAction("delete");
    setActionTargetId(categoryId);

    startTransition(async () => {
      try {
        await apiDelete<void>(`/api/categories/${categoryId}`);
        setCategories((currentCategories) =>
          currentCategories.filter((category) => category.categoryId !== categoryId),
        );
        if (editingId === categoryId) {
          resetEdit();
        }
        setSuccessMessage("Kategorie byla smazaná.");
        notifySuccess("Kategorie byla smazaná.");
        setDeleteTarget(null);
      } catch (deleteError) {
        const normalizedError = normalizeClientError(deleteError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      } finally {
        setAction(null);
        setActionTargetId(null);
      }
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow="Kategorie"
        title="Správa kategorií memů"
        description="Kategorie pomáhají udržet feed přehledný a dávají komunitnímu obsahu jasnou strukturu."
      />

      <ErrorNotice error={error} />
      <SuccessNotice message={successMessage} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Nová kategorie</CardTitle>
            <CardDescription>
              Vytvoř novou skupinu obsahu pro feed a moderaci.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                id="create-category-name"
                label="Název"
                autoFocus
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((currentState) => ({
                    ...currentState,
                    name: event.target.value,
                  }))
                }
                placeholder="Např. Škola"
                required
              />
              <Textarea
                id="create-category-description"
                label="Popis"
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((currentState) => ({
                    ...currentState,
                    description: event.target.value,
                  }))
                }
                placeholder="Krátký popis kategorie"
              />
              <Button type="submit" disabled={isPending} size="lg">
                {isPending && action === "create" ? "Vytvářím..." : "Vytvořit kategorii"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Přehled kategorií</CardTitle>
            <CardDescription>
              {categories.length} kategorií dostupných pro nové memy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <LoadingState
                title="Načítám kategorie"
                description="Taháme seznam kategorií z backendu."
              />
            ) : categories.length === 0 ? (
              <EmptyState
                title="Zatím tu nejsou žádné kategorie"
                description="Vytvoř první kategorii a začni strukturovat obsah feedu."
              />
            ) : (
              categories.map((category) => {
                const isEditing = editingId === category.categoryId;
                const isActionPending = isPending && actionTargetId === category.categoryId;

                return (
                  <div
                    key={category.categoryId}
                    className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                  >
                    {isEditing ? (
                        <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="brand">Editace</Badge>
                          <Badge variant="outline">#{category.categoryId}</Badge>
                        </div>
                        <Input
                          id={`edit-category-name-${category.categoryId}`}
                          label="Název"
                          value={editForm.name}
                          onChange={(event) =>
                            setEditForm((currentState) => ({
                              ...currentState,
                              name: event.target.value,
                            }))
                          }
                        />
                        <Textarea
                          id={`edit-category-description-${category.categoryId}`}
                          label="Popis"
                          value={editForm.description}
                          onChange={(event) =>
                            setEditForm((currentState) => ({
                              ...currentState,
                              description: event.target.value,
                            }))
                          }
                        />
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            onClick={() => handleSave(category.categoryId)}
                            disabled={isActionPending}
                          >
                            {isActionPending && action === "save" ? "Ukládám..." : "Uložit"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={resetEdit}
                            disabled={isActionPending}
                          >
                            Zrušit
                          </Button>
                        </div>
                      </div>
                    ) : (
                        <div className="min-w-0 space-y-4">
                        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="brand">{category.name}</Badge>
                              <Badge variant="outline">#{category.categoryId}</Badge>
                            </div>
                            <p className="break-words text-sm leading-6 text-slate-600">
                              {category.description || "Bez popisu"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => beginEdit(category)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(category)}
                              disabled={isActionPending}
                            >
                              {isActionPending && action === "delete" ? "Mažu..." : "Delete"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Smazat kategorii?"
        description={
          deleteTarget
            ? `Opravdu chceš smazat kategorii "${deleteTarget.name}"?`
            : ""
        }
        confirmLabel="Smazat kategorii"
        pending={isPending && action === "delete" && actionTargetId === deleteTarget?.categoryId}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget.categoryId);
          }
        }}
      />
    </div>
  );
}

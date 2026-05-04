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
import { formatDate } from "@/lib/utils";

type EventItem = {
  eventId: number;
  name: string;
  date?: string | null;
  detailsJson?: Record<string, unknown> | null;
};

type EventListResponse = {
  events: EventItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function toJsonString(value: Record<string, unknown> | null | undefined) {
  if (!value) return "";
  return JSON.stringify(value, null, 2);
}

function parseDetailsJson(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return JSON.parse(trimmed) as Record<string, unknown>;
}

export function EventsPanel() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    date: "",
    detailsJson: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    date: "",
    detailsJson: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [action, setAction] = useState<"create" | "save" | "delete" | "load-detail" | null>(null);
  const [actionTargetId, setActionTargetId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { notifyError, notifySuccess } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiGet<EventListResponse>("/api/events", {
          cache: "no-store",
        });

        if (isMounted) {
          setEvents(response.events);
          setMeta({
            total: response.total,
            page: response.page,
            totalPages: response.totalPages,
          });
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

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  async function loadEventDetail(eventId: number) {
    setIsDetailLoading(true);
    setError(null);
    setSuccessMessage("");
    setAction("load-detail");
    setActionTargetId(eventId);

    try {
      const event = await apiGet<EventItem>(`/api/events/${eventId}`, {
        cache: "no-store",
      });
      setSelectedEventId(eventId);
      setEditForm({
        name: event.name,
        date: event.date ? event.date.slice(0, 10) : "",
        detailsJson: toJsonString(event.detailsJson),
      });
    } catch (detailError) {
      setError(normalizeClientError(detailError));
    } finally {
      setIsDetailLoading(false);
      setAction(null);
      setActionTargetId(null);
    }
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage("");

    if (!createForm.name.trim()) {
      setError({ message: "Název eventu je povinný.", details: [] });
      return;
    }

    let detailsJson: Record<string, unknown> | undefined;
    try {
      detailsJson = parseDetailsJson(createForm.detailsJson);
    } catch {
      setError({
        message: "Pole s detaily musí obsahovat platný JSON objekt.",
        details: [],
      });
      return;
    }

    setAction("create");
    setActionTargetId(null);

    startTransition(async () => {
      try {
        const createdEvent = await apiPost<EventItem>("/api/events", {
          name: createForm.name.trim(),
          date: createForm.date || null,
          detailsJson,
        });

        setEvents((currentEvents) => [...currentEvents, createdEvent]);
        setMeta((currentMeta) => ({ ...currentMeta, total: currentMeta.total + 1 }));
        setCreateForm({ name: "", date: "", detailsJson: "" });
        setSuccessMessage("Event byl vytvořený.");
        notifySuccess("Event byl vytvořený.");
      } catch (createError) {
        const normalizedError = normalizeClientError(createError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      } finally {
        setAction(null);
      }
    });
  }

  function handleSave(eventId: number) {
    setError(null);
    setSuccessMessage("");

    if (!editForm.name.trim()) {
      setError({ message: "Název eventu je povinný.", details: [] });
      return;
    }

    let detailsJson: Record<string, unknown> | undefined;
    try {
      detailsJson = parseDetailsJson(editForm.detailsJson);
    } catch {
      setError({
        message: "Pole s detaily musí obsahovat platný JSON objekt.",
        details: [],
      });
      return;
    }

    setAction("save");
    setActionTargetId(eventId);

    startTransition(async () => {
      try {
        const updatedEvent = await apiPatch<EventItem>(`/api/events/${eventId}`, {
          name: editForm.name.trim(),
          date: editForm.date || null,
          detailsJson,
        });

        setEvents((currentEvents) =>
          currentEvents.map((item) => (item.eventId === eventId ? updatedEvent : item)),
        );
        setSelectedEventId(eventId);
        setEditForm({
          name: updatedEvent.name,
          date: updatedEvent.date ? updatedEvent.date.slice(0, 10) : "",
          detailsJson: toJsonString(updatedEvent.detailsJson),
        });
        setSuccessMessage("Event byl upravený.");
        notifySuccess("Event byl upravený.");
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

  function handleDelete(eventId: number) {
    setError(null);
    setSuccessMessage("");
    setAction("delete");
    setActionTargetId(eventId);

    startTransition(async () => {
      try {
        await apiDelete<void>(`/api/events/${eventId}`);
        setEvents((currentEvents) =>
          currentEvents.filter((item) => item.eventId !== eventId),
        );
        if (selectedEventId === eventId) {
          setSelectedEventId(null);
          setEditForm({ name: "", date: "", detailsJson: "" });
        }
        setMeta((currentMeta) => ({
          ...currentMeta,
          total: Math.max(0, currentMeta.total - 1),
        }));
        setSuccessMessage("Event byl smazaný.");
        notifySuccess("Event byl smazaný.");
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
        eyebrow="Akce"
        title="Správa školních eventů"
        description="Přehled školních akcí, jejich termínů a doplňujících informací pro komunitní část platformy."
      />

      <ErrorNotice error={error} />
      <SuccessNotice message={successMessage} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Nový event</CardTitle>
            <CardDescription>
              Datum je volitelné a doplňující informace můžeš přidat jako strukturovaná metadata.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                id="create-event-name"
                label="Název"
                autoFocus
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((currentState) => ({
                    ...currentState,
                    name: event.target.value,
                  }))
                }
                placeholder="Např. Absolventský meetup"
                required
              />
              <Input
                id="create-event-date"
                label="Datum"
                type="date"
                value={createForm.date}
                onChange={(event) =>
                  setCreateForm((currentState) => ({
                    ...currentState,
                    date: event.target.value,
                  }))
                }
              />
              <Textarea
                id="create-event-details"
                label="Detaily (JSON)"
                value={createForm.detailsJson}
                onChange={(event) =>
                  setCreateForm((currentState) => ({
                    ...currentState,
                    detailsJson: event.target.value,
                  }))
                }
                placeholder={`{\n  "location": "DELTA",\n  "type": "meetup"\n}`}
                hint="Pole očekává validní JSON objekt."
              />
              <Button type="submit" disabled={isPending} size="lg">
                {isPending && action === "create" ? "Vytvářím..." : "Vytvořit event"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Přehled eventů</CardTitle>
              <CardDescription>
                {meta.total} eventů celkem, stránka {meta.page} z {Math.max(meta.totalPages, 1)}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <LoadingState
                  title="Načítám eventy"
                  description="Taháme seznam eventů z backendu."
                />
              ) : events.length === 0 ? (
                <EmptyState
                  title="Zatím tu nejsou žádné eventy"
                  description="Vytvoř první event a doplň komunitní stránku o důležité termíny."
                />
              ) : (
                events.map((event) => {
                  const isActionPending = isPending && actionTargetId === event.eventId;
                  const isSelected = selectedEventId === event.eventId;

                  return (
                    <div
                      key={event.eventId}
                      className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="brand">{event.name}</Badge>
                            <Badge variant="outline">#{event.eventId}</Badge>
                            {event.date ? (
                              <Badge variant="neutral">{formatDate(event.date)}</Badge>
                            ) : (
                              <Badge variant="accent">Bez data</Badge>
                            )}
                          </div>
                          <p className="break-words text-sm text-slate-600">
                            {event.detailsJson
                              ? "Obsahuje doplňující metadata k akci."
                              : "Bez doplňujících detailů."}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void loadEventDetail(event.eventId)}
                            disabled={isDetailLoading && actionTargetId === event.eventId}
                          >
                            {isDetailLoading && actionTargetId === event.eventId
                              ? "Načítám..."
                              : isSelected
                                ? "Obnovit detail"
                                : "Upravit"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(event)}
                            disabled={isActionPending}
                          >
                            {isActionPending && action === "delete" ? "Mažu..." : "Smazat"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Editor eventu</CardTitle>
              <CardDescription>
                Vyber akci ze seznamu a uprav její název, datum nebo doplňující informace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedEventId ? (
                <EmptyState
                  title="Vyber event k editaci"
                  description="Klikni v seznamu na Upravit a otevře se detail vybrané akce."
                />
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSave(selectedEventId);
                  }}
                  className="space-y-4"
                >
                  <Input
                    id="edit-event-name"
                    label="Název"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((currentState) => ({
                        ...currentState,
                        name: event.target.value,
                      }))
                    }
                  />
                  <Input
                    id="edit-event-date"
                    label="Datum"
                    type="date"
                    value={editForm.date}
                    onChange={(event) =>
                      setEditForm((currentState) => ({
                        ...currentState,
                        date: event.target.value,
                      }))
                    }
                  />
                  <Textarea
                    id="edit-event-details"
                    label="Detaily (JSON)"
                    value={editForm.detailsJson}
                    onChange={(event) =>
                      setEditForm((currentState) => ({
                        ...currentState,
                        detailsJson: event.target.value,
                      }))
                    }
                    placeholder={`{\n  "location": "DELTA",\n  "type": "meetup"\n}`}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="submit"
                      disabled={isPending && actionTargetId === selectedEventId}
                    >
                      {isPending && action === "save" && actionTargetId === selectedEventId
                        ? "Ukládám..."
                        : "Uložit změny"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSelectedEventId(null);
                        setEditForm({ name: "", date: "", detailsJson: "" });
                      }}
                      disabled={isPending && actionTargetId === selectedEventId}
                    >
                      Zavřít editor
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Smazat event?"
        description={
          deleteTarget ? `Opravdu chceš smazat event "${deleteTarget.name}"?` : ""
        }
        confirmLabel="Smazat event"
        pending={isPending && action === "delete" && actionTargetId === deleteTarget?.eventId}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            handleDelete(deleteTarget.eventId);
          }
        }}
      />
    </div>
  );
}

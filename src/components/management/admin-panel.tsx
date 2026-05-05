"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import type { MemeItem } from "@/components/memes/types";
import { readTagNames, tagsInputToObject, tagsObjectToInput } from "@/components/memes/types";
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
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { normalizeClientError, type ErrorState } from "@/lib/client-error";
import {
  createEmptyEventDetailsForm,
  detailsJsonToForm,
  eventDetailsFormToJson,
  getEventDetailEntries,
  type EventDetailsForm,
} from "@/lib/event-details";
import { cn, formatDate } from "@/lib/utils";

type AdminUser = {
  userId: number;
  username: string;
  email: string;
  role: "User" | "Moderator" | "Admin";
  schoolYear?: number | null;
  favoriteSubject?: string | null;
  createdAt: string;
};

type AdminCategory = {
  categoryId: number;
  name: string;
  description?: string | null;
};

type AdminComment = {
  commentId: number;
  memeId: number;
  text: string;
  createdAt: string;
  updatedAt?: string;
  author: {
    userId: number;
    username: string;
    email: string;
    role: string;
  };
  meme: {
    memeId: number;
    title?: string | null;
    imageUrl: string;
    createdAt: string;
  };
};

type AdminReport = {
  reportId: number;
  status: "pending" | "reviewed" | "rejected" | "resolved";
  reason: string;
  createdAt: string;
  meme: {
    memeId: number;
    title?: string | null;
    imageUrl: string;
    createdAt: string;
  };
  reporter: {
    userId: number;
    username: string;
    email: string;
    role: string;
  };
};

type AuditLog = {
  logId: number;
  action: string;
  tableName?: string | null;
  recordId?: number | null;
  timestamp: string;
  user?: {
    userId: number;
    username: string;
    email: string;
    role: string;
  } | null;
};

type AuditLogsResponse = {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type AdminEvent = {
  eventId: number;
  name: string;
  date?: string | null;
  detailsJson?: Record<string, unknown> | null;
};

type EventListResponse = {
  events: AdminEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type CurrentStaffUser = {
  userId: number;
  username: string;
  email: string;
  role: "Moderator" | "Admin";
};

type DeleteTarget =
  | { kind: "user"; id: number; label: string }
  | { kind: "meme"; id: number; label: string }
  | { kind: "comment"; id: number; memeId: number; label: string }
  | { kind: "category"; id: number; label: string }
  | { kind: "event"; id: number; label: string }
  | null;

const reportStatusOptions: Array<AdminReport["status"]> = [
  "pending",
  "reviewed",
  "rejected",
  "resolved",
];

const reportStatusLabels: Record<AdminReport["status"], string> = {
  pending: "Čeká na kontrolu",
  reviewed: "Zkontrolováno",
  rejected: "Zamítnuto",
  resolved: "Vyřešeno",
};

const auditActionLabels: Record<string, string> = {
  login: "Přihlášení",
  register: "Registrace",
  create_meme: "Vytvoření příspěvku",
  update_meme: "Úprava příspěvku",
  delete_meme: "Smazání příspěvku",
  create_comment: "Přidání komentáře",
  update_comment: "Úprava komentáře",
  delete_comment: "Smazání komentáře",
  report_meme: "Nahlášení příspěvku",
  admin_update_report: "Změna stavu nahlášení",
  create_category: "Vytvoření kategorie",
  update_category: "Úprava kategorie",
  delete_category: "Smazání kategorie",
  create_event: "Vytvoření akce",
  update_event: "Úprava akce",
  delete_event: "Smazání akce",
  seed_demo_refresh: "Obnovení demo prostředí",
  seed_demo_users: "Obnovení demo uživatelů",
  seed_demo_categories: "Obnovení demo kategorií",
  seed_demo_memes: "Obnovení demo příspěvků",
  seed_demo_reports: "Obnovení demo nahlášení",
  seed_demo_events: "Obnovení demo akcí",
};

function SectionCard({
  id,
  title,
  description,
  actions,
  children,
}: {
  id: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="min-w-0 overflow-hidden border-white/80 bg-white/92 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
      <CardHeader className="border-b border-slate-100">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription className="break-words">{description}</CardDescription>
          </div>
          {actions ? <div className="min-w-0 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">{children}</CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(248,250,252,0.92)_100%)]">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="font-medium text-slate-500">{label}:</span>
      <span className="min-w-0 break-words text-slate-700">{value}</span>
    </div>
  );
}

function EmptySection({ title, description }: { title: string; description: string }) {
  return <EmptyState title={title} description={description} />;
}

type EventFormState = {
  name: string;
  date: string;
  details: EventDetailsForm;
};

function createEmptyEventForm(): EventFormState {
  return {
    name: "",
    date: "",
    details: createEmptyEventDetailsForm(),
  };
}

function reportBadgeVariant(status: AdminReport["status"]) {
  if (status === "resolved") return "success";
  if (status === "reviewed") return "brand";
  if (status === "rejected") return "accent";
  return "neutral";
}

export function AdminPanel() {
  const [currentUser, setCurrentUser] = useState<CurrentStaffUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [memes, setMemes] = useState<MemeItem[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditMeta, setAuditMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [eventsMeta, setEventsMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [reportDrafts, setReportDrafts] = useState<Record<number, AdminReport["status"]>>({});

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    role: "User" as AdminUser["role"],
    schoolYear: "",
    favoriteSubject: "",
  });

  const [editingMemeId, setEditingMemeId] = useState<number | null>(null);
  const [memeForm, setMemeForm] = useState({
    title: "",
    categoryId: "",
    tags: "",
  });

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentForm, setCommentForm] = useState("");

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [newCategoryForm, setNewCategoryForm] = useState({ name: "", description: "" });

  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState<EventFormState>(createEmptyEventForm);
  const [newEventForm, setNewEventForm] = useState<EventFormState>(createEmptyEventForm);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [actionTargetId, setActionTargetId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { notifyError, notifySuccess } = useToast();
  const isModerator = currentUser?.role === "Moderator";

  useEffect(() => {
    let isMounted = true;

    async function loadAdminData() {
      setIsLoading(true);
      setError(null);

      try {
        const staffUser = await apiGet<CurrentStaffUser>("/api/auth/me", { cache: "no-store" });
        if (!isMounted) return;

        setCurrentUser(staffUser);

        if (staffUser.role === "Moderator") {
          const loadedReports = await apiGet<AdminReport[]>("/api/admin/reports", { cache: "no-store" });
          if (!isMounted) return;

          setUsers([]);
          setMemes([]);
          setComments([]);
          setCategories([]);
          setEvents([]);
          setAuditLogs([]);
          setEventsMeta({ total: 0, page: 1, totalPages: 0 });
          setAuditMeta({ total: 0, page: 1, totalPages: 0 });
          setReports(loadedReports);
          setReportDrafts(
            loadedReports.reduce<Record<number, AdminReport["status"]>>((acc, report) => {
              acc[report.reportId] = report.status;
              return acc;
            }, {}),
          );
          return;
        }

        const [
          loadedUsers,
          loadedMemes,
          loadedComments,
          loadedReports,
          loadedCategories,
          loadedEvents,
          loadedLogs,
        ] = await Promise.all([
          apiGet<AdminUser[]>("/api/users", { cache: "no-store" }),
          apiGet<MemeItem[]>("/api/admin/memes", { cache: "no-store" }),
          apiGet<AdminComment[]>("/api/admin/comments", { cache: "no-store" }),
          apiGet<AdminReport[]>("/api/admin/reports", { cache: "no-store" }),
          apiGet<AdminCategory[]>("/api/categories", { cache: "no-store" }),
          apiGet<EventListResponse>("/api/events?limit=100", { cache: "no-store" }),
          apiGet<AuditLogsResponse>("/api/admin/audit-logs?limit=100", { cache: "no-store" }),
        ]);

        if (!isMounted) return;

        setUsers(loadedUsers);
        setMemes(loadedMemes);
        setComments(loadedComments);
        setReports(loadedReports);
        setCategories(loadedCategories);
        setEvents(loadedEvents.events);
        setEventsMeta({
          total: loadedEvents.total,
          page: loadedEvents.page,
          totalPages: loadedEvents.totalPages,
        });
        setAuditLogs(loadedLogs.logs);
        setAuditMeta({
          total: loadedLogs.total,
          page: loadedLogs.page,
          totalPages: loadedLogs.totalPages,
        });
        setReportDrafts(
          loadedReports.reduce<Record<number, AdminReport["status"]>>((acc, report) => {
            acc[report.reportId] = report.status;
            return acc;
          }, {}),
        );
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

    void loadAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleActionError(sourceError: unknown) {
    const normalizedError = normalizeClientError(sourceError);
    setError(normalizedError);
    notifyError(normalizedError.message, normalizedError.details);
  }

  function resetMessages() {
    setError(null);
    setSuccessMessage("");
  }

  function beginUserEdit(user: AdminUser) {
    setEditingUserId(user.userId);
    setUserForm({
      username: user.username,
      email: user.email,
      role: user.role,
      schoolYear: user.schoolYear ? String(user.schoolYear) : "",
      favoriteSubject: user.favoriteSubject ?? "",
    });
    resetMessages();
  }

  function beginMemeEdit(meme: MemeItem) {
    setEditingMemeId(meme.memeId);
    setMemeForm({
      title: meme.title ?? "",
      categoryId: meme.categoryId ? String(meme.categoryId) : "",
      tags: tagsObjectToInput(meme.tags),
    });
    resetMessages();
  }

  function beginCommentEdit(comment: AdminComment) {
    setEditingCommentId(comment.commentId);
    setCommentForm(comment.text);
    resetMessages();
  }

  function beginCategoryEdit(category: AdminCategory) {
    setEditingCategoryId(category.categoryId);
    setCategoryForm({
      name: category.name,
      description: category.description ?? "",
    });
    resetMessages();
  }

  function beginEventEdit(event: AdminEvent) {
    setEditingEventId(event.eventId);
    setEventForm({
      name: event.name,
      date: event.date ? event.date.slice(0, 10) : "",
      details: detailsJsonToForm(event.detailsJson),
    });
    resetMessages();
  }

  function handleUserSave(userId: number) {
    resetMessages();
    setActionKey("save-user");
    setActionTargetId(userId);

    startTransition(async () => {
      try {
        const updated = await apiPatch<AdminUser>(`/api/users/${userId}`, {
          username: userForm.username.trim(),
          email: userForm.email.trim(),
          role: userForm.role,
          schoolYear: userForm.schoolYear ? Number(userForm.schoolYear) : null,
          favoriteSubject: userForm.favoriteSubject.trim() || null,
        });

        setUsers((current) =>
          current.map((user) => (user.userId === userId ? updated : user)),
        );
        setEditingUserId(null);
        setSuccessMessage(`Uživatel #${userId} byl upravený.`);
        notifySuccess(`Uživatel #${userId} byl upravený.`);
      } catch (saveError) {
        handleActionError(saveError);
      } finally {
        setActionKey(null);
        setActionTargetId(null);
      }
    });
  }

  function handleMemeSave(memeId: number) {
    resetMessages();
    setActionKey("save-meme");
    setActionTargetId(memeId);

    startTransition(async () => {
      try {
        const updated = await apiPatch<MemeItem>(`/api/memes/${memeId}`, {
          title: memeForm.title.trim() || null,
          categoryId: memeForm.categoryId ? Number(memeForm.categoryId) : null,
          tags: tagsInputToObject(memeForm.tags),
        });

        setMemes((current) =>
          current.map((meme) => (meme.memeId === memeId ? updated : meme)),
        );
        setEditingMemeId(null);
        setSuccessMessage(`Post #${memeId} byl upravený.`);
        notifySuccess(`Post #${memeId} byl upravený.`);
      } catch (saveError) {
        handleActionError(saveError);
      } finally {
        setActionKey(null);
        setActionTargetId(null);
      }
    });
  }

  function handleCommentSave(commentId: number, memeId: number) {
    if (!commentForm.trim()) {
      setError({ message: "Komentář nesmí být prázdný.", details: [] });
      return;
    }

    resetMessages();
    setActionKey("save-comment");
    setActionTargetId(commentId);

    startTransition(async () => {
      try {
        const updated = await apiPatch<AdminComment>(`/api/memes/${memeId}/comments/${commentId}`, {
          text: commentForm.trim(),
        });

        setComments((current) =>
          current.map((comment) =>
            comment.commentId === commentId
              ? {
                  ...comment,
                  ...updated,
                  meme: comment.meme,
                }
              : comment,
          ),
        );
        setEditingCommentId(null);
        setCommentForm("");
        setSuccessMessage(`Komentář #${commentId} byl upravený.`);
        notifySuccess(`Komentář #${commentId} byl upravený.`);
      } catch (saveError) {
        handleActionError(saveError);
      } finally {
        setActionKey(null);
        setActionTargetId(null);
      }
    });
  }

  function handleReportSave(reportId: number) {
    const nextStatus = reportDrafts[reportId];
    if (!nextStatus) return;

    resetMessages();
    setActionKey("save-report");
    setActionTargetId(reportId);

    startTransition(async () => {
      try {
        const updated = await apiPatch<AdminReport>(`/api/admin/reports/${reportId}`, {
          status: nextStatus,
        });

        setReports((current) =>
          current.map((report) => (report.reportId === reportId ? updated : report)),
        );
        setReportDrafts((current) => ({ ...current, [reportId]: updated.status }));
        setSuccessMessage(`Report #${reportId} byl aktualizovaný.`);
        notifySuccess(`Report #${reportId} byl aktualizovaný.`);
      } catch (saveError) {
        handleActionError(saveError);
      } finally {
        setActionKey(null);
        setActionTargetId(null);
      }
    });
  }

  function handleCategoryCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newCategoryForm.name.trim()) {
      setError({ message: "Název kategorie je povinný.", details: [] });
      return;
    }

    resetMessages();
    setActionKey("create-category");
    setActionTargetId(null);

    startTransition(async () => {
      try {
        const created = await apiPost<AdminCategory>("/api/categories", {
          name: newCategoryForm.name.trim(),
          description: newCategoryForm.description.trim() || undefined,
        });

        setCategories((current) =>
          [...current, created].sort((a, b) => a.name.localeCompare(b.name, "cs")),
        );
        setNewCategoryForm({ name: "", description: "" });
        setSuccessMessage("Kategorie byla vytvořená.");
        notifySuccess("Kategorie byla vytvořená.");
      } catch (createError) {
        handleActionError(createError);
      } finally {
        setActionKey(null);
      }
    });
  }

  function handleCategorySave(categoryId: number) {
    if (!categoryForm.name.trim()) {
      setError({ message: "Název kategorie je povinný.", details: [] });
      return;
    }

    resetMessages();
    setActionKey("save-category");
    setActionTargetId(categoryId);

    startTransition(async () => {
      try {
        const updated = await apiPatch<AdminCategory>(`/api/categories/${categoryId}`, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || null,
        });

        setCategories((current) =>
          current
            .map((category) => (category.categoryId === categoryId ? updated : category))
            .sort((a, b) => a.name.localeCompare(b.name, "cs")),
        );
        setEditingCategoryId(null);
        setSuccessMessage("Kategorie byla upravená.");
        notifySuccess("Kategorie byla upravená.");
      } catch (saveError) {
        handleActionError(saveError);
      } finally {
        setActionKey(null);
        setActionTargetId(null);
      }
    });
  }

  function handleEventCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newEventForm.name.trim()) {
      setError({ message: "Název akce je povinný.", details: [] });
      return;
    }

    resetMessages();
    setActionKey("create-event");

    startTransition(async () => {
      try {
        const created = await apiPost<AdminEvent>("/api/events", {
          name: newEventForm.name.trim(),
          date: newEventForm.date || null,
          detailsJson: eventDetailsFormToJson(newEventForm.details),
        });

        setEvents((current) => [...current, created]);
        setEventsMeta((current) => ({ ...current, total: current.total + 1 }));
        setNewEventForm(createEmptyEventForm());
        setSuccessMessage("Akce byla vytvořená.");
        notifySuccess("Akce byla vytvořená.");
      } catch (createError) {
        handleActionError(createError);
      } finally {
        setActionKey(null);
      }
    });
  }

  function handleEventSave(eventId: number) {
    if (!eventForm.name.trim()) {
      setError({ message: "Název akce je povinný.", details: [] });
      return;
    }

    resetMessages();
    setActionKey("save-event");
    setActionTargetId(eventId);

    startTransition(async () => {
      try {
        const updated = await apiPatch<AdminEvent>(`/api/events/${eventId}`, {
          name: eventForm.name.trim(),
          date: eventForm.date || null,
          detailsJson: eventDetailsFormToJson(eventForm.details),
        });

        setEvents((current) =>
          current.map((item) => (item.eventId === eventId ? updated : item)),
        );
        setEditingEventId(null);
        setSuccessMessage("Akce byla upravená.");
        notifySuccess("Akce byla upravená.");
      } catch (saveError) {
        handleActionError(saveError);
      } finally {
        setActionKey(null);
        setActionTargetId(null);
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;

    resetMessages();
    setActionKey(`delete-${deleteTarget.kind}`);
    setActionTargetId(deleteTarget.id);

    startTransition(async () => {
      try {
        if (deleteTarget.kind === "user") {
          await apiDelete<void>(`/api/users/${deleteTarget.id}`);
          setUsers((current) => current.filter((user) => user.userId !== deleteTarget.id));
          if (editingUserId === deleteTarget.id) {
            setEditingUserId(null);
          }
          setSuccessMessage("Účet byl smazaný.");
          notifySuccess("Účet byl smazaný.");
        }

        if (deleteTarget.kind === "meme") {
          await apiDelete<void>(`/api/memes/${deleteTarget.id}`);
          setMemes((current) => current.filter((meme) => meme.memeId !== deleteTarget.id));
          setComments((current) => current.filter((comment) => comment.memeId !== deleteTarget.id));
          setReports((current) => current.filter((report) => report.meme.memeId !== deleteTarget.id));
          if (editingMemeId === deleteTarget.id) {
            setEditingMemeId(null);
          }
          setSuccessMessage("Post byl smazaný.");
          notifySuccess("Post byl smazaný.");
        }

        if (deleteTarget.kind === "comment") {
          await apiDelete<void>(`/api/memes/${deleteTarget.memeId}/comments/${deleteTarget.id}`);
          setComments((current) => current.filter((comment) => comment.commentId !== deleteTarget.id));
          if (editingCommentId === deleteTarget.id) {
            setEditingCommentId(null);
            setCommentForm("");
          }
          setSuccessMessage("Komentář byl smazaný.");
          notifySuccess("Komentář byl smazaný.");
        }

        if (deleteTarget.kind === "category") {
          await apiDelete<void>(`/api/categories/${deleteTarget.id}`);
          setCategories((current) => current.filter((category) => category.categoryId !== deleteTarget.id));
          setMemes((current) =>
            current.map((meme) =>
              meme.categoryId === deleteTarget.id
                ? { ...meme, categoryId: null, category: null }
                : meme,
            ),
          );
          if (editingCategoryId === deleteTarget.id) {
            setEditingCategoryId(null);
          }
          setSuccessMessage("Kategorie byla smazaná.");
          notifySuccess("Kategorie byla smazaná.");
        }

        if (deleteTarget.kind === "event") {
          await apiDelete<void>(`/api/events/${deleteTarget.id}`);
          setEvents((current) => current.filter((item) => item.eventId !== deleteTarget.id));
          setEventsMeta((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
          if (editingEventId === deleteTarget.id) {
            setEditingEventId(null);
          }
          setSuccessMessage("Akce byla smazaná.");
          notifySuccess("Akce byla smazaná.");
        }

        setDeleteTarget(null);
      } catch (deleteError) {
        handleActionError(deleteError);
      } finally {
        setActionKey(null);
        setActionTargetId(null);
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow={isModerator ? "Moderace" : "Admin"}
          title={isModerator ? "Moderátorské centrum" : "Řídicí centrum aplikace"}
          description={
            isModerator
              ? "Připravuji sekci pro řešení nahlášení a zásahy do nevhodného obsahu."
              : "Připravuji sekce pro správu uživatelů, obsahu, reportů a interních záznamů."
          }
        />
        <LoadingState
          title="Načítám administraci"
          description={
            isModerator
              ? "Sbírám nahlášení a potřebná data pro moderaci."
              : "Sbírám data napříč celou aplikací, aby byl dashboard opravdu použitelný."
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        eyebrow={isModerator ? "Moderace" : "Admin"}
        title={isModerator ? "Moderátorské centrum" : "Řídicí centrum aplikace"}
        description={
          isModerator
            ? "Vyhrazená část pro práci s nahlášeními a odstranění nevhodného obsahu."
            : "Jedno místo pro správu účtů, obsahu, reportů, kategorií, akcí i auditních stop."
        }
        actions={
          <div className="flex min-w-0 flex-wrap gap-2">
            <a href="#reports" className={buttonStyles({ variant: "secondary", size: "sm" })}>
              Reports
            </a>
            {!isModerator ? (
              <a href="#users" className={buttonStyles({ variant: "secondary", size: "sm" })}>
                Users
              </a>
            ) : null}
            {!isModerator ? (
              <a href="#audit" className={buttonStyles({ variant: "secondary", size: "sm" })}>
                Audit logs
              </a>
            ) : null}
          </div>
        }
      />

      <ErrorNotice error={error} />
      <SuccessNotice message={successMessage} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isModerator ? (
          <>
            <MetricCard label="Reports" value={reports.length} />
            <MetricCard
              label="Pending reports"
              value={reports.filter((report) => report.status === "pending").length}
            />
          </>
        ) : (
          <>
            <MetricCard label="Users" value={users.length} />
            <MetricCard label="Memes" value={memes.length} />
            <MetricCard label="Comments" value={comments.length} />
            <MetricCard
              label="Pending reports"
              value={reports.filter((report) => report.status === "pending").length}
            />
          </>
        )}
      </div>

      {!isModerator ? (
      <SectionCard
        id="users"
        title="Users"
        description="Správa účtů, rolí a profilových údajů. Admin zde vidí i interní metadata účtů."
      >
        {users.length === 0 ? (
          <EmptySection title="Žádné účty" description="Backend nevrátil žádné uživatele." />
        ) : (
          <div className="space-y-4">
            {users.map((user) => {
              const isEditing = editingUserId === user.userId;
              const isRowPending = isPending && actionTargetId === user.userId;

              return (
                <div key={user.userId} className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  {isEditing ? (
                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="brand">Editace účtu</Badge>
                        <Badge variant="outline">#{user.userId}</Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          id={`user-username-${user.userId}`}
                          label="Username"
                          value={userForm.username}
                          onChange={(event) => setUserForm((current) => ({ ...current, username: event.target.value }))}
                        />
                        <Input
                          id={`user-email-${user.userId}`}
                          label="E-mail"
                          type="email"
                          value={userForm.email}
                          onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                        />
                        <label className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-slate-700">Role</span>
                          <select
                            value={userForm.role}
                            onChange={(event) =>
                              setUserForm((current) => ({
                                ...current,
                                role: event.target.value as AdminUser["role"],
                              }))
                            }
                            className={cn(fieldClassName, "appearance-none")}
                          >
                            <option value="User">User</option>
                            <option value="Moderator">Moderator</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </label>
                        <Input
                          id={`user-schoolyear-${user.userId}`}
                          label="Ročník"
                          type="number"
                          min={1}
                          max={4}
                          value={userForm.schoolYear}
                          onChange={(event) => setUserForm((current) => ({ ...current, schoolYear: event.target.value }))}
                        />
                        <Input
                          id={`user-favorite-${user.userId}`}
                          label="Oblíbený předmět"
                          value={userForm.favoriteSubject}
                          onChange={(event) =>
                            setUserForm((current) => ({ ...current, favoriteSubject: event.target.value }))
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={() => handleUserSave(user.userId)} disabled={isRowPending}>
                          {isRowPending && actionKey === "save-user" ? "Ukládám..." : "Uložit"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingUserId(null)} disabled={isRowPending}>
                          Zrušit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-semibold text-slate-950">{user.username}</h3>
                          <Badge variant={user.role === "Admin" ? "brand" : user.role === "Moderator" ? "accent" : "outline"}>{user.role}</Badge>
                          <Badge variant="neutral">#{user.userId}</Badge>
                        </div>
                        <MetaRow label="E-mail" value={user.email} />
                        <MetaRow label="Ročník" value={user.schoolYear ?? "—"} />
                        <MetaRow label="Oblíbený předmět" value={user.favoriteSubject || "—"} />
                        <MetaRow label="Vytvořeno" value={formatDate(user.createdAt)} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => beginUserEdit(user)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "user",
                              id: user.userId,
                              label: `smazat účet ${user.username}`,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      ) : null}

      {!isModerator ? (
      <SectionCard
        id="memes"
        title="Memes"
        description="Moderace a úpravy všech příspěvků včetně interních dat, category vazby, tagů a počtu reakcí."
      >
        {memes.length === 0 ? (
          <EmptySection title="Žádné posty" description="V systému zatím nejsou žádné memy." />
        ) : (
          <div className="space-y-4">
            {memes.map((meme) => {
              const isEditing = editingMemeId === meme.memeId;
              const isRowPending = isPending && actionTargetId === meme.memeId;
              const tags = readTagNames(meme.tags);

              return (
                <div key={meme.memeId} className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  {isEditing ? (
                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="brand">Editace postu</Badge>
                        <Badge variant="outline">#{meme.memeId}</Badge>
                      </div>
                      <Input
                        id={`meme-title-${meme.memeId}`}
                        label="Titulek"
                        value={memeForm.title}
                        onChange={(event) => setMemeForm((current) => ({ ...current, title: event.target.value }))}
                      />
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700">Kategorie</span>
                        <select
                          value={memeForm.categoryId}
                          onChange={(event) =>
                            setMemeForm((current) => ({ ...current, categoryId: event.target.value }))
                          }
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
                        id={`meme-tags-${meme.memeId}`}
                        label="Tagy"
                        value={memeForm.tags}
                        onChange={(event) => setMemeForm((current) => ({ ...current, tags: event.target.value }))}
                        placeholder="skola,humor"
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={() => handleMemeSave(meme.memeId)} disabled={isRowPending}>
                          {isRowPending && actionKey === "save-meme" ? "Ukládám..." : "Uložit"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingMemeId(null)} disabled={isRowPending}>
                          Zrušit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
                        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                          <img src={meme.imageUrl} alt={meme.title || "Meme"} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-lg font-semibold text-slate-950">{meme.title || "Bez názvu"}</h3>
                            <Badge variant="outline">#{meme.memeId}</Badge>
                            {meme.category ? <Badge variant="brand">{meme.category.name}</Badge> : null}
                          </div>
                          <MetaRow label="Autor" value={`@${meme.author.username} (${meme.author.userId})`} />
                          <MetaRow label="Vytvořeno" value={formatDate(meme.createdAt)} />
                          <MetaRow label="URL obrázku" value={<span className="break-all">{meme.imageUrl}</span>} />
                          <MetaRow label="Lajky" value={meme.likeCount} />
                          <MetaRow label="Komentáře" value={meme.commentCount} />
                          <div className="flex flex-wrap gap-2">
                            {tags.length > 0 ? tags.map((tag) => <Badge key={tag} variant="outline">#{tag}</Badge>) : <span className="text-sm text-slate-500">Bez tagů</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/memes/${meme.memeId}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>
                          Detail
                        </Link>
                        <Button type="button" variant="secondary" size="sm" onClick={() => beginMemeEdit(meme)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "meme",
                              id: meme.memeId,
                              label: `smazat post #${meme.memeId}`,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      ) : null}

      {!isModerator ? (
      <SectionCard
        id="comments"
        title="Comments"
        description="Centrální moderace komentářů napříč všemi memy včetně rychlé editace a smazání."
      >
        {comments.length === 0 ? (
          <EmptySection title="Žádné komentáře" description="Backend zatím nevrátil žádné komentáře." />
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isEditing = editingCommentId === comment.commentId;
              const isRowPending = isPending && actionTargetId === comment.commentId;

              return (
                <div key={comment.commentId} className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  {isEditing ? (
                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="brand">Editace komentáře</Badge>
                        <Badge variant="outline">#{comment.commentId}</Badge>
                        <Badge variant="neutral">Meme #{comment.meme.memeId}</Badge>
                      </div>
                      <Textarea
                        id={`comment-text-${comment.commentId}`}
                        label="Text komentáře"
                        value={commentForm}
                        onChange={(event) => setCommentForm(event.target.value)}
                        maxLength={1000}
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={() => handleCommentSave(comment.commentId, comment.memeId)} disabled={isRowPending}>
                          {isRowPending && actionKey === "save-comment" ? "Ukládám..." : "Uložit"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingCommentId(null)} disabled={isRowPending}>
                          Zrušit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-base font-semibold text-slate-950">{comment.meme.title || "Bez názvu"}</h3>
                          <Badge variant="outline">Komentář #{comment.commentId}</Badge>
                          <Badge variant="neutral">Meme #{comment.meme.memeId}</Badge>
                        </div>
                        <p className="max-w-3xl whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{comment.text}</p>
                        <MetaRow label="Autor" value={`${comment.author.username} (${comment.author.email})`} />
                        <MetaRow label="Vytvořeno" value={formatDate(comment.createdAt)} />
                        <MetaRow label="Updated" value={comment.updatedAt ? formatDate(comment.updatedAt) : "—"} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => beginCommentEdit(comment)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "comment",
                              id: comment.commentId,
                              memeId: comment.memeId,
                              label: `smazat komentář #${comment.commentId}`,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      ) : null}

      <SectionCard
        id="reports"
        title="Reports"
        description="Řízení nahlášení s možností měnit status a rovnou odstranit nevhodný obsah."
      >
        {reports.length === 0 ? (
          <EmptySection title="Žádné reporty" description="V systému zatím nejsou žádná nahlášení." />
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const draftStatus = reportDrafts[report.reportId] ?? report.status;
              const isRowPending = isPending && actionTargetId === report.reportId;

              return (
                <div key={report.reportId} className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-lg font-semibold text-slate-950">{report.meme.title || "Bez názvu"}</h3>
                        <Badge variant="outline">Report #{report.reportId}</Badge>
                        <Badge variant={reportBadgeVariant(report.status)}>{reportStatusLabels[report.status]}</Badge>
                      </div>
                      <p className="max-w-3xl whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{report.reason}</p>
                      <MetaRow label="Meme ID" value={report.meme.memeId} />
                      <MetaRow label="Reporter" value={`${report.reporter.username} (${report.reporter.email})`} />
                      <MetaRow label="Vytvořeno" value={formatDate(report.createdAt)} />
                    </div>
                    <div className="flex min-w-0 xl:min-w-[18rem] flex-col gap-2">
                      <select
                        value={draftStatus}
                        onChange={(event) =>
                          setReportDrafts((current) => ({
                            ...current,
                            [report.reportId]: event.target.value as AdminReport["status"],
                          }))
                        }
                        className={cn(fieldClassName, "appearance-none py-2")}
                      >
                        {reportStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {reportStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={() => handleReportSave(report.reportId)} disabled={isRowPending || draftStatus === report.status}>
                          {isRowPending && actionKey === "save-report" ? "Ukládám..." : "Change status"}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "meme",
                              id: report.meme.memeId,
                              label: `smazat nahlášený post #${report.meme.memeId}`,
                            })
                          }
                        >
                          Delete meme
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {!isModerator ? (
      <SectionCard
        id="categories"
        title="Categories"
        description="Správa taxonomy pro meme feed. Tady patří technické identifikátory a operace nad kategoriemi."
      >
        <Card className="min-w-0 border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Nová kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCategoryCreate} className="grid gap-4 xl:grid-cols-[1fr_1.2fr_auto] xl:items-end">
              <Input
                id="new-category-name"
                label="Název"
                value={newCategoryForm.name}
                onChange={(event) => setNewCategoryForm((current) => ({ ...current, name: event.target.value }))}
              />
              <Input
                id="new-category-description"
                label="Popis"
                value={newCategoryForm.description}
                onChange={(event) =>
                  setNewCategoryForm((current) => ({ ...current, description: event.target.value }))
                }
              />
              <Button type="submit" disabled={isPending}>
                {isPending && actionKey === "create-category" ? "Vytvářím..." : "Vytvořit"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {categories.length === 0 ? (
          <EmptySection title="Žádné kategorie" description="Vytvoř první kategorii pro obsah feedu." />
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const isEditing = editingCategoryId === category.categoryId;
              const isRowPending = isPending && actionTargetId === category.categoryId;

              return (
                <div key={category.categoryId} className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  {isEditing ? (
                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="brand">Editace kategorie</Badge>
                        <Badge variant="outline">#{category.categoryId}</Badge>
                      </div>
                      <Input
                        id={`category-name-${category.categoryId}`}
                        label="Název"
                        value={categoryForm.name}
                        onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                      />
                      <Textarea
                        id={`category-description-${category.categoryId}`}
                        label="Popis"
                        value={categoryForm.description}
                        onChange={(event) =>
                          setCategoryForm((current) => ({ ...current, description: event.target.value }))
                        }
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={() => handleCategorySave(category.categoryId)} disabled={isRowPending}>
                          {isRowPending && actionKey === "save-category" ? "Ukládám..." : "Uložit"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingCategoryId(null)} disabled={isRowPending}>
                          Zrušit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-semibold text-slate-950">{category.name}</h3>
                          <Badge variant="outline">#{category.categoryId}</Badge>
                        </div>
                        <p className="break-words text-sm text-slate-700">{category.description || "Bez popisu"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => beginCategoryEdit(category)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "category",
                              id: category.categoryId,
                              label: `smazat kategorii ${category.name}`,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      ) : null}

      {!isModerator ? (
      <SectionCard
        id="events"
        title="Events"
        description={`Správa školních akcí a jejich strukturovaných metadat. Načteno ${eventsMeta.total} položek.`}
      >
        <Card className="min-w-0 border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Nová akce</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEventCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="new-event-name"
                  label="Název"
                  value={newEventForm.name}
                  onChange={(event) => setNewEventForm((current) => ({ ...current, name: event.target.value }))}
                />
                <Input
                  id="new-event-date"
                  label="Datum"
                  type="date"
                  value={newEventForm.date}
                  onChange={(event) => setNewEventForm((current) => ({ ...current, date: event.target.value }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  id="new-event-location"
                  label="Místo"
                  value={newEventForm.details.location}
                  onChange={(event) =>
                    setNewEventForm((current) => ({
                      ...current,
                      details: { ...current.details, location: event.target.value },
                    }))
                  }
                />
                <Input
                  id="new-event-type"
                  label="Typ akce"
                  value={newEventForm.details.type}
                  onChange={(event) =>
                    setNewEventForm((current) => ({
                      ...current,
                      details: { ...current.details, type: event.target.value },
                    }))
                  }
                />
                <Input
                  id="new-event-audience"
                  label="Pro koho"
                  value={newEventForm.details.audience}
                  onChange={(event) =>
                    setNewEventForm((current) => ({
                      ...current,
                      details: { ...current.details, audience: event.target.value },
                    }))
                  }
                />
                <Input
                  id="new-event-speaker"
                  label="Přednášející / organizátor"
                  value={newEventForm.details.speaker}
                  onChange={(event) =>
                    setNewEventForm((current) => ({
                      ...current,
                      details: { ...current.details, speaker: event.target.value },
                    }))
                  }
                />
                <Input
                  id="new-event-capacity"
                  label="Kapacita"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={newEventForm.details.capacity}
                  onChange={(event) =>
                    setNewEventForm((current) => ({
                      ...current,
                      details: { ...current.details, capacity: event.target.value },
                    }))
                  }
                />
                <Input
                  id="new-event-prize"
                  label="Cena / odměna"
                  value={newEventForm.details.prize}
                  onChange={(event) =>
                    setNewEventForm((current) => ({
                      ...current,
                      details: { ...current.details, prize: event.target.value },
                    }))
                  }
                />
              </div>
              <Textarea
                id="new-event-agenda"
                label="Agenda"
                value={newEventForm.details.agenda}
                onChange={(event) =>
                  setNewEventForm((current) => ({
                    ...current,
                    details: { ...current.details, agenda: event.target.value },
                  }))
                }
                hint="Každý bod napiš na samostatný řádek."
              />
              <Textarea
                id="new-event-description"
                label="Poznámka"
                value={newEventForm.details.description}
                onChange={(event) =>
                  setNewEventForm((current) => ({
                    ...current,
                    details: { ...current.details, description: event.target.value },
                  }))
                }
              />
              <Button type="submit" disabled={isPending}>
                {isPending && actionKey === "create-event" ? "Vytvářím..." : "Vytvořit akci"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {events.length === 0 ? (
          <EmptySection title="Žádné akce" description="V systému zatím nejsou žádné eventy." />
        ) : (
          <div className="space-y-4">
            {events.map((eventItem) => {
              const isEditing = editingEventId === eventItem.eventId;
              const isRowPending = isPending && actionTargetId === eventItem.eventId;
              const detailEntries = getEventDetailEntries(eventItem.detailsJson);

              return (
                <div key={eventItem.eventId} className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  {isEditing ? (
                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="brand">Editace akce</Badge>
                        <Badge variant="outline">#{eventItem.eventId}</Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          id={`event-name-${eventItem.eventId}`}
                          label="Název"
                          value={eventForm.name}
                          onChange={(event) => setEventForm((current) => ({ ...current, name: event.target.value }))}
                        />
                        <Input
                          id={`event-date-${eventItem.eventId}`}
                          label="Datum"
                          type="date"
                          value={eventForm.date}
                          onChange={(event) => setEventForm((current) => ({ ...current, date: event.target.value }))}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          id={`event-location-${eventItem.eventId}`}
                          label="Místo"
                          value={eventForm.details.location}
                          onChange={(event) =>
                            setEventForm((current) => ({
                              ...current,
                              details: { ...current.details, location: event.target.value },
                            }))
                          }
                        />
                        <Input
                          id={`event-type-${eventItem.eventId}`}
                          label="Typ akce"
                          value={eventForm.details.type}
                          onChange={(event) =>
                            setEventForm((current) => ({
                              ...current,
                              details: { ...current.details, type: event.target.value },
                            }))
                          }
                        />
                        <Input
                          id={`event-audience-${eventItem.eventId}`}
                          label="Pro koho"
                          value={eventForm.details.audience}
                          onChange={(event) =>
                            setEventForm((current) => ({
                              ...current,
                              details: { ...current.details, audience: event.target.value },
                            }))
                          }
                        />
                        <Input
                          id={`event-speaker-${eventItem.eventId}`}
                          label="Přednášející / organizátor"
                          value={eventForm.details.speaker}
                          onChange={(event) =>
                            setEventForm((current) => ({
                              ...current,
                              details: { ...current.details, speaker: event.target.value },
                            }))
                          }
                        />
                        <Input
                          id={`event-capacity-${eventItem.eventId}`}
                          label="Kapacita"
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={eventForm.details.capacity}
                          onChange={(event) =>
                            setEventForm((current) => ({
                              ...current,
                              details: { ...current.details, capacity: event.target.value },
                            }))
                          }
                        />
                        <Input
                          id={`event-prize-${eventItem.eventId}`}
                          label="Cena / odměna"
                          value={eventForm.details.prize}
                          onChange={(event) =>
                            setEventForm((current) => ({
                              ...current,
                              details: { ...current.details, prize: event.target.value },
                            }))
                          }
                        />
                      </div>
                      <Textarea
                        id={`event-agenda-${eventItem.eventId}`}
                        label="Agenda"
                        value={eventForm.details.agenda}
                        onChange={(event) =>
                          setEventForm((current) => ({
                            ...current,
                            details: { ...current.details, agenda: event.target.value },
                          }))
                        }
                        hint="Každý bod napiš na samostatný řádek."
                      />
                      <Textarea
                        id={`event-description-${eventItem.eventId}`}
                        label="Poznámka"
                        value={eventForm.details.description}
                        onChange={(event) =>
                          setEventForm((current) => ({
                            ...current,
                            details: { ...current.details, description: event.target.value },
                          }))
                        }
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" onClick={() => handleEventSave(eventItem.eventId)} disabled={isRowPending}>
                          {isRowPending && actionKey === "save-event" ? "Ukládám..." : "Uložit"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingEventId(null)} disabled={isRowPending}>
                          Zrušit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-semibold text-slate-950">{eventItem.name}</h3>
                          <Badge variant="outline">#{eventItem.eventId}</Badge>
                        </div>
                        <MetaRow label="Datum" value={eventItem.date ? formatDate(eventItem.date) : "Bez termínu"} />
                        {detailEntries.length > 0 ? (
                          detailEntries.map((entry) => (
                            <MetaRow key={`${eventItem.eventId}-${entry.label}`} label={entry.label} value={entry.value} />
                          ))
                        ) : (
                          <MetaRow label="Detaily" value="—" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => beginEventEdit(eventItem)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setDeleteTarget({
                              kind: "event",
                              id: eventItem.eventId,
                              label: `smazat akci ${eventItem.name}`,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
      ) : null}

      {!isModerator ? (
      <SectionCard
        id="audit"
        title="Audit logs"
        description={`Read-only stopa interních operací. Načteno ${auditMeta.total} záznamů, stránka ${auditMeta.page}/${Math.max(auditMeta.totalPages, 1)}.`}
      >
        {auditLogs.length === 0 ? (
          <EmptySection title="Žádné audit logy" description="Backend nevrátil žádné auditní záznamy." />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">Čas</th>
                  <th className="px-3 py-3 font-medium">Akce</th>
                  <th className="px-3 py-3 font-medium">Uživatel</th>
                  <th className="px-3 py-3 font-medium">Tabulka</th>
                  <th className="px-3 py-3 font-medium">Record ID</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.logId} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-4 text-slate-600 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="px-3 py-4">
                      <Badge variant="outline">{auditActionLabels[log.action] ?? log.action}</Badge>
                    </td>
                    <td className="px-3 py-4">
                      {log.user ? (
                        <div className="min-w-0 space-y-1">
                          <div className="break-words font-medium text-slate-900">{log.user.username}</div>
                          <div className="break-all text-slate-500">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500">Systém</span>
                      )}
                    </td>
                    <td className="px-3 py-4 break-words text-slate-600">{log.tableName || "—"}</td>
                    <td className="px-3 py-4 text-slate-600">{log.recordId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Potvrdit smazání"
        description={deleteTarget ? `Opravdu chceš ${deleteTarget.label}?` : ""}
        confirmLabel="Smazat"
        pending={Boolean(isPending && deleteTarget && actionTargetId === deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

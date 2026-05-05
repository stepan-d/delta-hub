"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/feedback-notice";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast-provider";
import { normalizeClientError, type ErrorState } from "@/lib/client-error";

type AuthUser = {
  userId: number;
  username: string;
  email: string;
  role: string;
  schoolYear?: number | null;
  favoriteSubject?: string | null;
};

type UserCardProps = {
  user: AuthUser;
  onLogout: () => void;
  pending: boolean;
};

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

type RegisterFieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  schoolYear?: string;
  favoriteSubject?: string;
};

async function fetchCurrentUser() {
  return apiGet<AuthUser>("/api/auth/me", { cache: "no-store" });
}

function validateLogin(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!email.trim()) {
    errors.email = "Vyplň email.";
  } else if (!email.includes("@")) {
    errors.email = "Email musí mít platný formát.";
  }

  if (!password.trim()) {
    errors.password = "Vyplň heslo.";
  }

  return errors;
}

function validateRegister(formState: {
  username: string;
  email: string;
  password: string;
  schoolYear: string;
  favoriteSubject: string;
}): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  if (!formState.username.trim()) {
    errors.username = "Vyplň uživatelské jméno.";
  }

  if (!formState.email.trim()) {
    errors.email = "Vyplň email.";
  } else if (!formState.email.includes("@")) {
    errors.email = "Email musí mít platný formát.";
  }

  if (!formState.password.trim()) {
    errors.password = "Vyplň heslo.";
  } else if (formState.password.trim().length < 8) {
    errors.password = "Heslo musí mít alespoň 8 znaků.";
  }

  if (formState.schoolYear) {
    const schoolYear = Number(formState.schoolYear);
    if (!Number.isInteger(schoolYear) || schoolYear < 1 || schoolYear > 4) {
      errors.schoolYear = "Ročník musí být číslo od 1 do 4.";
    }
  }

  if (formState.favoriteSubject.trim().length > 80) {
    errors.favoriteSubject = "Oblíbený předmět zkrať na 80 znaků nebo méně.";
  }

  return errors;
}

function UserCard({ user, onLogout, pending }: UserCardProps) {
  return (
    <Card className="min-w-0 overflow-hidden border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)]">
      <CardContent className="p-6">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Aktivní session</Badge>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <h3 className="mt-3 break-words text-2xl font-semibold text-slate-950">{user.username}</h3>
            <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
          </div>

          <Button type="button" onClick={onLogout} disabled={pending} variant="secondary">
            {pending ? "Odhlašuji..." : "Odhlásit se"}
          </Button>
        </div>

        <dl className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">ID</dt>
            <dd className="mt-1 break-words text-sm text-slate-800">{user.userId}</dd>
          </div>
          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Role</dt>
            <dd className="mt-1 break-words text-sm text-slate-800">{user.role}</dd>
          </div>
          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Ročník
            </dt>
            <dd className="mt-1 break-words text-sm text-slate-800">
              {user.schoolYear ?? "není vyplněno"}
            </dd>
          </div>
          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white px-4 py-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Oblíbený předmět
            </dt>
            <dd className="mt-1 break-words text-sm text-slate-800">
              {user.favoriteSubject || "není vyplněno"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function AuthSurface({
  title,
  description,
  children,
  sideTitle,
  sideDescription,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  sideTitle: string;
  sideDescription: string;
}) {
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-5xl gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
      <div className="min-w-0 space-y-6">
        <Badge variant="brand">Autentizace</Badge>
        <div className="space-y-3">
          <h1 className="break-words text-4xl font-semibold tracking-[-0.04em] text-slate-950">{sideTitle}</h1>
          <p className="max-w-xl break-words text-base leading-7 text-slate-600">{sideDescription}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="min-w-0">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Backend</p>
              <p className="mt-2 break-words font-semibold text-slate-950">httpOnly cookie session</p>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Flow</p>
              <p className="mt-2 break-words font-semibold text-slate-950">Přihlášení, registrace, profil</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mx-auto w-full min-w-0 max-w-xl overflow-hidden border-white/80 bg-white/92">
        <CardHeader>
          <Badge variant="neutral">DELTA Hub</Badge>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    </div>
  );
}

export function LoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const { notifyError, notifySuccess } = useToast();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const nextFieldErrors = validateLogin(email, password);
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    startTransition(async () => {
      try {
        const loggedInUser = await apiPost<AuthUser>("/api/auth/login", {
          email: email.trim(),
          password,
        });

        setUser(loggedInUser);
        notifySuccess("Přihlášení proběhlo úspěšně.");

        try {
          const currentUser = await fetchCurrentUser();
          setUser((previousUser) => ({ ...previousUser, ...currentUser }));
        } catch {
          // Login response already contains a safe user, so the UI stays usable.
        }
      } catch (submitError) {
        setUser(null);
        const normalizedError = normalizeClientError(submitError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      }
    });
  }

  function handleLogout() {
    setError(null);

    startTransition(async () => {
      try {
        await apiPost<void>("/api/auth/logout");
        setUser(null);
        notifySuccess("Byl jsi odhlášen.");
      } catch (logoutError) {
        const normalizedError = normalizeClientError(logoutError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      }
    });
  }

  return (
    <AuthSurface
      title="Přihlášení"
      description="Vrať se zpět do feedu během pár vteřin."
      sideTitle="Přihlášení bez rušivých kroků."
      sideDescription="Čistý formulář, jasné stavy a přirozený tok pro běžné používání i klientské demo."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((currentErrors) => ({ ...currentErrors, email: undefined }));
          }}
          label="Email"
          placeholder="user@example.com"
          error={fieldErrors.email}
          required
        />

        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((currentErrors) => ({ ...currentErrors, password: undefined }));
          }}
          label="Heslo"
          placeholder="Minimálně 1 znak"
          error={fieldErrors.password}
          required
        />

        <Button type="submit" disabled={isPending} fullWidth size="lg">
          {isPending ? "Přihlašuji..." : "Přihlásit se"}
        </Button>
      </form>

      <div className="space-y-4">
        <ErrorNotice error={error} />

        {user ? (
          <UserCard user={user} onLogout={handleLogout} pending={isPending} />
        ) : (
          <div className="break-words rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Nemáš účet?{" "}
            <Link href="/register" className="font-medium text-sky-700 hover:text-sky-800">
              Zaregistruj se
            </Link>
            .
          </div>
        )}
      </div>
    </AuthSurface>
  );
}

export function RegisterPanel() {
  const [formState, setFormState] = useState({
    username: "",
    email: "",
    password: "",
    schoolYear: "",
    favoriteSubject: "",
  });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const { notifyError, notifySuccess } = useToast();

  function updateField<Key extends keyof typeof formState>(
    field: Key,
    value: (typeof formState)[Key],
  ) {
    setFormState((currentState) => ({ ...currentState, [field]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const nextFieldErrors = validateRegister(formState);
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    startTransition(async () => {
      try {
        const createdUser = await apiPost<AuthUser>("/api/auth/register", {
          username: formState.username.trim(),
          email: formState.email.trim(),
          password: formState.password,
          schoolYear: formState.schoolYear ? Number(formState.schoolYear) : undefined,
          favoriteSubject: formState.favoriteSubject.trim() || undefined,
        });

        setUser(createdUser);
        notifySuccess("Účet byl vytvořený.");

        try {
          const currentUser = await fetchCurrentUser();
          setUser((previousUser) => ({ ...previousUser, ...currentUser }));
        } catch {
          // Register response already contains the created user.
        }
      } catch (submitError) {
        setUser(null);
        const normalizedError = normalizeClientError(submitError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      }
    });
  }

  function handleLogout() {
    setError(null);

    startTransition(async () => {
      try {
        await apiPost<void>("/api/auth/logout");
        setUser(null);
        notifySuccess("Byl jsi odhlášen.");
      } catch (logoutError) {
        const normalizedError = normalizeClientError(logoutError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      }
    });
  }

  return (
    <AuthSurface
      title="Vytvořit účet"
      description="Vytvoř si účet a připoj se do DELTA komunity během chvilky."
      sideTitle="Komunita začíná dobrým onboardingem."
      sideDescription="Registrace je krátká, srozumitelná a po úspěchu rovnou ukáže nový profil, takže je celý první dojem připravený na demo i ostrý provoz."
    >
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            id="register-username"
            type="text"
            autoComplete="username"
            autoFocus
            value={formState.username}
            onChange={(event) => updateField("username", event.target.value)}
            label="Uživatelské jméno"
            placeholder="napr. delta_user"
            error={fieldErrors.username}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            value={formState.email}
            onChange={(event) => updateField("email", event.target.value)}
            label="Email"
            placeholder="user@example.com"
            error={fieldErrors.email}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={formState.password}
            onChange={(event) => updateField("password", event.target.value)}
            label="Heslo"
            placeholder="Minimálně 8 znaků"
            minLength={8}
            error={fieldErrors.password}
            required
          />
        </div>

        <div>
          <Input
            id="register-school-year"
            type="number"
            min={1}
            max={4}
            inputMode="numeric"
            value={formState.schoolYear}
            onChange={(event) => updateField("schoolYear", event.target.value)}
            label="Ročník"
            placeholder="1 až 4"
            error={fieldErrors.schoolYear}
          />
        </div>

        <div>
          <Input
            id="register-favorite-subject"
            type="text"
            value={formState.favoriteSubject}
            onChange={(event) => updateField("favoriteSubject", event.target.value)}
            label="Oblíbený předmět"
            placeholder="napr. matematika"
            maxLength={80}
            error={fieldErrors.favoriteSubject}
          />
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={isPending} fullWidth size="lg">
            {isPending ? "Registruji..." : "Vytvořit účet"}
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        <ErrorNotice error={error} />

        {user ? (
          <UserCard user={user} onLogout={handleLogout} pending={isPending} />
        ) : (
          <div className="break-words rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Už účet máš?{" "}
            <Link href="/login" className="font-medium text-sky-700 hover:text-sky-800">
              Přihlas se
            </Link>
            .
          </div>
        )}
      </div>
    </AuthSurface>
  );
}

type ProfileEditForm = {
  username: string;
  schoolYear: string;
  favoriteSubject: string;
};

type ProfileEditErrors = {
  username?: string;
  schoolYear?: string;
  favoriteSubject?: string;
};

function validateProfileEdit(form: ProfileEditForm): ProfileEditErrors {
  const errors: ProfileEditErrors = {};
  if (!form.username.trim()) errors.username = "Vyplň uživatelské jméno.";
  if (form.schoolYear) {
    const year = Number(form.schoolYear);
    if (!Number.isInteger(year) || year < 1 || year > 4) {
      errors.schoolYear = "Ročník musí být číslo od 1 do 4.";
    }
  }
  if (form.favoriteSubject.trim().length > 80) {
    errors.favoriteSubject = "Oblíbený předmět zkrať na 80 znaků nebo méně.";
  }
  return errors;
}

export function ProfilePanel() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProfileEditForm>({ username: "", schoolYear: "", favoriteSubject: "" });
  const [editErrors, setEditErrors] = useState<ProfileEditErrors>({});
  const { notifyError, notifySuccess } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const currentUser = await fetchCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch (loadError) {
        if (isMounted) {
          setUser(null);
          setError(normalizeClientError(loadError));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProfile();
    return () => { isMounted = false; };
  }, []);

  function beginEdit() {
    if (!user) return;
    setEditForm({
      username: user.username,
      schoolYear: user.schoolYear ? String(user.schoolYear) : "",
      favoriteSubject: user.favoriteSubject ?? "",
    });
    setEditErrors({});
    setError(null);
    setIsEditing(true);
  }

  function updateEditField<K extends keyof ProfileEditForm>(field: K, value: ProfileEditForm[K]) {
    setEditForm((current) => ({ ...current, [field]: value }));
    setEditErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSave() {
    if (!user) return;
    const nextErrors = validateProfileEdit(editForm);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    startTransition(async () => {
      try {
        const updated = await apiPatch<AuthUser>(`/api/users/${user.userId}`, {
          username: editForm.username.trim(),
          schoolYear: editForm.schoolYear ? Number(editForm.schoolYear) : null,
          favoriteSubject: editForm.favoriteSubject.trim() || null,
        });
        setUser(updated);
        setIsEditing(false);
        notifySuccess("Profil byl uložený.");
      } catch (saveError) {
        const normalizedError = normalizeClientError(saveError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      }
    });
  }

  function handleLogout() {
    setError(null);

    startTransition(async () => {
      try {
        await apiPost<void>("/api/auth/logout");
        setUser(null);
        notifySuccess("Byl jsi odhlášen.");
      } catch (logoutError) {
        const normalizedError = normalizeClientError(logoutError);
        setError(normalizedError);
        notifyError(normalizedError.message, normalizedError.details);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Profil"
        title="Tvůj profil"
        description="Přehled a správa tvého účtu v DELTA Hubu."
        actions={
          !isLoading && user && !isEditing ? (
            <Button type="button" onClick={beginEdit} variant="secondary" disabled={isPending}>
              Upravit profil
            </Button>
          ) : undefined
        }
      />

      <ErrorNotice error={error} />

      {isLoading ? (
        <LoadingState
          title="Načítám profil"
          description="Ověřuji přihlášení a načítám údaje aktivního účtu."
        />
      ) : null}

      {!isLoading && !user && !error ? (
        <EmptyState
          title="Žádná aktivní session"
          description="Pro zobrazení profilu se nejdřív přihlas."
          action={
            <Link href="/login" className={buttonStyles({ variant: "primary", size: "sm" })}>
              Přejít na login
            </Link>
          }
        />
      ) : null}

      {!isLoading && user ? (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="min-w-0 space-y-4">
            {isEditing ? (
              <Card className="min-w-0 overflow-hidden border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)]">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="brand">Editace profilu</Badge>
                    <Badge variant="outline">#{user.userId}</Badge>
                  </div>
                  <CardTitle>Upravit profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    id="profile-username"
                    label="Uživatelské jméno"
                    value={editForm.username}
                    onChange={(e) => updateEditField("username", e.target.value)}
                    error={editErrors.username}
                    autoFocus
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="profile-school-year"
                      label="Ročník"
                      type="number"
                      min={1}
                      max={4}
                      inputMode="numeric"
                      value={editForm.schoolYear}
                      onChange={(e) => updateEditField("schoolYear", e.target.value)}
                      error={editErrors.schoolYear}
                      placeholder="1 až 4"
                    />
                    <Input
                      id="profile-favorite-subject"
                      label="Oblíbený předmět"
                      value={editForm.favoriteSubject}
                      onChange={(e) => updateEditField("favoriteSubject", e.target.value)}
                      error={editErrors.favoriteSubject}
                      placeholder="napr. matematika"
                      maxLength={80}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={handleSave} disabled={isPending}>
                      {isPending ? "Ukládám..." : "Uložit změny"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} disabled={isPending}>
                      Zrušit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <UserCard user={user} onLogout={handleLogout} pending={isPending} />
            )}
          </div>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Informace o účtu</CardTitle>
              <CardDescription>
                E-mail a role nelze změnit vlastními silami. Pro změnu kontaktuj admina.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
              <div className="break-words rounded-3xl bg-slate-50 p-4">
                <span className="font-medium text-slate-700">E-mail:</span>{" "}
                <span className="break-all">{user.email}</span>
              </div>
              <div className="break-words rounded-3xl bg-slate-50 p-4">
                <span className="font-medium text-slate-700">Role:</span>{" "}
                {user.role}
              </div>
              <div className="break-words rounded-3xl bg-slate-50 p-4">
                <span className="font-medium text-slate-700">ID:</span>{" "}
                #{user.userId}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

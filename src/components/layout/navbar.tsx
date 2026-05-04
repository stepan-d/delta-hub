"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ApiError, apiGet, apiPost } from "@/lib/api-client";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavbarUser = {
  userId: number;
  username: string;
  email: string;
  role: string;
};

const primaryNavigation = [
  { href: "/memes", label: "Memes" },
  { href: "/categories", label: "Categories" },
  { href: "/events", label: "Events" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

async function fetchCurrentUser() {
  return apiGet<NavbarUser>("/api/auth/me", { cache: "no-store" });
}

function NavLink({
  href,
  label,
  pathname,
  onClick,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-xl px-3.5 py-2 text-sm font-semibold transition",
        isActive(pathname, href)
          ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      )}
    >
      {label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const currentUser = await fetchCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (error) {
        if (isMounted) {
          if (error instanceof ApiError && error.status === 401) {
            setUser(null);
            return;
          }

          setUser(null);
        }
      }
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      window.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isUserMenuOpen]);

  function handleLogout() {
    startTransition(async () => {
      try {
        await apiPost<void>("/api/auth/logout");
        setUser(null);
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      } catch {
        setIsUserMenuOpen(false);
      }
    });
  }

  return (
    <div className="relative flex min-w-0 items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#2563eb_100%)] text-sm font-semibold text-white shadow-[0_14px_32px_rgba(37,99,235,0.28)]">
            DH
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold tracking-[-0.03em] text-slate-950">
              DELTA Hub
            </div>
            <p className="hidden truncate text-sm text-slate-500 sm:block">
              Komunitní feed pro memy, akce a školní dění
            </p>
          </div>
        </Link>
      </div>

      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        <nav aria-label="Main menu" className="flex min-w-0 items-center gap-1 rounded-2xl border border-white/80 bg-white/92 p-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          {primaryNavigation.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
          ))}
          {user && (user.role === "Admin" || user.role === "Moderator") ? (
            <NavLink href="/admin" label="Admin" pathname={pathname} />
          ) : null}
        </nav>

        <Link href="/memes/create" className={buttonStyles({ variant: "primary", size: "sm" })}>
          Přidat meme
        </Link>

        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((currentState) => !currentState)}
              className="inline-flex max-w-[14rem] items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/92 px-4 py-2 text-sm font-semibold text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                {user.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate">{user.username}</span>
              <span className={cn("text-slate-400 transition", isUserMenuOpen && "rotate-180")}>⌄</span>
            </button>

            {isUserMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-56 overflow-hidden rounded-[24px] border border-white/80 bg-white/96 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="truncate text-sm font-semibold text-slate-950">{user.username}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="flex flex-col gap-1 p-2">
                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isPending}
                    className="rounded-2xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-60"
                  >
                    {isPending ? "Odhlašuji..." : "Logout"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
              Login
            </Link>
            <Link href="/register" className={buttonStyles({ variant: "secondary", size: "sm" })}>
              Register
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <Link href="/memes/create" className={buttonStyles({ variant: "primary", size: "sm" })}>
          Přidat meme
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((currentState) => !currentState)}
          aria-label={isMobileMenuOpen ? "Zavřít navigaci" : "Otevřít navigaci"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/92 text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:bg-slate-50"
        >
          <span className="relative block h-4 w-5">
            <span
              className={cn(
                "absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition",
                isMobileMenuOpen && "top-[7px] rotate-45",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition",
                isMobileMenuOpen && "opacity-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition",
                isMobileMenuOpen && "top-[7px] -rotate-45",
              )}
            />
          </span>
        </button>
      </div>

      {isMobileMenuOpen ? (
        <div className="absolute inset-x-4 top-[calc(100%-0.25rem)] z-30 lg:hidden">
          <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl">
            <nav aria-label="Mobile menu" className="flex flex-col gap-1">
              {primaryNavigation.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  pathname={pathname}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              {user && (user.role === "Admin" || user.role === "Moderator") ? (
                <NavLink
                  href="/admin"
                  label="Admin"
                  pathname={pathname}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ) : null}
            </nav>

            <div className="mt-3 border-t border-slate-100 pt-3">
              {user ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-950">{user.username}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full" })}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isPending}
                      className={buttonStyles({ variant: "ghost", size: "sm", className: "w-full" })}
                    >
                      {isPending ? "Odhlašuji..." : "Logout"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={buttonStyles({ variant: "ghost", size: "sm", className: "w-full" })}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={buttonStyles({ variant: "secondary", size: "sm", className: "w-full" })}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

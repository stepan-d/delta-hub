import { Suspense } from "react";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { ToastProvider } from "@/components/ui/toast-provider";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="relative min-h-screen overflow-hidden text-slate-950">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-32 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />

        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-2xl">
            <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
              <Suspense fallback={<div className="h-11 animate-pulse rounded-2xl bg-slate-100" />}>
                <Navbar />
              </Suspense>
            </div>
          </header>

          <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </main>

          <footer className="border-t border-white/60 bg-white/55 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <p className="min-w-0 break-words">DELTA Hub pro komunitní obsah, akce a moderaci.</p>
              <p className="min-w-0 break-words">Next.js 16 • React 19 • Tailwind CSS</p>
            </div>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}

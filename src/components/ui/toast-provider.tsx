"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ToastVariant = "info" | "error" | "success";

type ToastItem = {
  id: number;
  message: string;
  details: string[];
  variant: ToastVariant;
};

type ToastInput = {
  message: string;
  details?: string[];
  variant?: ToastVariant;
};

type ToastContextValue = {
  notify: (input: ToastInput) => void;
  notifySuccess: (message: string, details?: string[]) => void;
  notifyError: (message: string, details?: string[]) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ message, details = [], variant = "info" }: ToastInput) => {
      const id = nextIdRef.current++;
      setToasts((currentToasts) => [...currentToasts, { id, message, details, variant }]);

      window.setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      notifySuccess: (message, details) => notify({ message, details, variant: "success" }),
      notifyError: (message, details) => notify({ message, details, variant: "error" }),
      dismiss,
    }),
    [dismiss, notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:justify-end"
      >
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((toast) => (
            <Alert
              key={toast.id}
              variant={toast.variant}
              className="pointer-events-auto border shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{toast.message}</p>
                  {toast.details.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm">
                      {toast.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-w-0 px-2 py-1"
                  onClick={() => dismiss(toast.id)}
                >
                  Zavřít
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}

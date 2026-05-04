import { ApiError } from "@/lib/api-client";

export type ErrorState = {
  message: string;
  details: string[];
};

export function normalizeClientError(error: unknown): ErrorState {
  if (error instanceof ApiError) {
    const message =
      error.message === "Unauthorized"
        ? "Pro pokračování se nejdřív přihlas."
        : error.message === "Forbidden"
          ? "Do téhle sekce mají přístup jen administrátoři."
          : error.message === "Validation error"
            ? "Některá pole nejsou vyplněná správně."
            : error.message === "Internal server error"
              ? "Došlo k chybě na serveru. Zkus to prosím za chvíli znovu."
              : error.message;

    return {
      message,
      details:
        error.details?.map((detail) =>
          detail.path?.trim() ? `${detail.path}: ${detail.message}` : detail.message,
        ) ?? [],
    };
  }

  if (error instanceof Error) {
    return { message: error.message, details: [] };
  }

  return { message: "Došlo k nečekané chybě.", details: [] };
}

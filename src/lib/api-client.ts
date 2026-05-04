type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type ApiErrorDetail = {
  path: string;
  message: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: ApiErrorDetail[];

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      details?: ApiErrorDetail[];
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body" | "credentials" | "method"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

type ApiSuccessEnvelope<T> = {
  data: T;
  message?: string;
};

type ApiErrorEnvelope = {
  error?: string;
  code?: string;
  details?: ApiErrorDetail[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasDataProperty<T>(value: unknown): value is ApiSuccessEnvelope<T> {
  return isObject(value) && "data" in value;
}

function toApiError(
  status: number,
  fallbackMessage: string,
  payload: unknown,
): ApiError {
  if (isObject(payload)) {
    const errorPayload = payload as ApiErrorEnvelope;
    return new ApiError(errorPayload.error || fallbackMessage, {
      status,
      code: errorPayload.code,
      details: errorPayload.details,
    });
  }

  if (typeof payload === "string" && payload.trim()) {
    return new ApiError(payload, { status });
  }

  return new ApiError(fallbackMessage, { status });
}

async function apiRequest<T>(
  method: ApiMethod,
  input: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(input, {
    ...rest,
    method,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body:
      body == null
        ? undefined
        : isFormData || typeof body === "string" || body instanceof Blob
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw toApiError(
      response.status,
      `API request failed: ${method} ${input} (${response.status})`,
      payload,
    );
  }

  if (hasDataProperty<T>(payload)) {
    return payload.data;
  }

  return payload as T;
}

export function apiGet<T>(input: string, options?: ApiRequestOptions) {
  return apiRequest<T>("GET", input, options);
}

export function apiPost<T>(
  input: string,
  body?: ApiRequestOptions["body"],
  options?: Omit<ApiRequestOptions, "body">,
) {
  return apiRequest<T>("POST", input, { ...options, body });
}

export function apiPatch<T>(
  input: string,
  body?: ApiRequestOptions["body"],
  options?: Omit<ApiRequestOptions, "body">,
) {
  return apiRequest<T>("PATCH", input, { ...options, body });
}

export function apiDelete<T>(input: string, options?: ApiRequestOptions) {
  return apiRequest<T>("DELETE", input, options);
}

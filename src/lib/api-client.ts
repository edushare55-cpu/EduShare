/**
 * lib/api-client.ts
 *
 * Typed API client used by ALL React Query hooks.
 * Never call fetch() directly in components — always go through this.
 */

// ─── API Error Class ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public override message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error ?? "An unexpected error occurred",
      res.status,
      json.code
    );
  }

  return json.data as T;
}

// ─── Typed Client ─────────────────────────────────────────────────────────────

export const apiClient = {
  get:    <T>(url: string) =>
    apiFetch<T>(url),
  post:   <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "POST",   body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown) =>
    apiFetch<T>(url, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: <T = null>(url: string) =>
    apiFetch<T>(url, { method: "DELETE" }),
};

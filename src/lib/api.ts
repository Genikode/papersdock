/* Minimal API client built on fetch with base URL, x-api-key, and bearer token support. */

export const API_BASE_URL = "https://lms-prod.ddns.net"; // {{baseUrl}}
export const API_KEY_HEADER_NAME = "x-api-key";

/**
 * IMPORTANT: Confirm with backend which API key value to use.
 * The screenshots/code show both "pms_api" and "lms_API" in different places.
 * If the server expects "pms_api", change this constant.
 */
export const API_KEY_HEADER_VALUE = "lms_API";

import { getAccessToken } from "./auth";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  path: string; // must start with '/'
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown; // will be JSON.stringified if not FormData
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

export async function apiRequest<T = unknown>(options: RequestOptions): Promise<T> {
  const { method = "GET", path, query, body, headers = {}, signal } = options;

  const token = getAccessToken();
  const url = buildUrl(path, query);

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  // Build headers ONCE, including Authorization if present.
  const initHeaders: Record<string, string> = {
    Accept: "application/json",
    [API_KEY_HEADER_NAME]: API_KEY_HEADER_VALUE,
    ...(token ? { accessToken: `Bearer ${token}` } : {}),
    ...headers,
  };

  if (body !== undefined && !isFormData) {
    initHeaders["Content-Type"] = "application/json";
  }

  const init: RequestInit = {
    method,
    headers: initHeaders,
    signal,
    body:
      body === undefined
        ? undefined
        : isFormData
        ? (body as FormData)
        : JSON.stringify(body),
  };

  const response = await fetch(url, init);

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson
      ? (data as any)?.message ?? response.statusText
      : response.statusText;
    const error = new Error(message) as Error & { status?: number; data?: unknown };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  get:  <T>(path: string, query?: RequestOptions["query"], headers?: Record<string, string>, signal?: AbortSignal) =>
    apiRequest<T>({ method: "GET", path, query, headers, signal }),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>, signal?: AbortSignal) =>
    apiRequest<T>({ method: "POST", path, body, headers, signal }),
  put:  <T>(path: string, body?: unknown, headers?: Record<string, string>, signal?: AbortSignal) =>
    apiRequest<T>({ method: "PUT", path, body, headers, signal }),
  patch:<T>(path: string, body?: unknown, headers?: Record<string, string>, signal?: AbortSignal) =>
    apiRequest<T>({ method: "PATCH", path, body, headers, signal }),
  delete:<T>(path: string, body?: unknown, headers?: Record<string, string>, signal?: AbortSignal) =>
    apiRequest<T>({ method: "DELETE", path, body, headers, signal }),
};

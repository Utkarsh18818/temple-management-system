import type { paths } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

const ACCESS_TOKEN_KEY = "templeos_access_token";

type ApiPath = keyof paths;

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(
    status: number,
    message: string,
    detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: BodyInit | null;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token =
    window.localStorage.getItem(
      ACCESS_TOKEN_KEY,
    );

  if (!token) {
    return null;
  }

  const cleanToken = token.trim();

  return cleanToken || null;
}

export function setAccessToken(
  token: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const cleanToken = token.trim();

  if (!cleanToken) {
    throw new Error(
      "Cannot store an empty access token.",
    );
  }

  window.localStorage.setItem(
    ACCESS_TOKEN_KEY,
    cleanToken,
  );
  window.dispatchEvent(new Event("templeos:session"));
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(
    ACCESS_TOKEN_KEY,
  );

  /*
   * Remove the legacy sessionStorage token as well.
   * This prevents an old session token from surviving
   * after logout or migration.
   */
  window.sessionStorage.removeItem(
    ACCESS_TOKEN_KEY,
  );
  window.dispatchEvent(new Event("templeos:session"));
}

function getErrorMessage(
  status: number,
  detail: unknown,
): string {
  if (typeof detail === "string") {
    return detail;
  }

  if (
    detail &&
    typeof detail === "object" &&
    "detail" in detail
  ) {
    const nestedDetail = (
      detail as {
        detail?: unknown;
      }
    ).detail;

    if (typeof nestedDetail === "string") {
      return nestedDetail;
    }

    if (Array.isArray(nestedDetail)) {
      return nestedDetail
        .map((item) => {
          if (
            item &&
            typeof item === "object" &&
            "msg" in item &&
            typeof (
              item as {
                msg?: unknown;
              }
            ).msg === "string"
          ) {
            return (
              item as {
                msg: string;
              }
            ).msg;
          }

          return "Validation error";
        })
        .join(", ");
    }
  }

  switch (status) {
    case 400:
      return "The request could not be processed.";
    case 401:
      return "Authentication is required.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "The request conflicts with existing data.";
    case 422:
      return "Please check the submitted information.";
    case 429:
      return "Too many requests. Please try again later.";
    default:
      return "Something went wrong while communicating with the server.";
  }
}

async function parseResponse(
  response: Response,
): Promise<unknown> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    return response.json();
  }

  const text =
    await response.text();

  return text || null;
}

export async function apiRequest<T>(
  path: ApiPath | string,
  options: RequestOptions = {},
): Promise<T> {
  const headers =
    new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set(
      "Accept",
      "application/json",
    );
  }

  const publicCatalog = (!options.method || options.method === "GET") &&
    /^\/api\/v1\/public\/(?:temples|sevas)(?:\/|\?|$)/.test(path);
  const token = publicCatalog ? null : getAccessToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        method:
          options.method ??
          "GET",
        headers,
        body:
          options.body,
        signal:
          options.signal,
        cache: "no-store",
      },
    );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    /*
     * DO NOT clear the token here.
     *
     * Authentication state is owned by AuthProvider.
     */
    throw new ApiError(
      response.status,
      getErrorMessage(
        response.status,
        data,
      ),
      data,
    );
  }

  return data as T;
}

export async function apiJson<T>(
  path: ApiPath | string,
  method:
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method,
      headers: {
        "Content-Type":
          "application/json",
      },
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
      signal,
    },
  );
}

export async function apiForm<T>(
  path: ApiPath | string,
  fields: Record<
    string,
    string | undefined
  >,
  signal?: AbortSignal,
): Promise<T> {
  const formData =
    new URLSearchParams();

  for (
    const [
      key,
      value,
    ] of Object.entries(
      fields,
    )
  ) {
    if (
      value !== undefined
    ) {
      formData.set(
        key,
        value,
      );
    }
  }

  return apiRequest<T>(
    path,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: formData,
      signal,
    },
  );
}

export {
  API_BASE_URL,
};

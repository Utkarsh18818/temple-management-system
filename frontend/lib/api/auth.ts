import type { components } from "@/types/api";

import {
  apiForm,
  apiRequest,
  setAccessToken,
} from "@/lib/api/client";

type TokenResponse =
  components["schemas"]["TokenResponse"];

type UserResponse =
  components["schemas"]["UserResponse"];

export type LoginCredentials = {
  username: string;
  password: string;
};

const ACCESS_TOKEN_KEY =
  "templeos_access_token";

export async function login(
  credentials: LoginCredentials,
): Promise<TokenResponse> {
  const response =
    await apiForm<TokenResponse>(
      "/api/v1/auth/login",
      {
        username: credentials.username,
        password: credentials.password,
        grant_type: "password",
      },
    );

  const accessToken =
    response.access_token?.trim();

  if (!accessToken) {
    throw new Error(
      "Login succeeded but the server did not return an access token.",
    );
  }

  /*
   * Store through the central API client.
   */
  setAccessToken(accessToken);

  /*
   * Explicit browser-side persistence.
   *
   * This is intentionally kept here as a defensive
   * guarantee for the authentication boundary.
   */
  if (typeof window !== "undefined") {
    sessionStorage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken,
    );

    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken,
    );

    /*
     * Fail immediately if the browser refused
     * to persist the authentication token.
     */
    const sessionToken =
      sessionStorage.getItem(
        ACCESS_TOKEN_KEY,
      );

    const localToken =
      localStorage.getItem(
        ACCESS_TOKEN_KEY,
      );

    if (
      sessionToken !== accessToken ||
      localToken !== accessToken
    ) {
      throw new Error(
        "Unable to persist the authentication session in this browser.",
      );
    }
  }

  return response;
}

export async function getCurrentUser(): Promise<UserResponse> {
  return apiRequest<UserResponse>(
    "/api/v1/auth/me",
  );
}
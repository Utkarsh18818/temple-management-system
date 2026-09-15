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

export async function login(
  credentials: LoginCredentials,
): Promise<TokenResponse> {
  const response =
    await apiForm<TokenResponse>(
      "/api/v1/auth/login",
      {
        username: credentials.username.trim(),
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

  setAccessToken(accessToken);

  return response;
}

export async function getCurrentUser(): Promise<UserResponse> {
  return apiRequest<UserResponse>(
    "/api/v1/auth/me",
  );
}
import type { components } from "@/types/api";
import {
  apiJson,
  apiRequest,
  setAccessToken,
  clearAccessToken,
} from "@/lib/api/client";

export type PublicDevotee =
  components["schemas"]["PublicDevoteeResponse"];

export type PublicDevoteeRegisterRequest =
  components["schemas"]["PublicDevoteeRegisterRequest"];

export type PublicDevoteeAuthResponse =
  components["schemas"]["PublicDevoteeAuthResponse"];

export type PublicDevoteeLoginRequest = {
  temple_id: string;
  identifier: string;
  password: string;
};

export async function registerPublicDevotee(
  payload: PublicDevoteeRegisterRequest,
): Promise<PublicDevoteeAuthResponse> {
  const response =
    await apiJson<PublicDevoteeAuthResponse>(
      "/api/v1/public/auth/register",
      "POST",
      payload,
    );

  setAccessToken(response.access_token);

  return response;
}

export async function loginPublicDevotee(
  username: string,
  password: string,
  templeId: string,
): Promise<PublicDevoteeAuthResponse> {
  const payload: PublicDevoteeLoginRequest = {
    temple_id: templeId,
    identifier: username.trim(),
    password,
  };

  const response =
    await apiJson<PublicDevoteeAuthResponse>(
      "/api/v1/public/auth/login",
      "POST",
      payload,
    );

  setAccessToken(response.access_token);

  return response;
}

export async function getPublicDevoteeMe(): Promise<PublicDevotee> {
  return apiRequest<PublicDevotee>(
    "/api/v1/public/auth/me",
    {
      method: "GET",
    },
  );
}

export function logoutPublicDevotee(): void {
  clearAccessToken();
}

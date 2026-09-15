"use client";

import { useMutation } from "@tanstack/react-query";

import {
  useAuth,
} from "@/lib/auth/auth-context";

import type {
  LoginCredentials,
} from "@/lib/api/auth";

export function useLogin() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (
      credentials: LoginCredentials,
    ) => {
      return login(credentials);
    },
  });
}

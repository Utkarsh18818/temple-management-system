"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  login as loginApi,
  type LoginCredentials,
} from "@/lib/api/auth";

import {
  ApiError,
  clearAccessToken,
  getAccessToken,
} from "@/lib/api/client";

import type { components } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";

type UserResponse =
  components["schemas"]["UserResponse"];

type AuthContextValue = {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    credentials: LoginCredentials,
  ) => Promise<UserResponse>;
  logout: () => void;
  refreshUser: () => Promise<UserResponse | null>;
};

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [user, setUser] =
    useState<UserResponse | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const refreshUser = useCallback(
    async (): Promise<UserResponse | null> => {
      const token = getAccessToken();

      if (!token) {
        setUser(null);
        return null;
      }

      try {
        const currentUser =
          await getCurrentUser();
        if (getAccessToken() !== token) return null;

        setUser(currentUser);

        return currentUser;
      } catch (error) {
        if (getAccessToken() !== token) return null;
        /*
         * Only a confirmed 401 means that the JWT
         * is invalid or expired.
         *
         * Network errors, 5xx errors, etc. must NOT
         * destroy an otherwise valid browser session.
         */
        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          clearAccessToken();
          setUser(null);
          return null;
        }

        /*
         * Preserve the token and current user state
         * for non-authentication failures.
         */
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        await refreshUser();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void initializeAuth();

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    const changed = () => { void refreshUser(); };
    window.addEventListener("templeos:session", changed);
    window.addEventListener("storage", changed);
    return () => { window.removeEventListener("templeos:session", changed); window.removeEventListener("storage", changed); };
  }, [refreshUser]);

  const login = useCallback(
    async (
      credentials: LoginCredentials,
    ): Promise<UserResponse> => {
      /*
       * loginApi stores the JWT before returning.
       */
      await loginApi(credentials);
      await queryClient.cancelQueries();
      queryClient.clear();

      /*
       * Immediately resolve the authenticated
       * application user using that JWT.
       */
      const currentUser =
        await getCurrentUser();

      setUser(currentUser);

      return currentUser;
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    void queryClient.cancelQueries();
    queryClient.clear();
    clearAccessToken();
    setUser(null);
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated:
          user !== null,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}

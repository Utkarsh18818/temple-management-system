"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ApiError,
  getAccessToken,
} from "@/lib/api/client";

import {
  getPublicDevoteeMe,
  loginPublicDevotee,
  logoutPublicDevotee,
  registerPublicDevotee,
  type PublicDevotee,
  type PublicDevoteeAuthResponse,
  type PublicDevoteeRegisterRequest,
} from "@/features/public/auth";

type PublicAuthContextValue = {
  devotee: PublicDevotee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<PublicDevoteeAuthResponse>;
  register: (
    payload: PublicDevoteeRegisterRequest,
  ) => Promise<PublicDevoteeAuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<PublicDevotee | null>;
};

const PublicAuthContext =
  createContext<PublicAuthContextValue | undefined>(
    undefined,
  );

export function PublicAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [devotee, setDevotee] =
    useState<PublicDevotee | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const refreshUser =
    useCallback(async (): Promise<
      PublicDevotee | null
    > => {
      const token = getAccessToken();

      if (!token) {
        setDevotee(null);
        return null;
      }

      try {
        const currentDevotee =
          await getPublicDevoteeMe();

        setDevotee(currentDevotee);

        return currentDevotee;
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          logoutPublicDevotee();
          setDevotee(null);
          return null;
        }

        /*
         * Preserve the existing devotee state on
         * temporary/network/server errors.
         */
        return null;
      }
    }, []);

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        if (!mounted) {
          return;
        }

        await refreshUser();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  const login =
    useCallback(
      async (
        username: string,
        password: string,
      ) => {
        const response =
          await loginPublicDevotee(
            username,
            password,
          );

        setDevotee(
          response.devotee,
        );

        return response;
      },
      [],
    );

  const register =
    useCallback(
      async (
        payload: PublicDevoteeRegisterRequest,
      ) => {
        const response =
          await registerPublicDevotee(
            payload,
          );

        setDevotee(
          response.devotee,
        );

        return response;
      },
      [],
    );

  const logout =
    useCallback(() => {
      logoutPublicDevotee();
      setDevotee(null);
    }, []);

  const value =
    useMemo<PublicAuthContextValue>(
      () => ({
        devotee,
        isAuthenticated:
          devotee !== null,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }),
      [
        devotee,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      ],
    );

  return (
    <PublicAuthContext.Provider
      value={value}
    >
      {children}
    </PublicAuthContext.Provider>
  );
}

export function usePublicAuth() {
  const context =
    useContext(
      PublicAuthContext,
    );

  if (!context) {
    throw new Error(
      "usePublicAuth must be used inside PublicAuthProvider.",
    );
  }

  return context;
}

"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useTemplePortal } from "./TempleContext";

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
    templeId: string,
    panNumber?: string,
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
  const queryClient = useQueryClient();
  const portal = useTemplePortal();
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
        if (getAccessToken() !== token) return null;

        setDevotee(currentDevotee);

        return currentDevotee;
      } catch (error) {
        if (getAccessToken() !== token) return null;
        if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
          setDevotee(null);
          return null;
        }
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

  useEffect(() => {
    const changed = () => { void refreshUser(); };
    window.addEventListener("templeos:session", changed);
    window.addEventListener("storage", changed);
    return () => { window.removeEventListener("templeos:session", changed); window.removeEventListener("storage", changed); };
  }, [refreshUser]);

  const login =
    useCallback(
      async (
        username: string,
        password: string,
        templeId: string,
        panNumber?: string,
      ) => {
        const response =
          await loginPublicDevotee(
            username,
            password,
            templeId,
            panNumber,
          );
        await queryClient.cancelQueries();
        queryClient.clear();

        setDevotee(
          response.devotee,
        );

        return response;
      },
      [queryClient],
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
        await queryClient.cancelQueries();
        queryClient.clear();

        setDevotee(
          response.devotee,
        );

        return response;
      },
      [queryClient],
    );

  const logout =
    useCallback(() => {
      void queryClient.cancelQueries();
      queryClient.clear();
      logoutPublicDevotee();
      setDevotee(null);
    }, [queryClient]);

  const value =
    useMemo<PublicAuthContextValue>(
      () => ({
        devotee: devotee?.temple_id === portal.templeId ? devotee : null,
        isAuthenticated:
          devotee !== null && devotee.temple_id === portal.templeId,
        isLoading: isLoading || portal.isLoading,
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
        portal.templeId,
        portal.isLoading,
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

"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboard } from "@/features/dashboard/api";

export function useDashboard(
  templeId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["dashboard", templeId ?? null],
    queryFn: () => getDashboard(templeId),
    enabled: Boolean(templeId) && enabled,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

"use client";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  getAuditLog,
  getAuditLogs,
  type GetAuditLogsParams,
} from "@/features/audit/api";

export const auditLogsQueryKey = [
  "audit-logs",
];

export function useAuditLogs(
  params: GetAuditLogsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...auditLogsQueryKey,
      params,
    ],
    queryFn: () =>
      getAuditLogs(params),
    enabled,
    staleTime:
      30 * 1000,
    retry: 1,
  });
}

export function useAuditLog(
  auditId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "audit-log",
      auditId,
    ],
    queryFn: () =>
      getAuditLog(
        auditId as string,
      ),
    enabled:
      Boolean(auditId) &&
      enabled,
    staleTime:
      60 * 1000,
    retry: 1,
  });
}

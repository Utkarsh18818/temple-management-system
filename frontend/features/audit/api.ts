import type { components } from "@/types/api";
import {
  apiJson,
  apiRequest,
} from "@/lib/api/client";

export type AuditLogResponse =
  components["schemas"]["AuditLogResponse"];

export type AuditLog =
  AuditLogResponse;

export type GetAuditLogsParams = {
  templeId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
};

function buildQuery(
  params: GetAuditLogsParams = {},
): string {
  const searchParams =
    new URLSearchParams();

  if (params.templeId) {
    searchParams.set(
      "temple_id",
      params.templeId,
    );
  }

  if (params.action) {
    searchParams.set(
      "action",
      params.action,
    );
  }

  if (params.entityType) {
    searchParams.set(
      "entity_type",
      params.entityType,
    );
  }

  if (params.entityId) {
    searchParams.set(
      "entity_id",
      params.entityId,
    );
  }

  if (params.userId) {
    searchParams.set(
      "user_id",
      params.userId,
    );
  }

  if (
    params.limit !== undefined
  ) {
    searchParams.set(
      "limit",
      String(params.limit),
    );
  }

  if (
    params.offset !== undefined
  ) {
    searchParams.set(
      "offset",
      String(params.offset),
    );
  }

  const query =
    searchParams.toString();

  return query
    ? `?${query}`
    : "";
}

export async function getAuditLogs(
  params: GetAuditLogsParams = {},
): Promise<AuditLogResponse[]> {
  return apiRequest<AuditLogResponse[]>(
    `/api/v1/audit${buildQuery(params)}`,
    {
      method: "GET",
    },
  );
}

export async function getAuditLog(
  auditId: string,
): Promise<AuditLogResponse> {
  return apiRequest<AuditLogResponse>(
    `/api/v1/audit/${auditId}`,
    {
      method: "GET",
    },
  );
}

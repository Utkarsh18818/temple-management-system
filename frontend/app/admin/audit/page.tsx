"use client";

import {
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileJson,
  Filter,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getAccessToken,
} from "@/lib/api/client";

import {
  useTemples,
} from "@/features/temples/hooks";

import {
  useAuditLog,
  useAuditLogs,
} from "@/features/audit/hooks";

import type {
  AuditLogResponse,
} from "@/features/audit/api";

const PAGE_SIZE = 50;

const ACTIONS = [
  "ALL",
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "STATUS_CHANGE",
];

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

function shortId(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "—";
  }

  return `${value.slice(
    0,
    8,
  )}…`;
}

function formatJson(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "No data";
  }

  try {
    return JSON.stringify(
      value,
      null,
      2,
    );
  } catch {
    return String(value);
  }
}

function actionClass(
  action: string,
) {
  switch (action) {
    case "CREATE":
      return "bg-[#e4f3ed] text-[#287c72]";

    case "UPDATE":
      return "bg-blue-50 text-blue-700";

    case "DELETE":
      return "bg-red-50 text-red-700";

    case "LOGIN":
      return "bg-violet-50 text-violet-700";

    case "LOGOUT":
      return "bg-slate-100 text-slate-700";

    case "STATUS_CHANGE":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function PageLoading() {
  return (
    <main className="min-h-screen bg-[var(--ivory)] p-6">
      <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <Loader2
            size={20}
            className="animate-spin text-[var(--krishna-blue)]"
          />
          Loading Audit Logs...
        </div>
      </div>
    </main>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="rounded-3xl border border-red-200 bg-white px-6 py-12">
      <div className="mx-auto max-w-xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-700">
          <AlertCircle size={19} />
        </div>

        <h2 className="mt-5 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
          Unable to load audit logs
        </h2>

        <p className="mt-2 break-words text-sm leading-6 text-[var(--muted-foreground)]">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--krishna-blue)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ivory)] text-[var(--antique-gold)]">
        <History size={23} />
      </div>

      <h2 className="mt-5 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
        No audit activity found
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
        There are no audit records matching the current filters.
      </p>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            {label}
          </p>

          <p className="mt-2 font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
            {value}
          </p>

          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {detail}
          </p>
        </div>

        <div className="rounded-xl bg-[var(--ivory)] p-2.5 text-[var(--krishna-blue)]">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
        {label}
      </label>

      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[var(--ivory)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
        {label}
      </p>

      <p
        className={`mt-1 break-all text-sm text-[var(--earth-brown-deep)] ${
          mono
            ? "font-mono text-xs"
            : "font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function JsonSection({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--ivory)] px-4 py-3">
        <FileJson
          size={16}
          className="text-[var(--muted-foreground)]"
        />

        <p className="text-sm font-semibold text-[var(--earth-brown-deep)]">
          {title}
        </p>
      </div>

      <pre className="max-h-80 overflow-auto bg-slate-950 p-4 text-xs leading-6 text-slate-200">
        {formatJson(value)}
      </pre>
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </p>

      <p className="mt-1 break-all text-sm text-[var(--earth-brown-deep)]">
        {value}
      </p>
    </div>
  );
}

export default function AuditPage() {
  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    selectedTempleId,
    setSelectedTempleId,
  ] = useState("");

  const [
    action,
    setAction,
  ] = useState("ALL");

  const [
    entityType,
    setEntityType,
  ] = useState("");

  const [
    entityId,
    setEntityId,
  ] = useState("");

  const [
    userId,
    setUserId,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(0);

  const [
    filtersOpen,
    setFiltersOpen,
  ] = useState(false);

  const [
    selectedAuditId,
    setSelectedAuditId,
  ] = useState<string | undefined>();

  useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * Same authentication pattern as the working Sevas page.
   */
  const hasToken =
    mounted &&
    Boolean(getAccessToken());

  /*
   * Use the existing temple hook rather than making
   * another direct temple API implementation.
   */
  const templesQuery =
    useTemples(hasToken);

  const temples =
    templesQuery.data ?? [];

  const activeTemples =
    temples.filter(
      (temple) =>
        temple.is_active,
    );

  /*
   * If the authenticated user belongs to a temple,
   * the backend will determine the permitted temple.
   *
   * For SUPER_ADMIN, the user has no temple_id,
   * so the first active temple is selected.
   *
   * We intentionally don't use AuthContext for the
   * authentication gate itself.
   */
  const effectiveTempleId =
    selectedTempleId ||
    activeTemples[0]?.id;

  const auditParams = useMemo(
    () => ({
      templeId:
        effectiveTempleId,
      action:
        action === "ALL"
          ? undefined
          : action,
      entityType:
        entityType.trim() ||
        undefined,
      entityId:
        entityId.trim() ||
        undefined,
      userId:
        userId.trim() ||
        undefined,
      limit: PAGE_SIZE,
      offset:
        page * PAGE_SIZE,
    }),
    [
      effectiveTempleId,
      action,
      entityType,
      entityId,
      userId,
      page,
    ],
  );

  const auditQuery =
    useAuditLogs(
      auditParams,
      hasToken &&
        Boolean(
          effectiveTempleId,
        ),
    );

  const detailQuery =
    useAuditLog(
      selectedAuditId,
      Boolean(
        selectedAuditId,
      ),
    );

  const auditLogs =
    auditQuery.data ?? [];

  const filteredLogs =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return auditLogs;
      }

      return auditLogs.filter(
        (
          item: AuditLogResponse,
        ) =>
          item.action
            .toLowerCase()
            .includes(term) ||
          item.entity_type
            .toLowerCase()
            .includes(term) ||
          Boolean(
            item.entity_id
              ?.toLowerCase()
              .includes(term),
          ) ||
          Boolean(
            item.user_id
              ?.toLowerCase()
              .includes(term),
          ),
      );
    }, [
      auditLogs,
      search,
    ]);

  const uniqueActions =
    new Set(
      auditLogs.map(
        (
          item: AuditLogResponse,
        ) => item.action,
      ),
    ).size;

  const uniqueEntities =
    new Set(
      auditLogs.map(
        (
          item: AuditLogResponse,
        ) =>
          item.entity_type,
      ),
    ).size;

  const uniqueUsers =
    new Set(
      auditLogs
        .map(
          (
            item: AuditLogResponse,
          ) => item.user_id,
        )
        .filter(Boolean),
    ).size;

  function clearFilters() {
    setAction("ALL");
    setEntityType("");
    setEntityId("");
    setUserId("");
    setSearch("");
    setPage(0);
  }

  if (!mounted) {
    return <PageLoading />;
  }

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-[var(--border)] bg-white p-10 text-center">
            <ShieldCheck
              size={40}
              className="mx-auto text-[var(--krishna-blue)]"
            />

            <h1 className="mt-5 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
              Authentication required
            </h1>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Please sign in to view audit activity.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (
    templesQuery.isLoading
  ) {
    return <PageLoading />;
  }

  if (
    templesQuery.isError
  ) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-5xl">
          <ErrorState
            message={
              templesQuery.error instanceof
              Error
                ? templesQuery.error.message
                : "Unable to load temples."
            }
            onRetry={() =>
              void templesQuery.refetch()
            }
          />
        </div>
      </main>
    );
  }

  if (
    !effectiveTempleId
  ) {
    return (
      <main className="min-h-screen bg-[var(--ivory)] p-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--krishna-blue)] p-2 text-white">
                <History size={20} />
              </div>

              <h1 className="font-display text-3xl font-semibold text-[var(--earth-brown-deep)]">
                Audit Logs
              </h1>
            </div>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Monitor administrative activity and changes across TempleOS.
            </p>
          </header>

          <section className="rounded-3xl border border-[var(--border)] bg-white px-6 py-16 text-center">
            <h2 className="font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
              No temple available
            </h2>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Create or activate a temple before viewing audit activity.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-devanagari text-sm tracking-[0.18em] text-[var(--antique-gold)]">
              गतिविधि निरीक्षण
            </p>

            <div className="mt-1 flex items-center gap-3">
              <div className="rounded-xl bg-[var(--krishna-blue)] p-2 text-white">
                <History size={20} />
              </div>

              <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--earth-brown-deep)]">
                Audit Logs
              </h1>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Monitor administrative activity and changes across TempleOS.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void auditQuery.refetch()
            }
            disabled={
              auditQuery.isFetching
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--earth-brown-deep)] shadow-sm transition hover:bg-[var(--ivory)] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                auditQuery.isFetching
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </header>

        <section className="mb-6 rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                Temple
              </p>

              <div className="relative mt-2 max-w-xl">
                <select
                  value={
                    effectiveTempleId
                  }
                  onChange={(
                    event,
                  ) => {
                    setSelectedTempleId(
                      event.target
                        .value,
                    );
                    setPage(0);
                  }}
                  className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 pr-10 text-sm text-[var(--earth-brown-deep)] outline-none focus:border-[var(--krishna-blue)]"
                >
                  {activeTemples.map(
                    (temple) => (
                      <option
                        key={temple.id}
                        value={temple.id}
                      >
                        {temple.name}
                      </option>
                    ),
                  )}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
              </div>
            </div>

            <div className="text-sm text-[var(--muted-foreground)]">
              Current workspace:
              <span className="ml-1 font-semibold text-[var(--earth-brown-deep)]">
                {
                  activeTemples.find(
                    (temple) =>
                      temple.id ===
                      effectiveTempleId,
                  )?.name
                }
              </span>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={History}
            label="Activities"
            value={
              filteredLogs.length
            }
            detail={`Page ${
              page + 1
            }`}
          />

          <StatCard
            icon={Activity}
            label="Actions"
            value={uniqueActions}
            detail="Distinct actions"
          />

          <StatCard
            icon={FileJson}
            label="Entities"
            value={
              uniqueEntities
            }
            detail="Affected resources"
          />

          <StatCard
            icon={UserRound}
            label="Users"
            value={uniqueUsers}
            detail="Users in current page"
          />
        </section>

        <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search action, entity, user or ID"
                  className="w-full rounded-xl border border-[var(--border)] bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--krishna-blue)]"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setFiltersOpen(
                    (value) =>
                      !value,
                  )
                }
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                  filtersOpen
                    ? "border-[var(--krishna-blue)] bg-[var(--krishna-blue)] text-white"
                    : "border-[var(--border)] bg-white text-[var(--earth-brown-deep)]"
                }`}
              >
                <Filter size={16} />
                Filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--earth-brown-deep)] hover:bg-[var(--ivory)]"
              >
                Clear
              </button>
            </div>

            {filtersOpen && (
              <div className="mt-5 grid gap-4 border-t border-[var(--border)] pt-5 md:grid-cols-2 lg:grid-cols-4">
                <FilterField label="Action">
                  <select
                    value={action}
                    onChange={(
                      event,
                    ) => {
                      setAction(
                        event.target
                          .value,
                      );
                      setPage(0);
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--krishna-blue)]"
                  >
                    {ACTIONS.map(
                      (
                        item: string,
                      ) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item ===
                          "ALL"
                            ? "All actions"
                            : item}
                        </option>
                      ),
                    )}
                  </select>
                </FilterField>

                <FilterField label="Entity type">
                  <input
                    value={
                      entityType
                    }
                    onChange={(
                      event,
                    ) => {
                      setEntityType(
                        event.target
                          .value,
                      );
                      setPage(0);
                    }}
                    placeholder="e.g. DONATION"
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--krishna-blue)]"
                  />
                </FilterField>

                <FilterField label="Entity ID">
                  <input
                    value={
                      entityId
                    }
                    onChange={(
                      event,
                    ) => {
                      setEntityId(
                        event.target
                          .value,
                      );
                      setPage(0);
                    }}
                    placeholder="UUID"
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--krishna-blue)]"
                  />
                </FilterField>

                <FilterField label="User ID">
                  <input
                    value={
                      userId
                    }
                    onChange={(
                      event,
                    ) => {
                      setUserId(
                        event.target
                          .value,
                      );
                      setPage(0);
                    }}
                    placeholder="UUID"
                    className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--krishna-blue)]"
                  />
                </FilterField>
              </div>
            )}
          </div>

          {auditQuery.isError && (
            <div className="m-5">
              <ErrorState
                message={
                  auditQuery.error instanceof
                  Error
                    ? auditQuery.error
                        .message
                    : "Unable to load audit activity."
                }
                onRetry={() =>
                  void auditQuery.refetch()
                }
              />
            </div>
          )}

          {auditQuery.isLoading ? (
            <PageLoading />
          ) : auditQuery.isError ? null : filteredLogs.length ===
            0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--ivory)] text-left">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        Activity
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        Entity
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        User
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        Time
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredLogs.map(
                      (
                        item: AuditLogResponse,
                      ) => (
                        <tr
                          key={
                            item.id
                          }
                          className="transition hover:bg-[var(--ivory)]/60"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-xl bg-[var(--ivory)] p-2 text-[var(--krishna-blue)]">
                                <Activity
                                  size={16}
                                />
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-[var(--earth-brown-deep)]">
                                  {
                                    item.action
                                  }
                                </p>

                                <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
                                  {shortId(
                                    item.id,
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-[var(--earth-brown-deep)]">
                              {
                                item.entity_type
                              }
                            </p>

                            <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
                              {shortId(
                                item.entity_id,
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-mono text-xs text-[var(--muted-foreground)]">
                              {shortId(
                                item.user_id,
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                              <Clock3
                                size={15}
                              />
                              {formatDate(
                                item.created_at,
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${actionClass(
                                  item.action,
                                )}`}
                              >
                                {
                                  item.action
                                }
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedAuditId(
                                    item.id,
                                  )
                                }
                                className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--ivory)] hover:text-[var(--krishna-blue)]"
                                title="View details"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Showing{" "}
                  {
                    filteredLogs.length
                  }{" "}
                  record
                  {filteredLogs.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  on page{" "}
                  {page + 1}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      page === 0
                    }
                    onClick={() =>
                      setPage(
                        (
                          value,
                        ) =>
                          Math.max(
                            0,
                            value -
                              1,
                          ),
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--earth-brown-deep)] disabled:opacity-40"
                  >
                    <ChevronLeft
                      size={15}
                    />
                    Previous
                  </button>

                  <span className="rounded-lg bg-[var(--ivory)] px-3 py-2 text-xs font-semibold text-[var(--earth-brown-deep)]">
                    {page + 1}
                  </span>

                  <button
                    type="button"
                    disabled={
                      auditLogs.length <
                      PAGE_SIZE
                    }
                    onClick={() =>
                      setPage(
                        (
                          value,
                        ) =>
                          value +
                          1,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--earth-brown-deep)] disabled:opacity-40"
                  >
                    Next
                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {selectedAuditId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35">
          <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--antique-gold)]">
                  Audit detail
                </p>

                <h2 className="mt-1 font-display text-2xl font-semibold text-[var(--earth-brown-deep)]">
                  Activity Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAuditId(
                    undefined,
                  )
                }
                className="rounded-xl p-2 text-[var(--muted-foreground)] hover:bg-[var(--ivory)]"
              >
                <X size={20} />
              </button>
            </div>

            {detailQuery.isLoading ||
            !detailQuery.data ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Loading details...
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-5 p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailItem
                      label="Action"
                      value={
                        detailQuery
                          .data
                          .action
                      }
                    />

                    <DetailItem
                      label="Entity"
                      value={
                        detailQuery
                          .data
                          .entity_type
                      }
                    />

                    <DetailItem
                      label="Entity ID"
                      value={
                        detailQuery
                          .data
                          .entity_id ||
                        "—"
                      }
                      mono
                    />

                    <DetailItem
                      label="User ID"
                      value={
                        detailQuery
                          .data
                          .user_id ||
                        "—"
                      }
                      mono
                    />

                    <DetailItem
                      label="Temple ID"
                      value={
                        detailQuery
                          .data
                          .temple_id ||
                        "—"
                      }
                      mono
                    />

                    <DetailItem
                      label="Created"
                      value={formatDate(
                        detailQuery
                          .data
                          .created_at,
                      )}
                    />
                  </div>

                  <JsonSection
                    title="Previous values"
                    value={
                      detailQuery
                        .data
                        .old_values
                    }
                  />

                  <JsonSection
                    title="New values"
                    value={
                      detailQuery
                        .data
                        .new_values
                    }
                  />

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--ivory)] p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={16}
                        className="text-[var(--krishna-blue)]"
                      />

                      <p className="text-sm font-semibold text-[var(--earth-brown-deep)]">
                        Request Metadata
                      </p>
                    </div>

                    <div className="mt-4 space-y-4">
                      <MetaRow
                        label="IP address"
                        value={
                          detailQuery
                            .data
                            .ip_address ||
                          "—"
                        }
                      />

                      <MetaRow
                        label="User agent"
                        value={
                          detailQuery
                            .data
                            .user_agent ||
                          "—"
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
                      Audit ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-[var(--earth-brown-deep)]">
                      {
                        detailQuery
                          .data
                          .id
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

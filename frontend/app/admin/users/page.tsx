"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Eye,
  Lock,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";

import {
  useAuth,
} from "@/lib/auth/auth-context";

import {
  apiRequest,
} from "@/lib/api/client";

import {
  useCreateUser,
  useUpdateUserStatus,
  useUser,
  useUsers,
} from "@/features/users/hooks";

import type {
  UserCreate,
  UserResponse,
  UserRole,
} from "@/features/users/api";

type Temple = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
};

const ROLES: {
  value: UserRole;
  label: string;
  description: string;
}[] = [
  {
    value: "TEMPLE_ADMIN",
    label: "Temple Admin",
    description:
      "Manages temple operations and staff.",
  },
  {
    value: "STAFF",
    label: "Staff",
    description:
      "Handles day-to-day temple operations.",
  },
  {
    value: "PANDIT",
    label: "Pandit",
    description:
      "Performs and manages religious services.",
  },
  {
    value: "VOLUNTEER",
    label: "Volunteer",
    description:
      "Supports temple activities and events.",
  },
];

function formatId(
  value: string | null | undefined,
) {
  if (!value) {
    return "—";
  }

  return `${value.slice(
    0,
    8,
  )}…`;
}

function getInitials(
  firstName: string,
  lastName: string | null,
) {
  return `${firstName.charAt(0)}${
    lastName?.charAt(0) ?? ""
  }`.toUpperCase();
}

function getRoleLabel(
  roleId: string,
) {
  return formatId(roleId);
}

function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
        Loading users...
      </div>
    </div>
  );
}

export default function UsersPage() {
  const {
    user,
  } = useAuth();

  const [mounted, setMounted] =
    useState(false);

  const [selectedTempleId, setSelectedTempleId] =
    useState("");

  const [temples, setTemples] =
    useState<Temple[]>([]);

  const [templesLoading, setTemplesLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "ALL" | "ACTIVE" | "INACTIVE"
    >("ALL");

  const [roleFilter, setRoleFilter] =
    useState<
      "ALL" | UserRole
    >("ALL");

  const [showCreate, setShowCreate] =
    useState(false);

  const [selectedUserId, setSelectedUserId] =
    useState<string>();

  const [showDetails, setShowDetails] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [statusError, setStatusError] =
    useState("");

  const [form, setForm] =
    useState<{
      temple_id: string;
      role: UserRole;
      email: string;
      phone: string;
      password: string;
      first_name: string;
      last_name: string;
    }>({
      temple_id: "",
      role: "STAFF",
      email: "",
      phone: "",
      password: "",
      first_name: "",
      last_name: "",
    });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated =
    mounted &&
    Boolean(user);

  const usersQuery =
    useUsers(isAuthenticated);

  const createMutation =
    useCreateUser();

  const statusMutation =
    useUpdateUserStatus();

  const selectedUserQuery =
    useUser(
      selectedUserId,
      showDetails,
    );

  /*
   * We intentionally fetch the temple list independently.
   * UserResponse exposes role_id but not the role name,
   * so authorization remains controlled by the backend.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let cancelled = false;

    async function loadTemples() {
      setTemplesLoading(true);

      try {
        const response =
          await apiRequest<Temple[]>(
            "/api/v1/temples",
          );

        if (!cancelled) {
          setTemples(response);

          if (
            !selectedTempleId &&
            response.length === 1
          ) {
            setSelectedTempleId(
              response[0].id,
            );
          }
        }
      } catch {
        if (!cancelled) {
          setTemples([]);
        }
      } finally {
        if (!cancelled) {
          setTemplesLoading(false);
        }
      }
    }

    loadTemples();

    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    selectedTempleId,
  ]);

  const users =
    usersQuery.data ?? [];

  const visibleUsers =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return users.filter(
        (item) => {
          const fullName =
            `${item.first_name} ${
              item.last_name ?? ""
            }`.trim();

          const matchesSearch =
            !normalizedSearch ||
            fullName
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            item.email
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            item.phone
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            item.id
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            (statusFilter ===
              "ACTIVE" &&
              item.is_active) ||
            (statusFilter ===
              "INACTIVE" &&
              !item.is_active);

          /*
           * The current UserResponse exposes only role_id.
           * We therefore cannot safely infer a role name.
           * Role filtering is intentionally not applied
           * until the backend exposes role metadata.
           */
          const matchesRole =
            roleFilter === "ALL";

          return (
            matchesSearch &&
            matchesStatus &&
            matchesRole
          );
        },
      );
    }, [
      users,
      search,
      statusFilter,
      roleFilter,
    ]);

  const stats = useMemo(() => {
    const active =
      users.filter(
        (item) =>
          item.is_active,
      ).length;

    const inactive =
      users.length -
      active;

    const verified =
      users.filter(
        (item) =>
          item.is_verified,
      ).length;

    return {
      total: users.length,
      active,
      inactive,
      verified,
    };
  }, [users]);

  function resetForm() {
    setForm({
      temple_id:
        user?.temple_id ??
        selectedTempleId ??
        "",
      role: "STAFF",
      email: "",
      phone: "",
      password: "",
      first_name: "",
      last_name: "",
    });

    setCreateError("");
  }

  function openCreate() {
    resetForm();
    setShowCreate(true);
  }

  function closeCreate() {
    if (
      createMutation.isPending
    ) {
      return;
    }

    setShowCreate(false);
    setCreateError("");
  }

  async function handleCreate(
    event: React.FormEvent,
  ) {
    event.preventDefault();
    setCreateError("");

    const templeId =
      form.temple_id ||
      user?.temple_id ||
      selectedTempleId;

    if (!templeId) {
      setCreateError(
        "Please select a temple.",
      );
      return;
    }

    if (
      form.first_name.trim()
        .length < 2
    ) {
      setCreateError(
        "First name must contain at least 2 characters.",
      );
      return;
    }

    if (
      form.password.length < 8
    ) {
      setCreateError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    const payload: UserCreate = {
      temple_id: templeId,
      role: form.role,
      password:
        form.password,
      first_name:
        form.first_name.trim(),
      last_name:
        form.last_name.trim() ||
        null,
      email:
        form.email.trim() ||
        null,
      phone:
        form.phone.trim() ||
        null,
    };

    try {
      await createMutation.mutateAsync(
        payload,
      );

      setShowCreate(false);
      resetForm();
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Unable to create the user.",
      );
    }
  }

  async function handleStatusToggle(
    item: UserResponse,
  ) {
    setStatusError("");

    try {
      await statusMutation.mutateAsync(
        {
          userId: item.id,
          data: {
            is_active:
              !item.is_active,
          },
        },
      );
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "Unable to update user status.",
      );
    }
  }

  function openDetails(
    id: string,
  ) {
    setSelectedUserId(id);
    setShowDetails(true);
  }

  function closeDetails() {
    setShowDetails(false);
    setSelectedUserId(undefined);
  }

  if (!mounted) {
    return <PageLoading />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Authentication is required.
        </div>
      </div>
    );
  }

  if (
    usersQuery.isLoading
  ) {
    return <PageLoading />;
  }

  if (
    usersQuery.isError
  ) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Users
          </h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load users.
          {usersQuery.error instanceof Error
            ? ` ${usersQuery.error.message}`
            : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Users
            </h1>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {stats.total}
            </span>
          </div>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Manage temple administrators,
            staff, pandits and volunteers.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total
            </span>
            <ShieldCheck className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {stats.total}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Active
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">
            {stats.active}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Inactive
            </span>
            <UserX className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-amber-950">
            {stats.inactive}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-blue-700">
              Verified
            </span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-950">
            {stats.verified}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search by name, email, phone or ID..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as typeof statusFilter,
              )
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="ALL">
              All statuses
            </option>
            <option value="ACTIVE">
              Active
            </option>
            <option value="INACTIVE">
              Inactive
            </option>
          </select>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target
                  .value as typeof roleFilter,
              )
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="ALL">
              All roles
            </option>
            {ROLES.map(
              (role) => (
                <option
                  key={role.value}
                  value={role.value}
                >
                  {role.label}
                </option>
              ),
            )}
          </select>
        </div>

        {statusError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {statusError}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  User
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role ID
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Verification
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visibleUsers.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center"
                  >
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                        <Search className="h-5 w-5 text-slate-400" />
                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-800">
                        No users found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search
                        or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleUsers.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                            {getInitials(
                              item.first_name,
                              item.last_name,
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.first_name}{" "}
                              {item.last_name ?? ""}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatId(
                                item.id,
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {item.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              {item.email}
                            </div>
                          )}

                          {item.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {item.phone}
                            </div>
                          )}

                          {!item.email &&
                            !item.phone && (
                              <span className="text-sm text-slate-400">
                                No contact details
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                          {getRoleLabel(
                            item.role_id,
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {item.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Unverified
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openDetails(
                                item.id,
                              )
                            }
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>

                          <button
                            type="button"
                            disabled={
                              statusMutation.isPending
                            }
                            onClick={() =>
                              handleStatusToggle(
                                item,
                              )
                            }
                            className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              item.is_active
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {item.is_active ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Activate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="my-4 flex max-h-[92vh] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Add User
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Create a temple-level operational user.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreate}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                onSubmit={
                  handleCreate
                }
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <div className="space-y-5 p-5">
                  {createError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                      {createError}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Temple
                      </label>

                      <select
                        value={
                          form.temple_id
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              temple_id:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        disabled={
                          Boolean(
                            user.temple_id,
                          ) ||
                          templesLoading
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                      >
                        <option value="">
                          {templesLoading
                            ? "Loading temples..."
                            : "Select temple"}
                        </option>

                        {temples.map(
                          (temple) => (
                            <option
                              key={
                                temple.id
                              }
                              value={
                                temple.id
                              }
                            >
                              {
                                temple.name
                              }{" "}
                              (
                              {
                                temple.code
                              }
                              )
                            </option>
                          ),
                        )}
                      </select>

                      {user.temple_id && (
                        <p className="mt-1.5 text-xs text-slate-400">
                          Your account is restricted
                          to its assigned temple.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        First name
                        <span className="text-red-500">
                          {" "}
                          *
                        </span>
                      </label>

                      <input
                        required
                        value={
                          form.first_name
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              first_name:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder="First name"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Last name
                      </label>

                      <input
                        value={
                          form.last_name
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              last_name:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder="Last name"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Email
                      </label>

                      <input
                        type="email"
                        value={
                          form.email
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              email:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder="user@example.com"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Phone
                      </label>

                      <input
                        value={
                          form.phone
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              phone:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder="+91..."
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Role
                        <span className="text-red-500">
                          {" "}
                          *
                        </span>
                      </label>

                      <select
                        required
                        value={
                          form.role
                        }
                        onChange={(
                          event,
                        ) =>
                          setForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              role:
                                event
                                  .target
                                  .value as UserRole,
                            }),
                          )
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                      >
                        {ROLES.map(
                          (role) => (
                            <option
                              key={
                                role.value
                              }
                              value={
                                role.value
                              }
                            >
                              {
                                role.label
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Password
                        <span className="text-red-500">
                          {" "}
                          *
                        </span>
                      </label>

                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                        <input
                          required
                          type="password"
                          minLength={8}
                          maxLength={72}
                          value={
                            form.password
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                password:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          placeholder="Minimum 8 characters"
                          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Role permissions
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {ROLES.find(
                            (
                              role,
                            ) =>
                              role.value ===
                              form.role,
                          )?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
                  <button
                    type="button"
                    onClick={
                      closeCreate
                    }
                    disabled={
                      createMutation.isPending
                    }
                    className="h-9 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending
                    }
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  User details
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  Account
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeDetails
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {selectedUserQuery.isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
                </div>
              ) : selectedUserQuery.isError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Unable to load this user.
                </div>
              ) : selectedUserQuery.data ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700">
                      {getInitials(
                        selectedUserQuery
                          .data
                          .first_name,
                        selectedUserQuery
                          .data
                          .last_name,
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {
                          selectedUserQuery
                            .data
                            .first_name
                        }{" "}
                        {
                          selectedUserQuery
                            .data
                            .last_name ??
                          ""
                        }
                      </h3>

                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          selectedUserQuery
                            .data
                            .is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {selectedUserQuery
                          .data
                          .is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 break-all text-sm text-slate-800">
                        {
                          selectedUserQuery
                            .data
                            .email ??
                          "Not provided"
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {
                          selectedUserQuery
                            .data
                            .phone ??
                          "Not provided"
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Temple ID
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-700">
                        {
                          selectedUserQuery
                            .data
                            .temple_id ??
                          "Global"
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Role ID
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-700">
                        {
                          selectedUserQuery
                            .data
                            .role_id
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Verification
                      </p>
                      <p className="mt-1 text-sm text-slate-800">
                        {
                          selectedUserQuery
                            .data
                            .is_verified
                            ? "Verified"
                            : "Not verified"
                        }
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        User ID
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-700">
                        {
                          selectedUserQuery
                            .data
                            .id
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={
                      statusMutation.isPending
                    }
                    onClick={() =>
                      handleStatusToggle(
                        selectedUserQuery.data!,
                      )
                    }
                    className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium ${
                      selectedUserQuery
                        .data
                        .is_active
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    } disabled:opacity-50`}
                  >
                    {selectedUserQuery
                      .data
                      .is_active ? (
                      <>
                        <UserX className="h-4 w-4" />
                        Deactivate User
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Activate User
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  Plus,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/lib/auth/auth-context";
import { useTemples } from "@/features/temples/hooks";
import {
  useDevotees,
  useUpdateDevoteeStatus,
} from "@/features/devotees/hooks";
import type { DevoteeResponse } from "@/features/devotees/api";
import { apiJson } from "@/lib/api/client";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gotra: string;
  date_of_birth: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  gotra: "",
  date_of_birth: "",
  notes: "",
};

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
) {
  const first =
    firstName?.trim().charAt(0) ?? "";

  const last =
    lastName?.trim().charAt(0) ?? "";

  return (
    `${first}${last}`.toUpperCase() || "D"
  );
}

function getFullName(
  devotee: DevoteeResponse,
) {
  return [
    devotee.first_name,
    devotee.last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

function getFormFromDevotee(
  devotee: DevoteeResponse,
): FormState {
  return {
    first_name:
      devotee.first_name ?? "",
    last_name:
      devotee.last_name ?? "",
    email:
      devotee.email ?? "",
    phone:
      devotee.phone ?? "",
    address:
      devotee.address ?? "",
    city:
      devotee.city ?? "",
    state:
      devotee.state ?? "",
    country:
      devotee.country ?? "India",
    pincode:
      devotee.pincode ?? "",
    gotra:
      devotee.gotra ?? "",
    date_of_birth:
      devotee.date_of_birth ?? "",
    notes:
      devotee.notes ?? "",
  };
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-[#e4f3ed] text-[#287c72]"
          : "bg-[#f1ece7] text-[#74685f]"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-[#287c72]"
            : "bg-[#74685f]"
        }`}
      />

      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function DevoteeRow({
  devotee,
  onEdit,
  onToggleStatus,
  updating,
}: {
  devotee: DevoteeResponse;
  onEdit: (
    devotee: DevoteeResponse,
  ) => void;
  onToggleStatus: (
    devotee: DevoteeResponse,
  ) => void;
  updating: boolean;
}) {
  const fullName =
    getFullName(devotee);

  return (
    <tr className="border-b border-[#eee5d8] last:border-b-0 hover:bg-[#fffaf3]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9eef5] font-serif text-sm font-semibold text-[#183b63]">
            {getInitials(
              devotee.first_name,
              devotee.last_name,
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-[#332a25]">
              {fullName ||
                "Unnamed devotee"}
            </p>

            {devotee.gotra && (
              <p className="truncate text-xs text-[#74685f]">
                Gotra:{" "}
                {devotee.gotra}
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-[#59483d]">
        {devotee.phone || "—"}
      </td>

      <td className="px-5 py-4 text-sm text-[#59483d]">
        <span className="block max-w-[220px] truncate">
          {devotee.email || "—"}
        </span>
      </td>

      <td className="px-5 py-4 text-sm text-[#59483d]">
        {devotee.city ||
          devotee.state ||
          "—"}
      </td>

      <td className="px-5 py-4 text-sm text-[#74685f]">
        {devotee.gotra || "—"}
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          active={
            devotee.is_active
          }
        />
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() =>
              onEdit(devotee)
            }
            className="rounded-lg p-2 text-[#74685f] transition hover:bg-[#f3ecdf] hover:text-[#183b63]"
            title="Edit devotee"
          >
            <Edit3 size={16} />
          </button>

          <button
            type="button"
            onClick={() =>
              onToggleStatus(
                devotee,
              )
            }
            disabled={updating}
            className="rounded-lg p-2 text-[#74685f] transition hover:bg-[#f3ecdf] hover:text-[#b85c73] disabled:cursor-not-allowed disabled:opacity-50"
            title={
              devotee.is_active
                ? "Deactivate devotee"
                : "Activate devotee"
            }
          >
            {updating ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : devotee.is_active ? (
              <UserX size={16} />
            ) : (
              <UserCheck
                size={16}
              />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  name: keyof FormState;
  value: string;
  onChange: (
    name: keyof FormState,
    value: string,
  ) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={`devotee-${name}`}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#74685f]"
      >
        {label}
        {required && (
          <span className="ml-1 text-[#b85c73]">
            *
          </span>
        )}
      </label>

      <input
        id={`devotee-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            name,
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        required={required}
        className="w-full rounded-xl border border-[#e0d5c7] bg-[#fffdf8] px-3.5 py-2.5 text-sm text-[#332a25] outline-none placeholder:text-[#aaa096] focus:border-[#183b63] focus:ring-2 focus:ring-[#183b63]/10"
      />
    </div>
  );
}

function DevoteeFormModal({
  open,
  editingDevotee,
  form,
  saving,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editingDevotee:
    | DevoteeResponse
    | null;
  form: FormState;
  saving: boolean;
  error: string;
  onChange: (
    name: keyof FormState,
    value: string,
  ) => void;
  onClose: () => void;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>,
  ) => void;
}) {
  if (!open) {
    return null;
  }

  const editing =
    Boolean(editingDevotee);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#332a25]/45 p-4 sm:p-8">
      <div className="my-4 w-full max-w-3xl rounded-2xl border border-[#e6dccd] bg-[#fffdf8] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e6dccd] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b08a45]">
              TempleOS
            </p>

            <h2 className="mt-1 font-serif text-2xl text-[#183b63]">
              {editing
                ? "Edit Devotee"
                : "Add Devotee"}
            </h2>

            <p className="mt-1 text-sm text-[#74685f]">
              {editing
                ? "Update the devotee profile information."
                : "Create a new devotee record for this temple."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-[#74685f] transition hover:bg-[#f3ecdf] disabled:opacity-50"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-6"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-[#e8c9d0] bg-[#fff7f8] px-4 py-3 text-sm text-[#9d435b]">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="First Name"
              name="first_name"
              value={
                form.first_name
              }
              onChange={onChange}
              placeholder="Enter first name"
              required
            />

            <FormField
              label="Last Name"
              name="last_name"
              value={
                form.last_name
              }
              onChange={onChange}
              placeholder="Enter last name"
            />

            <FormField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
              type="tel"
              placeholder="+91 9876543210"
            />

            <FormField
              label="Email"
              name="email"
              value={form.email}
              onChange={onChange}
              type="email"
              placeholder="devotee@example.com"
            />

            <FormField
              label="Gotra"
              name="gotra"
              value={form.gotra}
              onChange={onChange}
              placeholder="Enter gotra"
            />

            <FormField
              label="Date of Birth"
              name="date_of_birth"
              value={
                form.date_of_birth
              }
              onChange={onChange}
              type="date"
            />

            <div className="md:col-span-2">
              <FormField
                label="Address"
                name="address"
                value={
                  form.address
                }
                onChange={onChange}
                placeholder="House number, street, locality"
              />
            </div>

            <FormField
              label="City"
              name="city"
              value={form.city}
              onChange={onChange}
              placeholder="City"
            />

            <FormField
              label="State"
              name="state"
              value={form.state}
              onChange={onChange}
              placeholder="State"
            />

            <FormField
              label="Country"
              name="country"
              value={
                form.country
              }
              onChange={onChange}
              placeholder="Country"
            />

            <FormField
              label="Pincode"
              name="pincode"
              value={
                form.pincode
              }
              onChange={onChange}
              placeholder="Pincode"
            />

            <div className="md:col-span-2">
              <label
                htmlFor="devotee-notes"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#74685f]"
              >
                Notes
              </label>

              <textarea
                id="devotee-notes"
                name="notes"
                rows={4}
                value={form.notes}
                onChange={(event) =>
                  onChange(
                    "notes",
                    event.target.value,
                  )
                }
                placeholder="Additional information about the devotee..."
                className="w-full resize-none rounded-xl border border-[#e0d5c7] bg-[#fffdf8] px-3.5 py-2.5 text-sm text-[#332a25] outline-none placeholder:text-[#aaa096] focus:border-[#183b63] focus:ring-2 focus:ring-[#183b63]/10"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#e6dccd] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-[#e0d5c7] px-5 py-2.5 text-sm font-semibold text-[#59483d] transition hover:bg-[#f3ecdf] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#183b63] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102c4a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {editing
                ? "Save Changes"
                : "Create Devotee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DevoteesPage() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const userHasTemple =
    Boolean(user?.temple_id);

  const templesQuery =
    useTemples(
      !authLoading &&
        isAuthenticated &&
        !userHasTemple,
    );

  const [
    selectedTempleId,
    setSelectedTempleId,
  ] = useState<string>();

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "active" | "inactive" | "all"
  >("active");

  const [page, setPage] =
    useState(0);

  const [
    editingDevotee,
    setEditingDevotee,
  ] =
    useState<DevoteeResponse | null>(
      null,
    );

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [form, setForm] =
    useState<FormState>(
      EMPTY_FORM,
    );

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const pageSize = 20;

  const firstActiveTemple =
    useMemo(() => {
      if (
        !templesQuery.data?.length
      ) {
        return undefined;
      }

      return (
        templesQuery.data.find(
          (temple) =>
            temple.is_active,
        ) ??
        templesQuery.data[0]
      );
    }, [templesQuery.data]);

  const effectiveTempleId =
    userHasTemple
      ? user?.temple_id ??
        undefined
      : selectedTempleId ??
        firstActiveTemple?.id;

  const devoteeQuery =
    useDevotees(
      {
        templeId:
          effectiveTempleId,
        search:
          search || undefined,
        isActive:
          statusFilter === "all"
            ? undefined
            : statusFilter ===
              "active",
        limit: pageSize,
        offset:
          page * pageSize,
      },
      Boolean(
        effectiveTempleId &&
          isAuthenticated &&
          !authLoading,
      ),
    );

  const statusMutation =
    useUpdateDevoteeStatus();

  useEffect(() => {
    if (
      !authLoading &&
      !isAuthenticated
    ) {
      window.location.replace(
        "/login",
      );
    }
  }, [
    authLoading,
    isAuthenticated,
  ]);

  function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPage(0);
    setSearch(
      searchInput.trim(),
    );
  }

  function handleStatusChange(
    value:
      | "active"
      | "inactive"
      | "all",
  ) {
    setStatusFilter(value);
    setPage(0);
  }

  function handleTempleChange(
    value: string,
  ) {
    setSelectedTempleId(value);
    setPage(0);
  }

  function handleToggleStatus(
    devotee: DevoteeResponse,
  ) {
    statusMutation.mutate({
      devoteeId: devotee.id,
      data: {
        is_active:
          !devotee.is_active,
      },
    });
  }

  function openCreate() {
    setEditingDevotee(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(
    devotee: DevoteeResponse,
  ) {
    setEditingDevotee(
      devotee,
    );

    setForm(
      getFormFromDevotee(
        devotee,
      ),
    );

    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingDevotee(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleFormChange(
    name: keyof FormState,
    value: string,
  ) {
    setForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );

    if (formError) {
      setFormError("");
    }
  }

  function cleanOptional(
    value: string,
  ) {
    const trimmed =
      value.trim();

    return trimmed
      ? trimmed
      : null;
  }

  async function handleFormSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!effectiveTempleId) {
      setFormError(
        "Please select a temple before saving the devotee.",
      );

      return;
    }

    const firstName =
      form.first_name.trim();

    if (
      firstName.length < 2
    ) {
      setFormError(
        "First name must contain at least 2 characters.",
      );

      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      setFormError(
        "Please enter a valid email address.",
      );

      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingDevotee) {
        await apiJson(
          `/api/v1/devotees/${editingDevotee.id}`,
          "PUT",
          {
            first_name:
              firstName,
            last_name:
              cleanOptional(
                form.last_name,
              ),
            email:
              cleanOptional(
                form.email,
              ),
            phone:
              cleanOptional(
                form.phone,
              ),
            address:
              cleanOptional(
                form.address,
              ),
            city:
              cleanOptional(
                form.city,
              ),
            state:
              cleanOptional(
                form.state,
              ),
            country:
              cleanOptional(
                form.country,
              ),
            pincode:
              cleanOptional(
                form.pincode,
              ),
            gotra:
              cleanOptional(
                form.gotra,
              ),
            date_of_birth:
              cleanOptional(
                form.date_of_birth,
              ),
            notes:
              cleanOptional(
                form.notes,
              ),
          },
        );
      } else {
        await apiJson(
          `/api/v1/devotees?temple_id=${encodeURIComponent(
            effectiveTempleId,
          )}`,
          "POST",
          {
            first_name:
              firstName,
            last_name:
              cleanOptional(
                form.last_name,
              ),
            email:
              cleanOptional(
                form.email,
              ),
            phone:
              cleanOptional(
                form.phone,
              ),
            address:
              cleanOptional(
                form.address,
              ),
            city:
              cleanOptional(
                form.city,
              ),
            state:
              cleanOptional(
                form.state,
              ),
            country:
              form.country.trim() ||
              "India",
            pincode:
              cleanOptional(
                form.pincode,
              ),
            gotra:
              cleanOptional(
                form.gotra,
              ),
            date_of_birth:
              cleanOptional(
                form.date_of_birth,
              ),
            notes:
              cleanOptional(
                form.notes,
              ),
          },
        );
      }

      await devoteeQuery.refetch();

      closeForm();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : editingDevotee
            ? "Unable to update the devotee."
            : "Unable to create the devotee.";

      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  if (
    authLoading ||
    !isAuthenticated
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbf7ef]">
        <Loader2
          className="animate-spin text-[#183b63]"
          size={28}
        />
      </main>
    );
  }

  const devotees =
    devoteeQuery.data ?? [];

  const canGoPrevious =
    page > 0;

  const canGoNext =
    devotees.length ===
    pageSize;

  return (
    <main className="min-h-screen bg-[#fbf7ef] text-[#332a25]">
      <div className="border-b border-[#e6dccd] bg-[#fffdf8]">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 lg:px-8">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Users
                size={18}
                className="text-[#b08a45]"
              />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b08a45]">
                TempleOS
              </span>
            </div>

            <h1 className="font-serif text-3xl text-[#183b63]">
              Devotees
            </h1>

            <p className="mt-1 text-sm text-[#74685f]">
              Manage devotee records
              and temple
              relationships.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            disabled={
              !effectiveTempleId
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#183b63] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102c4a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Add Devotee
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6 lg:px-8">
        <section className="mb-6 rounded-2xl border border-[#e6dccd] bg-[#fffdf8] p-5 shadow-[0_6px_24px_rgba(89,72,61,0.05)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-1 flex-col gap-4 md:flex-row">
              {!userHasTemple && (
                <div className="w-full md:max-w-xs">
                  <label
                    htmlFor="temple"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#74685f]"
                  >
                    Temple
                  </label>

                  <select
                    id="temple"
                    value={
                      effectiveTempleId ??
                      ""
                    }
                    onChange={(event) =>
                      handleTempleChange(
                        event.target
                          .value,
                      )
                    }
                    className="w-full rounded-xl border border-[#e0d5c7] bg-[#fffdf8] px-3.5 py-2.5 text-sm text-[#332a25] outline-none focus:border-[#183b63] focus:ring-2 focus:ring-[#183b63]/10"
                  >
                    {templesQuery.data
                      ?.filter(
                        (temple) =>
                          temple.is_active,
                      )
                      .map(
                        (
                          temple,
                        ) => (
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
                            }
                          </option>
                        ),
                      )}
                  </select>
                </div>
              )}

              <form
                onSubmit={
                  handleSearchSubmit
                }
                className="w-full md:max-w-md"
              >
                <label
                  htmlFor="devotee-search"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#74685f]"
                >
                  Search
                </label>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b8d82]"
                  />

                  <input
                    id="devotee-search"
                    type="search"
                    value={
                      searchInput
                    }
                    onChange={(
                      event,
                    ) =>
                      setSearchInput(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Name, phone or email"
                    className="w-full rounded-xl border border-[#e0d5c7] bg-[#fffdf8] py-2.5 pl-10 pr-4 text-sm text-[#332a25] outline-none placeholder:text-[#aaa096] focus:border-[#183b63] focus:ring-2 focus:ring-[#183b63]/10"
                  />
                </div>
              </form>
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#74685f]"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={
                  statusFilter
                }
                onChange={(
                  event,
                ) =>
                  handleStatusChange(
                    event.target
                      .value as
                      | "active"
                      | "inactive"
                      | "all",
                  )
                }
                className="min-w-[150px] rounded-xl border border-[#e0d5c7] bg-[#fffdf8] px-3.5 py-2.5 text-sm text-[#332a25] outline-none focus:border-[#183b63] focus:ring-2 focus:ring-[#183b63]/10"
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                <option value="all">
                  All devotees
                </option>
              </select>
            </div>
          </div>
        </section>

        {templesQuery.isLoading &&
          !userHasTemple && (
            <div className="mb-6 rounded-2xl border border-[#e6dccd] bg-[#fffdf8] p-6 text-center text-sm text-[#74685f]">
              <Loader2
                size={20}
                className="mx-auto mb-2 animate-spin text-[#183b63]"
              />
              Loading temples...
            </div>
          )}

        {devoteeQuery.isLoading && (
          <div className="rounded-2xl border border-[#e6dccd] bg-[#fffdf8] p-12 text-center">
            <Loader2
              size={28}
              className="mx-auto mb-3 animate-spin text-[#183b63]"
            />

            <p className="text-sm text-[#74685f]">
              Loading devotees...
            </p>
          </div>
        )}

        {devoteeQuery.isError && (
          <div className="rounded-2xl border border-[#e8c9d0] bg-[#fff7f8] p-6">
            <p className="font-semibold text-[#9d435b]">
              Unable to load devotees
            </p>

            <p className="mt-1 text-sm text-[#74685f]">
              Please refresh the
              page and try again.
            </p>
          </div>
        )}

        {!devoteeQuery.isLoading &&
          !devoteeQuery.isError &&
          devotees.length === 0 && (
            <div className="rounded-2xl border border-[#e6dccd] bg-[#fffdf8] px-6 py-16 text-center shadow-[0_6px_24px_rgba(89,72,61,0.04)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e9eef5] text-[#183b63]">
                <Users size={24} />
              </div>

              <h2 className="mt-4 font-serif text-2xl text-[#183b63]">
                No devotees found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#74685f]">
                No devotee records
                match the current
                search and filter
                criteria.
              </p>

              <button
                type="button"
                onClick={openCreate}
                disabled={
                  !effectiveTempleId
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#183b63] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#102c4a] disabled:opacity-50"
              >
                <Plus size={16} />
                Add First Devotee
              </button>
            </div>
          )}

        {!devoteeQuery.isLoading &&
          !devoteeQuery.isError &&
          devotees.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-[#e6dccd] bg-[#fffdf8] shadow-[0_6px_24px_rgba(89,72,61,0.05)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px]">
                  <thead className="bg-[#f8f2e8]">
                    <tr className="text-left text-xs uppercase tracking-wide text-[#74685f]">
                      <th className="px-5 py-3.5 font-semibold">
                        Devotee
                      </th>

                      <th className="px-5 py-3.5 font-semibold">
                        Phone
                      </th>

                      <th className="px-5 py-3.5 font-semibold">
                        Email
                      </th>

                      <th className="px-5 py-3.5 font-semibold">
                        Location
                      </th>

                      <th className="px-5 py-3.5 font-semibold">
                        Gotra
                      </th>

                      <th className="px-5 py-3.5 font-semibold">
                        Status
                      </th>

                      <th className="px-5 py-3.5 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {devotees.map(
                      (
                        devotee,
                      ) => (
                        <DevoteeRow
                          key={
                            devotee.id
                          }
                          devotee={
                            devotee
                          }
                          onEdit={
                            openEdit
                          }
                          onToggleStatus={
                            handleToggleStatus
                          }
                          updating={
                            statusMutation.isPending &&
                            statusMutation
                              .variables
                              ?.devoteeId ===
                              devotee.id
                          }
                        />
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#e6dccd] px-5 py-4">
                <p className="text-sm text-[#74685f]">
                  Showing{" "}
                  <span className="font-semibold text-[#59483d]">
                    {page *
                      pageSize +
                      1}
                  </span>{" "}
                  –{" "}
                  <span className="font-semibold text-[#59483d]">
                    {page *
                      pageSize +
                      devotees.length}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      !canGoPrevious
                    }
                    onClick={() =>
                      setPage(
                        (
                          current,
                        ) =>
                          Math.max(
                            current -
                              1,
                            0,
                          ),
                      )
                    }
                    className="rounded-lg border border-[#e0d5c7] p-2 text-[#59483d] transition hover:bg-[#f3ecdf] disabled:cursor-not-allowed disabled:opacity-40"
                    title="Previous page"
                  >
                    <ChevronLeft
                      size={17}
                    />
                  </button>

                  <span className="px-2 text-sm font-medium text-[#59483d]">
                    Page{" "}
                    {page +
                      1}
                  </span>

                  <button
                    type="button"
                    disabled={
                      !canGoNext
                    }
                    onClick={() =>
                      setPage(
                        (
                          current,
                        ) =>
                          current +
                          1,
                      )
                    }
                    className="rounded-lg border border-[#e0d5c7] p-2 text-[#59483d] transition hover:bg-[#f3ecdf] disabled:cursor-not-allowed disabled:opacity-40"
                    title="Next page"
                  >
                    <ChevronRight
                      size={17}
                    />
                  </button>
                </div>
              </div>
            </section>
          )}
      </div>

      <DevoteeFormModal
        open={showForm}
        editingDevotee={
          editingDevotee
        }
        form={form}
        saving={saving}
        error={formError}
        onChange={
          handleFormChange
        }
        onClose={closeForm}
        onSubmit={
          handleFormSubmit
        }
      />
    </main>
  );
}

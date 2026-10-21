"use client";

import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Globe2,
  Loader2,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import {
  useCreateTemple,
  useTemples,
  useUpdateTemple,
  useUpdateTempleStatus,
} from "@/features/temples/hooks";
import type {
  TempleCreate,
  TempleResponse,
  TempleUpdate,
} from "@/features/temples/api";

type ModalMode = "create" | "edit" | null;

type TempleForm = {
  name: string;
  code: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  timezone: string;
};

const emptyForm: TempleForm = {
  name: "",
  code: "",
  description: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  phone: "",
  email: "",
  website: "",
  timezone: "Asia/Kolkata",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function formFromTemple(
  temple: TempleResponse,
): TempleForm {
  return {
    name: temple.name,
    code: temple.code,
    description: temple.description ?? "",
    address: temple.address ?? "",
    city: temple.city ?? "",
    state: temple.state ?? "",
    country: temple.country,
    pincode: temple.pincode ?? "",
    phone: temple.phone ?? "",
    email: temple.email ?? "",
    website: temple.website ?? "",
    timezone: temple.timezone,
  };
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input aria-label="Value"
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <textarea aria-label="Enter temple description..."
        value={value}
        rows={4}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        placeholder="Enter temple description..."
      />
    </label>
  );
}

export default function TemplesPage() {
  const {
    data: temples = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTemples();

  const createMutation = useCreateTemple();
  const updateMutation = useUpdateTemple();
  const statusMutation =
    useUpdateTempleStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">(
      "all",
    );

  const [modalMode, setModalMode] =
    useState<ModalMode>(null);
  const [selectedTemple, setSelectedTemple] =
    useState<TempleResponse | null>(null);
  const [form, setForm] =
    useState<TempleForm>(emptyForm);

  const [formError, setFormError] =
    useState("");

  const filteredTemples = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return temples.filter((temple) => {
      const matchesSearch =
        !query ||
        temple.name
          .toLowerCase()
          .includes(query) ||
        temple.code
          .toLowerCase()
          .includes(query) ||
        (temple.city ?? "")
          .toLowerCase()
          .includes(query) ||
        (temple.state ?? "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          temple.is_active) ||
        (statusFilter === "inactive" &&
          !temple.is_active);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    temples,
    search,
    statusFilter,
  ]);

  const activeCount = temples.filter(
    (temple) => temple.is_active,
  ).length;

  const inactiveCount =
    temples.length - activeCount;

  function openCreate() {
    setSelectedTemple(null);
    setForm(emptyForm);
    setFormError("");
    setModalMode("create");
  }

  function openEdit(
    temple: TempleResponse,
  ) {
    setSelectedTemple(temple);
    setForm(formFromTemple(temple));
    setFormError("");
    setModalMode("edit");
  }

  function closeModal() {
    if (
      createMutation.isPending ||
      updateMutation.isPending
    ) {
      return;
    }

    setModalMode(null);
    setSelectedTemple(null);
    setForm(emptyForm);
    setFormError("");
  }

  function updateField(
    field: keyof TempleForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const code = form.code.trim();

    if (name.length < 2) {
      setFormError(
        "Temple name must contain at least 2 characters.",
      );
      return;
    }

    if (
      modalMode === "create" &&
      code.length < 2
    ) {
      setFormError(
        "Temple code must contain at least 2 characters.",
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

    try {
      if (modalMode === "create") {
        const payload: TempleCreate = {
          name,
          code,
          description:
            form.description.trim() || null,
          address:
            form.address.trim() || null,
          city:
            form.city.trim() || null,
          state:
            form.state.trim() || null,
          country:
            form.country.trim() || "India",
          pincode:
            form.pincode.trim() || null,
          phone:
            form.phone.trim() || null,
          email:
            form.email.trim() || null,
          website:
            form.website.trim() || null,
          timezone:
            form.timezone.trim() ||
            "Asia/Kolkata",
        };

        await createMutation.mutateAsync(
          payload,
        );
      } else if (
        modalMode === "edit" &&
        selectedTemple
      ) {
        const payload: TempleUpdate = {
          name,
          description:
            form.description.trim() || null,
          address:
            form.address.trim() || null,
          city:
            form.city.trim() || null,
          state:
            form.state.trim() || null,
          country:
            form.country.trim() || null,
          pincode:
            form.pincode.trim() || null,
          phone:
            form.phone.trim() || null,
          email:
            form.email.trim() || null,
          website:
            form.website.trim() || null,
          timezone:
            form.timezone.trim() || null,
        };

        await updateMutation.mutateAsync({
          templeId: selectedTemple.id,
          payload,
        });
      }

      closeModal();
    } catch (submitError) {
      setFormError(
        getErrorMessage(submitError),
      );
    }
  }

  async function handleStatusChange(
    temple: TempleResponse,
  ) {
    const nextStatus = !temple.is_active;

    const action = nextStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${temple.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await statusMutation.mutateAsync({
        templeId: temple.id,
        isActive: nextStatus,
      });
    } catch (statusError) {
      window.alert(
        getErrorMessage(statusError),
      );
    }
  }

  const mutationPending =
    createMutation.isPending ||
    updateMutation.isPending;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Temple Management
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage temples and their
                  operational status.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Add Temple
          </button>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Total Temples
              </span>
              <Building2 className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {temples.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Active
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Inactive
              </span>
              <XCircle className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {inactiveCount}
            </p>
          </div>
        </div>

        {/* Main card */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input aria-label="Search by name, code or location..."
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, code or location..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="relative">
              <select aria-label="Status Filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "all"
                      | "active"
                      | "inactive",
                  )
                }
                className="appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">
                  All statuses
                </option>
                <option value="active">
                  Active
                </option>
                <option value="inactive">
                  Inactive
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading temples...
              </div>
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <XCircle className="mb-3 h-8 w-8 text-red-500" />

              <h2 className="font-medium text-slate-900">
                Unable to load temples
              </h2>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                {getErrorMessage(error)}
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading &&
            !isError &&
            filteredTemples.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <Building2 className="mb-3 h-9 w-9 text-slate-300" />

                <h2 className="font-medium text-slate-900">
                  {temples.length === 0
                    ? "No temples yet"
                    : "No matching temples"}
                </h2>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  {temples.length === 0
                    ? "Create your first temple to start managing TempleOS."
                    : "Try changing your search or status filter."}
                </p>

                {temples.length === 0 && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add Temple
                  </button>
                )}
              </div>
            )}

          {/* Table */}
          {!isLoading &&
            !isError &&
            filteredTemples.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">
                        Temple
                      </th>
                      <th className="px-5 py-3">
                        Location
                      </th>
                      <th className="px-5 py-3">
                        Contact
                      </th>
                      <th className="px-5 py-3">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredTemples.map(
                      (temple) => (
                        <tr
                          key={temple.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <Building2 className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">
                                  {temple.name}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  Code:{" "}
                                  {temple.code}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex max-w-xs items-start gap-2 text-sm text-slate-600">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                              <span>
                                {[
                                  temple.city,
                                  temple.state,
                                  temple.country,
                                ]
                                  .filter(
                                    Boolean,
                                  )
                                  .join(
                                    ", ",
                                  ) ||
                                  "Location not configured"}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1 text-sm text-slate-600">
                              {temple.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                                  {temple.phone}
                                </div>
                              )}

                              {temple.website && (
                                <div className="flex items-center gap-2">
                                  <Globe2 className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="max-w-[180px] truncate">
                                    {temple.website}
                                  </span>
                                </div>
                              )}

                              {!temple.phone &&
                                !temple.website && (
                                  <span className="text-slate-400">
                                    Not configured
                                  </span>
                                )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              active={
                                temple.is_active
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    temple,
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  statusMutation.isPending
                                }
                                onClick={() =>
                                  handleStatusChange(
                                    temple,
                                  )
                                }
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  temple.is_active
                                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                }`}
                              >
                                {statusMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                )}

                                {temple.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>

      {/* Create / Edit modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="temple-modal-title"
            className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2
                  id="temple-modal-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  {modalMode === "create"
                    ? "Add Temple"
                    : "Edit Temple"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {modalMode === "create"
                    ? "Create a new temple in TempleOS."
                    : "Update the temple information."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={mutationPending}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="max-h-[calc(92vh-145px)] overflow-y-auto"
            >
              <div className="grid gap-5 p-5 md:grid-cols-2">
                <Field
                  label="Temple Name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    updateField(
                      "name",
                      value,
                    )
                  }
                  placeholder="e.g. Shri Ram Mandir"
                />

                <Field
                  label="Temple Code"
                  required
                  value={form.code}
                  disabled={
                    modalMode === "edit"
                  }
                  onChange={(value) =>
                    updateField(
                      "code",
                      value,
                    )
                  }
                  placeholder="e.g. SRM001"
                />

                <TextAreaField
                  label="Description"
                  value={form.description}
                  onChange={(value) =>
                    updateField(
                      "description",
                      value,
                    )
                  }
                />

                <Field
                  label="Address"
                  value={form.address}
                  onChange={(value) =>
                    updateField(
                      "address",
                      value,
                    )
                  }
                  placeholder="Street / locality"
                />

                <Field
                  label="City"
                  value={form.city}
                  onChange={(value) =>
                    updateField(
                      "city",
                      value,
                    )
                  }
                  placeholder="City"
                />

                <Field
                  label="State"
                  value={form.state}
                  onChange={(value) =>
                    updateField(
                      "state",
                      value,
                    )
                  }
                  placeholder="State"
                />

                <Field
                  label="Country"
                  value={form.country}
                  onChange={(value) =>
                    updateField(
                      "country",
                      value,
                    )
                  }
                  placeholder="Country"
                />

                <Field
                  label="Pincode"
                  value={form.pincode}
                  onChange={(value) =>
                    updateField(
                      "pincode",
                      value,
                    )
                  }
                  placeholder="Pincode"
                />

                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(value) =>
                    updateField(
                      "phone",
                      value,
                    )
                  }
                  placeholder="Contact number"
                />

                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateField(
                      "email",
                      value,
                    )
                  }
                  placeholder="temple@example.com"
                />

                <Field
                  label="Website"
                  value={form.website}
                  onChange={(value) =>
                    updateField(
                      "website",
                      value,
                    )
                  }
                  placeholder="https://..."
                />

                <Field
                  label="Timezone"
                  value={form.timezone}
                  onChange={(value) =>
                    updateField(
                      "timezone",
                      value,
                    )
                  }
                  placeholder="Asia/Kolkata"
                />
              </div>

              {formError && (
                <div className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={mutationPending}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={mutationPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {mutationPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {modalMode === "create"
                    ? "Create Temple"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

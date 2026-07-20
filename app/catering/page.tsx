"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type CateringStatus =
  | "new"
  | "contacted"
  | "quote_sent"
  | "confirmed"
  | "completed"
  | "declined"
  | "canceled";

type CateringRequest = {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  event_date: string;
  event_time: string | null;
  guest_count: number;
  event_type: string | null;
  fulfillment_type: "pickup" | "delivery";
  delivery_address: string | null;
  menu_requests: string;
  dietary_restrictions: string | null;
  setup_requirements: string | null;
  special_instructions: string | null;
  estimated_budget: number | null;
  preferred_callback_time: string | null;
  internal_notes: string | null;
  status: CateringStatus;
  source: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_reason: string | null;
};

type ViewMode = "requests" | "confirmed" | "deleted";
type SortMode = "newest" | "oldest" | "event_soonest" | "largest";

const STATUS_LABELS: Record<CateringStatus, string> = {
  new: "New request",
  contacted: "Contacted",
  quote_sent: "Quote sent",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
  canceled: "Canceled",
};

const STATUS_STYLES: Record<CateringStatus, string> = {
  new: "bg-blue-50 text-blue-700 ring-blue-200",
  contacted: "bg-amber-50 text-amber-700 ring-amber-200",
  quote_sent: "bg-violet-50 text-violet-700 ring-violet-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  declined: "bg-rose-50 text-rose-700 ring-rose-200",
  canceled: "bg-slate-100 text-slate-600 ring-slate-200",
};

const EMPTY_FORM = {
  customer_name: "",
  phone: "",
  email: "",
  event_date: "",
  event_time: "",
  guest_count: "25",
  event_type: "",
  fulfillment_type: "pickup" as "pickup" | "delivery",
  delivery_address: "",
  menu_requests: "",
  dietary_restrictions: "",
  setup_requirements: "",
  special_instructions: "",
  estimated_budget: "",
  preferred_callback_time: "",
};

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

function clean(value: string | null | undefined) {
  return (value ?? "").trim();
}

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "Time not set";
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours)) return value;
  const date = new Date();
  date.setHours(hours, minutes || 0, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value: number | null) {
  if (value === null || Number.isNaN(value)) return "Not estimated";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function timeUntilDeletion(deletedAt: string | null) {
  if (!deletedAt) return "";
  const expires = new Date(deletedAt).getTime() + 3 * 24 * 60 * 60 * 1000;
  const difference = expires - Date.now();

  if (difference <= 0) return "Expired";
  const hours = Math.ceil(difference / (60 * 60 * 1000));
  if (hours <= 24) return `${hours} hour${hours === 1 ? "" : "s"} remaining`;

  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} remaining`;
}

function containsSearch(request: CateringRequest, query: string) {
  if (!query) return true;

  return [
    request.customer_name,
    request.phone,
    request.email,
    request.event_type,
    request.delivery_address,
    request.menu_requests,
    request.dietary_restrictions,
    request.special_instructions,
    request.internal_notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query.toLowerCase());
}

export default function Catering() {
  const supabase = useMemo(() => getSupabase(), []);
  const [requests, setRequests] = useState<CateringRequest[]>([]);
  const [view, setView] = useState<ViewMode>("requests");
  const [query, setQuery] = useState("");
  const [fulfillment, setFulfillment] = useState<"all" | "pickup" | "delivery">(
    "all"
  );
  const [sort, setSort] = useState<SortMode>("event_soonest");
  const [selected, setSelected] = useState<CateringRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadRequests(showSpinner = false) {
    if (!supabase) {
      setError(
        "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      setLoading(false);
      return;
    }

    if (showSpinner) setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("catering_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setRequests((data ?? []) as CateringRequest[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRequests();

    if (!supabase) return;

    const channel = supabase
      .channel("catering-requests-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "catering_requests",
        },
        () => loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    setNotes(selected?.internal_notes ?? "");
  }, [selected]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const activeRequests = useMemo(
    () => requests.filter((request) => !request.deleted_at),
    [requests]
  );

  const deletedRequests = useMemo(
    () => requests.filter((request) => Boolean(request.deleted_at)),
    [requests]
  );

  const confirmedRequests = useMemo(
    () =>
      activeRequests.filter((request) =>
        ["confirmed", "completed"].includes(request.status)
      ),
    [activeRequests]
  );

  const incomingRequests = useMemo(
    () =>
      activeRequests.filter(
        (request) => !["confirmed", "completed"].includes(request.status)
      ),
    [activeRequests]
  );

  const visibleRequests = useMemo(() => {
    const base =
      view === "requests"
        ? incomingRequests
        : view === "confirmed"
          ? confirmedRequests
          : deletedRequests;

    const filtered = base.filter((request) => {
      const matchesFulfillment =
        fulfillment === "all" ||
        request.fulfillment_type === fulfillment;
      return matchesFulfillment && containsSearch(request, query);
    });

    return [...filtered].sort((a, b) => {
      if (sort === "newest") {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      }

      if (sort === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sort === "largest") {
        return b.guest_count - a.guest_count;
      }

      return (
        new Date(`${a.event_date}T${a.event_time || "23:59"}`).getTime() -
        new Date(`${b.event_date}T${b.event_time || "23:59"}`).getTime()
      );
    });
  }, [
    view,
    incomingRequests,
    confirmedRequests,
    deletedRequests,
    query,
    fulfillment,
    sort,
  ]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = confirmedRequests.filter(
      (request) => request.event_date >= today && request.status !== "completed"
    );

    return {
      newRequests: incomingRequests.filter((request) => request.status === "new")
        .length,
      confirmed: upcoming.length,
      guests: upcoming.reduce(
        (total, request) => total + request.guest_count,
        0
      ),
      revenue: upcoming.reduce(
        (total, request) => total + (request.estimated_budget ?? 0),
        0
      ),
    };
  }, [incomingRequests, confirmedRequests]);

  async function updateRequest(
    request: CateringRequest,
    updates: Partial<CateringRequest>,
    successMessage: string
  ) {
    if (!supabase) return;

    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("catering_requests")
      .update(updates)
      .eq("id", request.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotice(successMessage);
      setSelected((current) =>
        current?.id === request.id ? { ...current, ...updates } : current
      );
      await loadRequests();
    }

    setSaving(false);
  }

  async function archiveRequest(request: CateringRequest) {
    const reason =
      window.prompt(
        "Why is this request being removed? Example: Customer canceled, duplicate, or not approved."
      )?.trim() || "Removed by staff";

    await updateRequest(
      request,
      {
        deleted_at: new Date().toISOString(),
        deleted_reason: reason,
      },
      "Request moved to Deleted Requests for 3 days."
    );
    setSelected(null);
  }

  async function restoreRequest(request: CateringRequest) {
    await updateRequest(
      request,
      {
        deleted_at: null,
        deleted_reason: null,
      },
      "Catering request restored."
    );
  }

  async function deleteForever(request: CateringRequest) {
    if (!supabase) return;

    const confirmed = window.confirm(
      "Permanently delete this catering request? This cannot be undone."
    );
    if (!confirmed) return;

    setSaving(true);
    const { error: deleteError } = await supabase
      .from("catering_requests")
      .delete()
      .eq("id", request.id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setNotice("Request permanently deleted.");
      setSelected(null);
      await loadRequests();
    }
    setSaving(false);
  }

  async function saveNotes() {
    if (!selected) return;

    await updateRequest(
      selected,
      { internal_notes: notes.trim() || null },
      "Internal notes saved."
    );
  }

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    if (form.fulfillment_type === "delivery" && !form.delivery_address.trim()) {
      setError("A delivery address is required for delivery requests.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase
      .from("catering_requests")
      .insert({
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        event_date: form.event_date,
        event_time: form.event_time || null,
        guest_count: Number(form.guest_count),
        event_type: form.event_type.trim() || null,
        fulfillment_type: form.fulfillment_type,
        delivery_address:
          form.fulfillment_type === "delivery"
            ? form.delivery_address.trim()
            : null,
        menu_requests: form.menu_requests.trim(),
        dietary_restrictions: form.dietary_restrictions.trim() || null,
        setup_requirements: form.setup_requirements.trim() || null,
        special_instructions: form.special_instructions.trim() || null,
        estimated_budget: form.estimated_budget
          ? Number(form.estimated_budget)
          : null,
        preferred_callback_time:
          form.preferred_callback_time.trim() || null,
        status: "new",
        source: "staff",
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setForm(EMPTY_FORM);
      setIsNewOpen(false);
      setNotice("New catering request created.");
      await loadRequests();
    }

    setSaving(false);
  }

  const viewTitle =
    view === "requests"
      ? "Incoming catering requests"
      : view === "confirmed"
        ? "Confirmed catering requests"
        : "Deleted catering requests";

  const viewDescription =
    view === "requests"
      ? "Review, contact, confirm, or remove new requests."
      : view === "confirmed"
        ? "Upcoming and completed catering events."
        : "Restore requests or permanently remove them. Deleted requests expire after 3 days.";

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      {notice && (
        <div className="fixed right-4 top-4 z-[70] max-w-sm rounded-2xl bg-[#123b2a] px-5 py-4 font-bold text-white shadow-2xl">
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] bg-[#123b2a] text-white shadow-xl shadow-emerald-950/10">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.25),transparent_35%)] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">
                Live catering workspace
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Catering Management
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75 sm:text-base">
                Review AI and staff-created requests, confirm events, search real
                customer data, and recover removed requests for up to three days.
              </p>
            </div>

            <button
              onClick={() => setIsNewOpen(true)}
              className="rounded-2xl bg-white px-5 py-3 font-black text-[#123b2a] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              + New catering request
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "New requests",
            value: stats.newRequests.toLocaleString(),
            helper: "Need staff review",
          },
          {
            label: "Confirmed events",
            value: stats.confirmed.toLocaleString(),
            helper: "Upcoming",
          },
          {
            label: "Guests scheduled",
            value: stats.guests.toLocaleString(),
            helper: "Confirmed events",
          },
          {
            label: "Expected revenue",
            value: formatMoney(stats.revenue),
            helper: "From provided estimates",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-bold text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {item.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {item.helper}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                {
                  key: "requests" as const,
                  label: "Requests",
                  count: incomingRequests.length,
                },
                {
                  key: "confirmed" as const,
                  label: "Confirmed Catering",
                  count: confirmedRequests.length,
                },
                {
                  key: "deleted" as const,
                  label: "Deleted Requests",
                  count: deletedRequests.length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setView(tab.key)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                    view === tab.key
                      ? "bg-[#123b2a] text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      view === tab.key
                        ? "bg-white/15 text-white"
                        : "bg-white text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => loadRequests(true)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Refresh data
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer, phone, email, event, address, menu, or notes..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <select
              value={fulfillment}
              onChange={(event) =>
                setFulfillment(
                  event.target.value as "all" | "pickup" | "delivery"
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="all">Pickup & delivery</option>
              <option value="pickup">Pickup only</option>
              <option value="delivery">Delivery only</option>
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="event_soonest">Event date: soonest</option>
              <option value="newest">Request: newest</option>
              <option value="oldest">Request: oldest</option>
              <option value="largest">Largest guest count</option>
            </select>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              {viewTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{viewDescription}</p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-3xl bg-slate-100"
                />
              ))}
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                {view === "deleted" ? "↺" : "✓"}
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">
                Nothing here right now
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleRequests.map((request) => (
                <article
                  key={request.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <button
                    onClick={() => setSelected(request)}
                    className="w-full text-left"
                  >
                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-xl font-black tracking-tight text-slate-950">
                              {request.customer_name}
                            </h3>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                                request.deleted_at
                                  ? "bg-slate-100 text-slate-600 ring-slate-200"
                                  : STATUS_STYLES[request.status]
                              }`}
                            >
                              {request.deleted_at
                                ? "Deleted"
                                : STATUS_LABELS[request.status]}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-slate-500">
                            {request.event_type || "Catering event"} ·{" "}
                            {request.guest_count} guests
                          </p>
                        </div>

                        <div className="shrink-0 rounded-2xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-slate-200">
                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                            Estimate
                          </p>
                          <p className="mt-0.5 font-black text-emerald-700">
                            {formatMoney(request.estimated_budget)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-3">
                      {[
                        {
                          label: "Event",
                          value: formatDate(request.event_date),
                        },
                        {
                          label: "Time",
                          value: formatTime(request.event_time),
                        },
                        {
                          label: "Fulfillment",
                          value:
                            request.fulfillment_type === "delivery"
                              ? "Delivery"
                              : "Pickup",
                        },
                      ].map((detail) => (
                        <div
                          key={detail.label}
                          className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-100"
                        >
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                            {detail.label}
                          </p>
                          <p className="mt-1 truncate text-sm font-black text-slate-800">
                            {detail.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 pb-5">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-purple-700">
                          Requested menu
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-700">
                          {request.menu_requests}
                        </p>
                      </div>

                      {request.deleted_at && (
                        <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 p-3 text-sm">
                          <p className="font-black text-rose-700">
                            {timeUntilDeletion(request.deleted_at)}
                          </p>
                          <p className="mt-1 text-rose-700/75">
                            {request.deleted_reason || "No reason provided"}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                    <button
                      onClick={() => setSelected(request)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      View details
                    </button>

                    {!request.deleted_at && view === "requests" && (
                      <>
                        {request.status === "new" && (
                          <button
                            disabled={saving}
                            onClick={() =>
                              updateRequest(
                                request,
                                { status: "contacted" },
                                "Request marked as contacted."
                              )
                            }
                            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                          >
                            Mark contacted
                          </button>
                        )}

                        <button
                          disabled={saving}
                          onClick={() =>
                            updateRequest(
                              request,
                              { status: "confirmed" },
                              "Catering request confirmed."
                            )
                          }
                          className="rounded-xl bg-[#123b2a] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0f3224] disabled:opacity-50"
                        >
                          Confirm request
                        </button>

                        <button
                          disabled={saving}
                          onClick={() => archiveRequest(request)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    )}

                    {!request.deleted_at && view === "confirmed" && (
                      <>
                        {request.status !== "completed" && (
                          <button
                            disabled={saving}
                            onClick={() =>
                              updateRequest(
                                request,
                                { status: "completed" },
                                "Catering event marked completed."
                              )
                            }
                            className="rounded-xl bg-[#123b2a] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0f3224] disabled:opacity-50"
                          >
                            Mark completed
                          </button>
                        )}
                        <button
                          disabled={saving}
                          onClick={() => archiveRequest(request)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </>
                    )}

                    {request.deleted_at && (
                      <>
                        <button
                          disabled={saving}
                          onClick={() => restoreRequest(request)}
                          className="rounded-xl bg-[#123b2a] px-4 py-2 text-sm font-black text-white transition hover:bg-[#0f3224] disabled:opacity-50"
                        >
                          Restore request
                        </button>
                        <button
                          disabled={saving}
                          onClick={() => deleteForever(request)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          Delete forever
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelected(null);
          }}
        >
          <aside className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-[#123b2a] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                    Catering request
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    {selected.customer_name}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-50/70">
                    Created {formatDateTime(selected.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl font-bold transition hover:bg-white/20"
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              <DetailSection
                title="Customer"
                rows={[
                  ["Name", selected.customer_name],
                  ["Phone", selected.phone],
                  ["Email", selected.email || "Not provided"],
                  [
                    "Preferred callback",
                    selected.preferred_callback_time || "Not provided",
                  ],
                ]}
              />

              <DetailSection
                title="Event"
                rows={[
                  ["Date", formatDate(selected.event_date)],
                  ["Time", formatTime(selected.event_time)],
                  ["Guests", selected.guest_count.toLocaleString()],
                  ["Event type", selected.event_type || "Not provided"],
                  [
                    "Status",
                    selected.deleted_at
                      ? "Deleted"
                      : STATUS_LABELS[selected.status],
                  ],
                ]}
              />

              <DetailSection
                title="Fulfillment"
                rows={[
                  [
                    "Method",
                    selected.fulfillment_type === "delivery"
                      ? "Delivery"
                      : "Pickup",
                  ],
                  [
                    "Address",
                    selected.delivery_address || "Not required for pickup",
                  ],
                  [
                    "Setup",
                    selected.setup_requirements || "No setup requested",
                  ],
                ]}
              />

              <DetailText
                title="Requested menu"
                value={selected.menu_requests}
              />
              <DetailText
                title="Dietary restrictions"
                value={
                  selected.dietary_restrictions ||
                  "No dietary restrictions provided"
                }
              />
              <DetailText
                title="Special instructions"
                value={
                  selected.special_instructions ||
                  "No special instructions provided"
                }
              />

              <section className="rounded-3xl border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">
                      Staff-only notes
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Saved directly to Supabase and updated live.
                    </p>
                  </div>
                  <button
                    disabled={saving}
                    onClick={saveNotes}
                    className="rounded-xl bg-[#123b2a] px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                  >
                    Save notes
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={5}
                  placeholder="Add callback details, quote notes, changes, or kitchen information..."
                  className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </section>

              <DetailSection
                title="System"
                rows={[
                  ["Estimated budget", formatMoney(selected.estimated_budget)],
                  ["Source", selected.source || "Unknown"],
                  ["Last updated", formatDateTime(selected.updated_at)],
                  [
                    "Deleted",
                    selected.deleted_at
                      ? formatDateTime(selected.deleted_at)
                      : "No",
                  ],
                ]}
              />
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
              <a
                href={`tel:${selected.phone}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700"
              >
                Call customer
              </a>

              {selected.email && (
                <a
                  href={`mailto:${selected.email}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700"
                >
                  Email customer
                </a>
              )}

              {!selected.deleted_at &&
                !["confirmed", "completed"].includes(selected.status) && (
                  <button
                    disabled={saving}
                    onClick={() =>
                      updateRequest(
                        selected,
                        { status: "confirmed" },
                        "Catering request confirmed."
                      )
                    }
                    className="rounded-xl bg-[#123b2a] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
                  >
                    Confirm request
                  </button>
                )}

              {selected.deleted_at ? (
                <button
                  disabled={saving}
                  onClick={() => restoreRequest(selected)}
                  className="rounded-xl bg-[#123b2a] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
                >
                  Restore
                </button>
              ) : (
                <button
                  disabled={saving}
                  onClick={() => archiveRequest(selected)}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-700 disabled:opacity-50"
                >
                  Remove request
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {isNewOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setIsNewOpen(false);
          }}
        >
          <form
            onSubmit={createRequest}
            className="my-auto w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 bg-[#123b2a] p-6 text-white">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                  Staff entry
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  New catering request
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid max-h-[70vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">
              <Field
                label="Customer name"
                required
                value={form.customer_name}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    customer_name: value,
                  }))
                }
              />
              <Field
                label="Phone"
                required
                value={form.phone}
                onChange={(value) =>
                  setForm((current) => ({ ...current, phone: value }))
                }
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm((current) => ({ ...current, email: value }))
                }
              />
              <Field
                label="Event type"
                value={form.event_type}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    event_type: value,
                  }))
                }
              />
              <Field
                label="Event date"
                type="date"
                required
                value={form.event_date}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    event_date: value,
                  }))
                }
              />
              <Field
                label="Event time"
                type="time"
                value={form.event_time}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    event_time: value,
                  }))
                }
              />
              <Field
                label="Guest count"
                type="number"
                required
                min="1"
                value={form.guest_count}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    guest_count: value,
                  }))
                }
              />
              <Field
                label="Estimated budget"
                type="number"
                min="0"
                value={form.estimated_budget}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    estimated_budget: value,
                  }))
                }
              />

              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  Fulfillment
                </span>
                <select
                  value={form.fulfillment_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fulfillment_type: event.target.value as
                        | "pickup"
                        | "delivery",
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold outline-none focus:border-emerald-500"
                >
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </label>

              <Field
                label="Delivery address"
                required={form.fulfillment_type === "delivery"}
                value={form.delivery_address}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    delivery_address: value,
                  }))
                }
              />

              <div className="sm:col-span-2">
                <TextAreaField
                  label="Menu requests"
                  required
                  value={form.menu_requests}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      menu_requests: value,
                    }))
                  }
                />
              </div>

              <TextAreaField
                label="Dietary restrictions"
                value={form.dietary_restrictions}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    dietary_restrictions: value,
                  }))
                }
              />

              <TextAreaField
                label="Setup requirements"
                value={form.setup_requirements}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    setup_requirements: value,
                  }))
                }
              />

              <div className="sm:col-span-2">
                <TextAreaField
                  label="Special instructions"
                  value={form.special_instructions}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      special_instructions: value,
                    }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <Field
                  label="Preferred callback time"
                  value={form.preferred_callback_time}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      preferred_callback_time: value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setIsNewOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#123b2a] px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function DetailSection({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 p-5">
      <h3 className="font-black text-slate-950">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-3.5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-bold text-slate-800">
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DetailText({ title, value }: { title: string; value: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 p-5">
      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
        {value}
      </p>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        min={min}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}
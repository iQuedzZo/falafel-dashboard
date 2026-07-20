"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderStatus = "New" | "Preparing" | "Ready" | "Completed";

type Order = {
  id: number;
  customer_name: string;
  phone?: string | null;
  items: string;
  status: OrderStatus | string;
  order_time?: string | null;
  pickup_time?: string | null;
  pickup_date?: string | null;
  estimated_prep_time?: string | null;
  price?: number | string | null;
  order_total?: number | string | null;
  special_instructions?: string | null;
};

type StatusConfig = {
  label: OrderStatus;
  dot: string;
  badge: string;
  column: string;
  headerIcon: string;
  emptyMessage: string;
};

const STATUS_CONFIG: StatusConfig[] = [
  {
    label: "New",
    dot: "bg-sky-500",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    column: "border-sky-100 bg-sky-50/60",
    headerIcon: "●",
    emptyMessage: "Waiting for new orders",
  },
  {
    label: "Preparing",
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    column: "border-amber-100 bg-amber-50/60",
    headerIcon: "◐",
    emptyMessage: "No orders are being prepared",
  },
  {
    label: "Ready",
    dot: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    column: "border-emerald-100 bg-emerald-50/60",
    headerIcon: "✓",
    emptyMessage: "No orders are ready for pickup",
  },
  {
    label: "Completed",
    dot: "bg-slate-500",
    badge: "border-slate-200 bg-slate-100 text-slate-700",
    column: "border-slate-200 bg-slate-100/70",
    headerIcon: "✓",
    emptyMessage: "No completed orders yet",
  },
];

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  New: "Preparing",
  Preparing: "Ready",
  Ready: "Completed",
  Completed: null,
};

const NEXT_ACTION: Record<OrderStatus, string> = {
  New: "Start preparing",
  Preparing: "Mark ready",
  Ready: "Complete order",
  Completed: "Completed",
};

function normalizeStatus(status: string): OrderStatus {
  if (status === "Preparing" || status === "Ready" || status === "Completed") {
    return status;
  }

  return "New";
}

function getOrderTotal(order: Order): number {
  const value = order.order_total ?? order.price ?? 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasUsefulInstructions(value?: string | null): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return !["none", "no", "n/a", "na", "no special instructions"].includes(
    normalized
  );
}

function safeDate(value?: string | null): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatClockTime(value?: string | null): string {
  const date = safeDate(value);

  if (!date) return "Time unavailable";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFullDate(value?: string | null): string {
  const date = safeDate(value);

  if (!date) return "Date unavailable";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPhone(value?: string | null): string {
  if (!value) return "No phone number";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return value;
}

function getTimeAgo(value: string | null | undefined, now: number): string {
  const date = safeDate(value);

  if (!date) return "Unknown time";

  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getAgeStyle(value?: string | null): string {
  const date = safeDate(value);

  if (!date) return "border-slate-200 bg-slate-50 text-slate-600";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (minutes < 5) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (minutes < 10) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function getPickupLabel(order: Order): string | null {
  if (!order.pickup_time && !order.pickup_date) return null;

  if (order.pickup_date && order.pickup_time) {
    return `${order.pickup_date} at ${order.pickup_time}`;
  }

  return order.pickup_time || order.pickup_date || null;
}

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-lg text-white shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notification, setNotification] = useState<Order | null>(null);
  const [now, setNow] = useState(Date.now());
  const [search, setSearch] = useState("");
  const [expandedStatus, setExpandedStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const getOrders = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("order_time", { ascending: false });

    if (error) {
      console.error("SUPABASE ORDER FETCH ERROR:", error);
      setErrorMessage("Orders could not be loaded. Check your Supabase connection.");
    } else {
      setOrders((data || []) as Order[]);
      setErrorMessage(null);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  const updateStatus = useCallback(
    async (id: number, nextStatus: OrderStatus) => {
      setUpdatingIds((current) => new Set(current).add(id));
      setErrorMessage(null);

      const previousOrders = orders;

      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, status: nextStatus } : order
        )
      );

      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", id);

      if (error) {
        console.error("SUPABASE STATUS UPDATE ERROR:", error);
        setOrders(previousOrders);
        setErrorMessage("The status could not be updated. Please try again.");
      }

      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    },
    [orders]
  );

  useEffect(() => {
    void getOrders();

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 10_000);

    const channel = supabase
      .channel(`orders-realtime-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setNotification(newOrder);

            const audio = new Audio("/sounds/ding.mp3");
            audio.play().catch(() => {
              // Browsers may block sound until the user interacts with the page.
            });

            window.setTimeout(() => {
              setNotification(null);
            }, 6000);
          }

          void getOrders();
        }
      )
      .subscribe();

    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [getOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) => {
      const searchable = [
        order.id,
        order.customer_name,
        order.phone,
        order.items,
        order.special_instructions,
        order.pickup_time,
        order.pickup_date,
        order.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [orders, search]);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + getOrderTotal(order),
      0
    );

    const pricedOrders = orders.filter((order) => getOrderTotal(order) > 0);
    const activeOrders = orders.filter(
      (order) => normalizeStatus(order.status) !== "Completed"
    ).length;
    const readyOrders = orders.filter(
      (order) => normalizeStatus(order.status) === "Ready"
    ).length;

    return {
      totalOrders: orders.length,
      totalRevenue,
      averageOrder:
        pricedOrders.length > 0 ? totalRevenue / pricedOrders.length : 0,
      activeOrders,
      readyOrders,
    };
  }, [orders]);

  const visibleStatusConfigs = expandedStatus
    ? STATUS_CONFIG.filter((status) => status.label === expandedStatus)
    : STATUS_CONFIG;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      {notification && (
        <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md">
          <div className="overflow-hidden rounded-2xl border border-emerald-300 bg-white shadow-2xl shadow-emerald-950/20">
            <div className="flex items-center justify-between bg-emerald-600 px-5 py-3 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg">
                  🔔
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                    Live order
                  </p>
                  <p className="font-bold">New order received</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="rounded-lg px-2 py-1 text-lg text-white/80 transition hover:bg-white/15 hover:text-white"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 p-5">
              <div>
                <p className="text-sm font-bold text-slate-950">
                  {notification.customer_name}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {notification.items}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-500">
                  Order #{notification.id}
                </span>
                {getOrderTotal(notification) > 0 && (
                  <span className="text-lg font-black text-emerald-700">
                    ${getOrderTotal(notification).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto max-w-[1800px] px-4 py-7 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                Live kitchen operations
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Falafel Flare Orders
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
                Manage incoming orders, preparation, and pickup status from one
                live dashboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Current time
                </p>
                <p className="mt-1 font-bold text-white">
                  {new Date(now).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void getOrders(true)}
                disabled={refreshing}
                className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? "Refreshing…" : "Refresh orders"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {errorMessage && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm">
            <div>
              <p className="font-bold">Something needs attention</p>
              <p className="mt-1 text-sm text-rose-700">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="rounded-lg px-2 py-1 text-lg hover:bg-rose-100"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="All orders"
            value={stats.totalOrders}
            helper="Total orders currently loaded"
            icon="▣"
          />
          <StatCard
            label="Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            helper="From orders with a saved total"
            icon="$"
          />
          <StatCard
            label="Average order"
            value={`$${stats.averageOrder.toFixed(2)}`}
            helper="Average of priced orders"
            icon="↗"
          />
          <StatCard
            label="Active orders"
            value={stats.activeOrders}
            helper="New, preparing, or ready"
            icon="●"
          />
          <StatCard
            label="Ready now"
            value={stats.readyOrders}
            helper="Waiting for customer pickup"
            icon="✓"
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, phone, item, order number…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-slate-500 sm:justify-end">
              <span>
                Showing <strong className="text-slate-900">{filteredOrders.length}</strong>{" "}
                of <strong className="text-slate-900">{orders.length}</strong>
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-6 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
            {STATUS_CONFIG.map((status) => (
              <div
                key={status.label}
                className="min-h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="h-7 w-32 rounded bg-slate-200" />
                <div className="mt-6 h-56 rounded-2xl bg-slate-100" />
              </div>
            ))}
          </section>
        ) : (
          <section className="mt-6 overflow-x-auto pb-4">
            {expandedStatus && (
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Expanded category
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    Showing all {expandedStatus.toLowerCase()} orders
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedStatus(null)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span aria-hidden="true">▦</span>
                  List view
                </button>
              </div>
            )}

            <div
              className={
                expandedStatus
                  ? "grid grid-cols-1 gap-5"
                  : "grid min-w-[1250px] grid-cols-4 gap-5 2xl:min-w-0"
              }
            >
              {visibleStatusConfigs.map((statusConfig) => {
                const columnOrders = filteredOrders.filter(
                  (order) => normalizeStatus(order.status) === statusConfig.label
                );

                return (
                  <div
                    key={statusConfig.label}
                    className={`min-h-[620px] rounded-2xl border p-4 shadow-sm ${statusConfig.column}`}
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm ${statusConfig.dot}`}
                        >
                          {statusConfig.headerIcon}
                        </span>
                        <div>
                          <h2 className="font-black text-slate-950">
                            {statusConfig.label}
                          </h2>
                          <p className="text-xs text-slate-500">
                            {columnOrders.length}{" "}
                            {columnOrders.length === 1 ? "order" : "orders"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white bg-white/80 px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                          {columnOrders.length}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedStatus(
                              expandedStatus === statusConfig.label
                                ? null
                                : statusConfig.label
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                          aria-label={
                            expandedStatus === statusConfig.label
                              ? "Return to all order categories"
                              : `Expand ${statusConfig.label} orders`
                          }
                        >
                          <span aria-hidden="true">
                            {expandedStatus === statusConfig.label ? "▦" : "⛶"}
                          </span>
                          {expandedStatus === statusConfig.label
                            ? "List view"
                            : "Expand"}
                        </button>
                      </div>
                    </div>

                    <div
                      className={
                        expandedStatus
                          ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                          : "space-y-4"
                      }
                    >
                      {columnOrders.length === 0 ? (
                        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                            {statusConfig.headerIcon}
                          </div>
                          <p className="mt-4 font-bold text-slate-700">
                            Nothing here
                          </p>
                          <p className="mt-1 max-w-[220px] text-sm text-slate-500">
                            {search
                              ? "No matching orders in this column."
                              : statusConfig.emptyMessage}
                          </p>
                        </div>
                      ) : (
                        columnOrders.map((order) => {
                          const normalizedStatus = normalizeStatus(order.status);
                          const nextStatus = NEXT_STATUS[normalizedStatus];
                          const total = getOrderTotal(order);
                          const pickupLabel = getPickupLabel(order);
                          const isUpdating = updatingIds.has(order.id);

                          return (
                            <article
                              key={order.id}
                              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                            >
                              <div className="p-4 sm:p-5">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="text-lg font-black tracking-tight text-slate-950">
                                        Order #{order.id}
                                      </h3>
                                      <span
                                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusConfig.badge}`}
                                      >
                                        {normalizedStatus}
                                      </span>
                                    </div>
                                    <p className="mt-2 truncate font-bold text-slate-800">
                                      {order.customer_name || "Unnamed customer"}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                      {formatPhone(order.phone)}
                                    </p>
                                  </div>

                                  {total > 0 && (
                                    <div className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-right ring-1 ring-emerald-100">
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                        Total
                                      </p>
                                      <p className="text-xl font-black text-emerald-800">
                                        ${total.toFixed(2)}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                    Items
                                  </p>
                                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">
                                    {order.items || "No items were saved"}
                                  </p>
                                </div>

                                {hasUsefulInstructions(order.special_instructions) && (
                                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                                      Special instructions
                                    </p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-amber-950">
                                      {order.special_instructions}
                                    </p>
                                  </div>
                                )}

                                {(pickupLabel || order.estimated_prep_time) && (
                                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {pickupLabel && (
                                      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">
                                          Pickup
                                        </p>
                                        <p className="mt-1 text-sm font-black text-sky-950">
                                          {pickupLabel}
                                        </p>
                                      </div>
                                    )}

                                    {order.estimated_prep_time && (
                                      <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                                          Prep estimate
                                        </p>
                                        <p className="mt-1 text-sm font-black text-violet-950">
                                          {order.estimated_prep_time}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                                  <div>
                                    <p className="text-xs text-slate-400">
                                      {formatFullDate(order.order_time)} at{" "}
                                      {formatClockTime(order.order_time)}
                                    </p>
                                    <span
                                      className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getAgeStyle(
                                        order.order_time
                                      )}`}
                                    >
                                      {getTimeAgo(order.order_time, now)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-slate-200 bg-slate-50 p-3">
                                {nextStatus ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void updateStatus(order.id, nextStatus)
                                    }
                                    disabled={isUpdating}
                                    className={`w-full rounded-xl px-4 py-3 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                      nextStatus === "Preparing"
                                        ? "bg-amber-500 hover:bg-amber-600"
                                        : nextStatus === "Ready"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : "bg-slate-900 hover:bg-slate-800"
                                    }`}
                                  >
                                    {isUpdating
                                      ? "Updating…"
                                      : NEXT_ACTION[normalizedStatus]}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => void updateStatus(order.id, "New")}
                                    disabled={isUpdating}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isUpdating ? "Updating…" : "Reopen order"}
                                  </button>
                                )}
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
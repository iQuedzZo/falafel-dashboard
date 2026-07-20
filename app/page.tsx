"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderStatus = "New" | "Preparing" | "Ready" | "Completed";

type Order = {
  id: number;
  customer_name?: string | null;
  phone?: string | null;
  items?: string | null;
  status?: string | null;
  order_time?: string | null;
  order_total?: number | string | null;
  price?: number | string | null;
  special_instructions?: string | null;
};

type DashboardStats = {
  totalOrders: number;
  revenue: number;
  averageOrder: number;
  newOrders: number;
  preparing: number;
  ready: number;
  completed: number;
  active: number;
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  New: "bg-sky-50 text-sky-700 ring-sky-200",
  Preparing: "bg-amber-50 text-amber-700 ring-amber-200",
  Ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Completed: "bg-slate-100 text-slate-700 ring-slate-200",
};

function normalizeStatus(status?: string | null): OrderStatus {
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

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatTime(value?: string | null): string {
  if (!value) return "Time unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTimeAgo(value?: string | null, now = Date.now()): string {
  if (!value) return "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours} hr${hours === 1 ? "" : "s"} ago`;
}

function getStartOfTodayIso(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.toISOString();
}

function StatCard({
  label,
  value,
  note,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  note: string;
  accent: string;
  icon: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className={`mt-3 text-4xl font-black tracking-tight ${accent}`}>
            {value}
          </p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-xl text-amber-700 ring-1 ring-amber-100">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-400">{note}</p>
    </article>
  );
}

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const getDashboardOrders = useCallback(async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .gte("order_time", getStartOfTodayIso())
      .order("order_time", { ascending: false });

    if (error) {
      console.error("DASHBOARD ORDER FETCH ERROR:", error);
      setErrorMessage("Today’s dashboard data could not be loaded.");
    } else {
      setOrders((data || []) as Order[]);
      setErrorMessage(null);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void getDashboardOrders();

    const clock = window.setInterval(() => {
      setNow(Date.now());
    }, 10_000);

    const channel = supabase
      .channel(`dashboard-orders-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          void getDashboardOrders();
        }
      )
      .subscribe();

    return () => {
      window.clearInterval(clock);
      void supabase.removeChannel(channel);
    };
  }, [getDashboardOrders]);

  const stats = useMemo<DashboardStats>(() => {
    const totalRevenue = orders.reduce(
      (sum, order) => sum + getOrderTotal(order),
      0
    );

    const pricedOrders = orders.filter((order) => getOrderTotal(order) > 0);
    const newOrders = orders.filter(
      (order) => normalizeStatus(order.status) === "New"
    ).length;
    const preparing = orders.filter(
      (order) => normalizeStatus(order.status) === "Preparing"
    ).length;
    const ready = orders.filter(
      (order) => normalizeStatus(order.status) === "Ready"
    ).length;
    const completed = orders.filter(
      (order) => normalizeStatus(order.status) === "Completed"
    ).length;

    return {
      totalOrders: orders.length,
      revenue: totalRevenue,
      averageOrder:
        pricedOrders.length > 0 ? totalRevenue / pricedOrders.length : 0,
      newOrders,
      preparing,
      ready,
      completed,
      active: newOrders + preparing + ready,
    };
  }, [orders]);

  const activity = useMemo(() => orders.slice(0, 8), [orders]);

  const serviceHealth = useMemo(() => {
    const total = Math.max(stats.totalOrders, 1);

    return [
      {
        label: "Orders completed",
        value: Math.round((stats.completed / total) * 100),
      },
      {
        label: "Kitchen load",
        value: Math.min(100, Math.round((stats.preparing / Math.max(stats.active, 1)) * 100)),
      },
      {
        label: "Pickup readiness",
        value: Math.min(100, Math.round((stats.ready / Math.max(stats.active, 1)) * 100)),
      },
    ];
  }, [stats]);

  const statCards = [
    {
      label: "Today’s Orders",
      value: stats.totalOrders,
      note: "Real orders received since midnight",
      accent: "text-slate-950",
      icon: "▤",
    },
    {
      label: "Today’s Revenue",
      value: formatMoney(stats.revenue),
      note: "Based on saved order totals",
      accent: "text-emerald-700",
      icon: "$",
    },
    {
      label: "Active Orders",
      value: stats.active,
      note: "New, preparing, or ready",
      accent: "text-amber-700",
      icon: "●",
    },
    {
      label: "Average Order",
      value: formatMoney(stats.averageOrder),
      note: "Average of orders with totals",
      accent: "text-violet-700",
      icon: "↗",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[2rem] bg-[#123b2a] px-6 py-8 text-white shadow-xl shadow-emerald-950/10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
              Live operations overview
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Welcome back to Falafel Flare
            </h1>
            <p className="mt-3 max-w-2xl text-emerald-50/70">
              Monitor today’s orders, kitchen progress, revenue, and customer pickup activity from one live dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <div className="rounded-2xl border border-white/10 bg-white/8 px-5 py-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/60">
                Current service
              </p>
              <div className="mt-2 flex items-center gap-2 font-bold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </span>
                AI receptionist online
              </div>
            </div>

            <button
              type="button"
              onClick={() => void getDashboardOrders(true)}
              disabled={refreshing}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#123b2a] shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing…" : "Refresh dashboard"}
            </button>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm">
          <div>
            <p className="font-black">Dashboard connection problem</p>
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

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-white p-5"
              >
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="mt-5 h-10 w-20 rounded bg-slate-200" />
                <div className="mt-4 h-3 w-40 rounded bg-slate-100" />
              </div>
            ))
          : statCards.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "New", value: stats.newOrders, tone: "text-sky-700", bg: "bg-sky-50", ring: "ring-sky-100" },
          { label: "Preparing", value: stats.preparing, tone: "text-amber-700", bg: "bg-amber-50", ring: "ring-amber-100" },
          { label: "Ready", value: stats.ready, tone: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-100" },
          { label: "Completed", value: stats.completed, tone: "text-slate-700", bg: "bg-slate-100", ring: "ring-slate-200" },
        ].map((item) => (
          <Link
            key={item.label}
            href="/orders"
            className={`rounded-2xl p-4 ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${item.bg} ${item.ring}`}
          >
            <div className="flex items-center justify-between">
              <p className={`font-black ${item.tone}`}>{item.label}</p>
              <span className={`text-2xl font-black ${item.tone}`}>{item.value}</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">Open order board →</p>
          </Link>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Live feed
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Today’s Activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest orders and their current live status.
              </p>
            </div>
            <Link
              href="/orders"
              className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              View all orders
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                />
              ))
            ) : activity.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
                  ▤
                </div>
                <p className="mt-4 font-black text-slate-800">No orders yet today</p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                  New orders will appear here automatically as soon as the AI receptionist submits them.
                </p>
              </div>
            ) : (
              activity.map((item) => {
                const status = normalizeStatus(item.status);
                const total = getOrderTotal(item);

                return (
                  <article
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-[#123b2a] shadow-sm">
                        #{item.id}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {item.customer_name || "Unnamed customer"}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {item.items || "No items saved"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-4 sm:block sm:text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                      <p className="mt-0 text-xs font-semibold text-slate-400 sm:mt-2">
                        {formatTime(item.order_time)} · {getTimeAgo(item.order_time, now)}
                      </p>
                      {total > 0 && (
                        <p className="mt-1 text-sm font-black text-emerald-700">
                          {formatMoney(total)}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Live status
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">
            Service health
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            These indicators are calculated from today’s real order statuses.
          </p>

          <div className="mt-6 space-y-5">
            {serviceHealth.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-600">{item.label}</span>
                  <span className="font-black text-slate-900">{item.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1c7c54] transition-all duration-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <p className="font-bold text-emerald-900">Live data connected</p>
            <p className="mt-1 text-sm leading-6 text-emerald-800/75">
              Dashboard totals and activity refresh automatically whenever an order is created or updated.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              Current time
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {new Date(now).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(now).toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
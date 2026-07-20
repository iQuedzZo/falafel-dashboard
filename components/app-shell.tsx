"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: "📊",
  },
  {
    name: "Orders",
    href: "/orders",
    icon: "🧾",
  },
  {
    name: "Catering",
    href: "/catering",
    icon: "🍽️",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: "⚙️",
  },
];

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Restaurant OS
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight">
                Falafel Flare
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Operations Dashboard
              </p>
            </div>

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
          {navigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>

                {active && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-slate-950" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
              </span>

              <div>
                <p className="text-sm font-bold">
                  AI Receptionist
                </p>

                <p className="text-xs text-slate-400">
                  Online and receiving calls
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold shadow-sm lg:hidden"
          >
            ☰
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-slate-900">
                Falafel Flare
              </p>

              <p className="text-xs text-slate-500">
                Restaurant Management
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-700">
              FF
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
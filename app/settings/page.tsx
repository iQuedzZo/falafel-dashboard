"use client";

import { useEffect, useMemo, useState } from "react";

type SettingsState = {
  restaurantName: string;
  businessHours: string;
  restaurantPhone: string;
  restaurantEmail: string;
  pickupPreparationTime: string;
  defaultOrderType: "Pickup" | "Delivery";
  aiAssistantName: string;
  aiAssistantStatus: "Active" | "Paused";
  showServiceHealth: boolean;
  showRevenue: boolean;
  showRecentActivity: boolean;
  orderSoundEnabled: boolean;
  autoRefreshEnabled: boolean;
  refreshIntervalSeconds: number;
};

type EditableSection = "restaurant" | "orders" | "assistant" | null;

const STORAGE_KEY = "falafel-flare-settings-v1";

const DEFAULT_SETTINGS: SettingsState = {
  restaurantName: "Falafel Flare",
  businessHours: "11:00 AM - 9:00 PM",
  restaurantPhone: "",
  restaurantEmail: "",
  pickupPreparationTime: "20 minutes",
  defaultOrderType: "Pickup",
  aiAssistantName: "Alex",
  aiAssistantStatus: "Active",
  showServiceHealth: true,
  showRevenue: true,
  showRecentActivity: true,
  orderSoundEnabled: true,
  autoRefreshEnabled: true,
  refreshIntervalSeconds: 30,
};

function SettingToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <p className="font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-emerald-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  type?: "text" | "email" | "tel";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 w-full rounded-2xl border px-4 py-3.5 font-semibold outline-none transition ${
          readOnly
            ? "cursor-default border-slate-200 bg-slate-50 text-slate-700"
            : "border-emerald-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        }`}
      />
    </label>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [editingSection, setEditingSection] = useState<EditableSection>(null);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SettingsState>;
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(merged);
        setDraft(merged);
      }
    } catch (error) {
      console.error("SETTINGS LOAD ERROR:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(draft),
    [settings, draft]
  );

  function updateDraft<Key extends keyof SettingsState>(
    key: Key,
    value: SettingsState[Key]
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function beginEdit(section: Exclude<EditableSection, null>) {
    setDraft(settings);
    setEditingSection(section);
  }

  function cancelEdit() {
    setDraft(settings);
    setEditingSection(null);
  }

  function persist(nextSettings: SettingsState, message = "Settings saved") {
    setSettings(nextSettings);
    setDraft(nextSettings);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    window.dispatchEvent(new Event("falafel-settings-updated"));
    setToast(message);
  }

  function saveSection() {
    persist(draft);
    setEditingSection(null);
  }

  function saveQuickSetting<Key extends keyof SettingsState>(
    key: Key,
    value: SettingsState[Key]
  ) {
    const nextSettings = { ...settings, [key]: value };
    persist(nextSettings, "Preference updated");
  }

  function resetSettings() {
    const confirmed = window.confirm(
      "Reset all dashboard settings to their original values?"
    );

    if (!confirmed) return;

    persist(DEFAULT_SETTINGS, "Settings reset");
    setEditingSection(null);
  }

  function testOrderSound() {
    const audio = new Audio("/sounds/ding.mp3");

    audio.play().catch(() => {
      setToast("Your browser blocked the test sound");
    });
  }

  if (!loaded) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-44 animate-pulse rounded-[2rem] bg-slate-200" />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
          <div className="h-96 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      {toast && (
        <div className="fixed right-5 top-5 z-50 rounded-2xl border border-emerald-200 bg-white px-5 py-4 font-bold text-emerald-800 shadow-2xl">
          ✓ {toast}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] bg-[#123b2a] px-6 py-8 text-white shadow-xl shadow-emerald-950/10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
              Control center
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-emerald-50/70">
              Manage restaurant details, order defaults, dashboard preferences,
              and AI receptionist status.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/60">
              Save status
            </p>
            <div className="mt-2 flex items-center gap-2 font-bold">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  hasUnsavedChanges ? "bg-amber-300" : "bg-emerald-300"
                }`}
              />
              {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  Restaurant profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Core business identity and contact information.
                </p>
              </div>

              {editingSection === "restaurant" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveSection}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => beginEdit("restaurant")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Restaurant Name"
                value={draft.restaurantName}
                readOnly={editingSection !== "restaurant"}
                onChange={(value) => updateDraft("restaurantName", value)}
              />
              <Field
                label="Business Hours"
                value={draft.businessHours}
                readOnly={editingSection !== "restaurant"}
                onChange={(value) => updateDraft("businessHours", value)}
              />
              <Field
                label="Restaurant Phone"
                value={draft.restaurantPhone}
                readOnly={editingSection !== "restaurant"}
                type="tel"
                placeholder="Add restaurant phone"
                onChange={(value) => updateDraft("restaurantPhone", value)}
              />
              <Field
                label="Restaurant Email"
                value={draft.restaurantEmail}
                readOnly={editingSection !== "restaurant"}
                type="email"
                placeholder="Add restaurant email"
                onChange={(value) => updateDraft("restaurantEmail", value)}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  Order operations
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Defaults used by the kitchen and pickup workflow.
                </p>
              </div>

              {editingSection === "orders" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveSection}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => beginEdit("orders")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Pickup Preparation Time"
                value={draft.pickupPreparationTime}
                readOnly={editingSection !== "orders"}
                onChange={(value) =>
                  updateDraft("pickupPreparationTime", value)
                }
              />

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Default Order Type
                </span>
                <select
                  value={draft.defaultOrderType}
                  disabled={editingSection !== "orders"}
                  onChange={(event) =>
                    updateDraft(
                      "defaultOrderType",
                      event.target.value as "Pickup" | "Delivery"
                    )
                  }
                  className={`mt-2 w-full rounded-2xl border px-4 py-3.5 font-semibold outline-none transition ${
                    editingSection === "orders"
                      ? "border-emerald-300 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      : "cursor-default border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <option value="Pickup">Pickup</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  AI receptionist
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assistant identity and availability controls.
                </p>
              </div>

              {editingSection === "assistant" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveSection}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => beginEdit("assistant")}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="AI Assistant Name"
                value={draft.aiAssistantName}
                readOnly={editingSection !== "assistant"}
                onChange={(value) => updateDraft("aiAssistantName", value)}
              />

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Assistant Status
                </span>
                <select
                  value={draft.aiAssistantStatus}
                  disabled={editingSection !== "assistant"}
                  onChange={(event) =>
                    updateDraft(
                      "aiAssistantStatus",
                      event.target.value as "Active" | "Paused"
                    )
                  }
                  className={`mt-2 w-full rounded-2xl border px-4 py-3.5 font-semibold outline-none transition ${
                    editingSection === "assistant"
                      ? "border-emerald-300 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      : "cursor-default border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                </select>
              </label>
            </div>

            <div
              className={`mt-4 rounded-2xl border p-4 ${
                settings.aiAssistantStatus === "Active"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <p
                className={`font-bold ${
                  settings.aiAssistantStatus === "Active"
                    ? "text-emerald-800"
                    : "text-amber-800"
                }`}
              >
                {settings.aiAssistantStatus === "Active"
                  ? "AI receptionist is marked active"
                  : "AI receptionist is marked paused"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                This dashboard preference does not directly start or stop your
                Vapi assistant.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-black tracking-tight">
                Dashboard preferences
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose which live information should be visible on the main
                dashboard.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <SettingToggle
                checked={settings.showServiceHealth}
                onChange={(value) =>
                  saveQuickSetting("showServiceHealth", value)
                }
                label="Show service health"
                description="Display completed-order, kitchen-load, and pickup-readiness indicators."
              />
              <SettingToggle
                checked={settings.showRevenue}
                onChange={(value) => saveQuickSetting("showRevenue", value)}
                label="Show revenue totals"
                description="Allow revenue and average-order values to appear on the dashboard."
              />
              <SettingToggle
                checked={settings.showRecentActivity}
                onChange={(value) =>
                  saveQuickSetting("showRecentActivity", value)
                }
                label="Show recent activity"
                description="Display the live list of today's most recent orders."
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-black tracking-tight">
                Notifications and refreshing
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Configure basic order alerts and dashboard refresh behavior.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <SettingToggle
                checked={settings.orderSoundEnabled}
                onChange={(value) =>
                  saveQuickSetting("orderSoundEnabled", value)
                }
                label="New-order sound"
                description="Play the dashboard notification sound when a new order arrives."
              />
              <SettingToggle
                checked={settings.autoRefreshEnabled}
                onChange={(value) =>
                  saveQuickSetting("autoRefreshEnabled", value)
                }
                label="Automatic refreshing"
                description="Keep dashboard information refreshed automatically."
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <label className="block">
                  <span className="font-bold text-slate-900">
                    Refresh interval
                  </span>
                  <p className="mt-1 text-sm text-slate-500">
                    Used by pages that read this saved preference.
                  </p>
                  <select
                    value={settings.refreshIntervalSeconds}
                    disabled={!settings.autoRefreshEnabled}
                    onChange={(event) =>
                      saveQuickSetting(
                        "refreshIntervalSeconds",
                        Number(event.target.value)
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value={15}>Every 15 seconds</option>
                    <option value={30}>Every 30 seconds</option>
                    <option value={60}>Every minute</option>
                    <option value={120}>Every 2 minutes</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={testOrderSound}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Test notification sound
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Connections
            </p>
            <h2 className="mt-1 text-xl font-black">System integrations</h2>

            <div className="mt-5 space-y-3">
              {["Supabase", "Vapi AI", "Website dashboard"].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100"
                >
                  <span className="font-semibold text-slate-700">{name}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                    Configured
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Saved locally
            </p>
            <h2 className="mt-1 text-xl font-black">Current preferences</h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Service health</span>
                <span className="font-bold text-slate-900">
                  {settings.showServiceHealth ? "Visible" : "Hidden"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Revenue</span>
                <span className="font-bold text-slate-900">
                  {settings.showRevenue ? "Visible" : "Hidden"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Order sound</span>
                <span className="font-bold text-slate-900">
                  {settings.orderSoundEnabled ? "On" : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-slate-500">Auto refresh</span>
                <span className="font-bold text-slate-900">
                  {settings.autoRefreshEnabled
                    ? `${settings.refreshIntervalSeconds}s`
                    : "Off"}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-100">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Important
            </p>
            <h2 className="mt-1 text-xl font-black text-amber-950">
              Browser-based settings
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/75">
              These settings save in this browser. They remain after refreshing,
              but they are not yet shared across multiple employee devices.
            </p>
          </section>

          <section className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-700">
              Reset
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Restore defaults
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Return all settings on this device to their original values.
            </p>
            <button
              type="button"
              onClick={resetSettings}
              className="mt-5 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
            >
              Reset settings
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}
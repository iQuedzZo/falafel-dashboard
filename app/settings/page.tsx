const settingsSections = [
  { title: "Restaurant profile", description: "Core business identity and contact information", fields: [{ label: "Restaurant Name", value: "Falafel Flare" }, { label: "Business Hours", value: "11:00 AM - 9:00 PM" }] },
  { title: "Order operations", description: "Defaults used by the kitchen and pickup workflow", fields: [{ label: "Pickup Preparation Time", value: "20 minutes" }, { label: "Default Order Type", value: "Pickup" }] },
  { title: "AI receptionist", description: "Assistant identity and customer-facing behavior", fields: [{ label: "AI Assistant Name", value: "Alex" }, { label: "Assistant Status", value: "Active" }] },
];

export default function Settings() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <section className="rounded-[2rem] bg-[#123b2a] px-6 py-8 text-white shadow-xl shadow-emerald-950/10 sm:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Control center</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-emerald-50/70">Manage restaurant details, order defaults, AI receptionist behavior, and future integrations.</p>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          {settingsSections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight">{section.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{section.description}</p>
                </div>
                <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Edit</button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <label key={field.label} className="block">
                    <span className="text-sm font-bold text-slate-700">{field.label}</span>
                    <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" value={field.value} readOnly />
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Connections</p>
            <h2 className="mt-1 text-xl font-black">System integrations</h2>
            <div className="mt-5 space-y-3">
              {["Supabase", "Vapi AI", "Website dashboard"].map((name) => (
                <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <span className="font-semibold text-slate-700">{name}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">Connected</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-amber-50 p-6 ring-1 ring-amber-100">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Coming next</p>
            <h2 className="mt-1 text-xl font-black text-amber-950">Expanded controls</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/70">Later we’ll add editable hours, assistant voice settings, notifications, catering rules, staff access, and integration controls.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

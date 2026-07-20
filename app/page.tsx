const stats = [
  { label: "Today's Orders", value: "24", note: "Across all channels", accent: "text-slate-950", icon: "▤" },
  { label: "New Orders", value: "5", note: "Waiting to be accepted", accent: "text-blue-700", icon: "●" },
  { label: "Preparing", value: "8", note: "Currently in the kitchen", accent: "text-orange-600", icon: "◷" },
  { label: "Ready for Pickup", value: "11", note: "Ready for customers", accent: "text-emerald-700", icon: "✓" },
];

const activity = [
  { id: 201, customer: "Jordan M.", items: "Chicken shawarma wrap, fries", status: "Preparing", time: "6:42 PM", tone: "orange" },
  { id: 202, customer: "Maya R.", items: "Falafel plate, hummus", status: "Ready for pickup", time: "6:38 PM", tone: "green" },
  { id: 203, customer: "Chris T.", items: "Beef shawarma bowl", status: "New order", time: "6:35 PM", tone: "blue" },
];

const toneClasses: Record<string, string> = {
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
};

export default function Home() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[2rem] bg-[#123b2a] px-6 py-8 text-white shadow-xl shadow-emerald-950/10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Operations overview</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Welcome back to Falafel Flare</h1>
            <p className="mt-3 max-w-2xl text-emerald-50/70">Monitor orders, kitchen progress, catering activity, and restaurant performance from one place.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/8 px-5 py-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/60">Current service</p>
            <div className="mt-2 flex items-center gap-2 font-bold"><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /> Dinner service active</div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                <p className={`mt-3 text-4xl font-black tracking-tight ${stat.accent}`}>{stat.value}</p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-xl text-amber-700">{stat.icon}</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Live feed</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Today's Activity</h2>
            </div>
            <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50">View orders</button>
          </div>

          <div className="mt-5 space-y-3">
            {activity.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white font-black text-[#123b2a] shadow-sm">#{item.id}</div>
                  <div>
                    <p className="font-bold text-slate-900">{item.customer}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.items}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneClasses[item.tone]}`}>{item.status}</span>
                  <p className="mt-0 text-xs font-semibold text-slate-400 sm:mt-2">{item.time}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Quick status</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Service health</h2>
          <div className="mt-6 space-y-5">
            {[{ label: "Order capacity", value: 68 }, { label: "Kitchen load", value: 54 }, { label: "Pickup readiness", value: 82 }].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-slate-600">{item.label}</span><span className="font-black text-slate-900">{item.value}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#1c7c54]" style={{ width: `${item.value}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
            <p className="font-bold text-amber-900">Next improvement</p>
            <p className="mt-1 text-sm leading-6 text-amber-800/75">In Phase 2, these dashboard numbers and the activity feed will come directly from Supabase.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

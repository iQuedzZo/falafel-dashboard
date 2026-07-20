const cateringOrders = [
  { id: 1, company: "ABC Construction", date: "July 22, 2026", time: "11:30 AM", guests: 45, items: ["20 Chicken Shawarma", "15 Falafel Plates", "10 Fries"], status: "New Inquiry", contact: "David Chen", phone: "(209) 555-0142", total: "$780.00" },
  { id: 2, company: "Tracy School Event", date: "August 5, 2026", time: "12:00 PM", guests: 80, items: ["40 Falafel Wraps", "40 Shawarma Wraps"], status: "Confirmed", contact: "Maria Lopez", phone: "(209) 555-0197", total: "$1,240.00" },
];

const statusStyles: Record<string, string> = {
  "New Inquiry": "bg-blue-50 text-blue-700 ring-blue-200",
  Confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export default function Catering() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-700">Events & large orders</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Catering Management</h1>
          <p className="mt-2 max-w-2xl text-slate-500">Track inquiries, event details, guest counts, estimated totals, and fulfillment progress.</p>
        </div>
        <button className="rounded-2xl bg-[#123b2a] px-5 py-3 font-bold text-white shadow-lg shadow-emerald-950/15 transition hover:-translate-y-0.5">+ New catering request</button>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Open Requests", value: "2" }, { label: "Confirmed Events", value: "1" }, { label: "Guests Scheduled", value: "125" }, { label: "Estimated Revenue", value: "$2,020" }].map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 space-y-5">
        {cateringOrders.map((order) => (
          <article key={order.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
            <div className="border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-black tracking-tight">{order.company}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyles[order.status]}`}>{order.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Request #{order.id} · {order.contact} · {order.phone}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Estimated total</p>
                  <p className="mt-1 text-2xl font-black text-emerald-700">{order.total}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[{ label: "Event date", value: order.date }, { label: "Event time", value: order.time }, { label: "Guest count", value: `${order.guests} guests` }].map((detail) => (
                  <div key={detail.label} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{detail.label}</p>
                    <p className="mt-1 font-bold text-slate-800">{detail.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-700">Requested menu</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {order.items.map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700">{item}</div>)}
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100">Mark contacted</button>
                  <button className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-700 transition hover:bg-purple-100">Confirm event</button>
                  <button className="rounded-xl bg-[#123b2a] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0f3224]">Mark delivered</button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

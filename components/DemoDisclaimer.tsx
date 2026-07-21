"use client";

import { useEffect, useState } from "react";

export default function DemoDisclaimer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <h2 className="text-center text-2xl font-black">Demo Notice</h2>

        <p className="mt-4 text-center leading-7 text-slate-600">
          This is not an official Falafel Flare product. This website was
          created solely as a demonstration.
        </p>

        <button
          onClick={() => setOpen(false)}
          className="mt-6 w-full rounded-2xl bg-[#123b2a] py-3 font-bold text-white"
        >
          Okay
        </button>
      </div>
    </div>
  );
}
"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function RefundFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("refundable") === "1";

  function toggle() {
    router.push(active ? "/ops" : "/ops?refundable=1");
  }

  return (
    <button
      type="button"
      id="filter-refundable"
      onClick={toggle}
      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {active ? "Show all transactions" : "Show refundable only"}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RefundPanelProps {
  transactionId: string;
  amountLabel: string;
  eligible: boolean;
  ineligibleMessage: string | null;
}

export default function RefundPanel({
  transactionId,
  amountLabel,
  eligible,
  ineligibleMessage,
}: RefundPanelProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!eligible) {
    return (
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-sm font-semibold text-amber-900">Refund unavailable</h2>
        <p
          className="mt-2 text-sm text-amber-800"
          role="status"
          data-testid="refund-unavailable"
        >
          {ineligibleMessage}
        </p>
      </div>
    );
  }

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/refunds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, reason }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Refund failed.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setReason("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-lg border border-slate-200 bg-white p-6"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Issue refund
      </h2>

      <label htmlFor="refund-reason" className="mt-4 block text-sm font-medium">
        Reason for refund
      </label>
      <input
        id="refund-reason"
        name="reason"
        type="text"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Customer returned item"
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />

      {error && (
        <p
          role="alert"
          data-testid="refund-error"
          className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={submitting}
        data-testid="refund-submit"
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Processing..." : `Refund ${amountLabel}`}
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const FIELD_CLASS =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSubmitting(true);
    setError(null);

    const formElement = document.getElementById("checkout-form") as HTMLFormElement;
    const form = new FormData(formElement);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("customerName"),
        customerEmail: form.get("customerEmail"),
        description: form.get("description"),
        amount: form.get("amount"),
        cardNumber: form.get("cardNumber"),
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      transaction?: { id: string };
    };

    if (!response.ok || !payload.transaction) {
      setError(payload.error ?? "Payment failed.");
      setSubmitting(false);
      return;
    }

    router.push(`/confirmation/${payload.transaction.id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-1 text-sm text-slate-600">
        Complete your purchase. Payments are captured immediately.
      </p>

      <form
        id="checkout-form"
        onSubmit={handleSubmit}
        className="mt-6 rounded-lg border border-slate-200 bg-white p-6"
      >
        <label htmlFor="customerName" className="block text-sm font-medium">
          Full name
        </label>
        <input id="customerName" name="customerName" type="text" className={FIELD_CLASS} />

        <label htmlFor="customerEmail" className="mt-4 block text-sm font-medium">
          Email address
        </label>
        <input id="customerEmail" name="customerEmail" type="text" className={FIELD_CLASS} />

        <label htmlFor="description" className="mt-4 block text-sm font-medium">
          Item
        </label>
        <input id="description" name="description" type="text" className={FIELD_CLASS} />

        <label htmlFor="amount" className="mt-4 block text-sm font-medium">
          Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="text"
          placeholder="129.50"
          className={FIELD_CLASS}
        />

        <label htmlFor="cardNumber" className="mt-4 block text-sm font-medium">
          Card number
        </label>
        <input
          id="cardNumber"
          name="cardNumber"
          type="text"
          placeholder="4242424242424242"
          className={FIELD_CLASS}
        />

        {error && (
          <p
            role="alert"
            data-testid="checkout-error"
            className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={submitting}
          data-testid="checkout-submit"
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Pay now"}
        </button>
      </form>
    </div>
  );
}

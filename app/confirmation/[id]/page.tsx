import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransaction } from "@/lib/store";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transaction = getTransaction(id);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="max-w-lg">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h1 className="text-xl font-semibold text-emerald-900" data-testid="confirmation-heading">
          Payment successful
        </h1>
        <p className="mt-2 text-sm text-emerald-800">
          We charged {formatCents(transaction.amountCents)} to the card ending{" "}
          {transaction.cardLast4}.
        </p>
      </div>

      <dl className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Reference</dt>
          <dd className="font-mono text-xs" data-testid="confirmation-reference">
            {transaction.reference}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Item</dt>
          <dd className="font-medium">{transaction.description}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Total</dt>
          <dd className="font-semibold tabular-nums">
            {formatCents(transaction.amountCents)}
          </dd>
        </div>
      </dl>

      <Link
        href="/ops"
        className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        View in transactions console
      </Link>
    </div>
  );
}

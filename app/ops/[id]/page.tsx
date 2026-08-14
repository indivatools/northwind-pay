import Link from "next/link";
import { notFound } from "next/navigation";
import { getTransaction, getRefundsForTransaction } from "@/lib/store";
import { checkRefundEligibility } from "@/lib/refund-rules";
import { formatCents } from "@/lib/money";
import RefundPanel from "./refund-panel";

export const dynamic = "force-dynamic";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transaction = getTransaction(id);

  if (!transaction) {
    notFound();
  }

  const eligibility = checkRefundEligibility(transaction);
  const refunds = getRefundsForTransaction(transaction.id);

  return (
    <div className="max-w-2xl">
      <Link href="/ops" className="text-sm font-medium text-blue-600 hover:text-blue-800">
        Back to transactions
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {transaction.reference}
      </h1>

      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-slate-200 bg-white p-6 text-sm">
        <div>
          <dt className="text-slate-500">Customer</dt>
          <dd className="mt-1 font-medium">{transaction.customerName}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="mt-1 font-medium">{transaction.customerEmail}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Item</dt>
          <dd className="mt-1 font-medium">{transaction.description}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Card</dt>
          <dd className="mt-1 font-medium">Ending {transaction.cardLast4}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Amount</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">
            {formatCents(transaction.amountCents)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Captured</dt>
          <dd className="mt-1 font-medium">
            {eligibility.daysSinceCapture} days ago
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd className="mt-1 font-medium" data-testid="transaction-status">
            {transaction.status}
          </dd>
        </div>
      </dl>

      {refunds.length > 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Refund history
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {refunds.map((refund) => (
              <li key={refund.id} className="flex justify-between">
                <span className="text-slate-600">{refund.reason}</span>
                <span className="font-medium tabular-nums">
                  {formatCents(refund.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RefundPanel
        transactionId={transaction.id}
        amountLabel={formatCents(transaction.amountCents)}
        eligible={eligibility.eligible}
        ineligibleMessage={eligibility.message ?? null}
      />
    </div>
  );
}

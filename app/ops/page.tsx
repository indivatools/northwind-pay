import Link from "next/link";
import { listTransactions } from "@/lib/store";
import { checkRefundEligibility, REFUND_WINDOW_DAYS } from "@/lib/refund-rules";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default function TransactionsPage() {
  const transactions = listTransactions();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-slate-600">
          Captured payments can be refunded within {REFUND_WINDOW_DAYS} days of capture.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => {
              const eligibility = checkRefundEligibility(transaction);
              return (
                <tr
                  key={transaction.id}
                  data-testid={`txn-row-${transaction.id}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {transaction.reference}
                  </td>
                  <td className="px-4 py-3 font-medium" data-testid="txn-customer">
                    {transaction.customerName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{transaction.description}</td>
                  <td className="px-4 py-3 text-slate-600" data-testid="txn-age">
                    {eligibility.daysSinceCapture} days
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        transaction.status === "REFUNDED"
                          ? "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                          : "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                      }
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatCents(transaction.amountCents)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/ops/${transaction.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

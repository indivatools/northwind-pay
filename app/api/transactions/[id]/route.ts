import { NextResponse } from "next/server";
import { getTransaction, getRefundsForTransaction } from "@/lib/store";
import { checkRefundEligibility } from "@/lib/refund-rules";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const transaction = getTransaction(id);

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  const eligibility = checkRefundEligibility(transaction);

  return NextResponse.json({
    transaction,
    refunds: getRefundsForTransaction(transaction.id),
    refundable: eligibility.eligible,
    daysSinceCapture: eligibility.daysSinceCapture,
  });
}

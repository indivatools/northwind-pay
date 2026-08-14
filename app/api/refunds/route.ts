import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getTransaction, recordRefund } from "@/lib/store";
import { checkRefundEligibility } from "@/lib/refund-rules";

interface RefundRequestBody {
  transactionId?: unknown;
  reason?: unknown;
}

export async function POST(request: Request) {
  let body: RefundRequestBody;
  try {
    body = (await request.json()) as RefundRequestBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { transactionId, reason } = body;

  if (typeof transactionId !== "string" || transactionId.length === 0) {
    return NextResponse.json({ error: "transactionId is required." }, { status: 400 });
  }
  if (typeof reason !== "string" || reason.trim().length === 0) {
    return NextResponse.json({ error: "A refund reason is required." }, { status: 400 });
  }

  const transaction = getTransaction(transactionId);
  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  const eligibility = checkRefundEligibility(transaction);
  if (!eligibility.eligible) {
    return NextResponse.json(
      { error: eligibility.message, reason: eligibility.reason },
      { status: 422 },
    );
  }

  const refund = recordRefund({
    id: `ref_${randomUUID().slice(0, 8)}`,
    transactionId: transaction.id,
    amountCents: transaction.amountCents,
    reason: reason.trim(),
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ refund }, { status: 201 });
}

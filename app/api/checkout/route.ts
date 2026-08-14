import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { insertTransaction, listTransactions } from "@/lib/store";
import { parseAmountToCents } from "@/lib/money";
import type { Transaction } from "@/lib/types";

const CARD_NUMBER_PATTERN = /^\d{16}$/;
const REFERENCE_BASE = 10_400;
const REFERENCE_STEP = 7;

interface CheckoutRequestBody {
  customerName?: unknown;
  customerEmail?: unknown;
  description?: unknown;
  amount?: unknown;
  cardNumber?: unknown;
}

function nextReference(): string {
  return `CQA-${REFERENCE_BASE + listTransactions().length * REFERENCE_STEP}`;
}

export async function POST(request: Request) {
  let body: CheckoutRequestBody;
  try {
    body = (await request.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { customerName, customerEmail, description, amount, cardNumber } = body;

  if (typeof customerName !== "string" || customerName.trim().length === 0) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (typeof customerEmail !== "string" || !customerEmail.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return NextResponse.json({ error: "An item description is required." }, { status: 400 });
  }
  if (typeof cardNumber !== "string" || !CARD_NUMBER_PATTERN.test(cardNumber.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Card number must be 16 digits." }, { status: 400 });
  }

  const amountCents = typeof amount === "string" ? parseAmountToCents(amount) : null;
  if (amountCents === null || amountCents <= 0) {
    return NextResponse.json({ error: "Amount must be a positive value." }, { status: 400 });
  }

  const transaction: Transaction = {
    id: `txn_${randomUUID().slice(0, 8)}`,
    reference: nextReference(),
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim(),
    description: description.trim(),
    amountCents,
    currency: "USD",
    cardLast4: cardNumber.replace(/\s/g, "").slice(-4),
    status: "CAPTURED",
    capturedAt: new Date().toISOString(),
    refundedAt: null,
  };

  insertTransaction(transaction);
  return NextResponse.json({ transaction }, { status: 201 });
}

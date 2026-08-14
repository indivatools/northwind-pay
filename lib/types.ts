export type TransactionStatus = "CAPTURED" | "REFUNDED" | "VOIDED";

export interface Transaction {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  description: string;
  amountCents: number;
  currency: "USD";
  cardLast4: string;
  status: TransactionStatus;
  capturedAt: string;
  refundedAt: string | null;
}

export interface Refund {
  id: string;
  transactionId: string;
  amountCents: number;
  reason: string;
  createdAt: string;
}

export interface Database {
  transactions: Transaction[];
  refunds: Refund[];
}

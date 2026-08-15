import type { Transaction } from "./types";

/**
 * Merchant refund policy.
 *
 * A captured payment may be refunded within REFUND_WINDOW_DAYS days of capture,
 * inclusive — a payment captured exactly REFUND_WINDOW_DAYS days ago is still
 * eligible. On the day after the window closes it is no longer refundable.
 */
export const REFUND_WINDOW_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type RefundDenialReason =
  | "ALREADY_REFUNDED"
  | "NOT_CAPTURED"
  | "WINDOW_EXPIRED";

export interface RefundEligibility {
  eligible: boolean;
  reason?: RefundDenialReason;
  message?: string;
  daysSinceCapture: number;
}

export function daysSinceCapture(
  transaction: Transaction,
  now: Date = new Date(),
): number {
  const capturedAt = new Date(transaction.capturedAt).getTime();
  return Math.floor((now.getTime() - capturedAt) / MS_PER_DAY);
}

export function checkRefundEligibility(
  transaction: Transaction,
  now: Date = new Date(),
): RefundEligibility {
  const days = daysSinceCapture(transaction, now);

  if (transaction.status === "REFUNDED") {
    return {
      eligible: false,
      reason: "ALREADY_REFUNDED",
      message: "This payment has already been refunded.",
      daysSinceCapture: days,
    };
  }

  if (transaction.status !== "CAPTURED") {
    return {
      eligible: false,
      reason: "NOT_CAPTURED",
      message: "Only captured payments can be refunded.",
      daysSinceCapture: days,
    };
  }

  if (days >= REFUND_WINDOW_DAYS) {
    return {
      eligible: false,
      reason: "WINDOW_EXPIRED",
      message: `Refund window closed. Payments can be refunded within ${REFUND_WINDOW_DAYS} days of capture; this one was captured ${days} days ago.`,
      daysSinceCapture: days,
    };
  }

  return { eligible: true, daysSinceCapture: days };
}

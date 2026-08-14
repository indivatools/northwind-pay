import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Database, Refund, Transaction } from "./types";

const DB_PATH = join(process.cwd(), "data", "db.json");

function emptyDatabase(): Database {
  return { transactions: [], refunds: [] };
}

function read(): Database {
  if (!existsSync(DB_PATH)) {
    return emptyDatabase();
  }
  const raw = readFileSync(DB_PATH, "utf8");
  return JSON.parse(raw) as Database;
}

function write(db: Database): void {
  writeFileSync(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

export function listTransactions(): Transaction[] {
  return read().transactions.sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  );
}

export function getTransaction(id: string): Transaction | null {
  return read().transactions.find((t) => t.id === id) ?? null;
}

export function getRefundsForTransaction(transactionId: string): Refund[] {
  return read().refunds.filter((r) => r.transactionId === transactionId);
}

export function insertTransaction(transaction: Transaction): Transaction {
  const db = read();
  db.transactions.push(transaction);
  write(db);
  return transaction;
}

export function recordRefund(refund: Refund): Refund {
  const db = read();
  const transaction = db.transactions.find((t) => t.id === refund.transactionId);
  if (!transaction) {
    throw new Error(`Cannot refund unknown transaction ${refund.transactionId}`);
  }

  db.refunds.push(refund);
  transaction.status = "REFUNDED";
  transaction.refundedAt = refund.createdAt;
  write(db);
  return refund;
}

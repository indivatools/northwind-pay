const CENTS_PER_UNIT = 100;

/** Format integer cents as a display string, e.g. 12950 -> "$129.50". */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const units = Math.floor(abs / CENTS_PER_UNIT);
  const remainder = abs % CENTS_PER_UNIT;
  return `${sign}$${units.toLocaleString("en-US")}.${String(remainder).padStart(2, "0")}`;
}

/**
 * Parse a user-entered amount string into integer cents.
 * Returns null when the input is not a well-formed non-negative amount.
 */
export function parseAmountToCents(input: string): number | null {
  const trimmed = input.trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [units, fraction = ""] = trimmed.split(".");
  const paddedFraction = fraction.padEnd(2, "0");
  return Number(units) * CENTS_PER_UNIT + Number(paddedFraction);
}

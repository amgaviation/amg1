/**
 * Spreadsheet formula-injection defense. A CSV/XLSX cell whose text begins with
 * a formula trigger (`=` `+` `-` `@`, or a leading TAB / CR) is interpreted as a
 * formula by Excel and Google Sheets, so an attacker-controlled value like
 * `=HYPERLINK(...)` or `=cmd|...` can execute on open. We neutralize it by
 * prefixing a single quote, which forces the value to render as literal text.
 * (Phone numbers like `+1...` also get quoted, which correctly keeps them as
 * text rather than a number/formula.)
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function sanitizeSpreadsheetCell<T>(value: T): T | string {
  if (typeof value === "string" && FORMULA_TRIGGER.test(value)) {
    return `'${value}`;
  }
  return value;
}

/** Sanitize every value in a row object (for XLSX.utils.json_to_sheet input). */
export function sanitizeSpreadsheetRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = sanitizeSpreadsheetCell(value);
  }
  return out as T;
}

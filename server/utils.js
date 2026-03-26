export function toNumber(input) {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const cleaned = raw.replace(/[^\d,.\-]/g, "");
  if (!cleaned) return null;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      const value = Number(normalized);
      return Number.isFinite(value) ? value : null;
    }
    const normalized = cleaned.replace(/,/g, "");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  if (hasComma) {
    const normalized = cleaned.replace(",", ".");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : null;
  }

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

export function isoNow() {
  return new Date().toISOString();
}

export function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "SRD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function hasNumericRate(value) {
  if (value === null || value === undefined || value === "") return false;
  return Number.isFinite(Number(value));
}

export function formatSrd(value) {
  if (!hasNumericRate(value)) return "Geen Koers";
  return currencyFormatter.format(Number(value));
}

export function relativeTime(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Updated -";
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Updated just now";
  if (diffSec < 3600) return `Updated ${Math.floor(diffSec / 60)} min ago`;
  return `Updated ${Math.floor(diffSec / 3600)} hr ago`;
}

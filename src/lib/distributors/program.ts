/**
 * Distributor programme terms shared by client and server.
 *
 * Tier discounts implement the Reimagination Program's proposed 18–28% resale
 * margin. They are starting ranges, not verified OBASIX margins: confirm them
 * against SKU-level costing, freight and GST before going live.
 */

export const distributorTiers = [
  { id: "silver", name: "Silver", discount: 0.18, description: "New distributors and smaller towns." },
  { id: "gold", name: "Gold", discount: 0.23, description: "Consistent quarterly volume." },
  { id: "platinum", name: "Platinum", discount: 0.28, description: "Regional distributors with institutional accounts." },
] as const;

export type DistributorTierId = (typeof distributorTiers)[number]["id"];

export function tierById(id: string) {
  return distributorTiers.find((t) => t.id === id) ?? distributorTiers[0];
}

/** Smallest trade order, at trade price before GST. */
export const minimumTradeOrder = 15000;

/** Territories are reviewed every quarter; none are permanently exclusive. */
export const territoryReviewMonths = 3;

export const businessTypes = [
  "Stationery or office supplies dealer",
  "Furniture or interiors dealer",
  "School and institutional supplier",
  "Signage or printing business",
  "Regional wholesaler",
  "Other",
] as const;

export type BusinessType = (typeof businessTypes)[number];

/** Indian financial-year quarter (Q1 = April–June) for a date. */
export function financialQuarter(date: Date) {
  const month = date.getMonth(); // 0 = January
  const fyStartYear = month >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const quarter = Math.floor(((month + 9) % 12) / 3) + 1;
  const startMonth = 3 + (quarter - 1) * 3; // months since January of fyStartYear
  const start = new Date(fyStartYear, startMonth, 1);
  const end = new Date(fyStartYear, startMonth + 3, 1);
  const label = `Q${quarter} FY${String(fyStartYear + 1).slice(-2)}`;
  return { quarter, label, start, end };
}

/** GSTIN: 2-digit state code, PAN, entity digit, Z, check character. */
export function isValidGstin(value: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value);
}

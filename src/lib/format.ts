export function formatPrice(amount: number, currency: "INR" = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPricePlaceholder(amount?: number): string {
  if (amount === undefined || Number.isNaN(amount)) {
    return "₹XX,XXX";
  }
  return formatPrice(amount);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

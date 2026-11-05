import { encodeLayout } from "@/lib/combination";
import type { CombinationLayout, CustomizerState } from "@/lib/types";

export function formatPrice(amount: number, currency: "INR" = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPricePlaceholder(amount?: number): string {
  if (amount === undefined || Number.isNaN(amount)) return "₹XX,XXX";
  return formatPrice(amount);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

type CustomizePrefill = Partial<CustomizerState> & {
  application?: string;
};

export function buildCustomizeHref(prefill: CustomizePrefill) {
  const params = new URLSearchParams();
  Object.entries(prefill).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (key === "combinationLayout") {
      params.set("layout", encodeLayout(value as CombinationLayout));
      return;
    }
    if (key === "logoDataUrl") return;
    if (Array.isArray(value)) params.set(key, value.join(","));
    else if (typeof value === "object") return;
    else params.set(key, String(value));
  });
  return `/customize?${params.toString()}`;
}

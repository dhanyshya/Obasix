import type { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  onQuickView?: (product: Product) => void;
}

export function ProductGrid({ products, onQuickView }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--obx-line)] bg-white px-6 py-16 text-center">
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--obx-ink)]">
          No boards match these filters
        </p>
        <p className="mt-2 text-sm text-[var(--obx-muted)]">
          Adjust filters or clear your search to explore the full OBASIX range.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
      ))}
    </div>
  );
}

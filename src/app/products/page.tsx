"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import type { MaterialType, Product, ProductFilters as Filters } from "@/lib/types";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { Suspense } from "react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const initialQ = searchParams.get("q") ?? "";
  const maxPrice = Math.max(...products.map((p) => p.startingPrice));

  const [filters, setFilters] = useState<Filters>({
    search: initialQ,
    categories: initialCategory ? [initialCategory] : [],
    materials: [],
    thicknesses: [],
    finishes: [],
    colours: [],
    applications: [],
    priceMin: 0,
    priceMax: maxPrice,
    sort: "featured",
  });
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [],
  );
  const materials = useMemo(
    () => Array.from(new Set(products.map((p) => p.material))) as MaterialType[],
    [],
  );
  const thicknesses = useMemo(
    () =>
      Array.from(new Set(products.flatMap((p) => p.thicknesses))).sort(
        (a, b) => a - b,
      ),
    [],
  );

  const filtered = useMemo(() => {
    let list = [...products];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    if (filters.categories.length) {
      list = list.filter((p) => filters.categories.includes(p.category));
    }
    if (filters.materials.length) {
      list = list.filter((p) => filters.materials.includes(p.material));
    }
    if (filters.thicknesses.length) {
      list = list.filter((p) =>
        p.thicknesses.some((t) => filters.thicknesses.includes(t)),
      );
    }
    if (filters.finishes.length) {
      list = list.filter((p) =>
        p.finishes.some((f) => filters.finishes.includes(f)),
      );
    }
    if (filters.colours.length) {
      list = list.filter((p) =>
        p.colours.some((c) => filters.colours.includes(c)),
      );
    }
    if (filters.applications.length) {
      list = list.filter((p) =>
        p.applications.some((a) => filters.applications.includes(a)),
      );
    }
    list = list.filter(
      (p) =>
        p.startingPrice >= filters.priceMin &&
        p.startingPrice <= filters.priceMax,
    );

    switch (filters.sort) {
      case "price-asc":
        list.sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case "price-desc":
        list.sort((a, b) => b.startingPrice - a.startingPrice);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }

    return list;
  }, [filters]);

  return (
    <div className="bg-[var(--obx-cream)]">
      <section className="border-b border-[var(--obx-line)] bg-[var(--obx-green-deep)] py-14 text-white">
        <div className="container-obx">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--obx-orange)]">
            Product Catalogue
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
            Board Showroom
          </h1>
          <p className="mt-3 max-w-2xl text-white/75">
            Explore OBASIX boards in a premium showroom experience — filter by
            material, finish, thickness and application.
          </p>
        </div>
      </section>

      <div className="container-obx py-8 md:py-12">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--obx-muted)]">
            Showing <span className="font-semibold text-[var(--obx-ink)]">{filtered.length}</span> products
          </p>
          <button
            type="button"
            className="btn btn-ghost lg:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            Filters
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">
            <ProductFilters
              filters={filters}
              onChange={setFilters}
              categories={categories}
              materials={materials}
              thicknesses={thicknesses}
              maxPrice={maxPrice}
            />
          </div>
          <ProductGrid products={filtered} onQuickView={setQuickView} />
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 lg:hidden">
          <div className="mx-auto max-h-[90vh] max-w-lg overflow-y-auto rounded-[var(--radius-lg)] bg-white p-2">
            <div className="flex justify-end p-2">
              <button type="button" onClick={() => setFiltersOpen(false)}>
                <X />
              </button>
            </div>
            <ProductFilters
              filters={filters}
              onChange={(next) => {
                setFilters(next);
                setFiltersOpen(false);
              }}
              categories={categories}
              materials={materials}
              thicknesses={thicknesses}
              maxPrice={maxPrice}
            />
          </div>
        </div>
      )}

      {quickView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative grid max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-lg)] bg-white md:grid-cols-2">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2"
              onClick={() => setQuickView(null)}
            >
              <X size={16} />
            </button>
            <div className="relative min-h-64">
              <Image
                src={quickView.images[0]}
                alt={quickView.name}
                fill
                className="object-cover"
                sizes="50vw"
              />
            </div>
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--obx-green)]">
                {quickView.category}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
                {quickView.name}
              </h2>
              <p className="mt-3 text-sm text-[var(--obx-muted)]">
                {quickView.shortDescription}
              </p>
              <p className="mt-4 text-xl font-bold">
                From {formatPrice(quickView.startingPrice)}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href={`/products/${quickView.id}`}
                  className="btn btn-secondary"
                  onClick={() => setQuickView(null)}
                >
                  View details
                </Link>
                <Link
                  href={`/customize?productId=${quickView.id}`}
                  className="btn btn-primary"
                  onClick={() => setQuickView(null)}
                >
                  Customize
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-obx py-20">Loading catalogue...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

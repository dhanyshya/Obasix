"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, ShoppingBag, SlidersHorizontal } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { getFinishById } from "@/data/finishes";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addItem } = useCart();
  const primaryFinish = getFinishById(product.finishes[0])?.name ?? product.finishes[0];
  const sizes = product.sizes.map((s) => s.label).join(" · ");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--obx-stone)]">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        {product.tag && (
          <span className="absolute left-3 top-3 rounded-[var(--radius-sm)] bg-[var(--obx-green)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {product.tag}
          </span>
        )}
        <div className="absolute inset-x-3 bottom-3 flex translate-y-2 gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onQuickView?.(product)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-white/95 px-3 py-2 text-xs font-semibold text-[var(--obx-ink)] backdrop-blur"
          >
            <Eye size={14} /> Quick View
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--obx-green)]">
          {product.category}
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--obx-ink)]">
          <Link href={`/products/${product.id}`} className="hover:text-[var(--obx-green)]">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--obx-muted)]">
          {product.shortDescription}
        </p>

        <div className="mt-4 space-y-1.5 text-xs text-[var(--obx-muted)]">
          <p>
            <span className="font-semibold text-[var(--obx-charcoal)]">Finish:</span> {primaryFinish}
          </p>
          <p>
            <span className="font-semibold text-[var(--obx-charcoal)]">Sizes:</span> {sizes}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[var(--obx-muted)]">Starting at</p>
            <p className="text-lg font-bold text-[var(--obx-ink)]">
              {formatPrice(product.startingPrice)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/customize?productId=${product.id}`}
            className="btn btn-outline !px-2 !py-2.5 text-xs"
          >
            <SlidersHorizontal size={14} /> Customize
          </Link>
          <button
            type="button"
            className="btn btn-primary !px-2 !py-2.5 text-xs"
            onClick={() =>
              addItem(product.id, {
                colourId: product.colours[0],
                finishId: product.finishes[0],
                thickness: product.thicknesses.includes(18)
                  ? 18
                  : product.thicknesses[0],
                sizeId: product.sizes[0].id,
                application: product.applications[0],
              })
            }
          >
            <ShoppingBag size={14} /> Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

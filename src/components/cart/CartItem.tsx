"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem as CartItemType } from "@/lib/types";
import { getProductById } from "@/data/products";
import { getColourById } from "@/data/colours";
import { getFinishById } from "@/data/finishes";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/CartContext";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const product = getProductById(item.productId);
  if (!product) return null;

  const colour = getColourById(item.configuration.colourId);
  const finish = getFinishById(item.configuration.finishId);
  const size =
    product.sizes.find((s) => s.id === item.configuration.sizeId)?.label ??
    "Custom size";

  return (
    <article className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white p-4 shadow-[var(--shadow-sm)] md:grid-cols-[120px_1fr_auto] md:p-5">
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-[var(--obx-stone)] md:aspect-auto md:h-28">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover"
          sizes="120px"
        />
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-[var(--obx-muted)]">Custom configuration</p>
        <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <span className="text-[var(--obx-muted)]">Colour: </span>
            <span className="font-medium">{colour?.name ?? "—"}</span>
          </div>
          <div>
            <span className="text-[var(--obx-muted)]">Finish: </span>
            <span className="font-medium">{finish?.name ?? "—"}</span>
          </div>
          <div>
            <span className="text-[var(--obx-muted)]">Size: </span>
            <span className="font-medium">{size}</span>
          </div>
          <div>
            <span className="text-[var(--obx-muted)]">Thickness: </span>
            <span className="font-medium">{item.configuration.thickness}mm</span>
          </div>
        </dl>
      </div>

      <div className="flex flex-row items-center justify-between gap-4 md:flex-col md:items-end">
        <p className="text-lg font-bold">
          {formatPrice(item.unitPrice * item.quantity)}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--obx-line)]"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--obx-line)]"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-[var(--obx-red)] hover:bg-[var(--obx-orange-soft)]"
            onClick={() => removeItem(item.id)}
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

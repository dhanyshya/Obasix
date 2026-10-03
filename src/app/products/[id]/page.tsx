"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { notFound } from "next/navigation";
import {
  accessories,
  getProductById,
  getRelatedProducts,
} from "@/data/products";
import { colours } from "@/data/colours";
import { finishes } from "@/data/finishes";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ColourSelector } from "@/components/customizer/ColourSelector";
import { RecommendationCard } from "@/components/product/RecommendationCard";
import { useCart } from "@/context/CartContext";
import { cn, formatPrice } from "@/lib/format";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = getProductById(id);
  const { addItem } = useCart();

  if (!product) {
    notFound();
  }

  const [colourId, setColourId] = useState(product.colours[0]);
  const [finishId, setFinishId] = useState(product.finishes[0]);
  const [thickness, setThickness] = useState(
    product.thicknesses.includes(18) ? 18 : product.thicknesses[0],
  );
  const [sizeId, setSizeId] = useState(product.sizes[0].id);
  const [quantity, setQuantity] = useState(1);

  const availableColours = useMemo(
    () => colours.filter((c) => product.colours.includes(c.id)),
    [product],
  );
  const availableFinishes = useMemo(
    () => finishes.filter((f) => product.finishes.includes(f.id)),
    [product],
  );
  const related = getRelatedProducts(product);
  const recommendedAccessories = accessories.filter((a) =>
    product.accessories.includes(a.id),
  );
  const finishPreviewHex = availableColours.find((c) => c.id === colourId)?.hex;

  return (
    <div className="bg-[var(--obx-cream)]">
      <div className="container-obx py-8 md:py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery
            images={product.images}
            alt={product.name}
            finishPreviewHex={finishPreviewHex}
          />

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--obx-green)]">
              {product.category}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-[var(--obx-muted)] leading-relaxed">
              {product.description}
            </p>
            <p className="mt-6 text-3xl font-bold">
              {formatPrice(product.startingPrice)}
              <span className="ml-2 text-sm font-medium text-[var(--obx-muted)]">
                starting price
              </span>
            </p>

            <div className="mt-8 space-y-6 rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white p-5">
              <ColourSelector
                colours={availableColours}
                value={colourId}
                onChange={setColourId}
              />

              <div>
                <p className="mb-2 text-sm font-semibold">Available finishes</p>
                <div className="flex flex-wrap gap-2">
                  {availableFinishes.map((finish) => (
                    <button
                      key={finish.id}
                      type="button"
                      onClick={() => setFinishId(finish.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold",
                        finishId === finish.id
                          ? "bg-[var(--obx-green)] text-white"
                          : "bg-[var(--obx-mist)]",
                      )}
                    >
                      {finish.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Thickness</p>
                <div className="flex flex-wrap gap-2">
                  {product.thicknesses.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setThickness(t)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold",
                        thickness === t
                          ? "bg-[var(--obx-green)] text-white"
                          : "bg-[var(--obx-mist)]",
                      )}
                    >
                      {t}mm
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSizeId(size.id)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold",
                        sizeId === size.id
                          ? "bg-[var(--obx-green)] text-white"
                          : "bg-[var(--obx-mist)]",
                      )}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Quantity</p>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  className="w-28 rounded-[var(--radius-md)] border border-[var(--obx-line)] px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Link
                href={`/customize?productId=${product.id}&colourId=${colourId}&finishId=${finishId}&thickness=${thickness}&sizeId=${sizeId}&quantity=${quantity}`}
                className="btn btn-secondary"
              >
                Customize Product
              </Link>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  addItem(
                    product.id,
                    {
                      colourId,
                      finishId,
                      thickness,
                      sizeId,
                      application: product.applications[0],
                    },
                    quantity,
                  )
                }
              >
                Add to Cart
              </button>
              <Link
                href={`/quote?product=${encodeURIComponent(product.name)}&quantity=${quantity}`}
                className="btn btn-outline"
              >
                Request Custom Quote
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          <section className="rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white p-6">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Specifications
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 border-b border-[var(--obx-line)] py-2">
                  <dt className="text-[var(--obx-muted)]">{key}</dt>
                  <dd className="font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white p-6">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Applications
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {product.applications.map((app) => (
                <li
                  key={app}
                  className="rounded-full bg-[var(--obx-green-soft)] px-3 py-1.5 text-xs font-semibold capitalize text-[var(--obx-green)]"
                >
                  {app}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white p-6">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              Features
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--obx-muted)]">
              {product.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--obx-orange)]" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Related products
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {related.map((item) => (
              <RecommendationCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Recommended accessories
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {recommendedAccessories.map((item) => (
              <RecommendationCard key={item.id} item={item} href="/cart" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

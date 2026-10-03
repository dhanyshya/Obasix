"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ApplicationType, CustomizerState, MaterialType, Product } from "@/lib/types";
import { colours as allColours } from "@/data/colours";
import { finishes as allFinishes } from "@/data/finishes";
import { ColourSelector } from "./ColourSelector";
import { FinishSelector } from "./FinishSelector";
import { DimensionSelector } from "./DimensionSelector";
import { cn, formatPricePlaceholder } from "@/lib/format";

const applications: ApplicationType[] = [
  "kitchen",
  "bedroom",
  "wardrobe",
  "office",
  "wall",
  "furniture",
  "partition",
  "commercial",
];

const materials: { id: MaterialType; label: string }[] = [
  { id: "mdf", label: "MDF" },
  { id: "hdf", label: "HDF" },
  { id: "particle", label: "Particle" },
  { id: "plywood", label: "Plywood" },
  { id: "acrylic", label: "Acrylic" },
  { id: "laminate-board", label: "Laminate Board" },
];

interface ProductConfiguratorProps {
  products: Product[];
  state: CustomizerState;
  onChange: (next: Partial<CustomizerState>) => void;
  onAddToCart: () => void;
  estimatedPrice?: number;
}

export function ProductConfigurator({
  products,
  state,
  onChange,
  onAddToCart,
  estimatedPrice,
}: ProductConfiguratorProps) {
  const product = products.find((p) => p.id === state.productId) ?? products[0];

  const availableColours = useMemo(
    () => allColours.filter((c) => product.colours.includes(c.id)),
    [product],
  );
  const availableFinishes = useMemo(
    () => allFinishes.filter((f) => product.finishes.includes(f.id)),
    [product],
  );
  const selectedColour = availableColours.find((c) => c.id === state.colourId);
  const selectedFinish = availableFinishes.find((f) => f.id === state.finishId);
  const selectedSize = product.sizes.find((s) => s.id === state.sizeId);

  const finishClass =
    selectedFinish?.type === "gloss"
      ? "finish-gloss"
      : selectedFinish?.type === "wood" || selectedFinish?.type === "veneer"
        ? "finish-wood"
        : selectedFinish?.type === "textured"
          ? "finish-textured"
          : "finish-matte";

  const sizeLabel =
    selectedSize && selectedSize.widthFt > 0
      ? selectedSize.label
      : `${Math.round(state.widthMm / 25.4 / 12)} × ${Math.round(state.heightMm / 25.4 / 12)} ft`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <div
          className={cn(
            "board-preview relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--obx-line)] shadow-[var(--shadow-md)]",
            finishClass,
          )}
          style={{
            backgroundColor: selectedColour?.hex ?? "#D4B896",
            aspectRatio: `${Math.max(state.widthMm, 1)} / ${Math.max(state.heightMm, 1)}`,
            maxHeight: 520,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/15" />
          <div className="absolute left-4 top-4 rounded-[var(--radius-sm)] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[var(--obx-ink)] backdrop-blur">
            Live preview
          </div>
          <div className="absolute bottom-4 left-4 right-4 rounded-[var(--radius-md)] bg-black/45 px-4 py-3 text-white backdrop-blur-sm">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {product.name}
            </p>
            <p className="text-sm text-white/80">
              {selectedColour?.name} · {selectedFinish?.name} · {state.thickness}mm
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white p-5 shadow-[var(--shadow-sm)]">
          <div>
            <p className="mb-2 text-sm font-semibold">Product</p>
            <select
              value={state.productId}
              onChange={(e) => {
                const next = products.find((p) => p.id === e.target.value);
                if (!next) return;
                onChange({
                  productId: next.id,
                  material: next.material,
                  thickness: next.thicknesses.includes(18)
                    ? 18
                    : next.thicknesses[0],
                  sizeId: next.sizes[0].id,
                  colourId: next.colours[0],
                  finishId: next.finishes[0],
                });
              }}
              className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--obx-green)]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Board type / Material</p>
            <div className="flex flex-wrap gap-2">
              {materials.map((material) => (
                <button
                  key={material.id}
                  type="button"
                  onClick={() => onChange({ material: material.id })}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    state.material === material.id
                      ? "bg-[var(--obx-green)] text-white"
                      : "bg-[var(--obx-mist)] text-[var(--obx-charcoal)]",
                  )}
                >
                  {material.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      sizeId: size.id,
                      widthMm:
                        size.widthFt > 0 ? Math.round(size.widthFt * 304.8) : state.widthMm,
                      heightMm:
                        size.heightFt > 0
                          ? Math.round(size.heightFt * 304.8)
                          : state.heightMm,
                    })
                  }
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    state.sizeId === size.id
                      ? "bg-[var(--obx-green)] text-white"
                      : "bg-[var(--obx-mist)] text-[var(--obx-charcoal)]",
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <ColourSelector
            colours={availableColours}
            value={state.colourId}
            onChange={(colourId) => onChange({ colourId })}
          />

          <FinishSelector
            finishes={availableFinishes}
            value={state.finishId}
            onChange={(finishId) => onChange({ finishId })}
          />

          <DimensionSelector
            widthMm={state.widthMm}
            heightMm={state.heightMm}
            thickness={state.thickness}
            quantity={state.quantity}
            thicknesses={product.thicknesses}
            onChange={onChange}
          />

          <div>
            <p className="mb-2 text-sm font-semibold">Application</p>
            <div className="flex flex-wrap gap-2">
              {applications.map((app) => (
                <button
                  key={app}
                  type="button"
                  onClick={() => onChange({ application: app })}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
                    state.application === app
                      ? "bg-[var(--obx-orange)] text-white"
                      : "bg-[var(--obx-mist)] text-[var(--obx-charcoal)]",
                  )}
                >
                  {app}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--obx-green)] bg-[var(--obx-green-soft)] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--obx-green)]">
            Your Configuration
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Product" value={product.name} />
            <Row label="Finish" value={selectedFinish?.name ?? "—"} />
            <Row label="Colour" value={selectedColour?.name ?? "—"} />
            <Row label="Size" value={sizeLabel} />
            <Row label="Thickness" value={`${state.thickness}mm`} />
            <Row label="Quantity" value={String(state.quantity)} />
            <Row
              label="Estimated Price"
              value={formatPricePlaceholder(estimatedPrice)}
              emphasize
            />
          </dl>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" className="btn btn-primary" onClick={onAddToCart}>
              Add to Cart
            </button>
            <Link
              href={`/quote?product=${encodeURIComponent(product.name)}&dimensions=${encodeURIComponent(`${state.widthMm}×${state.heightMm}mm · ${state.thickness}mm`)}&quantity=${state.quantity}&config=${encodeURIComponent(`${selectedColour?.name} / ${selectedFinish?.name}`)}`}
              className="btn btn-secondary"
            >
              Request Custom Quote
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--obx-muted)]">{label}</dt>
      <dd
        className={cn(
          "font-semibold text-[var(--obx-ink)]",
          emphasize && "text-base text-[var(--obx-green)]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import type { ApplicationType, CustomizerState, MaterialType } from "@/lib/types";
import { ProductConfigurator } from "@/components/customizer/ProductConfigurator";
import { useCart } from "@/context/CartContext";

function defaultState(productId?: string | null): CustomizerState {
  const product =
    products.find((p) => p.id === productId) ?? products[0];
  return {
    productId: product.id,
    material: product.material,
    thickness: product.thicknesses.includes(18) ? 18 : product.thicknesses[0],
    sizeId: product.sizes[0].id,
    colourId: product.colours[0],
    finishId: product.finishes[0],
    widthMm: Math.round(product.sizes[0].widthFt * 304.8) || 2438,
    heightMm: Math.round(product.sizes[0].heightFt * 304.8) || 1219,
    quantity: 6,
    application: product.applications[0],
  };
}

function CustomizeContent() {
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const [state, setState] = useState<CustomizerState>(() =>
    defaultState(searchParams.get("productId")),
  );
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const productId = searchParams.get("productId");
    const next = defaultState(productId);
    const colourId = searchParams.get("colourId");
    const finishId = searchParams.get("finishId");
    const thickness = searchParams.get("thickness");
    const sizeId = searchParams.get("sizeId");
    const quantity = searchParams.get("quantity");
    const application = searchParams.get("application");
    const material = searchParams.get("material");

    setState({
      ...next,
      ...(colourId ? { colourId } : {}),
      ...(finishId ? { finishId } : {}),
      ...(thickness ? { thickness: Number(thickness) } : {}),
      ...(sizeId ? { sizeId } : {}),
      ...(quantity ? { quantity: Number(quantity) } : {}),
      ...(application
        ? { application: application as ApplicationType }
        : {}),
      ...(material ? { material: material as MaterialType } : {}),
    });
  }, [searchParams]);

  const product = products.find((p) => p.id === state.productId) ?? products[0];

  return (
    <div className="bg-[var(--obx-cream)]">
      <section className="border-b border-[var(--obx-line)] bg-white py-12">
        <div className="container-obx">
          <p className="section-label">Customizer</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold md:text-5xl">
            Customize Your OBASIX Board
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--obx-muted)]">
            Configure product, colour, finish and dimensions with a live preview.
            Pricing stays dynamic-ready for your backend.
          </p>
        </div>
      </section>

      <div className="container-obx py-10 md:py-14">
        {added && (
          <div className="mb-6 rounded-[var(--radius-md)] border border-[var(--obx-green)] bg-[var(--obx-green-soft)] px-4 py-3 text-sm font-medium text-[var(--obx-green)]">
            Configuration added to your setup cart.
          </div>
        )}
        <ProductConfigurator
          products={products}
          state={state}
          onChange={(next) => setState((prev) => ({ ...prev, ...next }))}
          estimatedPrice={undefined}
          onAddToCart={() => {
            addItem(
              product.id,
              {
                colourId: state.colourId,
                finishId: state.finishId,
                thickness: state.thickness,
                sizeId: state.sizeId,
                customWidthMm: state.widthMm,
                customHeightMm: state.heightMm,
                application: state.application,
              },
              state.quantity,
            );
            setAdded(true);
            window.setTimeout(() => setAdded(false), 2500);
          }}
        />
      </div>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={<div className="container-obx py-20">Loading customizer...</div>}>
      <CustomizeContent />
    </Suspense>
  );
}

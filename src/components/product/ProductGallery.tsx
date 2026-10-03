"use client";

import Image from "next/image";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/format";

interface ProductGalleryProps {
  images: string[];
  alt: string;
  finishPreviewHex?: string;
}

export function ProductGallery({
  images,
  alt,
  finishPreviewHex,
}: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-[var(--obx-stone)]",
          zoomed && "cursor-zoom-out",
        )}
        onClick={() => setZoomed((v) => !v)}
      >
        <Image
          src={images[active]}
          alt={alt}
          fill
          className={cn(
            "object-cover transition duration-500",
            zoomed ? "scale-150" : "scale-100",
          )}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[var(--obx-ink)] backdrop-blur">
          <Search size={12} /> Click to zoom
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={image + index}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-[var(--radius-md)] border-2",
              active === index
                ? "border-[var(--obx-green)]"
                : "border-transparent",
            )}
          >
            <Image src={image} alt="" fill className="object-cover" sizes="120px" />
          </button>
        ))}
        {finishPreviewHex && (
          <div
            className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[var(--obx-line)] board-preview"
            style={{ backgroundColor: finishPreviewHex }}
            title="Finish preview"
          >
            <span className="absolute inset-x-0 bottom-0 bg-black/40 py-1 text-center text-[10px] font-semibold text-white">
              Finish
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

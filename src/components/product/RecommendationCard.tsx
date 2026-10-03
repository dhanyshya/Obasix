import Image from "next/image";
import Link from "next/link";
import type { Accessory, Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

interface RecommendationCardProps {
  item: Product | Accessory;
  href?: string;
  subtitle?: string;
}

export function RecommendationCard({ item, href, subtitle }: RecommendationCardProps) {
  const image = "images" in item ? item.images[0] : item.image;
  const price = "startingPrice" in item ? item.startingPrice : item.price;
  const link = href ?? ("slug" in item ? `/products/${item.id}` : "/cart");

  return (
    <Link
      href={link}
      className="group flex gap-3 rounded-[var(--radius-md)] border border-[var(--obx-line)] bg-white p-3 transition hover:border-[var(--obx-green)] hover:shadow-[var(--shadow-sm)]"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--obx-stone)]">
        <Image src={image} alt={item.name} fill className="object-cover" sizes="64px" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-[var(--obx-ink)] group-hover:text-[var(--obx-green)]">
          {item.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--obx-muted)]">
          {subtitle ?? item.description.slice(0, 80)}
        </p>
        <p className="mt-1 text-sm font-bold">{formatPrice(price)}</p>
      </div>
    </Link>
  );
}

import type { MetadataRoute } from "next";
import { getAllProducts } from "@/data/catalogue";
import { getVisibleSolutions } from "@/data/solutions";
import { wallModels } from "@/data/wallModels";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPaths = ["", "/products", "/customize", "/signage", "/signage/design", "/associates", "/distributors", "/partners", "/oem", "/visualize", "/smart-space", "/solutions", "/kits", "/kits/workplace", "/kits/education", "/kits/residential", "/materials", "/materials/glass", "/materials/felt", "/materials/fabric", "/materials/cork", "/materials/acoustic", "/premium", "/planning", "/quote", "/about", "/orders/track"];
  return [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}`, lastModified: now, priority: path === "" ? 1 : 0.7 })),
    ...getAllProducts().map((product) => ({ url: `${siteUrl}/products/${product.id}`, lastModified: now, priority: 0.8 })),
    ...getVisibleSolutions().map((solution) => ({ url: `${siteUrl}/solutions/${solution.id}`, lastModified: now, priority: 0.6 })),
    ...wallModels.map((wall) => ({ url: `${siteUrl}/visualize/${wall.id}`, lastModified: now, priority: 0.4 })),
  ];
}

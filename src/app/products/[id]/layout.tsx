import type { Metadata } from "next";
import { getAllProducts, getProductById } from "@/data/catalogue";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return getAllProducts().map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return { title: "Product not found" };
  const image = product.images[0];
  return {
    title: `${product.shortName} (${product.sku})`,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductLayout({ children, params }: LayoutProps<"/products/[id]">) {
  const { id } = await params;
  const product = getProductById(id);
  // Structured data uses only catalogue fields; availability is not claimed because stock is not tracked.
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        sku: product.sku,
        description: product.description,
        brand: { "@type": "Brand", name: "OBASIX" },
        image: product.images.map((src) => (src.startsWith("http") ? src : `${siteUrl}${src}`)),
        offers: {
          "@type": "Offer",
          priceCurrency: product.currency,
          price: product.price,
          url: `${siteUrl}/products/${product.id}`,
        },
      }
    : null;
  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          // JSON.stringify output with "<" escaped cannot break out of the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      ) : null}
      {children}
    </>
  );
}

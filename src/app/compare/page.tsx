"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { defaultCartConfiguration } from "@/lib/productActions";
import { frames, getProductById, getProductCategoryLabel } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

type Row = { label: string; value: (p: Product) => string };

const baseRows: Row[] = [
  { label: "Price", value: (p) => (p.price > 0 ? formatPrice(p.price) : "On quote") },
  { label: "MRP", value: (p) => (p.compareAtPrice ? formatPrice(p.compareAtPrice) : "—") },
  { label: "Product code", value: (p) => p.sku },
  { label: "Category", value: (p) => getProductCategoryLabel(p) },
  { label: "Series", value: (p) => (p.series ? p.series[0].toUpperCase() + p.series.slice(1) : "—") },
  { label: "Surface", value: (p) => p.surface.replace(/-/g, " ") },
  { label: "Magnetic", value: (p) => (p.magnetic ? "Yes" : "No") },
  { label: "Frame", value: (p) => frames.find((f) => f.id === p.frame)?.name ?? p.frame.replace(/-/g, " ") },
  { label: "Sizes", value: (p) => p.sizes.map((s) => s.label).join(", ") || "—" },
  { label: "Customisable", value: (p) => (p.customizable ? "Yes, via Design Your Board" : "No") },
  { label: "Suited to", value: (p) => p.applications.map((a) => a.replace(/-/g, " ")).join(", ") },
  { label: "Features", value: (p) => p.features.join(" · ") },
];

export default function ComparePage() {
  const { ids, remove, clear } = useCompare();
  const { addItem } = useCart();
  const products = ids.map((id) => getProductById(id)).filter((p): p is Product => Boolean(p));

  // Specification keys present on any compared product, excluding fields already shown above.
  const shown = new Set(["SKU", "Series", "Size", "Surface", "Frame", "Magnetic"]);
  const specKeys = [...new Set(products.flatMap((p) => Object.keys(p.specifications ?? {})))].filter((k) => !shown.has(k));
  const rows: Row[] = [...baseRows, ...specKeys.map((key) => ({ label: key, value: (p: Product) => p.specifications?.[key] ?? "—" }))];

  return (
    <>
    <PageMasthead
      code="Compare"
      title="Compare boards"
      lede="Side by side, from the OBASIX catalogue. Values that differ are highlighted."
      crumbs={[{ href: "/products", label: "Collections" }, { label: "Compare" }]}
      compact
    >
      {products.length ? (
        <Box sx={{ display: "flex", justifyContent: { md: "flex-end" } }}>
          <Button onClick={clear} variant="outlined" sx={{ "&&": { color: "#fff", borderColor: "rgba(255,255,255,0.5)", bgcolor: "transparent" } }}>
            Clear all
          </Button>
        </Box>
      ) : null}
    </PageMasthead>
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 }, px: { xs: 2, sm: 3 } }}>

      {products.length < 2 ? (
        <Box sx={{ mt: 5, p: { xs: 3, md: 5 }, border: 1, borderColor: "divider", textAlign: "center", bgcolor: "background.paper" }}>
          <Typography sx={{ fontWeight: 600 }}>
            {products.length === 0 ? "No products selected yet." : "Add one more product to compare."}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Use the Compare button on any product card or product page. You can compare up to four.
          </Typography>
          <Button variant="contained" component={Link} href="/products" sx={{ mt: 3 }}>
            Browse products
          </Button>
        </Box>
      ) : null}

      {products.length ? (
        <Box sx={{ mt: 4, overflowX: "auto", border: 1, borderColor: "divider", borderRadius: 0 }} tabIndex={0} aria-label="Comparison table, scroll sideways on small screens">
          <Box component="table" sx={{ width: "100%", minWidth: 180 + products.length * 200, borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                <Box component="th" scope="col" sx={{ width: 160, p: 2, textAlign: "left", position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 1 }}>
                  <span className="sr-only">Attribute</span>
                </Box>
                {products.map((p) => (
                  <Box component="th" scope="col" key={p.id} sx={{ p: 2, textAlign: "left", verticalAlign: "top", fontWeight: 400 }}>
                    <Box sx={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 0, overflow: "hidden", bgcolor: "primary.light" }}>
                      {p.images[0] ? <Image src={p.images[0]} alt="" fill sizes="220px" style={{ objectFit: "cover" }} /> : null}
                      <IconButton
                        size="small"
                        aria-label={`Remove ${p.shortName}`}
                        onClick={() => remove(p.id)}
                        sx={{ position: "absolute", top: 6, right: 6, bgcolor: "rgba(255,255,255,0.95)", "&:hover": { bgcolor: "#fff" } }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography component={Link} href={`/products/${p.id}`} sx={{ display: "block", mt: 1.25, fontWeight: 600, color: "text.primary", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                      {p.shortName}
                    </Typography>
                    {p.price > 0 ? (
                      <Button size="small" variant="contained" sx={{ mt: 1.25 }} onClick={() => addItem(p.id, defaultCartConfiguration(p), 1)}>
                        Add to cart
                      </Button>
                    ) : (
                      <Button size="small" variant="outlined" sx={{ mt: 1.25 }} component={Link} href={`/quote?product=${encodeURIComponent(p.shortName)}`}>
                        Request quote
                      </Button>
                    )}
                  </Box>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const values = products.map((p) => row.value(p));
                const differs = new Set(values).size > 1;
                return (
                  <Box component="tr" key={row.label} sx={{ borderTop: 1, borderColor: "divider" }}>
                    <Box component="th" scope="row" sx={{ p: 2, textAlign: "left", fontWeight: 600, color: "text.secondary", position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 1 }}>
                      {row.label}
                    </Box>
                    {values.map((value, index) => (
                      <Box component="td" key={products[index].id} sx={{ p: 2, verticalAlign: "top", textTransform: row.label === "Surface" || row.label === "Suited to" ? "capitalize" : undefined, bgcolor: differs ? "rgba(22,78,59,0.04)" : undefined }}>
                        {value}
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </tbody>
          </Box>
        </Box>
      ) : null}
    </Container>
    </>
  );
}

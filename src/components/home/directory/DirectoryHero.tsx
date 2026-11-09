"use client";

import Image from "next/image";
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { ProductActions } from "@/components/product/ProductActions";
import { getProductById, spaces } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";
import { Roundel, SignArrow, pageMax, pagePad, signType } from "./sign";

/** The lobby directory: pick a space, the panel shows the board OBASIX recommends for it. */
export function DirectoryHero() {
  const zones = spaces.filter((space) => getProductById(space.recommendedProductIds[0]));
  const [active, setActive] = useState(zones[0]?.id);
  const zone = zones.find((z) => z.id === active) ?? zones[0];
  const product = zone ? getProductById(zone.recommendedProductIds[0]) : undefined;
  const alsoFor = zone ? zone.recommendedProductIds.slice(1, 4).map((id) => getProductById(id)).filter(Boolean) : [];

  return (
    <Box component="section" aria-labelledby="directory-title" sx={{ bgcolor: brand.forestDeep, color: brand.white, position: "relative" }}>
      <Box
        sx={{
          ...pageMax,
          ...pagePad,
          pt: { xs: 4, md: 7 },
          pb: { xs: 0, md: 8 },
          display: "grid",
          gap: { xs: 4, md: 5, lg: 7 },
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.25fr) minmax(0, 1fr)" },
          alignItems: "stretch",
        }}
      >
        {/* Directory board */}
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Typography id="directory-title" component="h1" sx={{ ...signType.mega, color: brand.white, maxWidth: "11ch", textWrap: "balance" }}>
            Every space has a board.
          </Typography>
          <Typography sx={{ mt: { xs: 2, md: 2.5 }, maxWidth: 520, color: "rgba(255,255,255,0.82)", fontSize: { xs: 16, md: 18 }, lineHeight: 1.6 }}>
            Whiteboards, notice boards and stands, made by OBASIX in Delhi. Choose where it will hang.
          </Typography>

          <Box
            role="group"
            aria-label="Choose a space"
            component="ul"
            sx={{
              listStyle: "none",
              m: 0,
              p: 0,
              mt: { xs: 3, md: 5 },
              mx: { xs: -2, sm: 0 },
              px: { xs: 2, sm: 0 },
              borderTop: { sm: "2px solid rgba(255,255,255,0.22)" },
              display: { xs: "flex", sm: "grid" },
              gap: { xs: 1, sm: 0 },
              overflowX: { xs: "auto", sm: "visible" },
              scrollSnapType: { xs: "x mandatory", sm: "none" },
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              gridTemplateColumns: { sm: "1fr 1fr" },
              columnGap: { sm: 4 },
            }}
          >
            {zones.map((space, index) => {
              const on = space.id === zone?.id;
              return (
                <Box
                  component="li"
                  key={space.id}
                  sx={{
                    flexShrink: 0,
                    scrollSnapAlign: "start",
                    borderBottom: { sm: "1px solid rgba(255,255,255,0.16)" },
                    outline: { xs: `1px solid ${on ? brand.signal : "rgba(255,255,255,0.28)"}`, sm: "none" },
                    outlineOffset: -1,
                    px: { xs: 1.25, sm: 0 },
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    aria-pressed={on}
                    onClick={() => setActive(space.id)}
                    sx={{
                      all: "unset",
                      boxSizing: "border-box",
                      cursor: "pointer",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.75,
                      py: { xs: 1.35, md: 1.6 },
                      color: on ? brand.white : "rgba(255,255,255,0.78)",
                      transition: "color 200ms cubic-bezier(0.16,1,0.3,1)",
                      "&:hover": { color: brand.white },
                      "&:focus-visible": { outline: `3px solid ${brand.signal}`, outlineOffset: 2 },
                    }}
                  >
                    <Roundel active={on}>{String(index + 1).padStart(2, "0")}</Roundel>
                    <Box component="span" sx={{ ...signType.plate, fontSize: { xs: 17, sm: 20, md: 23 }, flex: 1, whiteSpace: "nowrap" }}>
                      {space.name}
                    </Box>
                    <SignArrow
                      sx={{ display: { xs: "none", sm: "block" }, transition: "transform 240ms cubic-bezier(0.16,1,0.3,1)", transform: on ? "translateX(0)" : "translateX(-6px)" }}
                      size={22}
                      color={on ? brand.signal : "rgba(255,255,255,0.45)"}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Destination panel: enamel plate with the recommended board */}
        {zone && product ? (
          <Box
            aria-live="polite"
            sx={{
              bgcolor: brand.white,
              color: brand.charcoal,
              display: "flex",
              flexDirection: "column",
              mx: { xs: -2, sm: 0 },
              boxShadow: { md: "0 30px 60px -20px rgba(0,0,0,0.45)" },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, px: { xs: 2, md: 3 }, py: 1.5, bgcolor: brand.signal, color: brand.charcoal }}>
              <Typography sx={{ ...signType.plate, fontSize: 17 }}>For the {zone.name.toLowerCase()}</Typography>
              <Box component={Link} href={`/products?space=${zone.id}`} sx={{ ...signType.plate, fontSize: 14, color: brand.charcoal, display: "inline-flex", alignItems: "center", gap: 0.75, textDecoration: "underline", textUnderlineOffset: 4, "&:focus-visible": { outline: `2px solid ${brand.charcoal}`, outlineOffset: 2 } }}>
                All boards for this space
              </Box>
            </Box>

            <Box
              key={zone.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                "@media (prefers-reduced-motion: no-preference)": {
                  animation: "obxWipe 520ms cubic-bezier(0.16,1,0.3,1) both",
                },
                "@keyframes obxWipe": {
                  from: { clipPath: "inset(0 0 0 100%)", opacity: 0.4 },
                  to: { clipPath: "inset(0 0 0 0)", opacity: 1 },
                },
              }}
            >
              <Box component={Link} href={`/products/${product.id}`} aria-label={product.name} sx={{ position: "relative", display: "block", aspectRatio: { xs: "16 / 10", md: "16 / 11" }, bgcolor: brand.white, borderBottom: `1px solid ${brand.line}` }}>
                {product.images[0] ? (
                  <Image src={product.images[0]} alt="" fill priority sizes="(max-width: 900px) 100vw, 44vw" style={{ objectFit: "contain", padding: "6%" }} />
                ) : null}
              </Box>
              <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.25, pb: { xs: 3, md: 3 }, display: "flex", flexDirection: "column", gap: 1.25, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ ...signType.code, fontSize: 12.5, color: brand.forest }}>{product.sku}</Typography>
                  <Typography sx={{ ...signType.code, fontSize: 12.5, color: brand.muted }}>{product.sizes.map((s) => s.label).join(" · ")}</Typography>
                </Box>
                <Typography component={Link} href={`/products/${product.id}`} sx={{ ...signType.plate, fontSize: { xs: 22, md: 26 }, color: brand.charcoal, "&:hover": { textDecoration: "underline", textUnderlineOffset: 4 } }}>
                  {product.shortName}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25 }}>
                  <Typography sx={{ ...signType.plate, fontSize: 26, fontVariantNumeric: "tabular-nums", color: brand.charcoal }}>
                    {product.price > 0 ? formatPrice(product.price) : "On quote"}
                  </Typography>
                  {product.compareAtPrice ? (
                    <Typography component="s" sx={{ fontSize: 15, color: brand.muted }}>
                      {formatPrice(product.compareAtPrice)}
                    </Typography>
                  ) : null}
                </Box>
                <Box sx={{ mt: "auto", pt: 1 }}>
                  <ProductActions product={product} variant="card" />
                </Box>
                {alsoFor.length ? (
                  <Typography sx={{ fontSize: 13.5, color: brand.body, pt: 0.5 }}>
                    Also for this space:{" "}
                    {alsoFor.map((p, i) => (
                      <span key={p!.id}>
                        <Box component={Link} href={`/products/${p!.id}`} sx={{ color: brand.forest, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
                          {p!.shortName}
                        </Box>
                        {i < alsoFor.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

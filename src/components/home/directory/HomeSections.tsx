import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { ProductCard } from "@/components/product/ProductCard";
import { categoryCards, getAllProducts, getFeaturedProducts } from "@/data/catalogue";
import { company } from "@/data/company";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";
import { SignArrow, SignTick, pageMax, pagePad, signType } from "./sign";

/** Dense band of real product codes: the catalogue as the proof. */
export function CodeBand() {
  const boards = getAllProducts().filter((p) => p.price > 0 && !["accessory", "desk-accessory"].includes(p.category));
  return (
    <Box component="section" aria-label="Product codes" sx={{ bgcolor: brand.charcoal, color: brand.white, borderTop: `3px solid ${brand.signal}` }}>
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 2, md: 2.5 }, display: "flex", gap: { xs: 2, md: 4 }, alignItems: "center" }}>
        <Typography sx={{ ...signType.plate, fontSize: { xs: 13, md: 14 }, color: brand.signal, flexShrink: 0, maxWidth: { xs: 90, md: "none" } }}>
          {boards.length} boards, by code
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: { xs: 2.5, md: 3.5 },
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            maskImage: "linear-gradient(90deg, #000 85%, transparent)",
          }}
          tabIndex={0}
          aria-label="Scroll product codes"
        >
          {boards.map((p) => (
            <Box
              key={p.id}
              component={Link}
              href={`/products/${p.id}`}
              sx={{
                ...signType.code,
                fontSize: 13,
                whiteSpace: "nowrap",
                color: "rgba(255,255,255,0.78)",
                py: 0.5,
                "&:hover": { color: brand.white },
                "&:focus-visible": { outline: `2px solid ${brand.signal}`, outlineOffset: 2 },
              }}
            >
              {p.sku} <Box component="span" sx={{ color: "rgba(255,255,255,0.5)" }}>{p.sizes[0]?.label}</Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/** The range, listed like a floor directory: name, count, entry price. */
export function RangeDirectory() {
  const all = getAllProducts();
  const rows = categoryCards
    .map((card) => {
      const items = all.filter((p) => p.category === card.category);
      const priced = items.filter((p) => p.price > 0).map((p) => p.price);
      return { ...card, count: items.length, from: priced.length ? Math.min(...priced) : null };
    })
    .filter((row) => row.count > 0);

  return (
    <Box component="section" aria-labelledby="range-title" sx={{ bgcolor: brand.white }}>
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 8, md: 12 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 3, flexWrap: "wrap" }}>
          <Typography id="range-title" component="h2" sx={{ ...signType.title, color: brand.charcoal, maxWidth: "14ch" }}>
            The range, floor by floor.
          </Typography>
          <Box component={Link} href="/products" sx={{ ...signType.plate, fontSize: 17, color: brand.charcoal, display: "inline-flex", alignItems: "center", gap: 1, borderBottom: `3px solid ${brand.signal}`, pb: 0.5, "&:hover": { color: brand.forest } }}>
            Browse all products <SignArrow size={20} />
          </Box>
        </Box>

        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mt: { xs: 4, md: 6 }, borderTop: `3px solid ${brand.charcoal}` }}>
          {rows.map((row) => (
            <Box component="li" key={row.id} sx={{ borderBottom: `1px solid ${brand.line}` }}>
              <Box
                component={Link}
                href={row.href}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "72px 1fr auto", md: "120px 1.2fr 1.4fr auto auto" },
                  alignItems: "center",
                  gap: { xs: 2, md: 4 },
                  py: { xs: 1.75, md: 2.25 },
                  color: brand.charcoal,
                  position: "relative",
                  transition: "background-color 220ms cubic-bezier(0.16,1,0.3,1)",
                  "&:hover": { bgcolor: brand.ivory },
                  "&:hover .rd-arrow": { color: brand.action, transform: "translateX(4px)" },
                  "&:focus-visible": { outline: `3px solid ${brand.signal}`, outlineOffset: -3 },
                }}
              >
                <Box sx={{ position: "relative", width: { xs: 72, md: 120 }, aspectRatio: "4 / 3", bgcolor: brand.ivory }}>
                  <Image src={row.image} alt="" fill sizes="120px" style={{ objectFit: "contain", padding: "8%" }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography component="h3" sx={{ ...signType.plate, fontSize: { xs: 18, md: 26 } }}>
                    {row.name}
                  </Typography>
                  <Typography sx={{ display: { xs: "block", md: "none" }, fontSize: 13, color: brand.muted, mt: 0.25 }}>
                    {row.count} products{row.from ? ` · from ${formatPrice(row.from)}` : ""}
                  </Typography>
                </Box>
                <Typography sx={{ display: { xs: "none", md: "block" }, fontSize: 15, color: brand.body, lineHeight: 1.55 }}>
                  {row.description}
                </Typography>
                <Typography sx={{ display: { xs: "none", md: "block" }, ...signType.code, fontSize: 14, color: brand.body, textAlign: "right", whiteSpace: "nowrap" }}>
                  {row.count} · {row.from ? `from ${formatPrice(row.from)}` : "on quote"}
                </Typography>
                <Box className="rd-arrow" sx={{ color: brand.charcoal, transition: "transform 220ms cubic-bezier(0.16,1,0.3,1), color 220ms" }}>
                  <SignArrow size={24} />
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export function Bestsellers() {
  const featured = getFeaturedProducts().slice(0, 4);
  return (
    <Box component="section" aria-labelledby="best-title" sx={{ bgcolor: brand.ivory }}>
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 8, md: 12 } }}>
        <Typography id="best-title" component="h2" sx={{ ...signType.title, color: brand.charcoal, maxWidth: "16ch" }}>
          Popular boards for offices and schools.
        </Typography>
        <Box
          sx={{
            mt: { xs: 4, md: 6 },
            display: "grid",
            gap: { xs: 2, md: 3 },
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
          }}
        >
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/** The maker: verified facts only (docs/official-website-audit.md). */
export function Maker() {
  const factory = company.locations.find((l) => l.label === "Factory");
  const facts = [
    { k: "Made at", v: factory?.address ?? "" },
    { k: "Government buyers", v: "Registered OEM on GeM" },
    { k: "Frames", v: "Light and heavy aluminium, natural finesse, pine wood, powder-coated black" },
    { k: "Surfaces", v: "Resin-coated magnetic, melamine, ceramic steel and fabric pin-up" },
  ];
  return (
    <Box component="section" aria-labelledby="maker-title" sx={{ bgcolor: brand.forest, color: brand.white }}>
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 8, md: 12 }, display: "grid", gap: { xs: 5, md: 8 }, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Box>
          <Typography id="maker-title" component="h2" sx={{ ...signType.title, color: brand.white, maxWidth: "13ch" }}>
            Made in Delhi, at our own factory.
          </Typography>
          <Typography sx={{ mt: 3, maxWidth: 520, color: "rgba(255,255,255,0.84)", fontSize: 17, lineHeight: 1.65 }}>
            OBASIX boards are made at our factory in Bawana, Delhi. Bulk, branded and non-standard sizes are quoted
            directly by our team.
          </Typography>
          <Box sx={{ mt: 4, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Box component={Link} href="/quote" sx={{ ...signType.plate, fontSize: 16, display: "inline-flex", alignItems: "center", gap: 1, bgcolor: brand.action, color: brand.white, px: 3, minHeight: 52, "&:hover": { bgcolor: brand.actionDark }, "&:focus-visible": { outline: `3px solid ${brand.signal}`, outlineOffset: 3 } }}>
              Request a bulk quote <SignArrow size={18} />
            </Box>
            <Box component="a" href={`tel:${company.phone}`} sx={{ ...signType.plate, fontSize: 16, display: "inline-flex", alignItems: "center", border: "2px solid rgba(255,255,255,0.6)", color: brand.white, px: 3, minHeight: 52, "&:hover": { borderColor: brand.white }, "&:focus-visible": { outline: `3px solid ${brand.signal}`, outlineOffset: 3 } }}>
              Call {company.phoneDisplay}
            </Box>
          </Box>
        </Box>
        <Box component="dl" sx={{ m: 0, borderTop: "2px solid rgba(255,255,255,0.35)" }}>
          {facts.map((fact) => (
            <Box key={fact.k} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "180px 1fr" }, gap: { xs: 0.5, sm: 3 }, py: 2.25, borderBottom: "1px solid rgba(255,255,255,0.18)" }}>
              <Box component="dt" sx={{ ...signType.code, fontSize: 13, color: "#FFC59E", textTransform: "uppercase" }}>
                {fact.k}
              </Box>
              <Box component="dd" sx={{ m: 0, fontSize: 17, color: brand.white, lineHeight: 1.5, display: "flex", gap: 1.25, alignItems: "flex-start" }}>
                <Box sx={{ mt: 0.4 }}>
                  <SignTick size={16} color={brand.white} />
                </Box>
                {fact.v}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/** Closing wayfinding signs: the three tools, each a full-width sign with a destination. */
export function Wayfinding() {
  const signs = [
    { href: "/customize", title: "Design your own board", line: "Size, frame, finish, logo and combination layouts, then add to cart or quote." },
    { href: "/visualize", title: "See it on your wall", line: "Place a board on a photo of your wall and see how it fits." },
    { href: "/compare", title: "Compare side by side", line: "Surface, frame, sizes and price for up to four boards." },
  ];
  return (
    <Box component="section" aria-label="Plan your board" sx={{ bgcolor: brand.white }}>
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 6, md: 9 } }}>
        {signs.map((sign, index) => (
          <Box
            key={sign.href}
            component={Link}
            href={sign.href}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr auto", md: "1.1fr 1fr auto" },
              alignItems: "center",
              gap: { xs: 2, md: 4 },
              py: { xs: 3, md: 4 },
              borderTop: index === 0 ? `3px solid ${brand.charcoal}` : `1px solid ${brand.line}`,
              borderBottom: index === signs.length - 1 ? `1px solid ${brand.line}` : undefined,
              color: brand.charcoal,
              "& .wf-arrow": { transition: "transform 260ms cubic-bezier(0.16,1,0.3,1), background-color 200ms" },
              "&:hover .wf-arrow": { transform: "translateX(6px)", bgcolor: brand.action },
              "&:focus-visible": { outline: `3px solid ${brand.signal}`, outlineOffset: -3 },
            }}
          >
            <Typography component="h3" sx={{ ...signType.plate, fontSize: { xs: 26, md: 40 }, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {sign.title}
            </Typography>
            <Typography sx={{ display: { xs: "none", md: "block" }, fontSize: 16, color: brand.body, lineHeight: 1.55 }}>{sign.line}</Typography>
            <Box className="wf-arrow" sx={{ width: { xs: 48, md: 64 }, height: { xs: 48, md: 64 }, bgcolor: brand.forest, color: brand.white, display: "grid", placeItems: "center" }}>
              <SignArrow size={26} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

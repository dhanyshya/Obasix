"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import NextLink from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductActions } from "@/components/product/ProductActions";
import { ProductQuickView } from "@/components/product/ProductQuickView";
import { Roundel, SignArrow, StripeSpine, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { getProductCategoryLabel } from "@/data/catalogue";
import { getSolutionProducts, getVisibleSolutions, type SolutionFocus } from "@/data/solutions";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { brandTokens as brand } from "@/theme/brandTokens";

type SolutionView = {
  id: string;
  name: string;
  headline: string;
  summary: string;
  image: string;
  focuses: SolutionFocus[];
};

type SolutionFilter =
  | "all"
  | "whiteboards"
  | "ceramic"
  | "notice"
  | "combination"
  | "wooden"
  | "stands"
  | "accessories";

const filterOptions: { id: SolutionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "whiteboards", label: "Whiteboards" },
  { id: "ceramic", label: "Ceramic Boards" },
  { id: "notice", label: "Notice Boards" },
  { id: "combination", label: "Combination Boards" },
  { id: "wooden", label: "Wooden Products" },
  { id: "stands", label: "Stands" },
  { id: "accessories", label: "Accessories" },
];

function matchesFocus(product: Product, focusId: string) {
  if (focusId === "all") return true;
  if (focusId === "meeting-rooms") return product.applications.includes("meeting-room");
  if (focusId === "workspaces") {
    return (
      product.category !== "stand" &&
      product.category !== "accessory" &&
      product.category !== "desk-accessory"
    );
  }
  if (focusId === "collaboration") {
    return (
      product.applications.includes("meeting-room") &&
      (product.category === "magnetic-whiteboard" ||
        product.category === "combination-board" ||
        product.category === "non-magnetic-whiteboard")
    );
  }
  return true;
}

function customizeApplication(solutionId: string) {
  if (solutionId === "training-room") return "training-room";
  if (solutionId === "collaboration") return "meeting-room";
  return solutionId;
}

function matchesFilter(product: Product, filter: SolutionFilter) {
  if (filter === "all") return true;
  if (filter === "whiteboards") {
    return product.category === "magnetic-whiteboard" || product.category === "non-magnetic-whiteboard";
  }
  if (filter === "ceramic") return product.surface === "ceramic-steel";
  if (filter === "notice") {
    return product.category === "notice-board" || product.category === "pin-up-board";
  }
  if (filter === "combination") return product.category === "combination-board";
  if (filter === "wooden") return product.category === "wooden-product";
  if (filter === "stands") return product.category === "stand";
  if (filter === "accessories") {
    return product.category === "accessory" || product.category === "desk-accessory";
  }
  return true;
}

const peach = "#FFC59E";

const ghostButtonSx = {
  "&&": { color: brand.white, borderColor: "rgba(255,255,255,0.5)", bgcolor: "transparent" },
  "&&:hover": { borderColor: brand.white, bgcolor: "rgba(255,255,255,0.08)" },
} as const;

/** Filter tab: plate with an orange underline when selected. */
const tabSx = (selected: boolean) => ({
  all: "unset" as const,
  boxSizing: "border-box" as const,
  cursor: "pointer",
  flexShrink: 0,
  whiteSpace: "nowrap" as const,
  px: 1.75,
  py: 1.25,
  ...signType.plate,
  fontSize: 15,
  color: selected ? brand.charcoal : brand.body,
  boxShadow: selected ? `inset 0 -3px 0 ${brand.signal}` : "inset 0 -3px 0 transparent",
  transition: "color 160ms, box-shadow 200ms cubic-bezier(0.16,1,0.3,1)",
  "&:hover": { color: brand.charcoal, boxShadow: selected ? `inset 0 -3px 0 ${brand.signal}` : `inset 0 -3px 0 ${brand.line}` },
  "&:focus-visible": { outline: `3px solid ${brand.signal}`, outlineOffset: -3 },
});

export function SolutionExperience({ solution }: { solution: SolutionView }) {
  const products = useMemo(() => getSolutionProducts(solution.id), [solution.id]);
  const focuses = solution.focuses.filter(
    (item) => item.id === "all" || products.some((product) => matchesFocus(product, item.id)),
  );
  const [focus, setFocus] = useState(focuses[0]?.id ?? "all");
  const [filter, setFilter] = useState<SolutionFilter>("all");
  const [quick, setQuick] = useState<Product | null>(null);
  const focused = products.filter((product) => matchesFocus(product, focus));
  const filters = filterOptions.filter(
    (item) => item.id === "all" || focused.some((product) => matchesFilter(product, item.id)),
  );
  const visible = focused.filter((product) => matchesFilter(product, filter));
  const showCategoryFilters = filters.length > 2;
  const [lead, ...rest] = visible;
  const others = getVisibleSolutions().filter((s) => s.id !== solution.id);
  const application = customizeApplication(solution.id);

  return (
    <Box sx={{ overflowX: "clip", bgcolor: brand.ivory }}>
      {/* 1. Full-bleed room photograph with the space's sign */}
      <Box component="section" aria-labelledby="solution-hero-heading" sx={{ position: "relative", bgcolor: brand.forestDeep, color: brand.white, minHeight: { xs: 520, md: 620 }, display: "flex", alignItems: "flex-end" }}>
        <Image src={solution.image} alt={`${solution.name} interior`} fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        <Box aria-hidden sx={{ position: "absolute", inset: 0, background: { xs: "linear-gradient(to top, rgba(11,46,34,0.96) 30%, rgba(11,46,34,0.35) 100%)", md: "linear-gradient(90deg, rgba(11,46,34,0.95) 0%, rgba(11,46,34,0.8) 38%, rgba(11,46,34,0.05) 75%)" } }} />
        <Box sx={{ ...pageMax, ...pagePad, position: "relative", width: "100%", pt: { xs: 14, md: 10 }, pb: { xs: 5, md: 8 } }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: "flex", alignItems: "center", gap: 1, ...signType.code, fontSize: 12.5 }}>
            <Box component={NextLink} href="/solutions" sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: brand.white, textDecoration: "underline" } }}>Spaces</Box>
            <SignArrow size={12} color="rgba(255,255,255,0.5)" />
            <Box component="span" aria-current="page" sx={{ color: brand.white }}>{solution.name}</Box>
          </Box>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, mt: 3 }}>
            <Box aria-hidden sx={{ width: 10, height: 10, bgcolor: brand.signal }} />
            <Typography sx={{ ...signType.code, fontSize: 13, color: peach, textTransform: "uppercase" }}>
              {solution.name} · {products.length} {products.length === 1 ? "product" : "products"}
            </Typography>
          </Box>
          <Typography id="solution-hero-heading" component="h1" sx={{ ...signType.mega, mt: 2, color: brand.white, maxWidth: "13ch", textWrap: "balance" }}>
            {solution.headline}
          </Typography>
          <Typography sx={{ mt: 2.5, maxWidth: 520, color: "rgba(255,255,255,0.85)", fontSize: { xs: 16, md: 18 }, lineHeight: 1.6 }}>
            {solution.summary}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 4 }}>
            <Button component={NextLink} href="#space-products" variant="contained" size="large" endIcon={<SignArrow size={18} />}>
              See the boards
            </Button>
            <Button component={NextLink} href={`/customize?application=${application}`} variant="outlined" size="large" sx={ghostButtonSx}>
              Design for this space
            </Button>
          </Box>
        </Box>
      </Box>
      <StripeSpine height={6} />

      {/* 2. Focus directory: what the room is for */}
      {focuses.length > 1 ? (
        <Box component="section" aria-label="What is this space for?" sx={{ bgcolor: brand.white, borderBottom: `1px solid ${brand.line}` }}>
          <Box sx={{ ...pageMax, ...pagePad, py: { xs: 3, md: 4 }, display: "grid", gap: { xs: 2, md: 4 }, gridTemplateColumns: { xs: "1fr", md: "220px 1fr" }, alignItems: "center" }}>
            <Typography component="h2" sx={{ ...signType.plate, fontSize: { xs: 19, md: 22 }, color: brand.charcoal }}>
              What is it for?
            </Typography>
            <Box role="group" aria-label="Choose a focus" sx={{ display: "flex", gap: { xs: 1, md: 1.5 }, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" }, mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 } }}>
              {focuses.map((item, index) => {
                const selected = focus === item.id;
                return (
                  <Box
                    key={item.id}
                    component="button"
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setFocus(item.id);
                      setFilter("all");
                    }}
                    sx={{
                      all: "unset",
                      boxSizing: "border-box",
                      cursor: "pointer",
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 1.25,
                      pl: 0.75,
                      pr: 2,
                      py: 0.75,
                      bgcolor: selected ? brand.forestDeep : brand.ivory,
                      color: selected ? brand.white : brand.charcoal,
                      transition: "background-color 200ms cubic-bezier(0.16,1,0.3,1), color 200ms",
                      "&:hover": { bgcolor: selected ? brand.forestDeep : "#E6E8E3" },
                      "&:focus-visible": { outline: `3px solid ${brand.signal}`, outlineOffset: 2 },
                      "& > span:first-of-type": selected ? {} : { borderColor: brand.line, color: brand.charcoal },
                    }}
                  >
                    <Roundel active={selected}>{String(index + 1).padStart(2, "0")}</Roundel>
                    <Box component="span" sx={{ ...signType.plate, fontSize: 16 }}>{item.label}</Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      ) : null}

      {/* 3. Products */}
      <Box component="section" id="space-products" aria-label="Recommended products" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 8 }, scrollMarginTop: 96 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 2, md: 3 }, alignItems: { md: "flex-end" }, justifyContent: "space-between", borderBottom: `2px solid ${brand.charcoal}` }}>
          <Box sx={{ pb: { md: 2 } }}>
            <Typography sx={{ ...signType.code, fontSize: 13, color: brand.signalInk }}>RECOMMENDED FOR {solution.name.toUpperCase()}</Typography>
            <Typography component="h2" sx={{ ...signType.title, fontSize: { xs: "2rem", md: "2.6rem" }, mt: 1, color: brand.charcoal }}>
              {visible.length} {visible.length === 1 ? "product" : "products"}
            </Typography>
          </Box>
          {showCategoryFilters ? (
            <Box role="group" aria-label="Filter products by category" sx={{ display: "flex", overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" }, mx: { xs: -2, sm: 0 }, px: { xs: 1, sm: 0 } }}>
              {filters.map((item) => (
                <Box key={item.id} component="button" type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} sx={tabSx(filter === item.id)}>
                  {item.label}
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>

        {lead ? (
          <Box key={`${focus}-${filter}`} className="finder-step">
            {/* Lead product: the board to start with */}
            <Box component="article" aria-label={`Start here: ${lead.shortName}`} sx={{ mt: { xs: 3, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.1fr) minmax(0, 1fr)" }, bgcolor: brand.white }}>
              <Box component={NextLink} href={`/products/${lead.id}`} aria-label={lead.shortName} sx={{ position: "relative", display: "block", aspectRatio: { xs: "4 / 3", md: "auto" }, minHeight: { md: 420 }, borderRight: { md: `1px solid ${brand.line}` }, "&:hover img": { transform: "scale(1.03)" } }}>
                {lead.images[0] ? <Image src={lead.images[0]} alt="" fill sizes="(max-width: 900px) 100vw, 55vw" style={{ objectFit: "contain", padding: "8%", transition: "transform 600ms cubic-bezier(0.16,1,0.3,1)" }} /> : null}
                <Box sx={{ position: "absolute", top: 0, left: 0, px: 1.75, py: 1, bgcolor: brand.signal, color: brand.charcoal, ...signType.plate, fontSize: 14 }}>Start here</Box>
              </Box>
              <Box sx={{ p: { xs: 2.5, md: 5 }, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography sx={{ ...signType.code, fontSize: 12.5, color: brand.forest }}>{lead.sku} · {getProductCategoryLabel(lead)}</Typography>
                <Typography component="h3" sx={{ ...signType.title, fontSize: { xs: "1.8rem", md: "2.4rem" }, color: brand.charcoal }}>
                  <Box component={NextLink} href={`/products/${lead.id}`} sx={{ color: "inherit", "&:hover": { textDecoration: "underline", textUnderlineOffset: 4 } }}>{lead.shortName}</Box>
                </Typography>
                <Typography sx={{ maxWidth: 480 }}>{lead.shortDescription}</Typography>
                {lead.sizes.length ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {lead.sizes.map((size) => (
                      <Box key={size.id} sx={{ px: 1.25, py: 0.5, border: `1px solid ${brand.line}`, ...signType.code, fontSize: 12.5, color: brand.charcoal }}>{size.label}</Box>
                    ))}
                  </Box>
                ) : null}
                <Typography sx={{ ...signType.plate, fontSize: 30, fontVariantNumeric: "tabular-nums", color: brand.charcoal, mt: 1 }}>
                  {lead.price > 0 ? formatPrice(lead.price) : "Price on request"}
                </Typography>
                <Box sx={{ mt: "auto", pt: 1 }}>
                  <ProductActions product={lead} variant="card" />
                </Box>
                {lead.customizable ? (
                  <Box component={NextLink} href={`/customize?productId=${lead.id}&application=${application}`} sx={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 0.75, ...signType.plate, fontSize: 15, color: brand.forest, textDecoration: "underline", textUnderlineOffset: 4 }}>
                    Customise this board
                    <SignArrow size={14} />
                  </Box>
                ) : null}
              </Box>
            </Box>

            {rest.length ? (
              <Box sx={{ mt: { xs: 2, md: 3 }, display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" } }}>
                {rest.map((product, index) => (
                  <Reveal key={product.id} delay={Math.min(index * 40, 240)} sx={{ height: "100%" }}>
                    <ProductCard product={product} onQuickView={setQuick} />
                  </Reveal>
                ))}
              </Box>
            ) : null}
          </Box>
        ) : (
          <Box sx={{ mt: 4, p: { xs: 4, md: 6 }, bgcolor: brand.white, borderTop: `6px solid ${brand.forest}` }}>
            <Typography component="h3" sx={{ ...signType.plate, fontSize: 24, color: brand.charcoal }}>No products in this selection yet</Typography>
            <Typography sx={{ mt: 1 }}>Try another filter or focus to see more OBASIX products.</Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setFilter("all");
                setFocus(focuses[0]?.id ?? "all");
              }}
              sx={{ mt: 3 }}
            >
              Clear filters
            </Button>
          </Box>
        )}
      </Box>

      {/* 4. Next steps */}
      <Box component="section" aria-labelledby="space-next" sx={{ bgcolor: brand.forestDeep, color: brand.white }}>
        <Box sx={{ ...pageMax, ...pagePad, py: { xs: 7, md: 10 } }}>
          <Typography id="space-next" component="h2" sx={{ ...signType.title, color: brand.white, maxWidth: "16ch" }}>
            Need it to a different size?
          </Typography>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, mt: { xs: 4, md: 6 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, borderTop: "2px solid rgba(255,255,255,0.25)" }}>
            {[
              { href: `/customize?application=${application}`, title: "Design your board", body: "Choose size, frame, colour and features." },
              { href: "/visualize", title: "See it on your wall", body: "Place a board on a photo of your room." },
              { href: "/quote", title: "Request a quote", body: "Bulk, custom and institutional orders." },
            ].map((step, i) => (
              <Box component="li" key={step.title} sx={{ borderBottom: { xs: "1px solid rgba(255,255,255,0.14)", md: 0 }, borderLeft: { md: i ? "1px solid rgba(255,255,255,0.14)" : 0 } }}>
                <Box component={NextLink} href={step.href} sx={{ display: "flex", gap: 2, alignItems: "flex-start", py: 3, px: { md: i ? 3.5 : 0 }, pr: { md: 3.5 }, color: brand.white, "&:hover svg": { transform: "translateX(4px)" }, "&:hover .t": { textDecoration: "underline", textUnderlineOffset: 4 } }}>
                  <Roundel>{String(i + 1).padStart(2, "0")}</Roundel>
                  <Box sx={{ flex: 1 }}>
                    <Typography className="t" sx={{ ...signType.plate, fontSize: 21, color: brand.white }}>{step.title}</Typography>
                    <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,0.78)" }}>{step.body}</Typography>
                  </Box>
                  <SignArrow size={20} color={brand.signal} sx={{ mt: 1, transition: "transform 220ms cubic-bezier(0.16,1,0.3,1)" }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 5. Other spaces */}
      {others.length ? (
        <Box component="nav" aria-label="Other spaces" sx={{ bgcolor: brand.white }}>
          <Box sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
            <Typography sx={{ ...signType.code, fontSize: 13, color: brand.muted }}>OTHER SPACES</Typography>
            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {others.map((s) => (
                <Box key={s.id} component={NextLink} href={`/solutions/${s.id}`} sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 2, py: 1.25, border: `1px solid ${brand.line}`, ...signType.plate, fontSize: 16, color: brand.charcoal, transition: "border-color 160ms, box-shadow 200ms", "&:hover": { borderColor: brand.charcoal, boxShadow: `inset 0 -3px 0 ${brand.signal}` } }}>
                  {s.name}
                  <SignArrow size={14} color={brand.signal} />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      ) : null}

      <ProductQuickView product={quick} open={Boolean(quick)} onClose={() => setQuick(null)} />
    </Box>
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { getAllProducts } from "@/data/catalogue";
import { getSolutionProducts } from "@/data/solutions";
import { buildCustomizeHref, formatPrice } from "@/lib/format";
import type { ApplicationType, BoardCategory, Product } from "@/lib/types";

type SpaceChoice = ApplicationType | "training-room";
type PurposeChoice =
  | "magnetic-whiteboard"
  | "non-magnetic-whiteboard"
  | "notice-pinup"
  | "chalk-board"
  | "combination-board"
  | "stand"
  | "any";
type SizeChoice = "compact" | "standard" | "large" | "any";
type BudgetChoice = "under-2k" | "2k-5k" | "5k-10k" | "over-10k" | "any";

const spaces: { id: SpaceChoice; label: string }[] = [
  { id: "office", label: "Office" },
  { id: "meeting-room", label: "Meeting Room" },
  { id: "classroom", label: "Classroom" },
  { id: "training-room", label: "Training Room" },
  { id: "reception", label: "Reception" },
  { id: "home", label: "Home" },
];

const purposes: { id: PurposeChoice; label: string }[] = [
  { id: "any", label: "Any board" },
  { id: "magnetic-whiteboard", label: "Magnetic whiteboard" },
  { id: "non-magnetic-whiteboard", label: "Non-magnetic whiteboard" },
  { id: "notice-pinup", label: "Notice / pin-up" },
  { id: "chalk-board", label: "Chalk board" },
  { id: "combination-board", label: "Combination" },
  { id: "stand", label: "Mobile stand" },
];

const sizes: { id: SizeChoice; label: string }[] = [
  { id: "any", label: "Any size" },
  { id: "compact", label: "Compact (≤ 2×3 ft)" },
  { id: "standard", label: "Standard (≈ 2×3 – 3×4)" },
  { id: "large", label: "Large (4×6+)" },
];

const budgets: { id: BudgetChoice; label: string }[] = [
  { id: "any", label: "Any budget" },
  { id: "under-2k", label: "Under ₹2,000" },
  { id: "2k-5k", label: "₹2,000 – ₹5,000" },
  { id: "5k-10k", label: "₹5,000 – ₹10,000" },
  { id: "over-10k", label: "Over ₹10,000" },
];

function maxArea(product: Product) {
  if (product.sizes.length === 0) return null;
  return Math.max(...product.sizes.map((s) => s.widthFt * s.heightFt));
}

function matchesPurpose(product: Product, purpose: PurposeChoice) {
  if (purpose === "any") return true;
  if (purpose === "notice-pinup") {
    return product.category === "notice-board" || product.category === "pin-up-board";
  }
  return product.category === (purpose as BoardCategory);
}

function matchesSize(product: Product, size: SizeChoice) {
  if (size === "any") return true;
  const area = maxArea(product);
  if (area == null) return product.category === "accessory" || product.category === "desk-accessory";
  if (size === "compact") return area <= 6;
  if (size === "standard") return area > 6 && area <= 14;
  return area > 14;
}

function matchesBudget(product: Product, budget: BudgetChoice) {
  if (budget === "any") return true;
  if (product.price <= 0) return false;
  if (budget === "under-2k") return product.price < 2000;
  if (budget === "2k-5k") return product.price >= 2000 && product.price <= 5000;
  if (budget === "5k-10k") return product.price > 5000 && product.price <= 10000;
  return product.price > 10000;
}

function matchesSpace(product: Product, space: SpaceChoice | null) {
  if (!space) return true;
  if (space === "training-room") {
    const text = `${product.name} ${product.shortDescription} ${product.description}`.toLowerCase();
    return text.includes("training") || product.applications.includes("classroom");
  }
  return product.applications.includes(space);
}

function explainMatch(
  product: Product,
  space: SpaceChoice | null,
  purpose: PurposeChoice,
  size: SizeChoice,
  budget: BudgetChoice,
) {
  const reasons: string[] = [];
  if (space) {
    if (space === "training-room") reasons.push("Suited to training / teaching spaces");
    else if (product.applications.includes(space)) reasons.push(`Listed for ${space.replace("-", " ")} use`);
  }
  if (purpose !== "any" && matchesPurpose(product, purpose)) {
    reasons.push("Matches the board type you selected");
  }
  if (size !== "any" && matchesSize(product, size)) {
    reasons.push("Fits your preferred size band");
  }
  if (budget !== "any" && matchesBudget(product, budget)) {
    reasons.push("Within your budget range");
  }
  if (reasons.length === 0) reasons.push("From the live OBASIX catalogue");
  return reasons.slice(0, 2).join(" · ");
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T | null;
  onChange: (id: T) => void;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ letterSpacing: "0.05em", fontWeight: 600, color: "text.secondary", display: "block", mb: 1 }}
      >
        {label}
      </Typography>
      <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
        {options.map((option) => {
          const active = value === option.id;
          return (
            <Button
              key={option.id}
              size="small"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              sx={{
                borderRadius: 0,
                border: "1px solid",
                borderColor: active ? "primary.main" : "divider",
                color: active ? "primary.main" : "text.secondary",
                bgcolor: active ? "primary.light" : "transparent",
                fontWeight: active ? 600 : 500,
                fontSize: 12.5,
                px: 1.35,
                minHeight: 34,
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                  bgcolor: active ? "primary.light" : "transparent",
                },
              }}
            >
              {option.label}
            </Button>
          );
        })}
      </Stack>
    </Box>
  );
}

export function FindRightBoardSection() {
  const catalogue = useMemo(() => getAllProducts(), []);
  const [space, setSpace] = useState<SpaceChoice | null>(null);
  const [purpose, setPurpose] = useState<PurposeChoice>("any");
  const [size, setSize] = useState<SizeChoice>("any");
  const [budget, setBudget] = useState<BudgetChoice>("any");

  const results = useMemo(() => {
    let pool = catalogue.filter(
      (p) =>
        p.category !== "accessory" &&
        p.category !== "desk-accessory" &&
        matchesSpace(p, space) &&
        matchesPurpose(p, purpose) &&
        matchesSize(p, size) &&
        matchesBudget(p, budget),
    );

    if (space && space !== "training-room") {
      const solutionHits = new Set(getSolutionProducts(space).map((p) => p.id));
      pool = [...pool].sort((a, b) => {
        const aHit = solutionHits.has(a.id) ? 0 : 1;
        const bHit = solutionHits.has(b.id) ? 0 : 1;
        if (aHit !== bHit) return aHit - bHit;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
    }

    return pool.slice(0, 6);
  }, [catalogue, space, purpose, size, budget]);

  const hasFilters = space != null || purpose !== "any" || size !== "any" || budget !== "any";

  const reset = () => {
    setSpace(null);
    setPurpose("any");
    setSize("any");
    setBudget("any");
  };

  return (
    <Box
      component="section"
      id="find-board"
      aria-labelledby="find-board-heading"
      sx={{
        py: { xs: 8, md: 11 },
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        scrollMarginTop: { xs: 64, md: 72 },
      }}
    >
      <Container>
        <Reveal>
          <Typography
            variant="overline"
            sx={{ color: "primary.main", letterSpacing: "0.05em", fontWeight: 600 }}
          >
            PRODUCT FINDER
          </Typography>
          <Typography
            id="find-board-heading"
            variant="h2"
            sx={{
              mt: 1.25,
              fontSize: { xs: "1.75rem", md: "2.4rem" },
              letterSpacing: "-0.03em",
              maxWidth: "16ch",
            }}
          >
            Find the Right Board
          </Typography>
          <Typography sx={{ mt: 1.25, color: "text.secondary", maxWidth: 460 }}>
            Answer a few questions — we match real catalogue products using space, type, size and
            price.
          </Typography>
        </Reveal>

        <Box
          sx={{
            mt: { xs: 4, md: 5 },
            display: "grid",
            gap: { xs: 3.5, lg: 5 },
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 0.95fr) minmax(0, 1.05fr)" },
          }}
        >
          <Reveal>
            <Stack spacing={3}>
              <OptionGroup
                label="1 · INTENDED SPACE"
                options={spaces}
                value={space}
                onChange={setSpace}
              />
              <OptionGroup
                label="2 · BOARD TYPE OR PURPOSE"
                options={purposes}
                value={purpose}
                onChange={setPurpose}
              />
              <OptionGroup label="3 · PREFERRED SIZE" options={sizes} value={size} onChange={setSize} />
              <OptionGroup
                label="4 · BUDGET (CATALOGUE PRICES)"
                options={budgets}
                value={budget}
                onChange={setBudget}
              />
              <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  onClick={reset}
                  disabled={!hasFilters}
                  sx={{ borderRadius: 0, borderColor: "divider" }}
                >
                  Reset Filters
                </Button>
                <Button
                  component={Link}
                  href="/products?guide=1"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                  sx={{ px: 0, fontWeight: 600 }}
                >
                  Open full product guide
                </Button>
              </Stack>
            </Stack>
          </Reveal>

          <Reveal delay={60}>
            {!hasFilters ? (
              <Box
                sx={{
                  height: "100%",
                  minHeight: 280,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.default",
                  display: "grid",
                  placeItems: "center",
                  px: 3,
                  textAlign: "center",
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>Start with your space</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 300, mx: "auto" }}>
                    Select at least one preference to see matching boards from the catalogue.
                  </Typography>
                </Box>
              </Box>
            ) : results.length === 0 ? (
              <Box
                sx={{
                  minHeight: 280,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.default",
                  display: "grid",
                  placeItems: "center",
                  px: 3,
                  textAlign: "center",
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>No exact matches</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1, mb: 2.5, maxWidth: 320, mx: "auto" }}>
                    Try widening size or budget, or browse applications for this space.
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center" }} useFlexGap>
                    <Button variant="outlined" onClick={reset} sx={{ borderRadius: 0 }}>
                      Reset Filters
                    </Button>
                    {space && space !== "training-room" ? (
                      <Button
                        component={Link}
                        href={`/solutions/${space}`}
                        variant="contained"
                        sx={{ borderRadius: 0 }}
                      >
                        View {spaces.find((s) => s.id === space)?.label} solutions
                      </Button>
                    ) : (
                      <Button component={Link} href="/products" variant="contained" sx={{ borderRadius: 0 }}>
                        Browse catalogue
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Box>
            ) : (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  {results.length} matching product{results.length === 1 ? "" : "s"}
                </Typography>
                {results.map((product) => (
                  <Box
                    key={product.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "88px 1fr", sm: "104px 1fr" },
                      gap: 2,
                      borderTop: 1,
                      borderColor: "divider",
                      pt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        aspectRatio: "1 / 1",
                        bgcolor: "#FFFFFF",
                      }}
                    >
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-contain"
                          sizes="104px"
                          style={{ padding: 8 }}
                        />
                      ) : null}
                    </Box>
                    <Box>
                      <Typography
                        component={Link}
                        href={`/products/${product.id}`}
                        sx={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: "text.primary",
                          display: "block",
                          "&:hover": { color: "primary.main" },
                        }}
                      >
                        {product.shortName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.sku}
                        {product.price > 0 ? ` · ${formatPrice(product.price)}` : " · Quote on request"}
                      </Typography>
                      <Typography sx={{ mt: 0.75, fontSize: 13, color: "text.secondary", lineHeight: 1.45 }}>
                        {explainMatch(product, space, purpose, size, budget)}
                      </Typography>
                      <Stack direction="row" spacing={1.25} sx={{ mt: 1.25 }} useFlexGap>
                        <Button
                          component={Link}
                          href={`/products/${product.id}`}
                          size="small"
                          sx={{ px: 0, minWidth: 0, fontWeight: 600 }}
                        >
                          View Product
                        </Button>
                        {product.customizable ? (
                          <Button
                            component={Link}
                            href={buildCustomizeHref({
                              productId: product.id,
                              application:
                                space && space !== "training-room" ? space : undefined,
                            })}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ borderRadius: 0 }}
                          >
                            Customize
                          </Button>
                        ) : null}
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Reveal>
        </Box>
      </Container>
    </Box>
  );
}

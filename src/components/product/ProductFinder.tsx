"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { ProductActions } from "@/components/product/ProductActions";
import { productCardDetailsButtonSx } from "@/components/product/productCardButtonStyles";
import { colours, frames, products } from "@/data/catalogue";
import type {
  ApplicationType,
  BoardCategory,
  BoardType,
  FrameType,
  Product,
  ProductFilters,
  SurfaceType,
} from "@/lib/types";
import { formatPrice } from "@/lib/format";

const STEPS = [
  { id: "category", title: "What are you looking for?", summary: "Category" },
  { id: "type", title: "Which board type?", summary: "Type" },
  { id: "size", title: "What size do you need?", summary: "Size" },
  { id: "frame", title: "Which frame?", summary: "Frame" },
  { id: "surface", title: "Which surface?", summary: "Surface" },
  { id: "colour", title: "Which colour?", summary: "Colour" },
  { id: "application", title: "Where will it be used?", summary: "Application" },
  { id: "price", title: "What budget fits?", summary: "Price" },
  { id: "sort", title: "How should we order them?", summary: "Sort" },
] as const;

const categoryOptions: { id: BoardCategory; label: string }[] = [
  { id: "magnetic-whiteboard", label: "Magnetic Whiteboards" },
  { id: "non-magnetic-whiteboard", label: "Non-Magnetic Whiteboards" },
  { id: "notice-board", label: "Notice Boards" },
  { id: "pin-up-board", label: "Pin-up Boards" },
  { id: "chalk-board", label: "Chalk Boards" },
  { id: "combination-board", label: "Combination Boards" },
  { id: "wooden-product", label: "Wooden Products" },
  { id: "stand", label: "Stands" },
  { id: "accessory", label: "Accessories" },
  { id: "desk-accessory", label: "Desk Accessories" },
];

const typeOptions: { id: BoardType; label: string }[] = [
  { id: "whiteboard", label: "Whiteboard" },
  { id: "magnetic-whiteboard", label: "Magnetic" },
  { id: "notice-board", label: "Notice Board" },
  { id: "pin-up-board", label: "Pin-up Board" },
  { id: "combination-board", label: "Combination" },
  { id: "chalk-board", label: "Chalk Board" },
];

const surfaceOptions: { id: SurfaceType; label: string }[] = [
  { id: "resin-coated", label: "Resin Coated" },
  { id: "melamine-hpl", label: "Melamine HPL" },
  { id: "ceramic-steel", label: "Ceramic Steel" },
  { id: "fabric-softboard", label: "Fabric Softboard" },
  { id: "chalkboard", label: "Chalkboard" },
  { id: "dual-side", label: "Dual Side" },
];

const applicationOptions: { id: ApplicationType; label: string }[] = [
  { id: "office", label: "Office" },
  { id: "classroom", label: "Classroom" },
  { id: "meeting-room", label: "Meeting Room" },
  { id: "home", label: "Home" },
  { id: "studio", label: "Studio" },
  { id: "reception", label: "Reception" },
  { id: "retail", label: "Retail" },
  { id: "commercial", label: "Commercial" },
];

const sortOptions: { id: ProductFilters["sort"]; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name", label: "Name" },
];

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/×/g, "x")
    .replace(/feet|ft/g, "")
    .replace(/[^a-z0-9.]+/g, "");
}

function sizeMatches(product: Product, selected: string) {
  const wanted = normalizeToken(selected);
  return product.sizes.some(
    (size) =>
      normalizeToken(size.id) === wanted || normalizeToken(size.label) === wanted,
  );
}

type MatchResult = { items: Product[]; relaxed: string[] };

function sortProducts(list: Product[], sort: ProductFilters["sort"]) {
  const next = [...list];
  switch (sort) {
    case "price-asc":
      next.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      next.sort((a, b) => b.price - a.price);
      break;
    case "name":
      next.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      next.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }
  return next;
}

/**
 * Category and board type are kept when they match real products.
 * Size, frame, surface, colour, application and price are dropped
 * only when they would otherwise hide every remaining product.
 */
function matchProducts(filters: ProductFilters, catalogueMax: number): MatchResult {
  let list = [...products];
  const relaxed: string[] = [];

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (product) =>
        product.name.toLowerCase().includes(q) ||
        product.shortDescription.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.shortName.toLowerCase().includes(q),
    );
  }

  const narrow = (label: string, active: boolean, test: (product: Product) => boolean) => {
    if (!active || list.length === 0) return;
    const next = list.filter(test);
    if (next.length > 0) list = next;
    else relaxed.push(label);
  };

  if (filters.categories.length > 0) {
    const next = list.filter((product) => filters.categories.includes(product.category));
    if (next.length === 0) return { items: [], relaxed: ["Category"] };
    list = next;
  }

  narrow(
    "Type",
    filters.boardTypes.length > 0,
    (product) => Boolean(product.boardType) && filters.boardTypes.includes(product.boardType!),
  );
  narrow("Size", filters.sizes.length > 0, (product) =>
    filters.sizes.some((size) => sizeMatches(product, size)),
  );
  narrow("Frame", filters.frames.length > 0, (product) =>
    filters.frames.includes(product.frame),
  );
  narrow("Surface", filters.surfaces.length > 0, (product) =>
    filters.surfaces.includes(product.surface),
  );
  narrow("Colour", filters.colours.length > 0, (product) =>
    product.colours.some((colour) => filters.colours.includes(colour)),
  );
  narrow("Application", filters.applications.length > 0, (product) =>
    product.applications.some((application) => filters.applications.includes(application)),
  );

  const priceActive = filters.priceMin > 0 || filters.priceMax < catalogueMax;
  narrow(
    "Price",
    priceActive,
    (product) => product.price >= filters.priceMin && product.price <= filters.priceMax,
  );

  return { items: sortProducts(list, filters.sort), relaxed };
}

export function ProductFinder() {
  const searchParams = useSearchParams();
  const maxPrice = Math.max(...products.map((p) => p.price));
  const initialCategory = searchParams.get("category") as BoardCategory | null;
  const initialQ = searchParams.get("q") ?? "";

  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    search: initialQ,
    categories:
      initialCategory && categoryOptions.some((c) => c.id === initialCategory)
        ? [initialCategory]
        : [],
    boardTypes: [],
    sizes: [],
    frames: [],
    surfaces: [],
    colours: [],
    applications: [],
    priceMin: 0,
    priceMax: maxPrice,
    sort: "featured",
  });

  const match = useMemo(() => matchProducts(filters, maxPrice), [filters, maxPrice]);
  const matches = match.items;
  const relaxed = match.relaxed;

  const sizes = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => p.sizes.forEach((s) => map.set(s.id, s.label)));
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, []);

  const priceBands = useMemo(() => {
    const bands = [
      { id: "any", label: "Any budget", min: 0, max: maxPrice },
      { id: "under-2", label: "Under ₹2,000", min: 0, max: 1999 },
      { id: "2-5", label: "₹2,000 – ₹5,000", min: 2000, max: 5000 },
      { id: "5-10", label: "₹5,000 – ₹10,000", min: 5001, max: 10000 },
      { id: "over-10", label: "Above ₹10,000", min: 10001, max: maxPrice },
    ];
    return bands.filter(
      (band) =>
        band.id === "any" ||
        products.some((p) => p.price >= band.min && p.price <= band.max),
    );
  }, [maxPrice]);

  const used = {
    categories: categoryOptions.filter((c) => products.some((p) => p.category === c.id)),
    types: typeOptions.filter((t) => products.some((p) => p.boardType === t.id)),
    frames: frames.filter((f) => products.some((p) => p.frame === f.id)),
    surfaces: surfaceOptions.filter((s) => products.some((p) => p.surface === s.id)),
    colours: colours.filter((c) => products.some((p) => p.colours.includes(c.id))),
    applications: applicationOptions.filter((a) =>
      products.some((p) => p.applications.includes(a.id)),
    ),
  };

  const priceLabel =
    filters.priceMin <= 0 && filters.priceMax >= maxPrice
      ? "Any"
      : (priceBands.find((b) => b.min === filters.priceMin && b.max === filters.priceMax)?.label ??
        `${formatPrice(filters.priceMin)} – ${formatPrice(filters.priceMax)}`);

  const summary = [
    {
      label: "Category",
      value: filters.categories[0]
        ? (categoryOptions.find((c) => c.id === filters.categories[0])?.label ?? "Any")
        : "Any",
    },
    {
      label: "Type",
      value: filters.boardTypes[0]
        ? (typeOptions.find((t) => t.id === filters.boardTypes[0])?.label ?? "Any")
        : "Any",
    },
    {
      label: "Size",
      value: filters.sizes[0]
        ? (sizes.find((s) => s.id === filters.sizes[0])?.label ?? "Any")
        : "Any",
    },
    {
      label: "Frame",
      value: filters.frames[0]
        ? (frames.find((f) => f.id === filters.frames[0])?.name ?? "Any")
        : "Any",
    },
    {
      label: "Surface",
      value: filters.surfaces[0]
        ? (surfaceOptions.find((s) => s.id === filters.surfaces[0])?.label ?? "Any")
        : "Any",
    },
    {
      label: "Colour",
      value: filters.colours[0]
        ? (colours.find((c) => c.id === filters.colours[0])?.name ?? "Any")
        : "Any",
    },
    {
      label: "Application",
      value: filters.applications[0]
        ? (applicationOptions.find((a) => a.id === filters.applications[0])?.label ?? "Any")
        : "Any",
    },
    { label: "Price", value: priceLabel },
    {
      label: "Sort",
      value: sortOptions.find((s) => s.id === filters.sort)?.label ?? "Featured",
    },
  ];

  const current = STEPS[step];

  const goTo = (index: number) => {
    setRevealed(false);
    setStep(index);
  };

  return (
    <Box sx={{ bgcolor: "background.paper" }}>
        <Container
        sx={{
          display: "grid",
          gap: { xs: 4, lg: 5 },
          py: { xs: 4, md: 5, lg: 5 },
          height: { md: "calc(100vh - 103px - 80px)" },
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 1fr) 320px",
            lg: "minmax(0, 1fr) 380px",
          },
        }}
      >
        <Box sx={{ minWidth: 0, minHeight: 0, overflowY: { xs: "visible", md: "auto" } }}>
          {!revealed ? (
            <>
              <Typography variant="overline" color="secondary">
                Product finder
              </Typography>
              <Typography variant="h3" component="h1" sx={{ mt: 2, maxWidth: 576, fontSize: { xs: 34, md: 46 } }}>
                Find the right board for your space.
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 2, maxWidth: 512, fontSize: { xs: 16, md: 18 }, lineHeight: 1.65 }}
              >
                Answer a few simple questions and we&apos;ll find the best OBASIX boards for you.
              </Typography>

              <Box key={current.id} className="finder-step" sx={{ mt: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.05em", fontWeight: 600 }}>
                  {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                </Typography>
                <Typography variant="h4" component="h2" sx={{ mt: 1.5, fontSize: { xs: 24, md: 30 } }}>
                  {current.title}
                </Typography>

                <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 4, pb: 18, flexWrap: "wrap" }}>
                  {current.id !== "sort" ? (
                    <Option
                      active={isAny(current.id, filters, maxPrice)}
                      onClick={() => setFilters((f) => clearStep(current.id, f, maxPrice))}
                    >
                      Any
                    </Option>
                  ) : null}
                    {optionsFor(current.id, used, sizes, priceBands).map((option) => (
                    <Option
                      key={option.id}
                      optionId={option.id}
                      active={isSelected(current.id, option, filters)}
                      onClick={() => setFilters((f) => selectStep(current.id, option, f))}
                      swatch={"swatch" in option && typeof option.swatch === "string" ? option.swatch : undefined}
                    >
                      {option.label}
                    </Option>
                  ))}
                </Stack>

                <Stack
                  direction="row"
                  useFlexGap
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                    mt: 4,
                    pt: 1.25,
                    pb: 1,
                    px: 1,
                    mx: -1,
                    flexWrap: "wrap",
                    position: "sticky",
                    bottom: {
                      xs: "calc(var(--mobile-nav-h, 64px) + 0.75rem + env(safe-area-inset-bottom, 0px))",
                      md: 1.5,
                    },
                    zIndex: 5,
                    bgcolor: "rgba(255, 255, 255, 0.96)",
                    borderTop: 1,
                    borderColor: "divider",
                    boxShadow: "0 -8px 24px rgba(37, 42, 38, 0.08)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {step > 0 ? (
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => setStep((s) => s - 1)}
                      sx={{ minHeight: 50, px: 2.5 }}
                    >
                      Back
                    </Button>
                  ) : null}
                  {step < STEPS.length - 1 ? (
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => setStep((s) => s + 1)}
                      sx={{
                        minHeight: 50,
                        px: 3.5,
                        bgcolor: "#164F3B",
                        color: "#FFFFFF",
                        border: "1px solid #164F3B",
                        "&:hover": { bgcolor: "#0F3A29", borderColor: "#0F3A29" },
                      }}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => setRevealed(true)}
                      sx={{
                        minHeight: 50,
                        px: 3.5,
                        bgcolor: "#164F3B",
                        color: "#FFFFFF",
                        border: "1px solid #164F3B",
                        "&:hover": { bgcolor: "#0F3A29", borderColor: "#0F3A29" },
                      }}
                    >
                      Show My Boards
                    </Button>
                  )}
                </Stack>
              </Box>

              <Box sx={{ mt: 6, display: { xs: "block", md: "none" } }}>
                <Summary rows={summary} count={matches.length} filters={filters} preferred={matches[0]} onJump={goTo} />
              </Box>
            </>
          ) : (
            <Box className="finder-step">
              {matches.length === 0 ? (
                <Box
                  sx={{
                    display: "grid",
                    alignItems: "center",
                    gap: 4,
                    gridTemplateColumns: { xs: "1fr", sm: "minmax(220px, 280px) 1fr" },
                  }}
                >
                  <BoardVisual filters={filters} preferred={matches[0]} />
                  <Box>
                    <Typography variant="body2" color="secondary" sx={{ fontWeight: 600 }}>
                      0 matches
                    </Typography>
                    <Typography variant="h4" component="h1" sx={{ mt: 1.5, fontSize: { xs: 28, md: 36 } }}>
                      Boards for your choices
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 448, lineHeight: 1.65 }}>
                      No OBASIX products are listed for this category.
                      <br />
                      Go back and choose another category.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => setRevealed(false)}
                      sx={{ mt: 4 }}
                    >
                      Adjust choices
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Stack
                    direction="row"
                    useFlexGap
                    spacing={2}
                   
                   
                    sx={{ alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap" }}
                  >
                    <Box>
                      <Typography variant="body2" color="secondary" sx={{ fontWeight: 600 }}>
                        {relaxed.length > 0
                          ? `${matches.length} boards match your main choices`
                          : `${matches.length} ${matches.length === 1 ? "match" : "matches"}`}
                      </Typography>
                      <Typography variant="h4" component="h1" sx={{ mt: 1.5, fontSize: { xs: 28, md: 36 } }}>
                        Boards for your choices
                      </Typography>
                      {relaxed.length > 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 512 }}>
                          Some specifications were adjusted to show the closest available options.
                        </Typography>
                      ) : null}
                    </Box>
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => setRevealed(false)}
                    >
                      Adjust choices
                    </Button>
                  </Stack>
                  <Grid container spacing={2} sx={{ mt: 5 }}>
                    {matches.map((product) => (
                      <Grid key={product.id} size={{ xs: 12, sm: 6 }}>
                        <ResultCard product={product} />
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              <Box sx={{ mt: 5, display: { xs: "block", md: "none" } }}>
                <Summary rows={summary} count={matches.length} filters={filters} preferred={matches[0]} onJump={goTo} />
              </Box>
            </Box>
          )}
        </Box>

        <Box
          component="aside"
          sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", minHeight: 0, minWidth: 0 }}
        >
          <Box sx={{ height: "100%", minHeight: 0 }}>
            <Summary rows={summary} count={matches.length} filters={filters} preferred={matches[0]} onJump={goTo} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function isAny(step: (typeof STEPS)[number]["id"], filters: ProductFilters, maxPrice: number) {
  switch (step) {
    case "category":
      return filters.categories.length === 0;
    case "type":
      return filters.boardTypes.length === 0;
    case "size":
      return filters.sizes.length === 0;
    case "frame":
      return filters.frames.length === 0;
    case "surface":
      return filters.surfaces.length === 0;
    case "colour":
      return filters.colours.length === 0;
    case "application":
      return filters.applications.length === 0;
    case "price":
      return filters.priceMin <= 0 && filters.priceMax >= maxPrice;
    case "sort":
      return false;
  }
}

function isSelected(
  step: (typeof STEPS)[number]["id"],
  option: { id: string; min?: number; max?: number },
  filters: ProductFilters,
) {
  switch (step) {
    case "category":
      return filters.categories[0] === option.id;
    case "type":
      return filters.boardTypes[0] === option.id;
    case "size":
      return filters.sizes[0] === option.id;
    case "frame":
      return filters.frames[0] === option.id;
    case "surface":
      return filters.surfaces[0] === option.id;
    case "colour":
      return filters.colours[0] === option.id;
    case "application":
      return filters.applications[0] === option.id;
    case "price":
      return filters.priceMin === option.min && filters.priceMax === option.max;
    case "sort":
      return filters.sort === option.id;
  }
}

function clearStep(
  step: (typeof STEPS)[number]["id"],
  filters: ProductFilters,
  maxPrice: number,
): ProductFilters {
  switch (step) {
    case "category":
      return { ...filters, categories: [] };
    case "type":
      return { ...filters, boardTypes: [] };
    case "size":
      return { ...filters, sizes: [] };
    case "frame":
      return { ...filters, frames: [] };
    case "surface":
      return { ...filters, surfaces: [] };
    case "colour":
      return { ...filters, colours: [] };
    case "application":
      return { ...filters, applications: [] };
    case "price":
      return { ...filters, priceMin: 0, priceMax: maxPrice };
    case "sort":
      return { ...filters, sort: "featured" };
  }
}

function selectStep(
  step: (typeof STEPS)[number]["id"],
  option: { id: string; min?: number; max?: number },
  filters: ProductFilters,
): ProductFilters {
  switch (step) {
    case "category":
      return { ...filters, categories: [option.id as BoardCategory] };
    case "type":
      return { ...filters, boardTypes: [option.id as BoardType] };
    case "size":
      return { ...filters, sizes: [option.id] };
    case "frame":
      return { ...filters, frames: [option.id as FrameType] };
    case "surface":
      return { ...filters, surfaces: [option.id as SurfaceType] };
    case "colour":
      return { ...filters, colours: [option.id] };
    case "application":
      return { ...filters, applications: [option.id as ApplicationType] };
    case "price":
      return {
        ...filters,
        priceMin: option.min ?? 0,
        priceMax: option.max ?? filters.priceMax,
      };
    case "sort":
      return { ...filters, sort: option.id as ProductFilters["sort"] };
  }
}

function optionsFor(
  step: (typeof STEPS)[number]["id"],
  used: {
    categories: { id: string; label: string }[];
    types: { id: string; label: string }[];
    frames: { id: string; name: string; swatch: string }[];
    surfaces: { id: string; label: string }[];
    colours: { id: string; name: string; hex: string }[];
    applications: { id: string; label: string }[];
  },
  sizes: { id: string; label: string }[],
  priceBands: { id: string; label: string; min: number; max: number }[],
) {
  switch (step) {
    case "category":
      return used.categories;
    case "type":
      return used.types;
    case "size":
      return sizes;
    case "frame":
      return used.frames.map((f) => ({ id: f.id, label: f.name, swatch: f.swatch }));
    case "surface":
      return used.surfaces;
    case "colour":
      return used.colours.map((c) => ({ id: c.id, label: c.name, swatch: c.hex }));
    case "application":
      return used.applications;
    case "price":
      return priceBands.filter((b) => b.id !== "any");
    case "sort":
      return sortOptions;
  }
}

function Option({
  active,
  onClick,
  children,
  swatch,
  optionId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  swatch?: string;
  optionId?: string;
}) {
  const isSelectedChalkBoard = active && optionId === "chalk-board";

  return (
    <Button
      variant={active ? "contained" : "outlined"}
      onClick={onClick}
      aria-pressed={active}
      style={
        isSelectedChalkBoard
          ? {
              backgroundColor: "#155640",
              color: "#FFFFFF",
              borderColor: "#155640",
              WebkitTextFillColor: "#FFFFFF",
            }
          : undefined
      }
      sx={
        isSelectedChalkBoard
          ? {
              bgcolor: "#155640",
              color: "#FFFFFF !important",
              borderColor: "#155640",
              WebkitTextFillColor: "#FFFFFF",
              "&, &.MuiButton-contained, &.MuiButton-colorPrimary": {
                bgcolor: "#155640 !important",
                color: "#FFFFFF !important",
                borderColor: "#155640 !important",
                WebkitTextFillColor: "#FFFFFF",
              },
              "&:hover": {
                bgcolor: "#155640",
                color: "#FFFFFF !important",
                borderColor: "#155640",
                WebkitTextFillColor: "#FFFFFF",
              },
              "&:hover.MuiButton-contained": {
                bgcolor: "#155640 !important",
                borderColor: "#155640 !important",
              },
            }
          : undefined
      }
      startIcon={
        swatch ? (
          <Box
            component="span"
            style={{ backgroundColor: swatch }}
            sx={{ display: "inline-block", width: 14, height: 14, border: "1px solid rgba(0,0,0,0.12)", borderRadius: "16px" }}
          />
        ) : undefined
      }
    >
      {children}
    </Button>
  );
}

function closestProduct(filters: ProductFilters): Product | undefined {
  let best: { product: Product; score: number } | undefined;
  for (const product of products) {
    if (!product.images[0]) continue;
    let score = 0;
    if (filters.categories[0] && product.category === filters.categories[0]) score += 8;
    if (filters.boardTypes[0] && product.boardType === filters.boardTypes[0]) score += 6;
    if (filters.sizes[0] && product.sizes.some((s) => s.id === filters.sizes[0])) score += 5;
    if (filters.frames[0] && product.frame === filters.frames[0]) score += 4;
    if (filters.surfaces[0] && product.surface === filters.surfaces[0]) score += 4;
    if (filters.colours[0] && product.colours.includes(filters.colours[0])) score += 3;
    if (filters.applications[0] && product.applications.includes(filters.applications[0])) score += 2;
    if (product.price >= filters.priceMin && product.price <= filters.priceMax) score += 1;
    if (!best || score > best.score) best = { product, score };
  }
  return best?.product ?? products.find((p) => p.images[0]);
}

function previewAspect(sizeId?: string) {
  if (!sizeId) return "4 / 3";
  const [width, height] = sizeId.split("x").map(Number);
  if (!width || !height) return "4 / 3";
  return `${width} / ${height}`;
}

function BoardVisual({
  filters,
  preferred,
  compact = false,
}: {
  filters: ProductFilters;
  preferred?: Product;
  compact?: boolean;
}) {
  const product = preferred ?? closestProduct(filters);
  const image = product?.images[0];
  const frame = frames.find((item) => item.id === (filters.frames[0] ?? product?.frame));
  const colour = colours.find((item) => item.id === (filters.colours[0] ?? product?.colours[0]));
  const aspect = previewAspect(filters.sizes[0] ?? product?.sizes[0]?.id);
  const previewKey = `${image ?? "placeholder"}-${frame?.id ?? "frame"}-${colour?.id ?? "colour"}-${aspect}`;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f3f2ef",
        p: 3,
        minHeight: compact ? 220 : 260,
      }}
    >
      <Box
        key={previewKey}
        className="finder-preview"
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 240,
          bgcolor: "background.paper",
          boxShadow: "0 16px 40px rgba(26,31,28,0.12)",
        }}
        style={{ aspectRatio: aspect }}
      >
        {image ? (
          <Image
            src={image}
            alt={product?.shortName ?? "OBASIX board preview"}
            fill
            className="object-contain p-3"
            sizes="280px"
          />
        ) : (
          <Box sx={{ position: "absolute", inset: 0 }} style={{ backgroundColor: colour?.hex ?? "#F7F7F5" }} />
        )}
        <Box
          sx={{
            pointerEvents: "none",
            position: "absolute",
            inset: 8,
            border: "8px solid",
            transition: "border-color 0.3s",
          }}
          style={{ borderColor: frame?.swatch ?? "#1A1A1A" }}
        />
        {colour ? (
          <Box
            sx={{
              pointerEvents: "none",
              position: "absolute",
              inset: 14,
              opacity: 0.3,
              mixBlendMode: "multiply",
              transition: "background-color 0.3s",
            }}
            style={{ backgroundColor: colour.hex }}
          />
        ) : null}
      </Box>
    </Box>
  );
}

function Summary({
  rows,
  count,
  filters,
  preferred,
  onJump,
}: {
  rows: { label: string; value: string }[];
  count: number;
  filters: ProductFilters;
  preferred?: Product;
  onJump: (index: number) => void;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        height: { xs: "auto", md: "100%" },
        minHeight: 0,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Typography variant="h6" component="h2">
          Your Board
        </Typography>
        <Typography
          key={count}
          className="finder-value"
          variant="body2"
          color="secondary"
          sx={{ textAlign: "right", fontWeight: 600 }}
        >
          {count} products match
        </Typography>
      </Stack>
      <Box sx={{ mt: 2, overflow: "hidden", border: 1, borderColor: "divider", borderRadius: "16px" }}>
        <BoardVisual filters={filters} preferred={preferred} compact />
      </Box>
      <Box
        component="dl"
        sx={{ m: 0, mt: 2.5, minHeight: 0, flex: { xs: "0 0 auto", md: "1 1 auto" }, overflowY: { xs: "visible", md: "auto" } }}
      >
        {rows.map((row, index) => (
          <ButtonBase
            key={row.label}
            onClick={() => onJump(index)}
            sx={{
              display: "flex",
              width: "100%",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 2,
              py: 1,
              textAlign: "left",
              borderBottom: 1,
              borderColor: "divider",
              "&:last-of-type": { borderBottom: 0 },
            }}
          >
            <Typography component="dt" variant="body2" color="text.secondary">
              {row.label}
            </Typography>
            <Typography
              key={row.value}
              component="dd"
              className="finder-value"
              variant="body2"
              sx={{ m: 0, textAlign: "right", fontWeight: 600 }}
            >
              {row.value}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
        <Box
          key={`foot-${count}`}
          component="span"
          className="finder-value"
          sx={{ fontWeight: 600, color: "text.primary" }}
        >
          {count}
        </Box>{" "}
        products match your choices
      </Typography>
      {count === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Try changing your selection to see more options.
        </Typography>
      ) : null}
    </Paper>
  );
}

function ResultCard({ product }: { product: Product }) {
  const category = categoryOptions.find((item) => item.id === product.category)?.label;
  const type = product.boardType
    ? typeOptions.find((item) => item.id === product.boardType)?.label
    : undefined;
  const frame = frames.find((item) => item.id === product.frame)?.name;
  const surface = surfaceOptions.find((item) => item.id === product.surface)?.label;
  const colour = product.colours
    .map((id) => colours.find((item) => item.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const application = product.applications
    .map((id) => applicationOptions.find((item) => item.id === id)?.label)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const facts = [
    category && type ? `${category} · ${type}` : category || type,
    product.sizes.map((size) => size.label).join(", "),
    frame,
    surface,
    colour,
    application,
  ].filter(Boolean);

  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{ display: "flex", height: "100%", flexDirection: "column", borderRadius: "16px", overflow: "hidden" }}
    >
      <Box sx={{ position: "relative", aspectRatio: "5 / 4", bgcolor: "background.default" }}>
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-6"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        ) : null}
      </Box>
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", p: 2.5 }}>
        <Typography variant="h6" component="h2">
          {product.shortName}
        </Typography>
        <Box component="ul" sx={{ m: 0, mt: 1.5, p: 0, listStyle: "none" }}>
          {facts.map((fact) => (
            <Typography key={fact} component="li" variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {fact}
            </Typography>
          ))}
        </Box>
        <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
          {formatPrice(product.price)}
        </Typography>
        <Button
          component={Link}
          href={`/products/${product.id}`}
          size="small"
          variant="outlined"
          fullWidth
          endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
          sx={{ ...productCardDetailsButtonSx, mt: 2 }}
        >
          View Details
        </Button>
        <Box sx={{ mt: 1 }}>
          <ProductActions product={product} variant="card" />
        </Box>
      </Box>
    </Paper>
  );
}

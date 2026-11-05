"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import Link from "@/components/Link";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFinder } from "@/components/product/ProductFinder";
import { ProductQuickView } from "@/components/product/ProductQuickView";
import { colours, frames, products } from "@/data/catalogue";
import { getSolutionProducts } from "@/data/solutions";
import { formatPrice } from "@/lib/format";
import type { BoardCategory, Product } from "@/lib/types";

const categoryName: Record<BoardCategory, string> = {
  "magnetic-whiteboard": "Magnetic Whiteboards",
  "non-magnetic-whiteboard": "Non-Magnetic Whiteboards",
  "notice-board": "Notice Boards",
  "pin-up-board": "Pin-up Boards",
  "chalk-board": "Chalk Boards",
  "combination-board": "Combination Boards",
  "wooden-product": "Wooden Products",
  stand: "Stands",
  accessory: "Accessories",
  "desk-accessory": "Desk Accessories",
};

const surfaceName: Record<string, string> = {
  "resin-coated": "Resin Coated",
  "melamine-hpl": "Melamine HPL",
  "ceramic-steel": "Ceramic Steel",
  "fabric-softboard": "Fabric Softboard",
  chalkboard: "Chalkboard",
  "dual-side": "Dual Side",
};

const typeName: Record<string, string> = {
  whiteboard: "Whiteboard",
  "magnetic-whiteboard": "Magnetic",
  "notice-board": "Notice Board",
  "pin-up-board": "Pin-up Board",
  "combination-board": "Combination",
  "chalk-board": "Chalk Board",
};

const spaces = [
  { id: "office", label: "Office" },
  { id: "classroom", label: "Classroom" },
  { id: "meeting-room", label: "Meeting Room" },
  { id: "training-room", label: "Training Room" },
  { id: "reception", label: "Reception" },
  { id: "home", label: "Home" },
] as const;

type NavKey =
  | "all"
  | BoardCategory
  | "ceramic-steel"
  | "notice-pinup"
  | "chalk-combination"
  | "stands-accessories";

function matchesQuery(product: Product, query: string) {
  if (!query) return true;
  const haystack = `${product.name} ${product.shortName} ${product.shortDescription} ${product.sku}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function isMagnet(product: Product) {
  return /magnet/i.test(`${product.name} ${product.shortName}`);
}

function isHolder(product: Product) {
  return /holder/i.test(`${product.name} ${product.shortName}`);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function ProductShowroom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const guide = searchParams.get("guide") === "1";

  const categoryParam = searchParams.get("category");
  const category: BoardCategory | "" =
    categoryParam && categoryParam in categoryName ? (categoryParam as BoardCategory) : "";
  const family = searchParams.get("family") ?? "";
  const space = spaces.some((item) => item.id === searchParams.get("space"))
    ? searchParams.get("space")!
    : "";
  const query = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "featured";
  const type = searchParams.get("type") ?? "";
  const size = searchParams.get("size") ?? "";
  const frame = searchParams.get("frame") ?? "";
  const surface = searchParams.get("surface") ?? "";
  const colour = searchParams.get("colour") ?? "";
  const use = searchParams.get("use") ?? "";
  const price = searchParams.get("price") ?? "";
  const accessoryKind = category === "accessory" ? searchParams.get("kind") ?? "all" : "";

  const activeNav: NavKey = useMemo(() => {
    if (surface === "ceramic-steel" && !category && !family) return "ceramic-steel";
    if (family === "notice-pinup") return "notice-pinup";
    if (family === "chalk-combination") return "chalk-combination";
    if (family === "stands-accessories") return "stands-accessories";
    if (category === "stand" || category === "accessory" || category === "desk-accessory") {
      return "stands-accessories";
    }
    if (category === "chalk-board" || category === "combination-board") return "chalk-combination";
    if (category) return category;
    return "all";
  }, [surface, category, family]);

  const pool = useMemo(() => {
    const spaceIds = space ? new Set(getSolutionProducts(space).map((product) => product.id)) : null;
    return products.filter((product) => {
      if (family === "notice-pinup") {
        if (product.category !== "notice-board" && product.category !== "pin-up-board") return false;
      } else if (family === "chalk-combination") {
        if (product.category !== "chalk-board" && product.category !== "combination-board") return false;
      } else if (family === "stands-accessories") {
        if (!["stand", "accessory", "desk-accessory"].includes(product.category)) return false;
      } else if (surface === "ceramic-steel" && !category && !family) {
        if (product.surface !== "ceramic-steel") return false;
      } else if (category === "accessory") {
        if (product.category !== "accessory") return false;
        if (accessoryKind === "magnets" && !isMagnet(product)) return false;
        if (accessoryKind === "holders" && !isHolder(product)) return false;
      } else if (category && product.category !== category) {
        return false;
      }
      if (
        category !== "accessory" &&
        family !== "stands-accessories" &&
        spaceIds &&
        !spaceIds.has(product.id)
      ) {
        return false;
      }
      if (!matchesQuery(product, query)) return false;
      return true;
    });
  }, [category, accessoryKind, space, query, family, surface]);

  const filterOptions = useMemo(() => {
    const types = unique(pool.map((product) => product.boardType).filter(Boolean) as string[]);
    const sizes = unique(pool.flatMap((product) => product.sizes.map((item) => item.label)));
    const frameIds = unique(pool.map((product) => product.frame));
    const surfaces = unique(pool.map((product) => product.surface));
    const colourIds = unique(pool.flatMap((product) => product.colours));
    const uses = unique(pool.flatMap((product) => product.applications));
    const prices = unique(pool.filter((product) => product.price > 0).map((product) => String(product.price)));
    return [
      { id: "type", label: "Product type", values: types.map((id) => ({ id, label: typeName[id] ?? id })) },
      { id: "size", label: "Size", values: sizes.map((id) => ({ id, label: id })) },
      {
        id: "frame",
        label: "Frame",
        values: frameIds.map((id) => ({ id, label: frames.find((item) => item.id === id)?.name ?? id })),
      },
      {
        id: "surface",
        label: "Surface",
        values: surfaces.map((id) => ({ id, label: surfaceName[id] ?? id })),
      },
      {
        id: "colour",
        label: "Colour",
        values: colourIds.map((id) => ({ id, label: colours.find((item) => item.id === id)?.name ?? id })),
      },
      {
        id: "use",
        label: "Compatibility",
        values: uses.map((id) => ({
          id,
          label:
            spaces.find((item) => item.id === id)?.label ??
            id.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        })),
      },
      {
        id: "price",
        label: "Price",
        values: prices
          .map((id) => ({ id, label: formatPrice(Number(id)), amount: Number(id) }))
          .sort((a, b) => a.amount - b.amount),
      },
    ].filter((item) => item.values.length > 1);
  }, [pool]);

  const visible = useMemo(() => {
    const predicates: Array<(product: Product) => boolean> = [];
    if (type) predicates.push((product) => product.boardType === type);
    if (size) predicates.push((product) => product.sizes.some((item) => item.label === size));
    if (frame) predicates.push((product) => product.frame === frame);
    if (surface && activeNav !== "ceramic-steel") {
      predicates.push((product) => product.surface === surface);
    }
    if (colour) predicates.push((product) => product.colours.includes(colour));
    if (use) {
      predicates.push((product) =>
        product.applications.includes(use as Product["applications"][number]),
      );
    }
    if (price) predicates.push((product) => String(product.price) === price);

    let list = [...pool];
    for (const predicate of predicates) {
      const next = list.filter(predicate);
      if (next.length > 0) list = next;
    }

    return list.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.shortName.localeCompare(b.shortName);
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [pool, type, size, frame, surface, colour, use, price, sort, activeNav]);

  const relatedAccessories = useMemo(() => {
    if (!category || category === "accessory" || category === "desk-accessory" || category === "stand") {
      return [];
    }
    const ids: string[] = [];
    products
      .filter((product) => product.category === category)
      .forEach((product) => {
        product.accessories.forEach((id) => {
          if (!ids.includes(id)) ids.push(id);
        });
      });
    return ids
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product));
  }, [category]);

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("guide");
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    const qs = next.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  const selectNav = (key: NavKey) => {
    if (key === "all") {
      setParams({ category: null, family: null, surface: null, group: null, kind: null });
      return;
    }
    if (key === "ceramic-steel") {
      setParams({ category: null, family: null, surface: "ceramic-steel", group: null, kind: null });
      return;
    }
    if (key === "notice-pinup") {
      setParams({ category: null, family: "notice-pinup", surface: null, group: null, kind: null });
      return;
    }
    if (key === "chalk-combination") {
      setParams({ category: null, family: "chalk-combination", surface: null, group: null, kind: null });
      return;
    }
    if (key === "stands-accessories") {
      setParams({ category: null, family: "stands-accessories", surface: null, group: null, kind: null });
      return;
    }
    setParams({ category: key, family: null, surface: null, group: null, kind: null });
  };

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (type) chips.push({ key: "type", label: `Type: ${typeName[type] ?? type}` });
    if (size) chips.push({ key: "size", label: `Size: ${size}` });
    if (frame) {
      chips.push({
        key: "frame",
        label: `Frame: ${frames.find((item) => item.id === frame)?.name ?? frame}`,
      });
    }
    if (surface && activeNav !== "ceramic-steel") {
      chips.push({ key: "surface", label: `Surface: ${surfaceName[surface] ?? surface}` });
    }
    if (colour) {
      chips.push({
        key: "colour",
        label: `Colour: ${colours.find((item) => item.id === colour)?.name ?? colour}`,
      });
    }
    if (use) chips.push({ key: "use", label: `Use: ${use.replace(/-/g, " ")}` });
    if (price) chips.push({ key: "price", label: `Price: ${formatPrice(Number(price))}` });
    if (space) chips.push({ key: "space", label: `Space: ${space.replace(/-/g, " ")}` });
    if (query) chips.push({ key: "q", label: `Search: ${query}` });
    return chips;
  }, [type, size, frame, surface, colour, use, price, space, query, activeNav]);

  const clearFilters = () => {
    setParams({
      type: null,
      size: null,
      frame: null,
      surface: activeNav === "ceramic-steel" ? "ceramic-steel" : null,
      colour: null,
      use: null,
      price: null,
      space: null,
      q: null,
      sort: null,
    });
  };

  const categoryNav = useMemo(() => {
    const items: { key: NavKey; label: string; count: number }[] = [
      { key: "all", label: "All Products", count: products.length },
    ];
    const byCategory = (id: BoardCategory) => products.filter((p) => p.category === id).length;

    const magnetic = byCategory("magnetic-whiteboard");
    if (magnetic) items.push({ key: "magnetic-whiteboard", label: "Magnetic Whiteboards", count: magnetic });

    const nonMag = byCategory("non-magnetic-whiteboard");
    if (nonMag) items.push({ key: "non-magnetic-whiteboard", label: "Non-Magnetic Whiteboards", count: nonMag });

    const ceramic = products.filter((p) => p.surface === "ceramic-steel").length;
    if (ceramic) items.push({ key: "ceramic-steel", label: "Ceramic Steel Boards", count: ceramic });

    const noticePin = products.filter(
      (p) => p.category === "notice-board" || p.category === "pin-up-board",
    ).length;
    if (noticePin) items.push({ key: "notice-pinup", label: "Notice & Pin-up Boards", count: noticePin });

    const chalkCombo =
      byCategory("chalk-board") + byCategory("combination-board");
    if (chalkCombo) {
      items.push({ key: "chalk-combination", label: "Chalk & Combination Boards", count: chalkCombo });
    }

    const wood = byCategory("wooden-product");
    if (wood) items.push({ key: "wooden-product", label: "Wooden Products", count: wood });

    const standsAccessories = products.filter((p) =>
      ["stand", "accessory", "desk-accessory"].includes(p.category),
    ).length;
    if (standsAccessories) {
      items.push({ key: "stands-accessories", label: "Stands & Accessories", count: standsAccessories });
    }

    return items;
  }, []);

  if (guide) {
    return (
      <Box sx={{ bgcolor: "background.default", pb: { xs: 10, md: 4 } }}>
        <Container sx={{ pt: 3, pb: 1 }}>
          <Button component={Link} href="/products" color="inherit" startIcon={<ArrowBackIcon />} sx={{ px: 0 }}>
            Back to collection
          </Button>
        </Container>
        <ProductFinder />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <Container
        maxWidth={false}
        sx={{ maxWidth: 1440, pt: { xs: 4, md: 5.5 }, pb: { xs: 3, md: 3.5 } }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2.5, md: 4 }}
          sx={{ alignItems: { md: "flex-end" }, justifyContent: "space-between" }}
        >
          <Box sx={{ minWidth: 0, maxWidth: 680 }}>
            <Typography
              variant="overline"
              sx={{
                display: "inline-flex",
                px: 1,
                py: 0.35,
                borderRadius: 0.5,
                bgcolor: "primary.light",
                color: "primary.main",
                letterSpacing: "0.16em",
                fontSize: 11,
              }}
            >
              Collection
            </Typography>
            <Typography
              variant="h1"
              sx={{
                mt: 1.25,
                fontSize: { xs: "1.85rem", md: "2.45rem" },
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.12,
                color: "text.primary",
              }}
            >
              Find the Right Board for Your Space
            </Typography>
            <Box sx={{ width: 44, height: 3, borderRadius: 1, bgcolor: "primary.main", mt: 2 }} />
            <Typography sx={{ mt: 2, color: "text.secondary", fontSize: { xs: 15, md: 16.5 }, maxWidth: 520, lineHeight: 1.7 }}>
              Explore thoughtfully designed boards, stands and accessories for better working spaces.
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/products?guide=1"
            variant="contained"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            sx={{
              alignSelf: { xs: "flex-start", md: "flex-end" },
              flexShrink: 0,
            }}
          >
            Find My Product
          </Button>
        </Stack>
      </Container>

      <Box
        sx={{
          borderTop: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 1440 }}>
          <Box
            component="nav"
            aria-label="Product categories"
            className="scrollbar-thin"
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              gap: 0.75,
              py: 1.5,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {categoryNav.map((item) => {
              const active = activeNav === item.key;
              return (
                <Button
                  key={item.key}
                  onClick={() => selectNav(item.key)}
                  aria-current={active ? "true" : undefined}
                  size="small"
                  sx={{
                    flexShrink: 0,
                    borderRadius: 999,
                    px: 1.75,
                    py: 0.85,
                    minWidth: 0,
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "primary.contrastText" : "text.secondary",
                    border: 1,
                    borderColor: active ? "primary.main" : "transparent",
                    bgcolor: active ? "primary.main" : "transparent",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: active ? "primary.dark" : "primary.light",
                      color: active ? "primary.contrastText" : "primary.main",
                    },
                  }}
                >
                  {item.label}
                  <Box
                    component="span"
                    sx={{
                      ml: 0.85,
                      opacity: active ? 0.85 : 0.6,
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {item.count}
                  </Box>
                </Button>
              );
            })}
          </Box>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1440, pt: 2.75, pb: 1.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1.25} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
              {visible.length} {visible.length === 1 ? "product" : "products"}
            </Typography>
            {activeFilters.length > 0 ? (
              <>
                {activeFilters.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    onDelete={() => setParams({ [chip.key]: null })}
                    size="small"
                    variant="outlined"
                    sx={{ borderRadius: 0.5 }}
                  />
                ))}
                <Button size="small" onClick={clearFilters} sx={{ px: 0, minWidth: 0 }}>
                  Clear filters
                </Button>
              </>
            ) : null}
          </Stack>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setFilterOpen(true)}
              sx={{
                bgcolor: "#164E3B",
                color: "#FFFFFF !important",
                borderColor: "#164E3B",
                borderWidth: "1px",
                borderStyle: "solid",
                "&, &.MuiButton-outlined, &.MuiButton-colorInherit, &.MuiButton-colorPrimary": {
                  color: "#FFFFFF !important",
                  WebkitTextFillColor: "#FFFFFF",
                },
                "& .MuiButton-startIcon, & .MuiSvgIcon-root": {
                  color: "#FFFFFF !important",
                  fill: "#FFFFFF !important",
                },
                transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease",
                "&:hover": {
                  bgcolor: "#0B3528",
                  borderColor: "#0B3528",
                  color: "#FFFFFF !important",
                  WebkitTextFillColor: "#FFFFFF",
                },
                "&.Mui-disabled": {
                  bgcolor: "#E8E6E0 !important",
                  borderColor: "#E8E6E0 !important",
                  color: "#6F756D !important",
                  WebkitTextFillColor: "#6F756D",
                },
                "&.Mui-disabled .MuiSvgIcon-root": {
                  color: "#6F756D !important",
                  fill: "#6F756D !important",
                },
              }}
            >
              Filter{activeFilters.length > 0 ? ` (${activeFilters.length})` : ""}
            </Button>
            <FormControl size="small" sx={{ minWidth: 150, bgcolor: "background.paper", borderRadius: 0.5 }}>
              <InputLabel id="sort-label">Sort by</InputLabel>
              <Select
                labelId="sort-label"
                label="Sort by"
                value={["featured", "price-asc", "price-desc", "name"].includes(sort) ? sort : "featured"}
                onChange={(event) =>
                  setParams({ sort: event.target.value === "featured" ? null : event.target.value })
                }
              >
                <MenuItem value="featured">Recommended</MenuItem>
                <MenuItem value="price-asc">Price: Low to High</MenuItem>
                <MenuItem value="price-desc">Price: High to Low</MenuItem>
                <MenuItem value="name">Name</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Container>

      <Container maxWidth={false} sx={{ maxWidth: 1440, pt: 1.5 }}>
        {visible.length === 0 ? (
          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              px: 3,
              py: 5,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontSize: "1.05rem" }}>
              No products match these filters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try clearing filters or choosing another category.
            </Typography>
            <Button variant="contained" onClick={clearFilters} sx={{ mt: 2.5 }}>
              Clear Filters
            </Button>
          </Box>
        ) : (
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            {visible.map((product) => (
              <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                <ProductCard product={product} onQuickView={setQuickProduct} />
              </Grid>
            ))}
          </Grid>
        )}

        {category && category !== "accessory" && category !== "desk-accessory" && category !== "stand" ? (
          <Box sx={{ mt: 6, pt: 4, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
              Complete your board
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Accessories that go with your selection
            </Typography>
            {relatedAccessories.length > 0 ? (
              <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                {relatedAccessories.map((item) => (
                  <Grid key={item.id} size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                    <ProductCard product={item} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={() => selectNav("stands-accessories")}
                sx={{ mt: 2, px: 0 }}
              >
                Browse stands & accessories
              </Button>
            )}
          </Box>
        ) : null}
      </Container>

      <Drawer
        anchor="right"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        slotProps={{
          paper: { sx: { width: "min(100%, 360px)", bgcolor: "background.paper" } },
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontSize: "1.05rem" }}>
              Filters
            </Typography>
            <IconButton aria-label="Close filters" onClick={() => setFilterOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <Stack spacing={2.5} sx={{ p: 2.5, flex: 1, overflowY: "auto" }}>
          {filterOptions.map((item) => {
            const current = searchParams.get(item.id) ?? "";
            return (
              <FormControl key={item.id} fullWidth size="small">
                <InputLabel id={`filter-${item.id}`}>{item.label}</InputLabel>
                <Select
                  labelId={`filter-${item.id}`}
                  label={item.label}
                  value={item.values.some((value) => value.id === current) ? current : ""}
                  onChange={(event) => setParams({ [item.id]: event.target.value || null })}
                >
                  <MenuItem value="">Any</MenuItem>
                  {item.values.map((value) => (
                    <MenuItem key={value.id} value={value.id}>
                      {value.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          })}
          <FormControl fullWidth size="small">
            <InputLabel id="filter-space">Space</InputLabel>
            <Select
              labelId="filter-space"
              label="Space"
              value={space}
              onChange={(event) => setParams({ space: event.target.value || null })}
            >
              <MenuItem value="">Any</MenuItem>
              {spaces
                .filter((item) => getSolutionProducts(item.id).length > 0)
                .map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Stack>
        <Box sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
          <Stack direction="row" spacing={1.5}>
            <Button fullWidth variant="outlined" onClick={clearFilters}>
              Clear
            </Button>
            <Button fullWidth variant="contained" onClick={() => setFilterOpen(false)}>
              Show {visible.length}
            </Button>
          </Stack>
        </Box>
      </Drawer>

      <ProductQuickView
        product={quickProduct}
        open={Boolean(quickProduct)}
        onClose={() => setQuickProduct(null)}
      />
    </Box>
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import NextLink from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { getProductCategoryLabel } from "@/data/catalogue";
import { getSolutionProducts, type SolutionFocus } from "@/data/solutions";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

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

const clamp = (lines: number) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
});

const containerSx = {
  maxWidth: 1440,
  px: { xs: 2.5, sm: 4, md: 6, lg: 8 },
} as const;

const chipSx = (selected: boolean) => ({
  flexShrink: 0,
  whiteSpace: "nowrap" as const,
  height: 40,
  px: 2.25,
  borderRadius: "999px",
  border: "1px solid",
  borderColor: selected ? "primary.main" : "divider",
  bgcolor: selected ? "primary.main" : "#FFFFFF",
  color: selected ? "primary.contrastText" : "text.primary",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.13em",
  textTransform: "uppercase" as const,
  boxShadow: selected ? "0 8px 18px rgba(11, 56, 41, 0.18)" : "none",
  transition: "background-color 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
  "&:hover": {
    borderColor: "primary.main",
    bgcolor: selected ? "primary.dark" : "background.default",
  },
});

const filterChipSx = (selected: boolean) => ({
  ...chipSx(selected),
  height: 36,
  px: 1.75,
  fontSize: 10.5,
  letterSpacing: "0.12em",
});

export function SolutionExperience({ solution }: { solution: SolutionView }) {
  const products = useMemo(() => getSolutionProducts(solution.id), [solution.id]);
  const focuses = solution.focuses.filter(
    (item) => item.id === "all" || products.some((product) => matchesFocus(product, item.id)),
  );
  const [focus, setFocus] = useState(focuses[0]?.id ?? "all");
  const [filter, setFilter] = useState<SolutionFilter>("all");

  const focused = products.filter((product) => matchesFocus(product, focus));
  const filters = filterOptions.filter(
    (item) => item.id === "all" || focused.some((product) => matchesFilter(product, item.id)),
  );
  const visible = focused.filter((product) => matchesFilter(product, filter));

  const showCategoryFilters = filters.length > 2;

  return (
    <Box sx={{ overflowX: "clip", bgcolor: "background.default" }}>
      <Box
        component="section"
        aria-labelledby="solution-hero-heading"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Container
          maxWidth={false}
          sx={{ ...containerSx, py: { xs: 4.5, sm: 5.5, md: 6.5, lg: 7 } }}
        >
          <Box
            sx={{
              display: "grid",
              alignItems: "center",
              gap: { xs: 4.5, md: 6, lg: 9 },
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                md: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                component="p"
                sx={{
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  color: "secondary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                }}
              >
                <Link component={NextLink} href="/solutions" underline="hover" color="inherit">
                  SOLUTIONS
                </Link>
                <Box component="span" aria-hidden sx={{ color: "text.secondary" }}>
                  /
                </Box>
                <Box component="span" sx={{ color: "text.primary" }}>
                  {solution.name.toUpperCase()}
                </Box>
              </Typography>

              <Typography
                id="solution-hero-heading"
                variant="h1"
                sx={{
                  mt: 2.5,
                  maxWidth: 620,
                  fontSize: { xs: "2.05rem", sm: "2.6rem", md: "3rem", lg: "3.45rem" },
                  lineHeight: 1.03,
                  letterSpacing: "-0.03em",
                  color: "text.primary",
                  textWrap: "balance",
                }}
              >
                {solution.headline}
              </Typography>

              <Typography
                sx={{
                  mt: 2.5,
                  maxWidth: 520,
                  fontSize: { xs: 15.5, md: 17 },
                  lineHeight: 1.8,
                  color: "text.secondary",
                }}
              >
                {solution.summary}
              </Typography>

              {focuses.length > 1 ? (
                <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 4, flexWrap: "wrap" }}>
                  {focuses.map((item) => {
                    const selected = focus === item.id;
                    return (
                      <Button
                        key={item.id}
                        type="button"
                        variant="outlined"
                        onClick={() => {
                          setFocus(item.id);
                          setFilter("all");
                        }}
                        aria-pressed={selected}
                        sx={chipSx(selected)}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Stack>
              ) : null}
            </Box>

            <Box
              sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "4px",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 28px 64px rgba(11, 56, 41, 0.18)",
                aspectRatio: { xs: "16 / 10", sm: "16 / 9", md: "5 / 4" },
                minHeight: { xs: 220, sm: 260 },
                bgcolor: "#0B3829",
              }}
            >
              <Image
                src={solution.image}
                alt={`${solution.name} interior featuring OBASIX boards`}
                fill
                priority
                className="object-cover"
                style={{ objectPosition: "center" }}
                sizes="(max-width: 768px) 100vw, 46vw"
              />
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(11,56,41,0) 62%, rgba(11,56,41,0.42) 100%)",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  left: { xs: 14, md: 18 },
                  bottom: { xs: 14, md: 18 },
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "2px",
                  bgcolor: "rgba(250, 249, 246, 0.92)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.65)",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#0B3829",
                  }}
                >
                  Office Collection
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container
        component="section"
        maxWidth={false}
        aria-label="Recommended products"
        sx={{ ...containerSx, py: { xs: 5, md: 6.5 } }}
      >
        <Reveal>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: 2, md: 3 },
              alignItems: { md: "center" },
              justifyContent: "space-between",
              borderBottom: "1px solid",
              borderColor: "divider",
              pb: { xs: 2.5, md: 3 },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                component="p"
                sx={{ fontSize: 10.5, letterSpacing: "0.2em", color: "secondary.main" }}
              >
                Recommended for {solution.name}
              </Typography>
              <Typography
                variant="h2"
                sx={{ mt: 1, fontSize: { xs: "1.65rem", md: "2.1rem" }, letterSpacing: "-0.02em" }}
              >
                {visible.length} {visible.length === 1 ? "product" : "products"}
              </Typography>
            </Box>
            {showCategoryFilters ? (
              <Box
                className="scrollbar-thin"
                role="group"
                aria-label="Filter products by category"
                sx={{
                  display: "flex",
                  gap: 1,
                  overflowX: "auto",
                  flexWrap: "nowrap",
                  maxWidth: "100%",
                  pb: 0.5,
                  scrollSnapType: "x proximity",
                }}
              >
                {filters.map((item) => {
                  const selected = filter === item.id;
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      variant="outlined"
                      onClick={() => setFilter(item.id)}
                      aria-pressed={selected}
                      sx={{ ...filterChipSx(selected), scrollSnapAlign: "start" }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            ) : null}
          </Box>
        </Reveal>

        <Box
          key={`${focus}-${filter}`}
          className="finder-step"
          sx={{
            mt: { xs: 3, md: 4 },
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: { xs: 2.5, sm: 3 },
          }}
        >
          {visible.map((product, index) => (
            <Reveal key={product.id} delay={Math.min(index * 40, 240)} sx={{ height: "100%" }}>
              <Box
                component="article"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  bgcolor: "#FFFFFF",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "4px",
                  overflow: "hidden",
                  transition:
                    "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 18px 44px rgba(11, 56, 41, 0.12)",
                    borderColor: "primary.main",
                  },
                  "&:hover .solution-product-img": { transform: "scale(1.03)" },
                  "&:focus-within": {
                    borderColor: "primary.main",
                    boxShadow: "0 0 0 2px rgba(22, 78, 59, 0.35)",
                  },
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                    "&:hover": { transform: "none" },
                    "&:hover .solution-product-img": { transform: "none" },
                  },
                }}
              >
                <Box
                  component={NextLink}
                  href={`/products/${product.id}`}
                  aria-label={`View ${product.shortName}`}
                  sx={{
                    position: "relative",
                    display: "block",
                    aspectRatio: "4 / 3",
                    overflow: "hidden",
                    bgcolor: "#FFFFFF",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="solution-product-img object-contain p-4 transition duration-500 sm:p-5"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                  ) : null}
                  {product.featured ? (
                    <Box
                      component="span"
                      sx={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        px: 1.25,
                        py: 0.5,
                        borderRadius: "2px",
                        bgcolor: "secondary.main",
                        color: "text.primary",
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                      }}
                    >
                      Featured
                    </Box>
                  ) : null}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    gap: 0.5,
                    p: { xs: 2, md: 2.25 },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.17em",
                      color: "text.secondary",
                    }}
                  >
                    {getProductCategoryLabel(product)}
                  </Typography>
                  <Typography
                    variant="h3"
                    component="h3"
                    sx={{
                      mt: 0.75,
                      fontSize: 16.5,
                      lineHeight: 1.35,
                      letterSpacing: "-0.02em",
                      minHeight: "2.7em",
                      ...clamp(2),
                    }}
                  >
                    <Link
                      component={NextLink}
                      href={`/products/${product.id}`}
                      color="inherit"
                      underline="none"
                    >
                      {product.shortName}
                    </Link>
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: 12.5,
                      lineHeight: 1.65,
                      color: "text.secondary",
                      minHeight: "2.6em",
                      ...clamp(2),
                    }}
                  >
                    {product.shortDescription}
                  </Typography>
                  {product.sizes.length > 0 ? (
                    <Typography
                      sx={{
                        mt: 0.5,
                        fontSize: 11,
                        color: "text.secondary",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={product.sizes.map((size) => size.label).join(" · ")}
                    >
                      {product.sizes.map((size) => size.label).join(" · ")}
                    </Typography>
                  ) : null}

                  <Typography
                    sx={{ mt: 1.25, fontSize: 16, fontWeight: 650, color: "text.primary" }}
                  >
                    {product.price > 0 ? formatPrice(product.price) : "Price on request"}
                  </Typography>

                  <Box
                    sx={{
                      mt: "auto",
                      pt: 1.5,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.5,
                    }}
                  >
                    <Link
                      component={NextLink}
                      href={`/products/${product.id}`}
                      color="primary"
                      underline="none"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.75,
                        py: 0.75,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        "&:hover": { textDecoration: "underline", textUnderlineOffset: "3px" },
                      }}
                    >
                      View product
                      <ArrowForwardIcon sx={{ fontSize: 13 }} />
                    </Link>
                    {product.customizable ? (
                      <Link
                        component={NextLink}
                        href={`/customize?productId=${product.id}&application=${customizeApplication(solution.id)}`}
                        color="inherit"
                        underline="none"
                        sx={{
                          py: 0.75,
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          color: "text.secondary",
                          whiteSpace: "nowrap",
                          "&:hover": { color: "primary.main" },
                        }}
                      >
                        Customise
                      </Link>
                    ) : null}
                  </Box>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>

        {visible.length === 0 ? (
          <Box
            sx={{
              mt: 4,
              p: { xs: 4, md: 6 },
              textAlign: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: "4px",
            }}
          >
            <Typography variant="h3" sx={{ fontSize: "1.25rem" }}>
              No products in this selection yet
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary" }}>
              Try another filter or focus to see more OBASIX products.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setFilter("all");
                setFocus(focuses[0]?.id ?? "all");
              }}
              sx={{ mt: 3 }}
            >
              Clear filters
            </Button>
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}

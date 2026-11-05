"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/Link";
import { getBoardProducts, getProductById, products as catalogueProducts } from "@/data/catalogue";
import {
  decodeLayout,
  defaultCombinationLayout,
  encodeLayout,
  combinationRequiresQuote,
} from "@/lib/combination";
import { defaultFeatureIds } from "@/lib/features";
import type { CustomizerState, FrameType, Product } from "@/lib/types";
import { ProductConfigurator } from "@/components/customizer/ProductConfigurator";
import { useCart } from "@/context/CartContext";
import { buildCustomizeHref, formatPrice } from "@/lib/format";

const LAYOUT_STORAGE_KEY = "obasix-customize-layout";

type ResolveResult =
  | { status: "ready"; product: Product }
  | { status: "missing" }
  | { status: "invalid"; productId: string }
  | { status: "not-customizable"; product: Product };

function resolveRequestedProduct(productId: string | null): ResolveResult {
  if (!productId) return { status: "missing" };
  const product = getProductById(productId);
  if (!product) return { status: "invalid", productId };
  if (!product.customizable) return { status: "not-customizable", product };
  return { status: "ready", product };
}

function stateFromProduct(product: Product, extras?: Partial<CustomizerState>): CustomizerState {
  return {
    boardType: product.boardType ?? "magnetic-whiteboard",
    productId: product.id,
    sizeId: product.sizes[0]?.id ?? "custom",
    customWidthFt: product.sizes[0]?.widthFt ?? 4,
    customHeightFt: product.sizes[0]?.heightFt ?? 6,
    useCustomSize: false,
    frameId: product.frame,
    colourId: product.colours[0] ?? "white",
    features: defaultFeatureIds(product),
    branding: false,
    quantity: 1,
    combinationLayout: defaultCombinationLayout(product),
    ...extras,
  };
}

function CustomizeContent() {
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const productIdParam = searchParams.get("productId");
  const resolved = useMemo(() => resolveRequestedProduct(productIdParam), [productIdParam]);

  const [state, setState] = useState<CustomizerState | null>(() =>
    resolved.status === "ready" ? stateFromProduct(resolved.product) : null,
  );
  const [added, setAdded] = useState(false);
  const products = getBoardProducts();
  const applicationParam = searchParams.get("application");
  const application = (
    [
      "office",
      "classroom",
      "meeting-room",
      "home",
      "studio",
      "reception",
      "retail",
      "commercial",
      "training-room",
    ] as const
  ).find((item) => item === applicationParam);

  const queryKey = searchParams.toString();
  useEffect(() => {
    const nextResolved = resolveRequestedProduct(searchParams.get("productId"));
    if (nextResolved.status !== "ready") {
      setState(null);
      return;
    }

    const product = nextResolved.product;
    const sizeId = searchParams.get("sizeId");
    const frameId = searchParams.get("frameId") as FrameType | null;
    const colourId = searchParams.get("colourId");
    const features = searchParams.get("features");
    const branding = searchParams.get("branding");
    const quantity = searchParams.get("quantity");
    const customWidthFt = searchParams.get("customWidthFt");
    const customHeightFt = searchParams.get("customHeightFt");
    const useCustomSize = searchParams.get("useCustomSize");
    const layoutParam = searchParams.get("layout");
    const decodedFromUrl = decodeLayout(layoutParam, product);
    let storedLayout = null as ReturnType<typeof decodeLayout>;
    try {
      const raw = sessionStorage.getItem(`${LAYOUT_STORAGE_KEY}:${product.id}`);
      storedLayout = decodeLayout(raw, product);
    } catch {
      storedLayout = null;
    }

    setState(
      stateFromProduct(product, {
        ...(sizeId && product.sizes.some((size) => size.id === sizeId) ? { sizeId } : {}),
        ...(frameId && frameId === product.frame ? { frameId } : {}),
        ...(colourId && product.colours.includes(colourId) ? { colourId } : {}),
        ...(features ? { features: features.split(",").filter(Boolean) } : {}),
        ...(branding ? { branding: branding === "true" } : {}),
        ...(quantity ? { quantity: Number(quantity) || 1 } : {}),
        ...(customWidthFt ? { customWidthFt: Number(customWidthFt) } : {}),
        ...(customHeightFt ? { customHeightFt: Number(customHeightFt) } : {}),
        ...(useCustomSize ? { useCustomSize: useCustomSize === "true" } : {}),
        ...(decodedFromUrl
          ? { combinationLayout: decodedFromUrl }
          : storedLayout
            ? { combinationLayout: storedLayout }
            : {}),
      }),
    );
    // queryKey is the URL. Depending on the searchParams object would reset feature
    // selections whenever that object identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  useEffect(() => {
    if (!state?.productId || !state.combinationLayout) return;
    try {
      sessionStorage.setItem(
        `${LAYOUT_STORAGE_KEY}:${state.productId}`,
        encodeLayout(state.combinationLayout),
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, [state?.productId, state?.combinationLayout]);

  const customizableChoices = catalogueProducts.filter((item) => item.customizable);

  const configuratorReady = Boolean(
    resolved.status === "ready" && state && state.productId === resolved.product.id,
  );

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        pb: { xs: 16, lg: 8 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2.5, md: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        {resolved.status === "missing" || resolved.status === "invalid" ? (
          <SelectProductState
            title={
              resolved.status === "invalid"
                ? "We could not find that product"
                : "Select a product to customize"
            }
            message={
              resolved.status === "invalid"
                ? `No catalogue product matches “${resolved.productId}”. Choose a product below or return to the catalogue.`
                : "Open Customize from a product or solution, or pick a customizable board from the catalogue."
            }
            choices={customizableChoices}
          />
        ) : null}

        {resolved.status === "not-customizable" ? (
          <NotCustomizableState product={resolved.product} />
        ) : null}

        {configuratorReady && state ? (
          <>
            {added ? (
              <Alert severity="success" role="status" sx={{ mb: 2 }}>
                Configuration added to your cart.
              </Alert>
            ) : null}
            <ProductConfigurator
              products={products}
              state={state}
              application={application}
              onChange={(next) => setState((prev) => (prev ? { ...prev, ...next } : prev))}
              onAddToCart={(accessoryIds) => {
                const product = getProductById(state.productId);
                if (
                  !product ||
                  !product.customizable ||
                  state.useCustomSize ||
                  product.price <= 0 ||
                  combinationRequiresQuote(
                    state.combinationLayout ?? defaultCombinationLayout(product),
                  )
                ) {
                  return;
                }
                addItem(
                  state.productId,
                  {
                    sizeId: state.sizeId,
                    frameId: state.frameId,
                    colourId: state.colourId,
                    features: state.features,
                    branding: state.branding,
                    logoDataUrl: state.logoDataUrl,
                    customWidthFt: state.useCustomSize ? state.customWidthFt : undefined,
                    customHeightFt: state.useCustomSize ? state.customHeightFt : undefined,
                    application: application === "training-room" ? undefined : application,
                    combinationLayout:
                      state.combinationLayout ?? defaultCombinationLayout(product),
                  },
                  state.quantity,
                );
                accessoryIds.forEach((id) => {
                  const accessory = getProductById(id);
                  if (accessory && accessory.price > 0) addItem(id, {}, 1);
                });
                setAdded(true);
                window.setTimeout(() => setAdded(false), 2500);
              }}
            />
          </>
        ) : null}
      </Box>
    </Box>
  );
}

function SelectProductState({
  title,
  message,
  choices,
}: {
  title: string;
  message: string;
  choices: Product[];
}) {
  return (
    <Paper component="section" variant="outlined" sx={{ borderRadius: "16px", p: { xs: 3, md: 4 } }}>
      <Button
        component={Link}
        href="/products"
        size="small"
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        sx={{ px: 0, py: 0.25, minWidth: 0 }}
      >
        Back to Products
      </Button>
      <Typography
        variant="h5"
        component="h1"
        sx={{ mt: 2, color: "text.primary", fontWeight: 600 }}
      >
        {title}
      </Typography>
      <Box sx={{ width: 40, height: 3, borderRadius: 1, bgcolor: "primary.main", mt: 1.5 }} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 672, lineHeight: 1.7 }}>
        {message}
      </Typography>
      <Grid container spacing={1.5} sx={{ mt: 3 }}>
        {choices.map((choice) => (
          <Grid key={choice.id} size={{ xs: 6, md: 4, lg: 3 }}>
            <ButtonBase
              component={Link}
              href={buildCustomizeHref({ productId: choice.id })}
              sx={{
                display: "block",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                textAlign: "left",
                borderRadius: "10px",
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                transition: "border-color 150ms ease, box-shadow 150ms ease",
                "&:hover": { borderColor: "primary.main", boxShadow: 1 },
                "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
              }}
            >
              <Box sx={{ position: "relative", aspectRatio: "5 / 4", bgcolor: "background.default" }}>
                {choice.images[0] ? (
                  <Image
                    src={choice.images[0]}
                    alt=""
                    fill
                    style={{ objectFit: "contain", padding: 12 }}
                    sizes="200px"
                  />
                ) : null}
              </Box>
              <Typography variant="body2" component="span" sx={{ fontWeight: 600, display: "block", px: 1.5, pt: 1 }}>
                {choice.shortName}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block", px: 1.5, pb: 1.5 }}>
                SKU {choice.sku}
              </Typography>
            </ButtonBase>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

function NotCustomizableState({ product }: { product: Product }) {
  return (
    <Paper component="section" variant="outlined" sx={{ borderRadius: "16px", p: { xs: 3, md: 4 } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ alignItems: { md: "flex-start" } }}>
        <Box
          sx={{
            position: "relative",
            mx: { xs: "auto", md: 0 },
            height: 160,
            width: "100%",
            maxWidth: 200,
            flexShrink: 0,
            overflow: "hidden",
            borderRadius: "10px",
            bgcolor: "background.default",
          }}
        >
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              style={{ objectFit: "contain", padding: 16 }}
              sizes="200px"
            />
          ) : null}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="overline" color="primary" sx={{ fontSize: 11 }}>
            Not configurable
          </Typography>
          <Typography variant="h5" component="h2" sx={{ mt: 0.5 }}>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            SKU {product.sku}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 576, lineHeight: 1.7 }}>
            This catalogue item does not support the board configurator. View the product details to buy it as listed, or choose a customizable board.
          </Typography>
          {product.price > 0 ? (
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1.5 }}>
              {formatPrice(product.price)}
            </Typography>
          ) : null}
          <Stack direction="row" useFlexGap spacing={1.5} sx={{ flexWrap: "wrap", mt: 2.5 }}>
            <Button
              component={Link}
              href={`/products/${product.id}`}
              variant="contained"
              endIcon={<ArrowForwardIcon />}
            >
              View product details
            </Button>
            <Button component={Link} href="/products" variant="outlined" color="inherit">
              Browse catalogue
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function CustomizePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ width: "100%", maxWidth: 1280, mx: "auto", px: { xs: 2.5, md: 4 }, py: 10, display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading customizer...</Typography>
        </Box>
      }
    >
      <CustomizeContent />
    </Suspense>
  );
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Stepper from "@mui/material/Stepper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AppLink from "@/components/Link";
import type { ApplicationType, BoardType, CustomizerState, Product, SurfaceType } from "@/lib/types";
import {
  colours,
  featureOptions,
  frames,
  getProductById,
} from "@/data/catalogue";
import { BoardPreview } from "./BoardPreview";
import { CombinationDesigner } from "./CombinationDesigner";
import { SizeSelector } from "./SizeSelector";
import { FrameSelector } from "./FrameSelector";
import { FinishSelector } from "./FinishSelector";
import { FeatureSelector } from "./FeatureSelector";
import { LogoUploader } from "./LogoUploader";
import { DESKTOP_MQ, SelectableCard, XL_MQ } from "./customizerUi";
import {
  combinationRequiresQuote,
  defaultCombinationLayout,
  getCombinationMaterial,
  layoutSummary,
  normalizeLayout,
  supportsCombinationDesigner,
} from "@/lib/combination";
import {
  customizeFeatureIds,
  featureCanToggle,
  featureName,
  featureNote,
  featureOption,
  normalizeFeatureIds,
} from "@/lib/features";
import { buildCustomizeHref, formatPrice } from "@/lib/format";
import { quoteBoardLabel } from "@/lib/quotes/schema";
import { SaveConfigurationButton } from "@/components/account/SaveConfigurationButton";

const boardTypes: { id: BoardType; label: string }[] = [
  { id: "whiteboard", label: "Whiteboard" },
  { id: "magnetic-whiteboard", label: "Magnetic Whiteboard" },
  { id: "pin-up-board", label: "Pin-up Board" },
  { id: "combination-board", label: "Combination Board" },
];

const surfaceLabels: Record<SurfaceType, string> = {
  "resin-coated": "Resin Coated",
  "melamine-hpl": "Melamine HPL",
  "ceramic-steel": "Ceramic Steel",
  "fabric-softboard": "Fabric Softboard",
  chalkboard: "Chalkboard",
  "dual-side": "Dual Side",
};

type StepId = "board" | "size" | "surface" | "frame" | "accessories" | "review";

const GUIDE_STEPS: { id: Exclude<StepId, "board">; label: string; short: string }[] = [
  { id: "size", label: "Size & Dimensions", short: "Size" },
  { id: "surface", label: "Surface & Layout", short: "Surface" },
  { id: "frame", label: "Frame & Colour", short: "Frame" },
  { id: "accessories", label: "Accessories", short: "Extras" },
  { id: "review", label: "Review & Quote", short: "Review" },
];

export function ProductConfigurator({
  products,
  state,
  application,
  onChange,
  onAddToCart,
}: {
  products: Product[];
  state: CustomizerState;
  application?: ApplicationType | "training-room" | null;
  onChange: (next: Partial<CustomizerState>) => void;
  onAddToCart: (accessoryIds: string[]) => void;
}) {
  const router = useRouter();
  const product = getProductById(state.productId);

  const featureCards = useMemo(() => {
    if (!product) return [];
    return customizeFeatureIds.map((id) => {
      const feature = featureOption(id);
      return {
        id,
        name: feature?.name ?? featureName(id),
        description: feature?.description ?? "",
        selected: id === "magnetic-surface" ? product.magnetic : state.features.includes(id),
        toggleable: featureCanToggle(product, id),
        note: featureNote(product, id),
      };
    });
  }, [product, state.features]);

  useEffect(() => {
    if (!product) return;
    const next = normalizeFeatureIds(product, state.features);
    if (next.join("|") !== state.features.join("|")) onChange({ features: next });
  }, [onChange, product, state.features]);

  useEffect(() => {
    if (!product) return;
    const current = state.combinationLayout ?? defaultCombinationLayout(product);
    if (!supportsCombinationDesigner(product)) {
      const single = defaultCombinationLayout(product);
      if (current.mode !== "single") {
        onChange({ combinationLayout: single });
      } else if (!state.combinationLayout) {
        onChange({ combinationLayout: single });
      }
      return;
    }
    const normalized = normalizeLayout(current, product);
    const same =
      Boolean(state.combinationLayout) &&
      normalized.mode === current.mode &&
      normalized.orientation === current.orientation &&
      normalized.sections.length === current.sections.length &&
      normalized.sections.every(
        (section, index) =>
          section.materialId === current.sections[index]?.materialId &&
          section.percent === current.sections[index]?.percent,
      );
    if (!same) onChange({ combinationLayout: normalized });
  }, [onChange, product, state.combinationLayout]);

  const [accessoryIds, setAccessoryIds] = useState<string[]>([]);
  const [step, setStep] = useState<StepId>("size");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [boardPickerOpen, setBoardPickerOpen] = useState(false);

  useEffect(() => {
    if (!product) return;
    setAccessoryIds((ids) => ids.filter((id) => product.accessories.includes(id)));
  }, [product]);

  useEffect(() => {
    setBoardPickerOpen(false);
    setStep("size");
  }, [state.productId]);

  if (!product || !product.customizable) {
    return null;
  }

  const logoSupported = featureOptions.some(
    (feature) =>
      feature.id === "logo-branding" && feature.boardTypes.includes(product.boardType ?? state.boardType),
  );

  const frame =
    frames.find((item) => item.id === state.frameId) ??
    frames.find((item) => item.id === product.frame) ??
    frames[0];
  const productFrames = frames.filter((item) => item.id === product.frame);
  const productColours = colours.filter((item) => product.colours.includes(item.id));
  const colour = productColours.find((item) => item.id === state.colourId) ?? productColours[0] ?? colours[0];
  const selectedSize = product.sizes.find((size) => size.id === state.sizeId) ?? product.sizes[0];
  const widthFt = state.useCustomSize ? state.customWidthFt : (selectedSize?.widthFt ?? 4);
  const heightFt = state.useCustomSize ? state.customHeightFt : (selectedSize?.heightFt ?? 3);
  const sizeLabel = state.useCustomSize
    ? `${state.customWidthFt} × ${state.customHeightFt} ft`
    : selectedSize?.label ?? "Listed size";
  const surfaceLabel = surfaceLabels[product.surface] ?? product.surface;
  const comboEnabled = supportsCombinationDesigner(product);
  const layout = comboEnabled
    ? normalizeLayout(state.combinationLayout ?? defaultCombinationLayout(product), product)
    : defaultCombinationLayout(product);
  const layoutLabel = layoutSummary(layout);
  const needsComboQuote = combinationRequiresQuote(layout);

  const customizableProducts = products.filter((item) => item.customizable);
  const visibleTypes = boardTypes.filter((type) =>
    customizableProducts.some((item) => item.boardType === type.id),
  );
  const boardProducts = customizableProducts.filter((item) => item.boardType === state.boardType);
  const choices = boardProducts.length ? boardProducts : customizableProducts;

  const related = (product.accessories ?? [])
    .map((id) => getProductById(id))
    .filter((item): item is Product => Boolean(item));
  const stands = related.filter((item) => item.category === "stand");
  const accessories = related.filter(
    (item) => item.category === "accessory" || item.category === "desk-accessory",
  );

  const selectedAccessories = accessories.filter((item) => accessoryIds.includes(item.id));
  const selectedStand = stands.find((item) => accessoryIds.includes(item.id));
  const accessoryTotal = accessoryIds.reduce((sum, id) => sum + (getProductById(id)?.price ?? 0), 0);
  const canAddToCart = product.price > 0 && !state.useCustomSize && !needsComboQuote;
  const listedTotal = canAddToCart ? product.price * state.quantity + accessoryTotal : undefined;

  const customSizeValid =
    !state.useCustomSize ||
    (state.customWidthFt >= 1 &&
      state.customWidthFt <= 20 &&
      state.customHeightFt >= 1 &&
      state.customHeightFt <= 20);

  const catalogueApplication =
    application && application !== "training-room" ? application : undefined;
  const spaceLabel =
    application === "training-room" ||
    (catalogueApplication && product.applications.includes(catalogueApplication))
      ? application?.replace(/-/g, " ") ?? null
      : null;

  const selectProduct = (next: Product) => {
    if (!next.customizable) return;
    // URL is the source of truth so refresh / share keeps the selected product.
    router.replace(
      buildCustomizeHref({
        productId: next.id,
        ...(application ? { application } : {}),
      }),
    );
  };

  const selectedFeatureIds = normalizeFeatureIds(product, state.features);
  const selectedFeatureNames = selectedFeatureIds.map(featureName);
  const accessoriesLabel =
    [...(selectedStand ? [selectedStand.shortName] : []), ...selectedAccessories.map((a) => a.shortName)].join(
      ", ",
    ) || "None";

  const quoteHref = `/quote?${new URLSearchParams({
    boardType: quoteBoardLabel(product),
    customSize: sizeLabel,
    quantity: String(state.quantity),
    colour: colour.name,
    features: selectedFeatureNames.join(", "),
    branding: state.branding ? "Yes" : "No",
    product: product.shortName,
    productId: product.id,
    frame: frame.name,
    surface: surfaceLabel,
    accessories: [
      selectedStand?.shortName,
      ...selectedAccessories.map((item) => item.shortName),
    ]
      .filter(Boolean)
      .join(", "),
    layout: layoutLabel,
    ...(needsComboQuote ? { combination: "1" } : {}),
    ...(state.useCustomSize ? { custom: "1" } : {}),
    ...(application ? { application } : {}),
    config: [
      product.shortName,
      sizeLabel,
      layoutLabel,
      surfaceLabel,
      frame.name,
      selectedStand?.shortName,
      selectedFeatureNames.join(", "),
      selectedAccessories.map((item) => item.shortName).join(", "),
    ]
      .filter(Boolean)
      .join(" · "),
  }).toString()}`;

  const activeGuideIndex = GUIDE_STEPS.findIndex((item) => item.id === step);

  const goNext = () => {
    if (step === "board") {
      setStep("size");
      setBoardPickerOpen(false);
      return;
    }
    if (step === "size" && !customSizeValid) return;
    const idx = GUIDE_STEPS.findIndex((item) => item.id === step);
    if (idx >= 0 && idx < GUIDE_STEPS.length - 1) setStep(GUIDE_STEPS[idx + 1].id);
  };

  const goPrev = () => {
    if (step === "board") return;
    const idx = GUIDE_STEPS.findIndex((item) => item.id === step);
    if (idx > 0) setStep(GUIDE_STEPS[idx - 1].id);
    else setBoardPickerOpen(true);
  };

  const previewProps = {
    surfaceHex: colour.hex,
    frameSwatch: frame.swatch,
    frameId: state.frameId,
    surfaceType: product.surface,
    boardTypeLabel: boardTypes.find((type) => type.id === product.boardType)?.label ?? "Board",
    productName: product.shortName,
    productCode: product.sku,
    sizeLabel,
    frameName: frame.name,
    colourName: colour.name,
    surfaceLabel: layout.mode === "single" ? surfaceLabel : undefined,
    layoutSummary: layoutLabel,
    combinationLayout: layout,
    widthFt,
    heightFt,
    features: selectedFeatureIds,
    magnetic: product.magnetic,
    logoDataUrl: state.logoDataUrl,
    branding: state.branding,
    quantity: state.quantity,
    image: product.images[0],
    sideImage: product.images[1],
    accessoriesLabel,
  };

  const saveConfig = (
    <SaveConfigurationButton
      productId={product.id}
      quantity={state.quantity}
      configuration={{
        sizeId: state.sizeId,
        frameId: state.frameId,
        colourId: state.colourId,
        features: selectedFeatureIds,
        customWidthFt: state.useCustomSize ? state.customWidthFt : undefined,
        customHeightFt: state.useCustomSize ? state.customHeightFt : undefined,
        branding: state.branding,
        combinationLayout: layout,
      }}
    />
  );

  const primaryAction = canAddToCart ? (
    <Button type="button" variant="contained" fullWidth onClick={() => onAddToCart(accessoryIds)}>
      Add to Cart
    </Button>
  ) : (
    <Box>
      <Button
        component={AppLink}
        href={quoteHref}
        variant="contained"
        color="primary"
        fullWidth
        sx={{ fontWeight: 700, minHeight: 48 }}
      >
        Request a Quote
      </Button>
      <Typography
        variant="caption"
        component="p"
        color="text.secondary"
        sx={{ mt: 0.9, textAlign: "center", lineHeight: 1.55 }}
      >
        Get a personalised price based on your board size, design and requirements.
      </Typography>
    </Box>
  );

  const summaryBlock = (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "primary.main", fontWeight: 700 }}
          >
            Order summary
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.35, color: "text.primary" }}>
            {product.shortName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            {product.sku}
          </Typography>
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexShrink: 0, color: "text.primary" }}>
          {listedTotal !== undefined ? formatPrice(listedTotal) : "Request a Quote"}
        </Typography>
      </Stack>

      <Stack component="dl" spacing={0.85} sx={{ m: 0, mt: 1.75, fontSize: 13 }}>
        <SummaryRow label="Size" value={sizeLabel} />
        {layout.mode === "single" ? (
          <SummaryRow label="Surface" value={surfaceLabel} />
        ) : (
          layout.sections.map((section, index) => (
            <SummaryRow
              key={section.id}
              label={`Section ${index + 1}`}
              value={`${section.percent}% ${getCombinationMaterial(section.materialId).shortLabel}`}
            />
          ))
        )}
        <SummaryRow label="Frame" value={frame.name} />
        <SummaryRow label="Colour" value={colour.name} />
        <SummaryRow label="Accessories" value={accessoriesLabel} />
        {spaceLabel ? <SummaryRow label="Space" value={spaceLabel} /> : null}
      </Stack>

      {(needsComboQuote || state.useCustomSize || product.price <= 0) && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5, lineHeight: 1.65 }}>
          {needsComboQuote
            ? "Combination layouts are quoted individually — catalogue list price does not apply."
            : state.useCustomSize
              ? "Custom dimensions require a quote — listed sizes keep catalogue pricing."
              : "This configuration is priced on request. Submit a quote for an accurate offer."}
        </Typography>
      )}

      <Stack spacing={1} sx={{ mt: 2 }}>
        {primaryAction}
        {canAddToCart ? (
          <MuiLink
            component={AppLink}
            href={quoteHref}
            underline="hover"
            variant="body2"
            sx={{ display: "block", textAlign: "center", fontWeight: 600 }}
          >
            Or request a quote
          </MuiLink>
        ) : null}
        <Box sx={{ pt: 0.5 }}>{saveConfig}</Box>
      </Stack>
    </Box>
  );

  const showBoardStep = boardPickerOpen || step === "board";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Mobile / tablet preview — updates with the same shared state */}
      <Box sx={{ [DESKTOP_MQ]: { display: "none" } }}>
        <BoardPreview {...previewProps} showDetails={false} compact />
      </Box>

      <Box
        sx={{
          display: "grid",
          alignItems: "start",
          gap: { xs: 3, lg: 4 },
          gridTemplateColumns: "minmax(0, 1fr)",
          [DESKTOP_MQ]: {
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
          },
          [XL_MQ]: { columnGap: 5 },
        }}
      >
        {/* Left: option steps */}
        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 3,
            pb: { xs: 12, lg: 4 },
          }}
        >
          <Box component="header">
            <Button
              component={AppLink}
              href="/products"
              size="small"
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
              sx={{ px: 0, py: 0.25, minWidth: 0, fontSize: 13, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
            >
              Products
            </Button>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Box
                sx={{
                  position: "relative",
                  width: 64,
                  height: 64,
                  flexShrink: 0,
                  overflow: "hidden",
                  borderRadius: "12px",
                  bgcolor: "primary.light",
                }}
              >
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    style={{ objectFit: "contain", padding: 6 }}
                    sizes="64px"
                    priority
                  />
                ) : null}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" component="h2" sx={{ fontSize: { xs: "1.25rem", md: "1.35rem" } }}>
                  {product.shortName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
                  {product.sku}
                  <Box component="span" sx={{ mx: 0.75, opacity: 0.4 }} aria-hidden>
                    ·
                  </Box>
                  {product.shortDescription}
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    setBoardPickerOpen((open) => !open);
                    setStep("board");
                  }}
                  sx={{ mt: 0.5, px: 0, py: 0.25, minWidth: 0, fontSize: 13, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
                >
                  {boardPickerOpen ? "Keep this board" : "Change board"}
                </Button>
              </Box>
            </Stack>
          </Box>

          {!boardPickerOpen ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, fontSize: 13 }}>
                Step {Math.max(1, activeGuideIndex + 1)} of {GUIDE_STEPS.length}:{" "}
                <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {GUIDE_STEPS[Math.max(0, activeGuideIndex)]?.label}
                </Box>
              </Typography>
              <Stepper
                nonLinear
                activeStep={activeGuideIndex}
                aria-label="Customization steps"
                sx={{
                  flexWrap: "wrap",
                  rowGap: 1,
                  "& .MuiStepLabel-label": { fontSize: 12.5, fontWeight: 600 },
                  "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": {
                    color: "primary.main",
                  },
                }}
              >
                {GUIDE_STEPS.map((item, index) => (
                  <Step key={item.id} completed={activeGuideIndex > index}>
                    <StepButton
                      color="inherit"
                      aria-current={item.id === step ? "step" : undefined}
                      onClick={() => setStep(item.id)}
                      sx={{ py: 0.5, px: 0.75 }}
                    >
                      {item.short}
                    </StepButton>
                  </Step>
                ))}
              </Stepper>
            </Box>
          ) : null}

          <Stack spacing={2.5}>
            {showBoardStep ? (
              <StepPanel title="Choose your board" helper="Pick a customizable board from the catalogue.">
                <Tabs
                  value={visibleTypes.some((type) => type.id === state.boardType) ? state.boardType : false}
                  onChange={(_, boardType: BoardType) => {
                    const next =
                      customizableProducts.find((item) => item.boardType === boardType) ??
                      customizableProducts[0];
                    if (next) selectProduct(next);
                  }}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  aria-label="Board type"
                  sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, fontSize: 13 } }}
                >
                  {visibleTypes.map((type) => (
                    <Tab key={type.id} value={type.id} label={type.label} />
                  ))}
                </Tabs>
                <Grid container spacing={1.5} sx={{ mt: 2 }}>
                  {choices.map((choice) => (
                    <Grid key={choice.id} size={6}>
                      <SelectableCard
                        selected={choice.id === product.id}
                        onClick={() => selectProduct(choice)}
                        sx={{ height: "100%" }}
                      >
                        <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "primary.light" }}>
                          {choice.images[0] ? (
                            <Image
                              src={choice.images[0]}
                              alt=""
                              fill
                              style={{ objectFit: "contain", padding: 10 }}
                              sizes="160px"
                            />
                          ) : null}
                        </Box>
                        <Typography variant="body2" component="span" sx={{ fontWeight: 600, display: "block", px: 1.25, pt: 1, lineHeight: 1.35 }}>
                          {choice.shortName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block", px: 1.25, pt: 0.5, pb: 1.25 }}>
                          {choice.price > 0 ? formatPrice(choice.price) : "On request"}
                        </Typography>
                      </SelectableCard>
                    </Grid>
                  ))}
                </Grid>
              </StepPanel>
            ) : null}

            {!boardPickerOpen && step === "size" ? (
              <StepPanel title="Size & Dimensions" helper="Listed sizes show catalogue pricing. Custom sizes go to quote.">
                <SizeSelector
                  sizeId={state.sizeId}
                  useCustomSize={state.useCustomSize}
                  customWidthFt={state.customWidthFt}
                  customHeightFt={state.customHeightFt}
                  sizes={product.sizes}
                  allowCustom={product.customizable}
                  listedPriceLabel={product.price > 0 ? formatPrice(product.price) : undefined}
                  onChange={onChange}
                />
              </StepPanel>
            ) : null}

            {!boardPickerOpen && step === "surface" ? (
              <StepPanel
                title="Surface & Layout"
                helper={
                  comboEnabled
                    ? "Choose a single surface or combination layout. Watch the live preview update as you adjust sections."
                    : "This board’s catalogue surface is shown below. Optional features update the live preview immediately."
                }
              >
                {!comboEnabled ? (
                  <SelectableCard
                    selected
                    onClick={() => undefined}
                    sx={{ px: 2, py: 1.75, mb: 2, cursor: "default" }}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <Box
                        aria-hidden
                        sx={{
                          width: 44,
                          height: 44,
                          flexShrink: 0,
                          borderRadius: "6px",
                          border: "1px solid",
                          borderColor: "divider",
                          background:
                            product.surface === "chalkboard"
                              ? "#2F4A3A"
                              : product.surface === "fabric-softboard"
                                ? colour.hex
                                : "linear-gradient(145deg,#fff,#F3F3F1)",
                        }}
                      />
                      <Box>
                        <Typography variant="body2" component="span" sx={{ fontWeight: 700, display: "block" }}>
                          {surfaceLabel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="span">
                          {product.magnetic ? "Magnetic writing surface" : "Non-magnetic surface"} · listed for this SKU
                        </Typography>
                      </Box>
                    </Stack>
                  </SelectableCard>
                ) : (
                  <CombinationDesigner
                    product={product}
                    layout={layout}
                    widthFt={widthFt}
                    heightFt={heightFt}
                    onChange={(combinationLayout) =>
                      onChange({ combinationLayout: normalizeLayout(combinationLayout, product) })
                    }
                  />
                )}

                <Box sx={{ mt: comboEnabled ? 2.5 : 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.25 }}>
                    Optional features
                  </Typography>
                  <FeatureSelector
                    cards={featureCards}
                    onToggle={(id) => {
                      if (!featureCanToggle(product, id)) return;
                      const next = state.features.includes(id)
                        ? state.features.filter((feature) => feature !== id)
                        : [...state.features, id];
                      onChange({ features: normalizeFeatureIds(product, next) });
                    }}
                  />
                </Box>
              </StepPanel>
            ) : null}

            {!boardPickerOpen && step === "frame" ? (
              <StepPanel title="Frame & Colour" helper="Options listed for this board only.">
                <FrameSelector
                  frames={productFrames.length ? productFrames : [frame]}
                  value={state.frameId}
                  onChange={(frameId) => onChange({ frameId })}
                  lockedNote={
                    productFrames.length <= 1
                      ? "This board ships with the frame listed below."
                      : undefined
                  }
                />
                <Box sx={{ mt: 3 }}>
                  <FinishSelector
                    colours={productColours.length ? productColours : [colour]}
                    value={colour.id}
                    onChange={(colourId) => onChange({ colourId })}
                  />
                </Box>
              </StepPanel>
            ) : null}

            {!boardPickerOpen && step === "accessories" ? (
              <StepPanel title="Accessories" helper="Compatible add-ons for this board. Quantity applies to the board.">
                {stands.length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      Mounting
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <SelectableCard
                          selected={!selectedStand}
                          onClick={() =>
                            setAccessoryIds((ids) => ids.filter((id) => !stands.some((stand) => stand.id === id)))
                          }
                          sx={{ px: 2, py: 1.5, height: "100%" }}
                        >
                          <Typography variant="body2" component="span" sx={{ fontWeight: 600, display: "block" }}>
                            Wall mount
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block", mt: 0.5 }}>
                            Standard wall installation
                          </Typography>
                        </SelectableCard>
                      </Grid>
                      {stands.map((stand) => (
                        <Grid key={stand.id} size={{ xs: 12, sm: 6 }}>
                          <SelectableCard
                            selected={selectedStand?.id === stand.id}
                            onClick={() =>
                              setAccessoryIds((ids) => [
                                ...ids.filter((id) => !stands.some((item) => item.id === id)),
                                stand.id,
                              ])
                            }
                            sx={{ px: 2, py: 1.5, height: "100%" }}
                          >
                            <Typography variant="body2" component="span" sx={{ fontWeight: 600, display: "block" }}>
                              {stand.shortName}
                            </Typography>
                            {stand.price > 0 ? (
                              <Typography variant="caption" color="primary" component="span" sx={{ fontWeight: 600, display: "block", mt: 0.5 }}>
                                {formatPrice(stand.price)}
                              </Typography>
                            ) : null}
                          </SelectableCard>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ) : null}

                {accessories.length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      Add-ons
                    </Typography>
                    <Grid container spacing={1.5}>
                      {accessories.map((item) => {
                        const selected = accessoryIds.includes(item.id);
                        return (
                          <Grid key={item.id} size={{ xs: 12, sm: 6 }}>
                            <Paper
                              variant="outlined"
                              sx={{
                                height: "100%",
                                borderRadius: "12px",
                                p: 1.5,
                                borderColor: selected ? "primary.main" : "divider",
                                bgcolor: selected ? "primary.light" : "background.paper",
                              }}
                            >
                              <FormControlLabel
                                sx={{ alignItems: "flex-start", m: 0, width: "100%", gap: 0.5 }}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={selected}
                                    onChange={() =>
                                      setAccessoryIds((ids) =>
                                        ids.includes(item.id)
                                          ? ids.filter((id) => id !== item.id)
                                          : [...ids, item.id],
                                      )
                                    }
                                    sx={{ p: 0.5, mt: 0.25 }}
                                  />
                                }
                                label={
                                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                                    <Box
                                      sx={{
                                        position: "relative",
                                        width: 48,
                                        height: 48,
                                        flexShrink: 0,
                                        overflow: "hidden",
                                        borderRadius: "6px",
                                        bgcolor: "background.default",
                                      }}
                                    >
                                      {item.images[0] ? (
                                        <Image
                                          src={item.images[0]}
                                          alt=""
                                          fill
                                          style={{ objectFit: "contain", padding: 4 }}
                                          sizes="48px"
                                        />
                                      ) : null}
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {item.shortName}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.35 }}>
                                        {item.shortDescription}
                                      </Typography>
                                      {item.price > 0 ? (
                                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mt: 0.5 }}>
                                          + {formatPrice(item.price)}
                                        </Typography>
                                      ) : (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                                          Price on request
                                        </Typography>
                                      )}
                                    </Box>
                                  </Stack>
                                }
                              />
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{ mb: 3, borderRadius: "12px", bgcolor: "background.default", px: 2, py: 1.5 }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      No catalogue accessories are listed for this board.
                    </Typography>
                  </Paper>
                )}

                {logoSupported ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      Logo branding
                    </Typography>
                    <LogoUploader
                      enabled={state.branding}
                      logoDataUrl={state.logoDataUrl}
                      onToggle={(branding) =>
                        onChange({
                          branding,
                          logoDataUrl: branding ? state.logoDataUrl : undefined,
                          features: branding
                            ? Array.from(new Set([...state.features, "logo-branding"]))
                            : state.features.filter((feature) => feature !== "logo-branding"),
                        })
                      }
                      onUpload={(logoDataUrl) =>
                        onChange({
                          logoDataUrl,
                          branding: Boolean(logoDataUrl),
                          features: logoDataUrl
                            ? Array.from(new Set([...state.features, "logo-branding"]))
                            : state.features.filter((feature) => feature !== "logo-branding"),
                        })
                      }
                    />
                  </Box>
                ) : null}

                <TextField
                  type="number"
                  label="Quantity"
                  value={state.quantity}
                  onChange={(event) =>
                    onChange({ quantity: Math.max(1, Math.min(99, Number(event.target.value) || 1)) })
                  }
                  slotProps={{ htmlInput: { min: 1, max: 99 } }}
                  sx={{ width: 120 }}
                />
              </StepPanel>
            ) : null}

            {!boardPickerOpen && step === "review" ? (
              <StepPanel
                title="Review & Quote"
                helper="Confirm your configuration. The live preview and summary already reflect your selections."
              >
                <Paper variant="outlined" sx={{ borderRadius: "10px", p: 2, borderColor: "divider" }}>
                  <Stack component="dl" spacing={1} sx={{ m: 0, fontSize: 14 }}>
                    <SummaryRow label="Product" value={`${product.shortName} (${product.sku})`} />
                    <SummaryRow label="Size" value={sizeLabel} />
                    <SummaryRow label="Surface" value={surfaceLabel} />
                    <SummaryRow label="Layout" value={layoutLabel} />
                    <SummaryRow label="Frame" value={frame.name} />
                    <SummaryRow label="Colour" value={colour.name} />
                    <SummaryRow label="Accessories" value={accessoriesLabel} />
                    <SummaryRow
                      label="Price"
                      value={listedTotal !== undefined ? formatPrice(listedTotal) : "Request a Quote"}
                    />
                  </Stack>
                </Paper>
                <Stack spacing={1.25} sx={{ mt: 2.5, display: { xs: "none", lg: "flex" } }}>
                  {primaryAction}
                  <Box>{saveConfig}</Box>
                </Stack>
              </StepPanel>
            ) : null}

            {/* Step navigation */}
            <Stack
              direction="row"
              useFlexGap
              spacing={1.25}
              sx={{ alignItems: "center", justifyContent: "space-between", pt: 0.5, flexWrap: "wrap", rowGap: 1 }}
            >
              <Button
                color="inherit"
                onClick={goPrev}
                disabled={boardPickerOpen || step === "board"}
                startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                sx={{ px: 1.5, py: 0.75 }}
              >
                Back
              </Button>
              {showBoardStep || step !== "review" ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={goNext}
                  disabled={step === "size" && !customSizeValid}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                  sx={{ borderRadius: 0.5, px: 2.5, py: 1, fontWeight: 600 }}
                >
                  {step === "accessories" ? "Review configuration" : "Continue"}
                </Button>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 220, textAlign: "right" }}>
                  Use Request a Quote or Add to Cart in the summary to finish.
                </Typography>
              )}
            </Stack>
          </Stack>
        </Box>

        {/* Right: sticky live preview + summary */}
        <Box
          component="aside"
          sx={{
            display: "none",
            minWidth: 0,
            [DESKTOP_MQ]: {
              display: "block",
              position: "sticky",
              top: "calc(var(--header-h, 88px) + 16px)",
              alignSelf: "start",
            },
          }}
        >
          <Stack spacing={2}>
            <BoardPreview {...previewProps} showDetails={false} />
            {!boardPickerOpen ? (
              <Paper variant="outlined" sx={{ borderRadius: "12px", borderColor: "divider", px: 2.5, py: 2 }}>
                {summaryBlock}
              </Paper>
            ) : null}
          </Stack>
        </Box>
      </Box>

      {/* Mobile sticky summary */}
      <Paper
        square
        elevation={0}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "var(--mobile-nav-h, 0px)",
          zIndex: 40,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          [DESKTOP_MQ]: { display: "none" },
        }}
      >
        <ButtonBase
          type="button"
          onClick={() => setSummaryOpen((open) => !open)}
          aria-expanded={summaryOpen}
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            textAlign: "left",
          }}
        >
          <Box component="span">
            <Typography
              component="span"
              variant="overline"
              color="text.secondary"
              sx={{ display: "block", fontSize: 11, lineHeight: 1.6 }}
            >
              Summary
            </Typography>
            <Typography component="span" variant="body2" sx={{ fontWeight: 600, display: "block", mt: 0.25 }}>
              {listedTotal !== undefined ? formatPrice(listedTotal) : "Request a quote"}
              <Box component="span" sx={{ ml: 1, fontWeight: 400, color: "text.secondary" }}>
                · {sizeLabel}
              </Box>
            </Typography>
          </Box>
          {summaryOpen ? <KeyboardArrowDownIcon aria-hidden /> : <KeyboardArrowUpIcon aria-hidden />}
        </ButtonBase>
        {summaryOpen ? (
          <Box sx={{ maxHeight: "50vh", overflowY: "auto", px: 2, pb: 2 }}>{summaryBlock}</Box>
        ) : (
          <Box sx={{ px: 2, pb: 1.5 }}>{primaryAction}</Box>
        )}
      </Paper>
    </Box>
  );
}

function StepPanel({
  title,
  helper,
  children,
}: {
  title: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <Box component="section">
      <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: 13, lineHeight: 1.6 }}>
        {helper}
      </Typography>
      <Box sx={{ mt: 2 }}>{children}</Box>
    </Box>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between" }}>
      <Box component="dt" sx={{ flexShrink: 0, color: "text.secondary" }}>
        {label}
      </Box>
      <Box component="dd" sx={{ m: 0, maxWidth: "68%", textAlign: "right", fontWeight: 500, lineHeight: 1.35 }}>
        {value}
      </Box>
    </Stack>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import Link from "@/components/Link";
import {
  colours,
  featureOptions,
  frames,
  getProductById,
} from "@/data/catalogue";
import {
  getDefaultProductForKind,
  visualizeBoardKinds,
  visualizeFrameGroups,
  visualizeSizePresets,
} from "@/data/wallModels";
import { useAIChat } from "@/context/AIChatContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import type {
  FrameType,
  Product,
  VisualizeBoardKind,
  VisualizeState,
  WallModel,
} from "@/lib/types";
import { WallScene } from "./WallScene";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { AIProductCard } from "@/components/ai/AIProductCard";

type StudioStep = "board" | "customize" | "preview" | "quote";

const stepper = [
  { id: "space", label: "Choose Space" },
  { id: "board", label: "Choose Board" },
  { id: "customize", label: "Customize" },
  { id: "preview", label: "Preview" },
  { id: "quote", label: "Request Quote" },
] as const;

function stepIndex(step: StudioStep) {
  if (step === "board") return 1;
  if (step === "customize") return 2;
  if (step === "preview") return 3;
  return 4;
}

function clampSize(wall: WallModel, w: number, h: number) {
  return {
    widthFt: Math.min(Math.max(1, w), wall.wallArea.maxWidthFt),
    heightFt: Math.min(Math.max(1, h), wall.wallArea.maxHeightFt),
  };
}

function isBoardProduct(product: Product) {
  return !["accessory", "stand", "desk-accessory"].includes(product.category);
}

function kindForProduct(product: Product): VisualizeBoardKind {
  return (
    visualizeBoardKinds.find((kind) => kind.defaultProductId === product.id)?.id ??
    (product.category === "non-magnetic-whiteboard"
      ? "non-magnetic-whiteboard"
      : product.category === "notice-board"
        ? "notice-board"
        : product.category === "pin-up-board"
          ? "pin-up-board"
          : product.category === "combination-board"
            ? "combination-board"
            : product.category === "chalk-board"
              ? "chalk-board"
              : product.id === "scuv90120"
                ? "ceramic-glass"
                : "magnetic-whiteboard")
  );
}

function fitSentence(wall: WallModel) {
  const listed = wall.recommendedBoards
    .map((id) => getProductById(id))
    .filter((product): product is Product => Boolean(product));
  const board = listed.find(isBoardProduct);
  const extra = listed.find((product) => !isBoardProduct(product));
  if (!board) return null;
  const size = board.sizes[0];
  const sizeText = size ? `${size.label} ` : "";
  const extraText = extra ? ` with a ${extra.shortName}` : "";
  return `For this ${wall.name.toLowerCase()}, a ${sizeText}${board.shortName}${extraText} may be suitable.`;
}

function buildInitialState(wall: WallModel): VisualizeState {
  const kind: VisualizeBoardKind = "magnetic-whiteboard";
  const productId =
    wall.recommendedBoards.find((id) => {
      const product = getProductById(id);
      return product && isBoardProduct(product);
    }) ?? getDefaultProductForKind(kind);
  const product = getProductById(productId);
  const preset = product?.sizes[0] ?? visualizeSizePresets.find((size) => size.id === "3x4")!;
  const sized = clampSize(wall, preset.widthFt, preset.heightFt);

  return {
    wallId: wall.id,
    boardKind: product ? kindForProduct(product) : kind,
    productId,
    widthFt: sized.widthFt,
    heightFt: sized.heightFt,
    useCustomSize: false,
    sizeId: preset.id,
    frameId: product?.frame ?? "aluminium-light",
    colourId: product?.colours[0] ?? "white",
    features: product?.magnetic ? ["magnetic-surface"] : [],
    logoScale: 1,
    logoX: 0.18,
    logoY: 0.16,
    accessoryIds: [],
    boardOffsetX: 0,
    boardOffsetY: 0,
    quantity: 1,
  };
}

export function WallStudio({ wall }: { wall: WallModel }) {
  const { addItem } = useCart();
  const { openChat, messages, applySuggestion } = useAIChat();
  const sceneRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<VisualizeState>(() => buildInitialState(wall));
  const [boardPlaced, setBoardPlaced] = useState(true);
  const [compare, setCompare] = useState(false);
  const [comparePercent, setComparePercent] = useState(45);
  const [savedNote, setSavedNote] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [step, setStep] = useState<StudioStep>("board");
  const [reached, setReached] = useState(1);
  const [zoom, setZoom] = useState(1);

  const product = getProductById(state.productId);
  const colour = colours.find((item) => item.id === state.colourId) ?? colours[0];
  const frame = frames.find((item) => item.id === state.frameId) ?? frames[0];
  const suggestion = fitSentence(wall);

  const boardChoices = visualizeBoardKinds
    .map((kind) => ({ kind, product: getProductById(kind.defaultProductId) }))
    .filter((item): item is { kind: (typeof visualizeBoardKinds)[number]; product: Product } =>
      Boolean(item.product),
    );

  const sizeChoices = product?.sizes ?? [];
  const relatedProducts = (product?.accessories ?? [])
    .map((id) => getProductById(id))
    .filter((item): item is Product => Boolean(item));
  const standOptions = relatedProducts.filter((item) => item.category === "stand");
  const accessoryChoices = relatedProducts.filter((item) => item.category !== "stand");
  const selectedRelatedIds = state.accessoryIds.filter((id) =>
    relatedProducts.some((item) => item.id === id),
  );

  const availableFrames = useMemo(() => {
    if (!product) return frames;
    const productFrame = product.frame;
    return frames.filter((item) => {
      if (item.id === productFrame) return true;
      return visualizeFrameGroups.some((group) =>
        (group.frameIds as readonly string[]).includes(item.id),
      );
    });
  }, [product]);

  const layoutFeatures = useMemo(() => {
    const boardType = product?.boardType ?? "magnetic-whiteboard";
    return featureOptions.filter(
      (feature) =>
        feature.id !== "logo-branding" && feature.boardTypes.includes(boardType),
    );
  }, [product]);

  const accessoryTotal = selectedRelatedIds.reduce((sum, id) => {
    return sum + (getProductById(id)?.price ?? 0);
  }, 0);
  const estimated =
    product && product.price > 0 ? (product.price + accessoryTotal) * state.quantity : undefined;

  const patch = useCallback((partial: Partial<VisualizeState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const go = (next: StudioStep) => {
    const index = stepIndex(next);
    setReached((value) => Math.max(value, index));
    setStep(next);
  };

  const selectBoardKind = (kind: VisualizeBoardKind) => {
    const productId = getDefaultProductForKind(kind);
    const nextProduct = getProductById(productId);
    const size = nextProduct?.sizes[0];
    const sized = size
      ? clampSize(wall, size.widthFt, size.heightFt)
      : { widthFt: state.widthFt, heightFt: state.heightFt };
    setBoardPlaced(true);
    patch({
      boardKind: kind,
      productId,
      frameId: nextProduct?.frame ?? "aluminium-light",
      colourId: nextProduct?.colours[0] ?? "white",
      features: nextProduct?.magnetic ? ["magnetic-surface"] : [],
      sizeId: size?.id ?? state.sizeId,
      useCustomSize: false,
      widthFt: sized.widthFt,
      heightFt: sized.heightFt,
      boardOffsetX: 0,
      boardOffsetY: 0,
      accessoryIds: state.accessoryIds.filter((id) => nextProduct?.accessories.includes(id)),
    });
  };

  const applySize = (id: string, widthFt: number, heightFt: number) => {
    const sized = clampSize(wall, widthFt, heightFt);
    patch({
      sizeId: id,
      useCustomSize: false,
      widthFt: sized.widthFt,
      heightFt: sized.heightFt,
      boardOffsetX: 0,
      boardOffsetY: 0,
    });
  };

  const setCustomSize = (widthFt: number, heightFt: number) => {
    const sized = clampSize(wall, widthFt, heightFt);
    patch({
      useCustomSize: true,
      sizeId: "custom",
      widthFt: sized.widthFt,
      heightFt: sized.heightFt,
      boardOffsetX: 0,
      boardOffsetY: 0,
    });
  };

  const toggleFeature = (id: string) => {
    const next = state.features.includes(id)
      ? state.features.filter((feature) => feature !== id)
      : [...state.features, id];
    patch({ features: next });
  };

  const toggleAccessory = (id: string) => {
    const next = state.accessoryIds.includes(id)
      ? state.accessoryIds.filter((item) => item !== id)
      : [...state.accessoryIds, id];
    patch({ accessoryIds: next });
  };

  const setMounted = (standId: string | null) => {
    const withoutStands = state.accessoryIds.filter(
      (id) => !standOptions.some((stand) => stand.id === id),
    );
    patch({ accessoryIds: standId ? [...withoutStands, standId] : withoutStands });
  };

  const nudge = (x: number, y: number) => {
    patch({
      boardOffsetX: Math.max(-0.2, Math.min(0.2, state.boardOffsetX + x)),
      boardOffsetY: Math.max(-0.2, Math.min(0.2, state.boardOffsetY + y)),
    });
  };

  const onLogoUpload = (file: File | null) => {
    if (!file) {
      patch({ logoDataUrl: undefined });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      patch({
        logoDataUrl: String(reader.result),
        features: state.features.includes("logo-branding")
          ? state.features
          : [...state.features, "logo-branding"],
      });
    };
    reader.readAsDataURL(file);
  };

  const addToCart = () => {
    if (!product) return;
    addItem(
      product.id,
      {
        sizeId: state.sizeId,
        frameId: state.frameId,
        colourId: state.colourId,
        features: state.features,
        customWidthFt: state.widthFt,
        customHeightFt: state.heightFt,
        branding: Boolean(state.logoDataUrl) || state.features.includes("logo-branding"),
        logoDataUrl: state.logoDataUrl,
        application: wall.application,
      },
      state.quantity,
    );
    selectedRelatedIds.forEach((id) => addItem(id, {}, 1));
  };

  const saveDesign = () => {
    try {
      localStorage.setItem(`obasix-wall-design-${wall.id}`, JSON.stringify(state));
      setSavedNote("Design saved on this device");
      window.setTimeout(() => setSavedNote(""), 2500);
    } catch {
      setSavedNote("Could not save design");
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`obasix-wall-design-${wall.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as VisualizeState;
        if (parsed.wallId === wall.id) {
          setState(parsed);
          setBoardPlaced(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, [wall.id]);

  const previewProduct = (productId: string) => {
    const nextProduct = getProductById(productId);
    if (!nextProduct || !isBoardProduct(nextProduct)) return;
    const size = nextProduct.sizes[0];
    const sized = size
      ? clampSize(wall, size.widthFt, size.heightFt)
      : { widthFt: state.widthFt, heightFt: state.heightFt };
    setBoardPlaced(true);
    setCompare(false);
    patch({
      boardKind: kindForProduct(nextProduct),
      productId: nextProduct.id,
      frameId: nextProduct.frame,
      colourId: nextProduct.colours[0] ?? "white",
      sizeId: size?.id ?? "3x4",
      widthFt: sized.widthFt,
      heightFt: sized.heightFt,
      features: nextProduct.magnetic ? ["magnetic-surface"] : [],
      accessoryIds: state.accessoryIds.filter((id) => nextProduct.accessories.includes(id)),
    });
    go("preview");
  };

  const askWallAI = () => {
    setAiOpen(true);
    openChat();
    applySuggestion(
      `Which board would look best on this ${wall.name} wall? Recommend size and features.`,
    );
  };

  const toggleFullscreen = () => {
    const node = sceneRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void node.requestFullscreen();
    }
  };

  const recentRecs = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.recommendations?.length)
    ?.recommendations;

  const activeStand = standOptions.find((stand) => state.accessoryIds.includes(stand.id));
  const quoteKind = product ? kindForProduct(product) : null;
  const quoteBoardType =
    (quoteKind &&
      ({
        "magnetic-whiteboard": "Magnetic Whiteboard",
        "non-magnetic-whiteboard": "Non-Magnetic Whiteboard",
        "ceramic-glass": "Magnetic Whiteboard",
        "notice-board": "Notice Board",
        "pin-up-board": "Pin-up Board",
        "combination-board": "Combination Board",
        "chalk-board": "Chalk Board",
      } satisfies Record<VisualizeBoardKind, string>)[quoteKind]) ||
    "Custom Board";
  const frameLabel =
    visualizeFrameGroups.find((group) =>
      (group.frameIds as readonly string[]).includes(state.frameId),
    )?.label ?? frame.name;
  const quoteHref = `/quote?${new URLSearchParams({
    boardType: quoteBoardType,
    customSize: `${state.widthFt}x${state.heightFt}`,
    quantity: String(state.quantity),
    colour: colour.name,
    wall: wall.id,
    product: product?.shortName ?? "",
    productId: product?.id ?? "",
    frame: frameLabel,
    config: [product?.shortName, wall.name].filter(Boolean).join(" · "),
  }).toString()}`;
  const currentIndex = stepIndex(step);

  return (
    <Box sx={{ overflowX: "hidden", bgcolor: "#F2F3F0", pb: 18 }}>
      <PageMasthead
        code="Visualise · Sample room"
        title={wall.name}
        crumbs={[{ href: "/visualize", label: "Visualise" }, { label: wall.name }]}
        compact
        lede={
          <>
            Try boards on this sample wall, or{" "}
            <Box component={Link} href="/visualize" sx={{ color: "#164E3B", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4 }}>
              upload a photo of your own wall
            </Box>
            .
          </>
        }
      >
        <Box component="ol" aria-label="Studio steps" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: `repeat(${stepper.length}, minmax(0, 1fr))`, gap: 0.5 }}>
          {stepper.map((item, index) => {
            const active = item.id === step;
            const done = index < currentIndex || (item.id === "space" && index === 0);
            const locked = index > reached && item.id !== "space";
            const railSx = {
              width: "100%",
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "flex-start",
              gap: 0.5,
              pt: 1.25,
              pb: 0.5,
              textAlign: "left" as const,
              borderTop: "2px solid",
              borderColor: active ? "#1B1D1C" : done ? "#164E3B" : "#E5E5E0",
              color: active ? "#1B1D1C" : "#6B706D",
              "&:hover": { color: "#1B1D1C" },
              "&.Mui-disabled": { opacity: 0.5, color: "#6B706D" },
              "&.Mui-focusVisible, &:focus-visible": { outline: "2px solid #164E3B", outlineOffset: 2 },
            };
            const inner = (
              <>
                <Box component="span" sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: 500, fontSize: 12.5, letterSpacing: "0", color: done && !active ? "#164E3B" : "inherit" }}>
                  {done && !active ? "✓ " : ""}
                  {`0${index + 1}`}
                </Box>
                <Box component="span" sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: active ? 600 : 500, fontSize: { xs: 12, sm: 14.5 }, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
                  {item.label}
                </Box>
              </>
            );
            return (
              <Box component="li" key={item.id} sx={{ minWidth: 0 }}>
                {item.id === "space" ? (
                  <Box component={Link} href="/visualize" sx={railSx}>
                    {inner}
                  </Box>
                ) : (
                  <ButtonBase type="button" disabled={locked} aria-current={active ? "step" : undefined} onClick={() => go(item.id)} sx={railSx}>
                    {inner}
                  </ButtonBase>
                )}
              </Box>
            );
          })}
        </Box>
        <ButtonBase type="button" onClick={askWallAI} sx={{ mt: 2.5, display: "inline-flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", "&.Mui-focusVisible": { outline: "2px solid #164E3B", outlineOffset: 2 } }}>
          <Typography component="span" sx={{ fontSize: 13, color: "#6B706D" }}>
            Not sure what fits your space?
          </Typography>
          <Typography component="span" sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: 600, fontSize: 15.5, color: "#164E3B", textDecoration: "underline", textUnderlineOffset: 4 }}>
            Ask OBASIX AI
          </Typography>
        </ButtonBase>
      </PageMasthead>

      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1440,
          px: { xs: 2, sm: 4, md: 6, lg: 8 },
          display: "grid",
          gap: { xs: 3, lg: 4 },
          py: { xs: 3, lg: 5 },
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.4fr) minmax(280px, 0.8fr)" },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box ref={sceneRef} sx={{ position: "relative", minWidth: 0, bgcolor: "#1B1D1C", borderRadius: { xs: "20px", md: "28px" }, overflow: "hidden" }}>
            <WallScene
              wall={wall}
              state={state}
              frameSwatch={frame.swatch}
              surfaceHex={colour.hex}
              showBoard={boardPlaced}
              compareMode={compare && boardPlaced}
              comparePercent={comparePercent}
              zoom={zoom}
              onBoardOffsetChange={(x, y) => patch({ boardOffsetX: x, boardOffsetY: y })}
              sx={{ minHeight: { xs: 240, lg: 520 }, borderRadius: "16px" }}
            />
            <Stack spacing={0.5} sx={{ position: "absolute", right: 12, top: 12, zIndex: 30 }}>
              <CanvasButton label="Zoom in" onClick={() => setZoom((value) => Math.min(1.8, value + 0.2))}>
                <ZoomInIcon sx={{ fontSize: 16 }} />
              </CanvasButton>
              <CanvasButton label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - 0.2))}>
                <ZoomOutIcon sx={{ fontSize: 16 }} />
              </CanvasButton>
              <CanvasButton
                label="Reset view"
                onClick={() => {
                  setZoom(1);
                  patch({ boardOffsetX: 0, boardOffsetY: 0 });
                }}
              >
                <RestartAltIcon sx={{ fontSize: 16 }} />
              </CanvasButton>
              <CanvasButton label="Fullscreen" onClick={toggleFullscreen}>
                <FullscreenIcon sx={{ fontSize: 16 }} />
              </CanvasButton>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ position: "absolute", bottom: 12, right: 12, zIndex: 30 }}>
              <CanvasButton label="Move left" onClick={() => nudge(-0.02, 0)}>←</CanvasButton>
              <CanvasButton label="Move up" onClick={() => nudge(0, -0.02)}>↑</CanvasButton>
              <CanvasButton label="Move down" onClick={() => nudge(0, 0.02)}>↓</CanvasButton>
              <CanvasButton label="Move right" onClick={() => nudge(0.02, 0)}>→</CanvasButton>
            </Stack>
            {compare && boardPlaced ? (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  zIndex: 30,
                  width: 180,
                  alignItems: "center",
                  bgcolor: "rgba(255,255,255,0.9)",
                  px: 1.5,
                  py: 0.5,
                }}
              >
                <Typography component="span" sx={{ fontSize: 11, fontWeight: 600 }}>
                  Compare
                </Typography>
                <Slider
                  size="small"
                  min={8}
                  max={92}
                  value={comparePercent}
                  onChange={(_, value) => setComparePercent(Array.isArray(value) ? value[0] : value)}
                  aria-label="Compare before and after"
                />
              </Stack>
            ) : null}
          </Box>
          <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
            {product
              ? `${product.shortName} is placed on this ${wall.name} photo.`
              : "Choose a board to place it on this room photo."}
          </Typography>
        </Box>

        <Box component="aside" sx={{ minWidth: 0, bgcolor: "#FFFFFF", borderTop: 0, p: { xs: 2.5, md: 3.5 }, alignSelf: "start" }}>
          <Box key={step} className="finder-step">
            {step === "board" ? (
              <Panel
                title="Choose your board"
                helper="Pick a board that exists in the OBASIX catalogue for this preview."
              >
                <Grid container spacing={1.5}>
                  {boardChoices.map(({ kind, product: choice }) => {
                    const selected = state.boardKind === kind.id;
                    return (
                      <Grid key={kind.id} size={6}>
                        <ButtonBase
                          type="button"
                          aria-pressed={selected}
                          onClick={() => selectBoardKind(kind.id)}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            width: "100%",
                            height: "100%",
                            justifyContent: "flex-start",
                            overflow: "hidden",
                            border: 1,
                            borderColor: selected ? "primary.main" : "divider",
                            bgcolor: "background.paper",
                            textAlign: "left",
                            transition: "transform 0.3s ease, border-color 0.3s ease",
                            "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)" },
                            "@media (prefers-reduced-motion: reduce)": {
                              transition: "none",
                              "&:hover": { transform: "none" },
                            },
                          }}
                        >
                          <Box sx={{ position: "relative", display: "block", aspectRatio: "5 / 4", bgcolor: "background.default" }}>
                            {choice.images[0] ? (
                              <Image
                                src={choice.images[0]}
                                alt=""
                                fill
                                className="object-contain p-3"
                                sizes="180px"
                              />
                            ) : null}
                          </Box>
                          <Typography component="span" sx={{ display: "block", px: 1.5, pt: 1, fontSize: 14, fontWeight: 600 }}>
                            {choice.shortName}
                          </Typography>
                          <Typography component="span" sx={{ display: "block", px: 1.5, fontSize: 12, color: "text.secondary" }}>
                            {kind.label}
                          </Typography>
                          {choice.sizes.length > 0 ? (
                            <Typography component="span" sx={{ display: "block", mt: 0.5, px: 1.5, fontSize: 12, color: "text.secondary" }}>
                              {choice.sizes.map((size) => size.label).join(" · ")}
                            </Typography>
                          ) : null}
                          {choice.price > 0 ? (
                            <Typography component="span" sx={{ display: "block", px: 1.5, py: 1, fontSize: 14, fontWeight: 600 }}>
                              {formatPrice(choice.price)}
                            </Typography>
                          ) : (
                            <Typography component="span" sx={{ display: "block", px: 1.5, py: 1, fontSize: 12, color: "text.secondary" }}>
                              Price on request
                            </Typography>
                          )}
                          {selected ? (
                            <Typography
                              component="span"
                              sx={{
                                display: "block",
                                px: 1.5,
                                pb: 1,
                                fontSize: 12,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: "secondary.main",
                              }}
                            >
                              Selected
                            </Typography>
                          ) : null}
                        </ButtonBase>
                      </Grid>
                    );
                  })}
                </Grid>
                <NavRow onNext={() => go("customize")} next="Customize" />
              </Panel>
            ) : null}

            {step === "customize" && product ? (
              <Panel title="Customize" helper="Set the listed size, frame, colour and logo for this board.">
                <Group label="Size">
                  <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
                    {sizeChoices.map((size) => (
                      <Button
                        key={size.id}
                        type="button"
                        variant="outlined"
                        onClick={() => applySize(size.id, size.widthFt, size.heightFt)}
                        sx={choiceSx(!state.useCustomSize && state.sizeId === size.id, "dark")}
                      >
                        {size.label}
                      </Button>
                    ))}
                    {product.customizable ? (
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => setCustomSize(state.widthFt, state.heightFt)}
                        sx={choiceSx(state.useCustomSize, "dark")}
                      >
                        Custom size
                      </Button>
                    ) : null}
                  </Stack>
                  {state.useCustomSize ? (
                    <Grid container spacing={1.5} sx={{ mt: 2 }}>
                      <Grid size={6}>
                        <TextField
                          label="Width in feet"
                          type="number"
                          fullWidth
                          value={state.widthFt}
                          onChange={(event) => setCustomSize(Number(event.target.value), state.heightFt)}
                          slotProps={{ htmlInput: { min: 1, max: wall.wallArea.maxWidthFt, step: 0.5 } }}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          label="Height in feet"
                          type="number"
                          fullWidth
                          value={state.heightFt}
                          onChange={(event) => setCustomSize(state.widthFt, Number(event.target.value))}
                          slotProps={{ htmlInput: { min: 1, max: wall.wallArea.maxHeightFt, step: 0.5 } }}
                        />
                      </Grid>
                    </Grid>
                  ) : null}
                </Group>
                <Group label="Frame">
                  <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
                    {visualizeFrameGroups.map((group) => {
                      const match = availableFrames.find((item) =>
                        (group.frameIds as readonly string[]).includes(item.id),
                      );
                      if (!match) return null;
                      const active = (group.frameIds as readonly string[]).includes(state.frameId);
                      return (
                        <Button
                          key={group.id}
                          type="button"
                          variant="outlined"
                          onClick={() => patch({ frameId: match.id as FrameType })}
                          startIcon={
                            <Box
                              component="span"
                              sx={{ height: 16, width: 16, border: "1px solid rgba(0,0,0,0.1)" }}
                              style={{ backgroundColor: match.swatch }}
                            />
                          }
                          sx={choiceSx(active, "outline")}
                        >
                          {group.label}
                        </Button>
                      );
                    })}
                  </Stack>
                </Group>
                <Group label="Colour">
                  <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
                    {colours
                      .filter((item) => product.colours.includes(item.id))
                      .map((item) => (
                        <ButtonBase
                          key={item.id}
                          type="button"
                          aria-label={item.name}
                          title={item.name}
                          onClick={() => patch({ colourId: item.id })}
                          sx={{
                            height: 36,
                            width: 36,
                            border: 2,
                            borderColor: state.colourId === item.id ? "text.primary" : "transparent",
                            transform: state.colourId === item.id ? "scale(1.05)" : "none",
                            transition: "all 0.2s ease",
                          }}
                          style={{ backgroundColor: item.hex }}
                        />
                      ))}
                  </Stack>
                </Group>
                {standOptions.length > 0 ? (
                  <Group label="How should it be mounted?">
                    <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => setMounted(null)}
                        sx={choiceSx(!activeStand, "outline")}
                      >
                        On the wall
                      </Button>
                      {standOptions.map((stand) => (
                        <Button
                          key={stand.id}
                          type="button"
                          variant="outlined"
                          onClick={() => setMounted(stand.id)}
                          sx={choiceSx(activeStand?.id === stand.id, "outline")}
                        >
                          {stand.shortName}
                        </Button>
                      ))}
                    </Stack>
                  </Group>
                ) : null}
                {layoutFeatures.length > 0 ? (
                  <Group label="How should your board be arranged?">
                    <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
                      {layoutFeatures.map((feature) => (
                        <Button
                          key={feature.id}
                          type="button"
                          variant="outlined"
                          onClick={() => toggleFeature(feature.id)}
                          sx={choiceSx(state.features.includes(feature.id), "mist")}
                        >
                          {feature.name}
                        </Button>
                      ))}
                    </Stack>
                  </Group>
                ) : null}
                <Group label="Add your logo">
                  <Button component="label" variant="outlined" color="primary" size="small">
                    {state.logoDataUrl ? "Replace logo" : "Upload logo"}
                    <Box
                      component="input"
                      type="file"
                      accept="image/*"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        onLogoUpload(event.target.files?.[0] ?? null)
                      }
                      sx={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        overflow: "hidden",
                        clip: "rect(0 0 0 0)",
                        whiteSpace: "nowrap",
                      }}
                    />
                  </Button>
                  {state.logoDataUrl ? (
                    <Grid container spacing={1} sx={{ mt: 1.5 }}>
                      <Grid size={4}>
                        <Range
                          label="Scale"
                          min={0.6}
                          max={2}
                          step={0.1}
                          value={state.logoScale}
                          onChange={(value) => patch({ logoScale: value })}
                        />
                      </Grid>
                      <Grid size={4}>
                        <Range
                          label="Across"
                          min={0.1}
                          max={0.9}
                          step={0.02}
                          value={state.logoX}
                          onChange={(value) => patch({ logoX: value })}
                        />
                      </Grid>
                      <Grid size={4}>
                        <Range
                          label="Down"
                          min={0.1}
                          max={0.9}
                          step={0.02}
                          value={state.logoY}
                          onChange={(value) => patch({ logoY: value })}
                        />
                      </Grid>
                    </Grid>
                  ) : null}
                </Group>
                {accessoryChoices.length > 0 ? (
                  <Group label="Accessories listed for this board">
                    <Stack spacing={1}>
                      {accessoryChoices.map((item) => {
                        const selected = selectedRelatedIds.includes(item.id);
                        return (
                          <Box
                            component="label"
                            key={item.id}
                            sx={{
                              display: "flex",
                              cursor: "pointer",
                              alignItems: "center",
                              gap: 1,
                              border: 1,
                              borderColor: selected ? "primary.main" : "divider",
                              p: 1,
                              transition: "border-color 0.2s ease",
                            }}
                          >
                            <Checkbox
                              size="small"
                              color="primary"
                              checked={selected}
                              onChange={() => toggleAccessory(item.id)}
                              sx={{ p: 0.5 }}
                            />
                            <Box sx={{ position: "relative", height: 56, width: 56, flexShrink: 0, bgcolor: "background.default" }}>
                              {item.images[0] ? (
                                <Image src={item.images[0]} alt="" fill className="object-contain p-1" sizes="56px" />
                              ) : null}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography component="span" sx={{ display: "block", fontSize: 14, fontWeight: 600 }}>
                                {item.shortName}
                              </Typography>
                              {item.price > 0 ? (
                                <Typography component="span" sx={{ fontSize: 14, fontWeight: 600 }}>
                                  {formatPrice(item.price)}
                                </Typography>
                              ) : null}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Group>
                ) : null}
                <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    variant="outlined"
                    color="inherit"
                    size="small"
                    onClick={() => setCompare((value) => !value)}
                    startIcon={<ViewColumnIcon sx={{ fontSize: 15 }} />}
                  >
                    Compare
                  </Button>
                </Stack>
                <NavRow onBack={() => go("board")} onNext={() => go("preview")} next="Preview" />
              </Panel>
            ) : null}

            {step === "preview" && product ? (
              <Panel title="Preview" helper="This is the setup currently shown in the room.">
                <Box component="dl" sx={{ m: 0, fontSize: 14 }}>
                  <Row label="Product" value={product.shortName} />
                  <Row label="Size" value={`${state.widthFt} × ${state.heightFt} ft`} />
                  <Row label="Frame" value={frameLabel} />
                  <Row label="Colour" value={colour.name} />
                  <Row label="Mounting" value={activeStand ? activeStand.shortName : "On the wall"} />
                  <Row
                    label="Accessories"
                    value={
                      selectedRelatedIds
                        .filter((id) => !standOptions.some((stand) => stand.id === id))
                        .map((id) => getProductById(id)?.shortName ?? id)
                        .join(", ") || "None"
                    }
                  />
                  <Row label="Logo" value={state.logoDataUrl ? "Uploaded" : "None"} />
                </Box>
                {suggestion ? (
                  <Typography variant="body2" sx={{ mt: 2, lineHeight: 1.7, color: "text.secondary" }}>
                    {suggestion}
                  </Typography>
                ) : null}
                {aiOpen && recentRecs ? (
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {recentRecs.slice(0, 3).map((rec) => (
                      <Box key={rec.productId}>
                        <AIProductCard productId={rec.productId} reason={rec.reason} />
                        <Button
                          type="button"
                          variant="outlined"
                          color="primary"
                          fullWidth
                          sx={{ mt: 1, py: 1, fontSize: 12 }}
                          onClick={() => previewProduct(rec.productId)}
                        >
                          Preview this board
                        </Button>
                      </Box>
                    ))}
                  </Stack>
                ) : null}
                <NavRow onBack={() => go("customize")} onNext={() => go("quote")} next="Request Quote" />
              </Panel>
            ) : null}

            {step === "quote" && product ? (
              <Panel title="Get a quote" helper="Send this setup, or add the listed products to your cart.">
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {product.shortName} · {state.widthFt} × {state.heightFt} ft
                </Typography>
                <Typography sx={{ mt: 1, fontSize: 24, fontWeight: 600 }}>
                  {estimated !== undefined ? formatPrice(estimated) : "Request a quote"}
                </Typography>
                <TextField
                  label="Quantity"
                  type="number"
                  value={state.quantity}
                  onChange={(event) => patch({ quantity: Math.max(1, Number(event.target.value) || 1) })}
                  slotProps={{ htmlInput: { min: 1, max: 50 } }}
                  sx={{ mt: 2, width: 120 }}
                />
                <Stack spacing={1} sx={{ mt: 2.5 }}>
                  <Button component={Link} href={quoteHref} variant="contained" color="primary">
                    Request a Quote
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    onClick={addToCart}
                    startIcon={<ShoppingBagOutlinedIcon sx={{ fontSize: 16 }} />}
                  >
                    Add to Cart
                  </Button>
                  <Button type="button" variant="outlined" color="inherit" onClick={saveDesign}>
                    Save design
                  </Button>
                  {savedNote ? (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "secondary.main" }}>
                      <CheckIcon sx={{ fontSize: 12 }} />
                      <Typography component="span" sx={{ fontSize: 12, fontWeight: 600 }}>
                        {savedNote}
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>
                <NavRow onBack={() => go("preview")} />
              </Panel>
            ) : null}
          </Box>
        </Box>
      </Container>

      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: { xs: "var(--mobile-nav-h, 64px)", md: 0 },
          zIndex: 1000,
          borderTop: "1px solid #E5E5E0",
          bgcolor: "#FFFFFF",
          boxShadow: "0 -18px 40px -24px rgba(11,46,34,0.45)",
        }}
      >
        <Container>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
            <Box
              key={`${product?.id}-${state.widthFt}-${state.frameId}-${state.accessoryIds.length}`}
              className="finder-value"
              sx={{ minWidth: 0 }}
            >
              <Typography
                component="p"
                sx={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.secondary" }}
              >
                Your board
              </Typography>
              <Typography variant="body2" noWrap sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: 700, fontSize: 15.5, color: "text.primary" }}>
                {product?.shortName ?? "Choose a board"}
                {" · "}
                {state.widthFt} × {state.heightFt} ft
                {" · "}
                {frameLabel}
                {" · "}
                {selectedRelatedIds.length}{" "}
                {selectedRelatedIds.length === 1 ? "accessory" : "accessories"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                size="small"
                sx={{ px: 1.5, py: 1, fontSize: 12 }}
                onClick={() => go("preview")}
              >
                Preview
              </Button>
              <Button
                component={Link}
                href={
                  product
                    ? `/customize?${new URLSearchParams({
                        productId: product.id,
                        ...(wall.application ? { application: wall.application } : {}),
                      }).toString()}`
                    : "/customize"
                }
                variant="outlined"
                color="primary"
                size="small"
                sx={{ px: 1.5, py: 1, fontSize: 12 }}
              >
                Customize
              </Button>
              <Button
                component={Link}
                href={quoteHref}
                variant="contained"
                color="primary"
                size="small"
                sx={{ px: 1.5, py: 1, fontSize: 12 }}
              >
                Request Quote
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

function choiceSx(selected: boolean, mode: "dark" | "outline" | "mist"): SxProps<Theme> {
  const filled =
    mode === "dark"
      ? { bgcolor: "text.primary", color: "common.white", borderColor: "text.primary" }
      : mode === "mist"
        ? { bgcolor: "background.default", color: "text.primary", borderColor: "text.primary" }
        : { bgcolor: "transparent", color: "text.primary", borderColor: "text.primary" };
  return {
    borderRadius: "16px",
    px: mode === "dark" ? 2 : 1.5,
    py: mode === "dark" ? 1.5 : 1,
    fontSize: 14,
    color: "text.primary",
    borderColor: "divider",
    ...(selected && filled),
    "&:hover": { borderColor: "text.primary", ...(selected && filled) },
  };
}

function Panel({
  title,
  helper,
  children,
}: {
  title: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography variant="h2" sx={{ fontSize: { xs: 24, md: 28 }, letterSpacing: "-0.025em" }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.7, color: "text.secondary" }}>
        {helper}
      </Typography>
      <Box sx={{ mt: 2.5 }}>{children}</Box>
    </Box>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography variant="body2" sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: 700, fontSize: 15, color: "text.primary" }}>
        {label}
      </Typography>
      <Box sx={{ mt: 1 }}>{children}</Box>
    </Box>
  );
}

function NavRow({
  onBack,
  onNext,
  next,
}: {
  onBack?: () => void;
  onNext?: () => void;
  next?: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ mt: 3, alignItems: "center", justifyContent: "space-between" }}>
      {onBack ? (
        <Button type="button" onClick={onBack} color="inherit" sx={{ p: 0, minWidth: 0, fontSize: 14 }}>
          Back
        </Button>
      ) : (
        <span />
      )}
      {onNext && next ? (
        <Button
          type="button"
          onClick={onNext}
          variant="contained"
          color="primary"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
          sx={{ px: 2, py: 1.25, fontSize: 14 }}
        >
          {next}
        </Button>
      ) : null}
    </Stack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ justifyContent: "space-between", borderBottom: 1, borderColor: "divider", py: 1 }}
    >
      <Box component="dt" sx={{ color: "text.secondary" }}>
        {label}
      </Box>
      <Box component="dd" sx={{ m: 0, textAlign: "right", fontWeight: 600 }}>
        {value}
      </Box>
    </Stack>
  );
}

function Range({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Box>
      <Typography component="span" sx={{ fontSize: 11, fontWeight: 600 }}>
        {label}
      </Typography>
      <Slider
        size="small"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(_, next) => onChange(Array.isArray(next) ? next[0] : next)}
        aria-label={label}
      />
    </Box>
  );
}

function CanvasButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <IconButton
      type="button"
      aria-label={label}
      onClick={onClick}
      sx={{
        height: 32,
        width: 32,
        borderRadius: "16px",
        fontSize: 14,
        bgcolor: "rgba(255,255,255,0.95)",
        color: "text.primary",
        "&:hover": { bgcolor: "common.white" },
      }}
    >
      {children}
    </IconButton>
  );
}

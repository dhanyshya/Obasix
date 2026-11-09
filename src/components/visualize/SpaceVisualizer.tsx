"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Container from "@mui/material/Container";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddShoppingCartOutlinedIcon from "@mui/icons-material/AddShoppingCartOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CompareOutlinedIcon from "@mui/icons-material/CompareOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PhotoOutlinedIcon from "@mui/icons-material/PhotoOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Link from "@/components/Link";
import { getProductCategoryLabel } from "@/data/catalogue";
import { wallModels } from "@/data/wallModels";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import type { Product, ProductSize } from "@/lib/types";
import {
  SAVED_PREVIEW_KEY,
  VISUALIZE_ACCEPT,
  defaultOverlay,
  downloadBlob,
  getVisualizeCatalogueProducts,
  isAllowedWallImage,
  productAspect,
  renderPreviewBlob,
  sizeToWidthFraction,
  type OverlayTransform,
  type SavedSpacePreview,
} from "@/lib/visualizeSpace";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { WallOverlayCanvas } from "./WallOverlayCanvas";

type StepId = "product" | "upload" | "position" | "preview";

const STEPS: { id: StepId; label: string; number: string }[] = [
  { id: "product", label: "Choose a Product", number: "01" },
  { id: "upload", label: "Upload Wall Photo", number: "02" },
  { id: "position", label: "Position the Board", number: "03" },
  { id: "preview", label: "Live Preview", number: "04" },
];

const FILTERS = [
  { id: "all", label: "All boards" },
  { id: "magnetic-whiteboard", label: "Whiteboards" },
  { id: "non-magnetic-whiteboard", label: "Non-magnetic" },
  { id: "notice-board", label: "Notice boards" },
  { id: "pin-up-board", label: "Pin boards" },
  { id: "combination-board", label: "Combination" },
  { id: "chalk-board", label: "Chalk boards" },
  { id: "wooden-product", label: "Wooden" },
] as const;

function stepIndex(id: StepId) {
  return STEPS.findIndex((step) => step.id === id);
}

export function SpaceVisualizer() {
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const wallObjectUrlRef = useRef<string | null>(null);
  const prefillsApplied = useRef(false);

  const catalogue = useMemo(() => getVisualizeCatalogueProducts(), []);
  const [step, setStep] = useState<StepId>("product");
  const [reached, setReached] = useState(0);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [wallSrc, setWallSrc] = useState<string | null>(null);
  const [wallName, setWallName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [transform, setTransform] = useState<OverlayTransform>(defaultOverlay());
  const [compare, setCompare] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [busy, setBusy] = useState(false);

  const product = catalogue.find((item) => item.id === productId) ?? null;
  const size =
    product?.sizes.find((item) => item.id === sizeId) ?? product?.sizes[0] ?? null;
  const aspect = product ? productAspect(product, size ?? undefined) : 4 / 3;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogue.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.shortName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
      );
    });
  }, [catalogue, filter, query]);

  const go = useCallback((next: StepId) => {
    const index = stepIndex(next);
    setReached((value) => Math.max(value, index));
    setStep(next);
  }, []);

  const revokeWallUrl = useCallback(() => {
    if (wallObjectUrlRef.current) {
      URL.revokeObjectURL(wallObjectUrlRef.current);
      wallObjectUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokeWallUrl(), [revokeWallUrl]);

  const chooseProduct = useCallback((next: Product, preferredSizeId?: string | null) => {
    const preferred =
      preferredSizeId && next.sizes.some((size) => size.id === preferredSizeId)
        ? next.sizes.find((size) => size.id === preferredSizeId)
        : undefined;
    const first = preferred ?? next.sizes[0];
    setProductId(next.id);
    setSizeId(first?.id ?? null);
    // Reset board transform for the new product, but keep any uploaded wall photo in this session
    setTransform(defaultOverlay(first ? sizeToWidthFraction(next, first) : 0.36));
    setCompare(false);
  }, []);

  useEffect(() => {
    if (prefillsApplied.current || catalogue.length === 0) return;
    prefillsApplied.current = true;

    const urlProductId = searchParams.get("productId");
    const urlSizeId = searchParams.get("sizeId");
    if (urlProductId) {
      const match = catalogue.find(
        (item) =>
          item.id === urlProductId ||
          item.slug === urlProductId ||
          item.sku === urlProductId,
      );
      if (match) {
        chooseProduct(match, urlSizeId);
        setReached(1);
        setStep("upload");
        return;
      }
    }

    try {
      const raw = localStorage.getItem(SAVED_PREVIEW_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedSpacePreview;
      if (!saved?.productId) return;
      const match = catalogue.find((item) => item.id === saved.productId);
      if (!match) return;
      setProductId(match.id);
      setSizeId(saved.sizeId || match.sizes[0]?.id || null);
      if (saved.transform) setTransform(saved.transform);
      if (saved.wallDataUrl) {
        setWallSrc(saved.wallDataUrl);
        setWallName("Saved wall photo");
        setReached(3);
      } else {
        setReached(1);
      }
    } catch {
      /* ignore corrupt saves */
    }
  }, [catalogue, chooseProduct, searchParams]);

  const applyWallFile = (file: File | null) => {
    if (!file) return;
    const check = isAllowedWallImage(file);
    if (!check.ok) {
      setUploadError(check.message);
      return;
    }
    setUploadError("");
    revokeWallUrl();
    const url = URL.createObjectURL(file);
    wallObjectUrlRef.current = url;
    setWallSrc(url);
    setWallName(file.name);
    setCompare(false);
    // Keep board placement sensible for the new wall without clearing the product
    setTransform((prev) => defaultOverlay(prev.widthFrac));
    setReached((value) => Math.max(value, 2));
    setStep("position");
  };

  const clearWall = () => {
    revokeWallUrl();
    setWallSrc(null);
    setWallName(null);
    setUploadError("");
    setCompare(false);
    setStep("upload");
  };

  const applySize = (nextSize: ProductSize) => {
    if (!product) return;
    setSizeId(nextSize.id);
    setTransform((prev) => ({
      ...prev,
      widthFrac: sizeToWidthFraction(product, nextSize),
      rotation: 0,
    }));
  };

  const resetTransform = () => {
    if (!product || !size) {
      setTransform(defaultOverlay());
      return;
    }
    setTransform(defaultOverlay(sizeToWidthFraction(product, size)));
  };

  const flash = (message: string) => {
    setStatusNote(message);
    window.setTimeout(() => setStatusNote(""), 2800);
  };

  const addToCart = () => {
    if (!product || !size) return;
    addItem(
      product.id,
      {
        sizeId: size.id,
        frameId: product.frame,
        colourId: product.colours[0],
        features: [],
        customWidthFt: size.widthFt,
        customHeightFt: size.heightFt,
      },
      1,
    );
    flash("Added to cart");
  };

  const savePreview = async () => {
    if (!product || !size) return;
    setBusy(true);
    try {
      let wallDataUrl: string | undefined;
      if (wallSrc) {
        // Prefer compact data URL only when small enough for localStorage
        if (wallSrc.startsWith("data:")) {
          wallDataUrl = wallSrc.length < 4_500_000 ? wallSrc : undefined;
        } else {
          const response = await fetch(wallSrc);
          const blob = await response.blob();
          if (blob.size < 3_500_000) {
            wallDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error("read failed"));
              reader.readAsDataURL(blob);
            });
          }
        }
      }
      const payload: SavedSpacePreview = {
        productId: product.id,
        sizeId: size.id,
        transform,
        wallDataUrl,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SAVED_PREVIEW_KEY, JSON.stringify(payload));
      flash(
        wallDataUrl
          ? "Preview saved on this device"
          : "Layout saved — re-upload the wall photo next time",
      );
    } catch {
      flash("Could not save preview — try Download instead");
    } finally {
      setBusy(false);
    }
  };

  const downloadPreview = async () => {
    if (!product || !wallSrc || !product.images[0]) return;
    setBusy(true);
    try {
      const blob = await renderPreviewBlob({
        wallSrc,
        boardSrc: product.images[0],
        transform,
        aspect,
      });
      downloadBlob(blob, `obasix-preview-${product.sku || product.id}.png`);
      flash("Preview downloaded");
    } catch {
      flash("Download failed — try another wall photo");
    } finally {
      setBusy(false);
    }
  };

  const canUpload = Boolean(product);
  const canPosition = Boolean(product && wallSrc);
  const canPreview = Boolean(product && wallSrc);

  const previewPanel =
    product && wallSrc ? (
      <Stack spacing={1.5}>
        <WallOverlayCanvas
          wallSrc={wallSrc}
          boardSrc={product.images[0] ?? ""}
          boardAlt={product.shortName}
          aspect={aspect}
          transform={transform}
          onChange={setTransform}
          compareMode={compare}
          showHandles={step === "position" || step === "preview"}
          label={product.shortName}
          sizeLabel={size ? `${size.label} · ${size.widthFt} × ${size.heightFt} ft` : undefined}
        />
        <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
          Preview is for visualization only and is not an exact measurement or guaranteed
          installation result. Your wall photo stays on this device unless you choose Save Preview.
        </Typography>
      </Stack>
    ) : (
      <Box
        sx={{
          aspectRatio: "16 / 10",
          border: "1px dashed",
          borderColor: "divider",
          bgcolor: "#FAFAF9",
          display: "grid",
          placeItems: "center",
          px: 3,
          textAlign: "center",
        }}
      >
        <Box>
          <PhotoOutlinedIcon sx={{ fontSize: 36, color: "text.secondary", mb: 1 }} />
          <Typography sx={{ fontWeight: 600, color: "text.primary" }}>
            {product ? "Upload your wall photo to continue" : "Your wall preview appears here"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: "text.secondary", maxWidth: 340, mx: "auto" }}>
            {product
              ? `${product.shortName} is selected. Add a photo of your own wall — sample rooms are optional.`
              : "Choose a board, then upload or capture a photo of your own wall. No sample room is required."}
          </Typography>
          {product ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ mt: 2, justifyContent: "center", alignItems: "center" }}
            >
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<UploadFileOutlinedIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Your Wall Photo
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<CameraAltOutlinedIcon />}
                onClick={() => cameraInputRef.current?.click()}
              >
                Take a Photo
              </Button>
            </Stack>
          ) : null}
        </Box>
      </Box>
    );

  return (
    <Box sx={{ bgcolor: "#F2F3F0", pb: { xs: 12, md: 8 } }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={VISUALIZE_ACCEPT}
        hidden
        onChange={(event) => {
          applyWallFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={VISUALIZE_ACCEPT}
        capture="environment"
        hidden
        onChange={(event) => {
          applyWallFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />

      <PageMasthead
        code="Visualise"
        title="See your board on your wall"
        lede="Select a board, then upload or capture a photo of your own wall. Sample rooms stay optional — every customer can use a different photo."
        crumbs={[{ href: "/", label: "Home" }, { label: "Visualise" }]}
        compact
      >
        <Box component="ol" aria-label="Visualiser steps" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 0.5 }}>
          {STEPS.map((item, index) => {
            const active = item.id === step;
            const done = index < stepIndex(step);
            const locked = index > reached;
            return (
              <Box component="li" key={item.id} sx={{ minWidth: 0 }}>
                <ButtonBase
                  type="button"
                  disabled={locked}
                  aria-current={active ? "step" : undefined}
                  onClick={() => go(item.id)}
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 0.5,
                    pt: 1.25,
                    pb: 0.5,
                    textAlign: "left",
                    borderTop: "4px solid",
                    borderColor: active || done ? "#EE6A1F" : "rgba(255,255,255,0.22)",
                    color: active ? "#FFFFFF" : "rgba(255,255,255,0.72)",
                    opacity: locked ? 0.5 : 1,
                    transition: "border-color 200ms cubic-bezier(0.16,1,0.3,1), color 160ms",
                    "&:hover": { color: "#FFFFFF" },
                    "&.Mui-focusVisible": { outline: "3px solid #EE6A1F", outlineOffset: 2 },
                  }}
                >
                  <Box component="span" sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.04em", color: done ? "#FFC59E" : "inherit" }}>
                    {done ? "✓ " : ""}
                    {item.number}
                  </Box>
                  <Box component="span" sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: active ? 800 : 700, fontSize: { xs: 12.5, sm: 15 }, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
                    {item.label}
                  </Box>
                </ButtonBase>
              </Box>
            );
          })}
        </Box>
      </PageMasthead>
      <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, sm: 4, md: 6, lg: 8 }, py: { xs: 3, md: 5 } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 3, lg: 4 },
            gridTemplateColumns: { xs: "1fr", lg: "minmax(380px, 0.8fr) minmax(0, 1.2fr)" },
            alignItems: "start",
          }}
        >
          <Box
            component="aside"
            sx={{
              minWidth: 0,
              order: { xs: 2, lg: 1 },
              bgcolor: "#FFFFFF",
              borderTop: "6px solid #164E3B",
              p: { xs: 2.5, md: 3.5 },
              mx: { xs: -2, sm: 0 },
            }}
          >
            {step === "product" ? (
              <Panel
                title="Choose a product"
                helper="Pick any whiteboard, pinboard, notice board, or other board from the OBASIX catalogue."
              >
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search boards"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", mb: 2 }}>
                  {FILTERS.map((item) => {
                    const active = filter === item.id;
                    return (
                      <Button
                        key={item.id}
                        size="small"
                        onClick={() => setFilter(item.id)}
                        sx={{
                          minHeight: 36,
                          px: 1.5,
                          border: "1px solid",
                          borderColor: active ? "#141917" : "divider",
                          color: active ? "#FFFFFF" : "text.primary",
                          bgcolor: active ? "#141917" : "#FFFFFF",
                          fontFamily: "var(--font-display), Helvetica Neue, sans-serif",
                          fontWeight: 700,
                          "&:hover": { bgcolor: active ? "#141917" : "#F2F3F0" },
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                    maxHeight: { lg: "58vh" },
                    overflowY: "auto",
                    pr: 0.5,
                  }}
                >
                  {filtered.map((item) => {
                    const selected = item.id === productId;
                    return (
                      <ButtonBase
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => chooseProduct(item)}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          textAlign: "left",
                          border: "2px solid",
                          borderColor: selected ? "#141917" : "#DCDFDA",
                          bgcolor: "#FFFFFF",
                          boxShadow: selected ? "inset 0 -4px 0 #EE6A1F" : "none",
                          overflow: "hidden",
                          transition: "border-color 160ms",
                          "&:hover": { borderColor: selected ? "#141917" : "#8A928C" },
                          "&.Mui-focusVisible": { outline: "3px solid #EE6A1F", outlineOffset: 2 },
                        }}
                      >
                        <Box
                          sx={{
                            position: "relative",
                            aspectRatio: "5 / 4",
                            bgcolor: "#FAFAF9",
                          }}
                        >
                          {item.images[0] ? (
                            <Image
                              src={item.images[0]}
                              alt=""
                              fill
                              className="object-contain p-3"
                              sizes="220px"
                            />
                          ) : null}
                        </Box>
                        <Box sx={{ p: 1.5 }}>
                          <Typography sx={{ fontSize: 11, color: "text.secondary", mb: 0.35 }}>
                            {getProductCategoryLabel(item)}
                          </Typography>
                          <Typography sx={{ fontFamily: "var(--font-display), Helvetica Neue, sans-serif", fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.01em", color: "text.primary" }}>
                            {item.shortName}
                          </Typography>
                          {item.sizes.length ? (
                            <Typography sx={{ mt: 0.5, fontSize: 12, color: "text.secondary" }}>
                              {item.sizes.map((s) => s.label).join(" · ")}
                            </Typography>
                          ) : null}
                          <Typography sx={{ mt: 0.75, fontWeight: 700, fontSize: 14 }}>
                            {item.price > 0 ? formatPrice(item.price) : "Price on request"}
                          </Typography>
                          {selected ? (
                            <Typography
                              sx={{
                                mt: 0.75,
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                color: "primary.main",
                              }}
                            >
                              Selected
                            </Typography>
                          ) : null}
                        </Box>
                      </ButtonBase>
                    );
                  })}
                </Box>

                {filtered.length === 0 ? (
                  <Typography sx={{ mt: 2, color: "text.secondary" }}>
                    No boards match this filter.
                  </Typography>
                ) : null}

                <Stack direction="row" spacing={1.5} sx={{ mt: 2.5, justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!product}
                    onClick={() => go("upload")}
                  >
                    Choose This Board
                  </Button>
                </Stack>
              </Panel>
            ) : null}

            {step === "upload" ? (
              <Panel
                title="Add your wall photo"
                helper="Use a photo of your own wall. JPG, JPEG, PNG, or WEBP up to 10 MB. Sample rooms are optional — never required."
              >
                {product ? (
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: "center",
                      border: "1px solid",
                      borderColor: "divider",
                      p: 1.25,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ position: "relative", width: 56, height: 56, bgcolor: "#FAFAF9", flexShrink: 0 }}>
                      {product.images[0] ? (
                        <Image src={product.images[0]} alt="" fill className="object-contain p-1" sizes="56px" />
                      ) : null}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{product.shortName}</Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                        {size?.label ?? "Standard"} ·{" "}
                        {product.price > 0 ? formatPrice(product.price) : "Quote"}
                      </Typography>
                    </Box>
                    <Button size="small" onClick={() => go("product")} sx={{ ml: "auto" }}>
                      Change board
                    </Button>
                  </Stack>
                ) : (
                  <Typography sx={{ mb: 2, color: "text.secondary", fontSize: 14 }}>
                    Choose a board first, then add your wall photo.
                  </Typography>
                )}

                <Stack spacing={1.25}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<UploadFileOutlinedIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canUpload}
                    sx={{ minHeight: 48, justifyContent: "flex-start", px: 2 }}
                  >
                    {wallSrc ? "Replace Your Wall Photo" : "1. Upload Your Wall Photo"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<CameraAltOutlinedIcon />}
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={!canUpload}
                    sx={{ minHeight: 48, justifyContent: "flex-start", px: 2, borderColor: "divider" }}
                  >
                    2. Take a Photo
                  </Button>
                  {wallSrc ? (
                    <Button color="inherit" onClick={clearWall} sx={{ alignSelf: "flex-start" }}>
                      Remove photo
                    </Button>
                  ) : null}
                </Stack>

                {uploadError ? (
                  <Typography sx={{ mt: 1.5, color: "error.main", fontSize: 13 }}>
                    {uploadError}
                  </Typography>
                ) : null}

                {wallSrc ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                      Your wall{wallName ? `: ${wallName}` : ""}
                    </Typography>
                    <Box
                      sx={{
                        position: "relative",
                        aspectRatio: "16 / 10",
                        border: "1px solid",
                        borderColor: "divider",
                        overflow: "hidden",
                        bgcolor: "#F3F3F1",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={wallSrc}
                        alt="Your uploaded wall"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                    <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
                      Processed in your browser for this session. Not uploaded to OBASIX servers unless you
                      save a preview on this device.
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      mt: 2,
                      border: "2px dashed",
                      borderColor: "divider",
                      bgcolor: "#FAFAF9",
                      p: 2.5,
                      textAlign: "center",
                    }}
                  >
                    <PhotoOutlinedIcon sx={{ fontSize: 28, color: "text.secondary", mb: 0.75 }} />
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: "text.primary" }}>
                      No wall photo yet
                    </Typography>
                    <Typography sx={{ mt: 0.75, fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>
                      For the best result, upload a clear, front-facing photo of your wall. A sample room is
                      never applied automatically.
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>
                    3. Choose a Sample Room (optional)
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 12.5, color: "text.secondary", lineHeight: 1.6 }}>
                    Prefer a studio template instead of your own photo? Sample rooms open separately and do
                    not replace an uploaded wall.
                  </Typography>
                  <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", mt: 1.25 }}>
                    {wallModels.slice(0, 5).map((wall) => (
                      <Button
                        key={wall.id}
                        size="small"
                        variant="outlined"
                        color="inherit"
                        component={Link}
                        href={`/visualize/${wall.id}`}
                        sx={{ borderColor: "divider" }}
                      >
                        {wall.name}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                <NavRow
                  onBack={() => go("product")}
                  onNext={wallSrc ? () => go("position") : undefined}
                  next="Position Board"
                />
              </Panel>
            ) : null}

            {step === "position" && product && wallSrc ? (
              <Panel
                title="Position the board"
                helper="Place the board on your uploaded wall. Drag, resize, and rotate while keeping aspect ratio. Reset position never removes your wall photo."
              >
                {product.sizes.length > 0 ? (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 1 }}>Size presets</Typography>
                    <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
                      {product.sizes.map((item) => {
                        const active = size?.id === item.id;
                        return (
                          <Button
                            key={item.id}
                            size="small"
                            variant="outlined"
                            onClick={() => applySize(item)}
                            sx={{
                              borderColor: active ? "primary.main" : "divider",
                              color: active ? "primary.main" : "text.primary",
                              fontWeight: active ? 700 : 500,
                            }}
                          >
                            {item.label}
                          </Button>
                        );
                      })}
                    </Stack>
                  </Box>
                ) : null}

                <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>
                  Rotation ({Math.round(transform.rotation)}°)
                </Typography>
                <Slider
                  size="small"
                  min={-18}
                  max={18}
                  step={1}
                  value={transform.rotation}
                  onChange={(_, value) =>
                    setTransform((prev) => ({
                      ...prev,
                      rotation: Array.isArray(value) ? value[0] : value,
                    }))
                  }
                  aria-label="Board rotation"
                  sx={{ mb: 1 }}
                />

                <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    startIcon={<RestartAltIcon />}
                    onClick={resetTransform}
                  >
                    Reset position
                  </Button>
                  <Button size="small" variant="outlined" color="inherit" onClick={() => go("upload")}>
                    Change wall photo
                  </Button>
                  <Button size="small" variant="outlined" color="inherit" onClick={() => go("product")}>
                    Choose product
                  </Button>
                </Stack>

                <Box sx={{ display: { xs: "block", lg: "none" }, mt: 2.5 }}>{previewPanel}</Box>

                <NavRow onBack={() => go("upload")} onNext={() => go("preview")} next="Live Preview" />
              </Panel>
            ) : null}

            {step === "position" && (!product || !wallSrc) ? (
              <Panel title="Position the board" helper="Choose a product and upload a wall photo first.">
                <NavRow onBack={() => go(wallSrc ? "upload" : "product")} />
              </Panel>
            ) : null}

            {step === "preview" && product && wallSrc ? (
              <Panel
                title="Live preview"
                helper="Compare before and after, save or download your setup, then add the product to your cart."
              >
                <Box
                  component="dl"
                  sx={{ m: 0, border: "1px solid", borderColor: "divider", px: 1.5 }}
                >
                  <SummaryRow label="Product" value={product.shortName} />
                  <SummaryRow
                    label="Size"
                    value={size ? `${size.label} (${size.widthFt} × ${size.heightFt} ft)` : "—"}
                  />
                  <SummaryRow
                    label="Price"
                    value={product.price > 0 ? formatPrice(product.price) : "On request"}
                  />
                </Box>

                <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", mt: 2 }}>
                  <Button
                    size="small"
                    variant={compare ? "contained" : "outlined"}
                    color={compare ? "primary" : "inherit"}
                    startIcon={<CompareOutlinedIcon />}
                    onClick={() => setCompare((value) => !value)}
                  >
                    Compare Before / After
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    startIcon={<RestartAltIcon />}
                    onClick={resetTransform}
                  >
                    Reset Preview
                  </Button>
                  <Button size="small" variant="outlined" color="inherit" onClick={() => go("product")}>
                    Choose Product
                  </Button>
                  <Button size="small" variant="outlined" color="inherit" onClick={() => go("upload")}>
                    Upload Wall Photo
                  </Button>
                </Stack>

                <Stack spacing={1} sx={{ mt: 2.5 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddShoppingCartOutlinedIcon />}
                    onClick={addToCart}
                    disabled={product.price <= 0}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<DownloadOutlinedIcon />}
                    onClick={() => void downloadPreview()}
                    disabled={busy}
                  >
                    Download Preview
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<SaveOutlinedIcon />}
                    onClick={() => void savePreview()}
                    disabled={busy}
                  >
                    Save Preview
                  </Button>
                  {product.price <= 0 ? (
                    <Button
                      component={Link}
                      href={`/quote?productId=${product.id}`}
                      variant="outlined"
                      color="primary"
                    >
                      Request a Quote
                    </Button>
                  ) : null}
                </Stack>

                {statusNote ? (
                  <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, alignItems: "center", color: "primary.main" }}>
                    <CheckIcon sx={{ fontSize: 14 }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{statusNote}</Typography>
                  </Stack>
                ) : null}

                <Box sx={{ display: { xs: "block", lg: "none" }, mt: 2.5 }}>{previewPanel}</Box>

                <NavRow onBack={() => go("position")} />
              </Panel>
            ) : null}
          </Box>

          <Box
            sx={{
              minWidth: 0,
              order: { xs: 1, lg: 2 },
              position: { lg: "sticky" },
              top: { lg: 112 },
              display: { xs: "none", lg: "block" },
              bgcolor: "#141917",
              p: 1.5,
            }}
          >
            {previewPanel}
            {(step === "position" || step === "preview") && canPosition ? (
              <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", mt: 1.5, display: { xs: "none", lg: "flex" }, "& .MuiButton-root": { color: "#FFFFFF", borderColor: "rgba(255,255,255,0.4)" }, "& .MuiButton-contained": { bgcolor: "#EE6A1F", color: "#141917", borderColor: "#EE6A1F" } }}>
                <Button
                  size="small"
                  variant={compare ? "contained" : "outlined"}
                  color={compare ? "primary" : "inherit"}
                  startIcon={<CompareOutlinedIcon />}
                  onClick={() => setCompare((value) => !value)}
                >
                  Compare
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={resetTransform}
                >
                  Reset
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<DownloadOutlinedIcon />}
                  onClick={() => void downloadPreview()}
                  disabled={busy || !canPreview}
                >
                  Download
                </Button>
              </Stack>
            ) : null}
          </Box>
        </Box>
      </Container>
    </Box>
  );
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
      <Typography
        variant="h2"
        sx={{ fontSize: { xs: "1.6rem", md: "1.9rem" }, color: "#141917", fontVariationSettings: '"wdth" 92' }}
      >
        {title}
      </Typography>
      <Typography sx={{ mt: 1, color: "text.secondary", lineHeight: 1.7, fontSize: 14.5 }}>
        {helper}
      </Typography>
      <Box sx={{ mt: 2.5 }}>{children}</Box>
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
        <Button type="button" onClick={onBack} color="inherit" sx={{ px: 0 }}>
          Back
        </Button>
      ) : (
        <span />
      )}
      {onNext && next ? (
        <Button type="button" variant="contained" color="primary" onClick={onNext}>
          {next}
        </Button>
      ) : null}
    </Stack>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider", py: 1.15 }}
    >
      <Box component="dt" sx={{ color: "text.secondary", fontSize: 14 }}>
        {label}
      </Box>
      <Box component="dd" sx={{ m: 0, fontWeight: 700, fontSize: 14, textAlign: "right" }}>
        {value}
      </Box>
    </Stack>
  );
}

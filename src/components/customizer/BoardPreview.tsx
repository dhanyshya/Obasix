"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import type { CombinationLayout, FrameType, SurfaceType } from "@/lib/types";
import { getCombinationMaterial, sectionDimensionLabel } from "@/lib/combination";
import { DESKTOP_MQ } from "./customizerUi";

interface BoardPreviewProps {
  surfaceHex: string;
  frameSwatch: string;
  frameId?: FrameType;
  surfaceType?: SurfaceType;
  boardTypeLabel: string;
  productName: string;
  productCode?: string;
  sizeLabel: string;
  frameName: string;
  colourName: string;
  surfaceLabel?: string;
  layoutSummary?: string;
  combinationLayout?: CombinationLayout;
  widthFt?: number;
  heightFt?: number;
  features: string[];
  magnetic?: boolean;
  branding: boolean;
  logoDataUrl?: string;
  quantity: number;
  image?: string;
  sideImage?: string;
  accessoriesLabel?: string;
  compact?: boolean;
  showDetails?: boolean;
}

const OVERLAY_LABEL = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
} as const;

function frameThickness(frameId?: FrameType) {
  if (!frameId) return 10;
  if (frameId.includes("heavy") || frameId === "pine-wood") return 14;
  if (frameId === "powder-coated-black") return 12;
  return 8;
}

function surfaceFill(surfaceType: SurfaceType | undefined, colourHex: string) {
  switch (surfaceType) {
    case "ceramic-steel":
      return "linear-gradient(145deg, #FFFFFF 0%, #F4F7F8 55%, #EEF2F3 100%)";
    case "melamine-hpl":
      return "linear-gradient(145deg, #FAFAF8 0%, #F3F2EE 100%)";
    case "resin-coated":
      return "linear-gradient(145deg, #FFFFFF 0%, #F7F7F5 100%)";
    case "fabric-softboard":
      return `linear-gradient(145deg, ${colourHex} 0%, ${colourHex}cc 100%)`;
    case "chalkboard":
      return "linear-gradient(145deg, #2F4A3A 0%, #24382C 100%)";
    case "dual-side":
      return "linear-gradient(145deg, #FFFFFF 0%, #F3F3F1 50%, #2F4A3A 50%, #24382C 100%)";
    default:
      return colourHex || "#FFFFFF";
  }
}

export function BoardPreview({
  surfaceHex,
  frameSwatch,
  frameId,
  surfaceType,
  boardTypeLabel,
  productName,
  productCode,
  sizeLabel,
  frameName,
  colourName,
  surfaceLabel,
  layoutSummary,
  combinationLayout,
  widthFt = 4,
  heightFt = 3,
  features,
  magnetic = false,
  branding,
  logoDataUrl,
  quantity,
  image,
  sideImage,
  accessoriesLabel,
  compact = false,
  showDetails,
}: BoardPreviewProps) {
  const detailsVisible = showDetails ?? !compact;
  const [view, setView] = useState<"front" | "side">("front");
  const [fullscreen, setFullscreen] = useState(false);
  const isCombination = combinationLayout?.mode === "combination";
  const showSide = Boolean(sideImage);
  const borderW = frameThickness(frameId);
  const boardAspect = Math.max(0.5, Math.min(2.2, widthFt / Math.max(heightFt, 0.5)));
  const fill = surfaceFill(surfaceType, surfaceHex);

  useEffect(() => {
    if (!showSide && view === "side") setView("front");
  }, [showSide, view]);

  const liveBoard = (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        p: { xs: 2.5, md: 3.5 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          aspectRatio: `${boardAspect}`,
          width: boardAspect >= 1 ? "min(92%, 520px)" : "auto",
          height: boardAspect < 1 ? "min(88%, 420px)" : "auto",
          maxWidth: "100%",
          maxHeight: "100%",
          borderStyle: "solid",
          borderColor: frameSwatch,
          borderWidth: borderW,
          bgcolor: "#FFFFFF",
          boxShadow: `
            0 ${Math.round(borderW / 2)}px ${borderW + 18}px rgba(34,41,35,0.18),
            inset 0 0 0 1px rgba(255,255,255,0.35)
          `,
          transition: "aspect-ratio 0.25s ease, border-color 0.2s ease, border-width 0.2s ease",
        }}
      >
        {isCombination && combinationLayout ? (
          <Box
            sx={{
              display: "flex",
              height: "100%",
              width: "100%",
              flexDirection: combinationLayout.orientation === "horizontal" ? "column" : "row",
            }}
          >
            {combinationLayout.sections.map((section, index) => {
              const material = getCombinationMaterial(section.materialId);
              const dim = sectionDimensionLabel(
                widthFt,
                heightFt,
                combinationLayout.orientation,
                section.percent,
              );
              return (
                <Box
                  key={section.id}
                  sx={{
                    position: "relative",
                    minHeight: 0,
                    minWidth: 0,
                    overflow: "hidden",
                    flexGrow: section.percent,
                    flexBasis: 0,
                    background: material.preview,
                    boxShadow:
                      index < combinationLayout.sections.length - 1
                        ? combinationLayout.orientation === "vertical"
                          ? "inset -1px 0 0 rgba(41,45,43,0.28)"
                          : "inset 0 -1px 0 rgba(41,45,43,0.28)"
                        : undefined,
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: 8,
                      right: 8,
                      bottom: 8,
                      borderRadius: "16px",
                      bgcolor: "rgba(41,45,43,0.72)",
                      color: "#fff",
                      px: 1,
                      py: 0.75,
                      fontSize: 10,
                      fontWeight: 500,
                    }}
                  >
                    {section.percent}% · {material.shortLabel}
                    <Box component="span" sx={{ display: "block", opacity: 0.8 }}>
                      {dim}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ position: "relative", width: "100%", height: "100%", background: fill }}>
            {image ? (
              <Box sx={{ position: "absolute", inset: "8%", opacity: 0.22 }}>
                <Image
                  src={image}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="420px"
                />
              </Box>
            ) : null}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  surfaceType === "ceramic-steel"
                    ? "linear-gradient(120deg, rgba(255,255,255,0.55) 0%, transparent 42%, rgba(0,0,0,0.03) 100%)"
                    : "linear-gradient(160deg, rgba(255,255,255,0.28) 0%, transparent 50%)",
                pointerEvents: "none",
              }}
            />
          </Box>
        )}

        {branding ? (
          <Paper
            elevation={0}
            sx={{
              position: "absolute",
              left: 12,
              top: 12,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "rgba(255,255,255,0.95)",
              px: 1,
              py: 0.5,
            }}
          >
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoDataUrl}
                alt="Logo preview"
                style={{ height: 24, width: "auto", maxWidth: 88, objectFit: "contain" }}
              />
            ) : (
              <Typography sx={{ ...OVERLAY_LABEL, color: "text.secondary" }}>Your Logo</Typography>
            )}
          </Paper>
        ) : null}

        {features.includes("calendar-section") ? (
          <Paper
            elevation={0}
            sx={{
              position: "absolute",
              right: 12,
              top: 12,
              zIndex: 3,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2px",
              bgcolor: "rgba(255,255,255,0.92)",
              border: "1px solid",
              borderColor: "divider",
              p: 0.75,
            }}
          >
            {Array.from({ length: 6 }, (_, index) => (
              <Box key={index} sx={{ width: 8, height: 8, border: 1, borderColor: "divider" }} />
            ))}
          </Paper>
        ) : null}

        {features.includes("custom-layout") && !isCombination ? (
          <Box
            sx={{
              pointerEvents: "none",
              position: "absolute",
              inset: "12%",
              zIndex: 2,
              border: "1px dashed rgba(0,0,0,0.22)",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "50%",
                width: 1,
                bgcolor: "rgba(0,0,0,0.18)",
              }}
            />
          </Box>
        ) : null}

        {features.includes("marker-tray") ? (
          <Box
            sx={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              zIndex: 3,
              width: "42%",
              height: 7,
              transform: "translateX(-50%)",
              borderRadius: "16px",
              backgroundColor: frameSwatch,
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          />
        ) : null}

        {features.includes("special-mounting") ? (
          <Box
            sx={{
              position: "absolute",
              bottom: -14,
              left: "50%",
              zIndex: 3,
              display: "flex",
              width: "28%",
              justifyContent: "space-between",
              transform: "translateX(-50%)",
            }}
          >
            <Box sx={{ width: 4, height: 12, bgcolor: "#333" }} />
            <Box sx={{ width: 4, height: 12, bgcolor: "#333" }} />
          </Box>
        ) : null}

        {magnetic && !isCombination ? (
          <Typography
            sx={{
              ...OVERLAY_LABEL,
              position: "absolute",
              left: 10,
              bottom: 10,
              zIndex: 3,
              color: "primary.main",
              bgcolor: "rgba(255,255,255,0.88)",
              px: 0.75,
              py: 0.25,
            }}
          >
            Magnetic
          </Typography>
        ) : null}
      </Box>
    </Box>
  );

  const previewStage = (fullscreenMode: boolean) => (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#F3F3F1",
        borderTop: "1px solid",
        borderBottom: detailsVisible ? "1px solid" : 0,
        borderColor: "divider",
        ...(fullscreenMode
          ? { minHeight: "65vh" }
          : compact
            ? { aspectRatio: "5 / 4" }
            : {
                aspectRatio: "5 / 4",
                minHeight: 260,
                [DESKTOP_MQ]: { minHeight: 320, aspectRatio: "5 / 4" },
              }),
      }}
    >
      {view === "side" && sideImage ? (
        <Image
          src={sideImage}
          alt={`${productName} side view`}
          fill
          style={{ objectFit: "contain", padding: "2rem" }}
          sizes={fullscreenMode ? "100vw" : "(max-width: 1024px) 100vw, 55vw"}
        />
      ) : (
        liveBoard
      )}
    </Box>
  );

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          overflow: "hidden",
          borderRadius: "16px",
          borderColor: "divider",
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{ display: "block", fontSize: 10, letterSpacing: "0.05em", color: "primary.main", fontWeight: 700 }}
            >
              Live Board Preview
            </Typography>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: "text.primary" }}>
              {sizeLabel}
              {layoutSummary ? (
                <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  {" "}
                  · {layoutSummary}
                </Box>
              ) : null}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {showSide ? (
              <ToggleButtonGroup
                exclusive
                size="small"
                color="primary"
                value={view}
                aria-label="Preview angle"
                onChange={(_, next: "front" | "side" | null) => {
                  if (next) setView(next);
                }}
              >
                {(["front", "side"] as const).map((option) => (
                  <ToggleButton
                    key={option}
                    value={option}
                    sx={{ px: 1.25, py: 0.25, fontSize: 11, textTransform: "capitalize" }}
                  >
                    {option}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            ) : null}
            <IconButton size="small" aria-label="Open fullscreen preview" onClick={() => setFullscreen(true)}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {previewStage(false)}

        <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider", bgcolor: "#FAFAF9" }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.primary" }}>
            {productName}
            {productCode ? (
              <Box component="span" sx={{ ml: 1, color: "text.secondary", fontWeight: 500 }}>
                {productCode}
              </Box>
            ) : null}
          </Typography>
          <Typography sx={{ mt: 0.35, fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}>
            {[sizeLabel, surfaceLabel, `${frameName} · ${colourName}`, boardTypeLabel]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        </Box>

        {detailsVisible ? (
          <Box
            component="dl"
            sx={{ m: 0, display: "grid", gap: 1, borderTop: 1, borderColor: "divider", px: 2, py: 1.75, fontSize: 13.5 }}
          >
            <Row label="Product" value={productName} />
            {productCode ? <Row label="Code" value={productCode} /> : null}
            <Row label="Size" value={sizeLabel} />
            {layoutSummary ? <Row label="Layout" value={layoutSummary} /> : null}
            {surfaceLabel ? <Row label="Surface" value={surfaceLabel} /> : null}
            <Row label="Frame" value={frameName} />
            <Row label="Colour" value={colourName} />
            {accessoriesLabel ? <Row label="Accessories" value={accessoriesLabel} /> : null}
            <Row label="Quantity" value={String(quantity)} />
          </Box>
        ) : null}
      </Paper>

      <Dialog
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        maxWidth="lg"
        fullWidth
        aria-label="Fullscreen board preview"
        slotProps={{ paper: { sx: { borderRadius: "16px", overflow: "hidden" } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {productName}
          <IconButton size="small" aria-label="Close fullscreen preview" onClick={() => setFullscreen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        {previewStage(true)}
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
      <Box component="dt" sx={{ color: "text.secondary" }}>
        {label}
      </Box>
      <Box component="dd" sx={{ m: 0, maxWidth: "60%", textAlign: "right", fontWeight: 600, color: "text.primary" }}>
        {value}
      </Box>
    </Stack>
  );
}

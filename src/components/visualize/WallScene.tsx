"use client";

import Image from "next/image";
import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { getProductById } from "@/data/catalogue";
import type { WallModel, VisualizeState } from "@/lib/types";

interface WallSceneProps {
  wall: WallModel;
  state: VisualizeState;
  frameSwatch: string;
  surfaceHex: string;
  showBoard: boolean;
  compareMode?: boolean;
  comparePercent?: number;
  onBoardOffsetChange?: (x: number, y: number) => void;
  zoom?: number;
  className?: string;
  sx?: SxProps<Theme>;
}

const badgeSx = {
  position: "absolute",
  borderRadius: 0.5,
  px: 1,
  py: 0.5,
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "common.white",
} as const;

export function WallScene({
  wall,
  state,
  frameSwatch,
  surfaceHex,
  showBoard,
  compareMode = false,
  comparePercent = 50,
  onBoardOffsetChange,
  zoom = 1,
  className,
  sx,
}: WallSceneProps) {
  const product = getProductById(state.productId);
  const area = wall.wallArea;
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const widthRatio = Math.min(1, state.widthFt / area.maxWidthFt);
  const heightRatio = Math.min(1, state.heightFt / area.maxHeightFt);
  const boardW = area.width * widthRatio;
  const boardH = area.height * heightRatio;

  const maxOffsetX = Math.max(0, (area.width - boardW) / 2);
  const maxOffsetY = Math.max(0, (area.height - boardH) / 2);
  const offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, state.boardOffsetX));
  const offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, state.boardOffsetY));

  const left = area.left + (area.width - boardW) / 2 + offsetX;
  const top = area.top + (area.height - boardH) / 2 + offsetY;

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!onBoardOffsetChange || !showBoard) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        ox: state.boardOffsetX,
        oy: state.boardOffsetY,
      };
      setDragging(true);
    },
    [onBoardOffsetChange, showBoard, state.boardOffsetX, state.boardOffsetY],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragRef.current || !onBoardOffsetChange) return;
      const parent = e.currentTarget.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dx = (e.clientX - dragRef.current.startX) / rect.width;
      const dy = (e.clientY - dragRef.current.startY) / rect.height;
      const nextX = Math.max(-maxOffsetX, Math.min(maxOffsetX, dragRef.current.ox + dx));
      const nextY = Math.max(-maxOffsetY, Math.min(maxOffsetY, dragRef.current.oy + dy));
      onBoardOffsetChange(nextX, nextY);
    },
    [maxOffsetX, maxOffsetY, onBoardOffsetChange],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  const hasMagnets =
    state.accessoryIds.includes("magnets-40mm") || state.accessoryIds.includes("magnets-30mm");
  const hasMarkerHolder =
    state.accessoryIds.includes("marker-holder-black") || state.accessoryIds.includes("marker-holder-white");

  const boardLayer = showBoard && product ? (
    <Box
      className={!dragging ? "viz-board" : undefined}
      sx={{
        position: "absolute",
        zIndex: 20,
        touchAction: "none",
        userSelect: "none",
        ...(!dragging && {
          transition: "left 0.3s ease-out, top 0.3s ease-out, width 0.3s ease-out, height 0.3s ease-out",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }),
        cursor: onBoardOffsetChange ? (dragging ? "grabbing" : "grab") : undefined,
      }}
      style={{
        left: `${left * 100}%`,
        top: `${top * 100}%`,
        width: `${boardW * 100}%`,
        height: `${boardH * 100}%`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Box
        sx={{
          position: "relative",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.8)",
        }}
        style={{
          borderWidth: 6,
          borderStyle: "solid",
          borderColor: frameSwatch,
          backgroundColor: surfaceHex,
        }}
      >
        <Image
          src={product.images[0]}
          alt={product.shortName}
          fill
          className="object-cover opacity-90"
          sizes="40vw"
          draggable={false}
        />
        <Box
          sx={{ pointerEvents: "none", position: "absolute", inset: 0, opacity: 0.3, mixBlendMode: "multiply" }}
          style={{ backgroundColor: surfaceHex }}
        />

        {state.features.includes("marker-tray") && (
          <Box
            sx={{
              position: "absolute",
              bottom: 4,
              left: "50%",
              height: 6,
              width: "55%",
              transform: "translateX(-50%)",
              borderRadius: 0.25,
            }}
            style={{ backgroundColor: frameSwatch }}
          />
        )}

        {state.features.includes("calendar-section") && (
          <Box
            sx={{
              position: "absolute",
              left: "12%",
              right: "12%",
              top: "14%",
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 0.25,
              opacity: 0.4,
            }}
          >
            {Array.from({ length: 14 }).map((_, i) => (
              <Box key={i} sx={{ aspectRatio: "1 / 1", border: "1px solid rgba(0,0,0,0.2)" }} />
            ))}
          </Box>
        )}

        {state.features.includes("custom-layout") && (
          <Box
            sx={{
              pointerEvents: "none",
              position: "absolute",
              inset: "10%",
              border: "1px dashed rgba(0,0,0,0.25)",
            }}
          />
        )}

        {/* Logo layer */}
        {(state.logoDataUrl || state.features.includes("logo-branding")) && (
          <Box
            sx={{ position: "absolute", zIndex: 30, transform: "translate(-50%, -50%)" }}
            style={{
              left: `${state.logoX * 100}%`,
              top: `${state.logoY * 100}%`,
              width: `${18 * state.logoScale}%`,
            }}
          >
            {state.logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.logoDataUrl}
                alt="Uploaded logo"
                className="h-auto w-full object-contain drop-shadow-sm"
                draggable={false}
              />
            ) : (
              <Typography
                component="span"
                sx={{
                  display: "block",
                  borderRadius: 0.5,
                  bgcolor: "rgba(255,255,255,0.9)",
                  px: 0.75,
                  py: 0.25,
                  textAlign: "center",
                  fontSize: { xs: 8, sm: 10 },
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "text.secondary",
                }}
              >
                Logo
              </Typography>
            )}
          </Box>
        )}

        {/* Accessories layer */}
        {hasMagnets ? (
          <Box sx={{ position: "absolute", right: "12%", top: "18%", display: "flex", gap: 0.5 }}>
            {["#E31C23", "#1B5E3B", "#F5A623", "#2F8F9D"].map((c) => (
              <Box
                key={c}
                component="span"
                sx={{
                  height: { xs: 10, sm: 12 },
                  width: { xs: 10, sm: 12 },
                  borderRadius: "50%",
                  boxShadow: 1,
                }}
                style={{ backgroundColor: c }}
              />
            ))}
          </Box>
        ) : null}

        {hasMarkerHolder && (
          <Box
            sx={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              height: { xs: 12, sm: 16 },
              width: "40%",
              transform: "translateX(-50%)",
              borderRadius: 0.25,
              border: "1px solid rgba(0,0,0,0.2)",
              boxShadow: 2,
            }}
            style={{
              backgroundColor: state.accessoryIds.includes("marker-holder-white") ? "#F2F2F0" : "#1A1A1A",
            }}
          />
        )}
      </Box>

      {state.accessoryIds.includes("mobile-3x4") && (
        <Box
          sx={{
            position: "absolute",
            bottom: "-18%",
            left: "50%",
            zIndex: 10,
            height: "18%",
            width: "8%",
            transform: "translateX(-50%)",
            borderRadius: 0.25,
            bgcolor: "#333",
          }}
        />
      )}
    </Box>
  ) : null;

  return (
    <Box
      className={className}
      sx={[
        {
          position: "relative",
          aspectRatio: "16 / 10",
          width: "100%",
          overflow: "hidden",
          borderRadius: 2,
          bgcolor: "background.default",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      aria-label={`${wall.name} wall preview`}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          transformOrigin: "center",
          transition: "transform 0.3s ease-out",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        }}
        style={{ transform: `scale(${zoom})` }}
      >
        <Image
          src={wall.image}
          alt={`${wall.name} wall`}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 70vw"
        />

        {/* Soft vignette so board reads as mounted */}
        <Box
          sx={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent, rgba(0,0,0,0.1))",
          }}
        />

        {compareMode ? (
          <>
            <Box sx={{ position: "absolute", inset: 0, zIndex: 30, overflow: "hidden" }} style={{ width: `${comparePercent}%` }}>
              <Box sx={{ position: "relative", height: "100%" }} style={{ width: `${10000 / Math.max(comparePercent, 1)}%` }}>
                <Image src={wall.image} alt="Original wall" fill className="object-cover" sizes="70vw" />
                <Box sx={{ ...badgeSx, left: 12, top: 12, bgcolor: "rgba(0,0,0,0.6)" }}>Before</Box>
              </Box>
            </Box>
            <Box sx={{ position: "absolute", inset: 0, zIndex: 20 }}>
              {boardLayer}
              <Box sx={{ ...badgeSx, right: 12, top: 12, bgcolor: "primary.main" }}>After</Box>
            </Box>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                bottom: 0,
                zIndex: 40,
                width: 2,
                bgcolor: "common.white",
                boxShadow: 2,
              }}
              style={{ left: `${comparePercent}%` }}
            >
              <Box
                component="span"
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  display: "flex",
                  height: 36,
                  width: 36,
                  transform: "translate(-50%, -50%)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: "2px solid #fff",
                  bgcolor: "primary.main",
                  color: "common.white",
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: 4,
                }}
              >
                ↔
              </Box>
            </Box>
          </>
        ) : (
          boardLayer
        )}
      </Box>

      {showBoard && product && !compareMode ? (
        <Box
          sx={{
            pointerEvents: "none",
            position: "absolute",
            bottom: 12,
            left: 12,
            zIndex: 30,
            maxWidth: "70%",
            bgcolor: "rgba(255,255,255,0.95)",
            px: 1.5,
            py: 1,
            color: "text.primary",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {product.shortName}
          </Typography>
          <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>
            {state.widthFt} × {state.heightFt} ft
          </Typography>
        </Box>
      ) : null}

      {!showBoard && !compareMode && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              borderRadius: 1.25,
              bgcolor: "rgba(255,255,255,0.9)",
              px: 2,
              py: 1,
              fontWeight: 600,
              color: "text.secondary",
              boxShadow: 1,
              backdropFilter: "blur(8px)",
            }}
          >
            Choose a board to place it on this wall
          </Typography>
        </Box>
      )}
    </Box>
  );
}

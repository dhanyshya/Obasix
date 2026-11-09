"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { OverlayTransform } from "@/lib/visualizeSpace";
import { isolateBoardImage } from "@/lib/boardIsolation";

type DragMode = "move" | "resize" | "rotate" | null;

interface WallOverlayCanvasProps {
  wallSrc: string;
  boardSrc: string;
  boardAlt: string;
  aspect: number;
  transform: OverlayTransform;
  onChange: (next: OverlayTransform) => void;
  compareMode?: boolean;
  showHandles?: boolean;
  label?: string;
  sizeLabel?: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function WallOverlayCanvas({
  wallSrc,
  boardSrc,
  boardAlt,
  aspect,
  transform,
  onChange,
  compareMode = false,
  showHandles = true,
  label,
  sizeLabel,
}: WallOverlayCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startAngle: number;
    origin: OverlayTransform;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [boardSrcState, setBoardSrcState] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setBoardSrcState(undefined);
    isolateBoardImage(boardSrc).then((url) => {
      if (!cancelled) setBoardSrcState(url);
    });
    return () => {
      cancelled = true;
    };
  }, [boardSrc]);

  const applyPointer = useCallback(
    (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      const stage = stageRef.current;
      if (!drag || !stage) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      if (drag.mode === "move") {
        const dx = (clientX - drag.startX) / rect.width;
        const dy = (clientY - drag.startY) / rect.height;
        onChange({
          ...drag.origin,
          cx: clamp(drag.origin.cx + dx, 0.08, 0.92),
          cy: clamp(drag.origin.cy + dy, 0.08, 0.92),
        });
        return;
      }

      if (drag.mode === "resize") {
        const originPxX = drag.origin.cx * rect.width;
        const originPxY = drag.origin.cy * rect.height;
        const localX = clientX - rect.left - originPxX;
        const localY = clientY - rect.top - originPxY;
        const rad = (-drag.origin.rotation * Math.PI) / 180;
        const ux = localX * Math.cos(rad) - localY * Math.sin(rad);
        const uy = localX * Math.sin(rad) + localY * Math.cos(rad);
        const halfW = Math.abs(ux);
        const halfH = Math.abs(uy);
        const fromW = (halfW * 2) / rect.width;
        const fromH = ((halfH * 2) * aspect) / rect.width;
        const next = clamp(Math.max(fromW, fromH), 0.12, 0.85);
        onChange({ ...drag.origin, widthFrac: next });
        return;
      }

      if (drag.mode === "rotate") {
        const originPxX = drag.origin.cx * rect.width + rect.left;
        const originPxY = drag.origin.cy * rect.height + rect.top;
        const angle =
          (Math.atan2(clientY - originPxY, clientX - originPxX) * 180) / Math.PI;
        const delta = angle - drag.startAngle;
        onChange({
          ...drag.origin,
          rotation: clamp(drag.origin.rotation + delta, -18, 18),
        });
      }
    },
    [aspect, onChange],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      applyPointer(event.clientX, event.clientY);
    };
    const onUp = () => endDrag();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [applyPointer, endDrag]);

  const startDrag = (mode: DragMode, event: ReactPointerEvent) => {
    if (!showHandles || compareMode || !mode) return;
    event.preventDefault();
    event.stopPropagation();
    const stage = stageRef.current;
    let startAngle = 0;
    if (mode === "rotate" && stage) {
      const rect = stage.getBoundingClientRect();
      const ox = transform.cx * rect.width + rect.left;
      const oy = transform.cy * rect.height + rect.top;
      startAngle =
        (Math.atan2(event.clientY - oy, event.clientX - ox) * 180) / Math.PI;
    }
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startAngle,
      origin: { ...transform },
    };
    setDragging(true);
  };

  const boardStyle = {
    left: `${transform.cx * 100}%`,
    top: `${transform.cy * 100}%`,
    width: `${transform.widthFrac * 100}%`,
    aspectRatio: `${aspect}`,
    transform: `translate(-50%, -50%) rotate(${transform.rotation}deg)`,
  } as const;

  return (
    <Box
      ref={stageRef}
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 10",
        overflow: "hidden",
        bgcolor: "#F3F3F1",
        border: "1px solid",
        borderColor: "divider",
        userSelect: "none",
        touchAction: "none",
        containerType: "size",
      }}
      aria-label="Wall preview with board overlay"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={wallSrc}
        alt="Uploaded wall"
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {!compareMode ? (
        <Box
          sx={{
            position: "absolute",
            zIndex: 2,
            cursor: showHandles ? (dragging ? "grabbing" : "grab") : "default",
            transition: dragging ? "none" : "box-shadow 0.2s ease",
            filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.28))",
          }}
          style={boardStyle}
          onPointerDown={(event) => startDrag("move", event)}
        >
          {boardSrcState ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={boardSrcState}
              alt={boardAlt}
              draggable={false}
              onError={() => setBoardSrcState(null)}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                pointerEvents: "none",
                background: "transparent",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                bgcolor: "#FFFFFF",
                border: "6px solid #C8C8C4",
                display: "grid",
                placeItems: "center",
                px: 1,
                opacity: boardSrcState === undefined ? 0.72 : 1,
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary", textAlign: "center" }}>
                {boardSrcState === undefined ? "Preparing board…" : boardAlt}
              </Typography>
            </Box>
          )}

          {showHandles ? (
            <>
              {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                <Box
                  key={corner}
                  onPointerDown={(event) => startDrag("resize", event)}
                  sx={{
                    position: "absolute",
                    zIndex: 3,
                    width: { xs: 18, md: 14 },
                    height: { xs: 18, md: 14 },
                    bgcolor: "#FFFFFF",
                    border: "2px solid",
                    borderColor: "primary.main",
                    borderRadius: 0,
                    cursor:
                      corner === "nw" || corner === "se"
                        ? "nwse-resize"
                        : "nesw-resize",
                    ...(corner === "nw" && { left: -7, top: -7 }),
                    ...(corner === "ne" && { right: -7, top: -7 }),
                    ...(corner === "sw" && { left: -7, bottom: -7 }),
                    ...(corner === "se" && { right: -7, bottom: -7 }),
                  }}
                  aria-label={`Resize ${corner}`}
                />
              ))}
              <Box
                onPointerDown={(event) => startDrag("rotate", event)}
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: { xs: -36, md: -30 },
                  zIndex: 3,
                  width: 22,
                  height: 22,
                  ml: "-11px",
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  border: "2px solid #FFFFFF",
                  cursor: "grab",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: "50%",
                    top: "100%",
                    width: 2,
                    height: 10,
                    bgcolor: "primary.main",
                    transform: "translateX(-50%)",
                  },
                }}
                aria-label="Rotate board"
              />
            </>
          ) : null}
        </Box>
      ) : null}

      {label || sizeLabel ? (
        <Box
          sx={{
            pointerEvents: "none",
            position: "absolute",
            left: 12,
            bottom: 12,
            zIndex: 4,
            maxWidth: "70%",
            bgcolor: "rgba(255,255,255,0.95)",
            border: "1px solid",
            borderColor: "divider",
            px: 1.5,
            py: 1,
          }}
        >
          {label ? (
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
              {label}
            </Typography>
          ) : null}
          {sizeLabel ? (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {sizeLabel}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      {compareMode ? (
        <Box
          sx={{
            position: "absolute",
            left: 12,
            top: 12,
            zIndex: 4,
            bgcolor: "rgba(34,41,35,0.8)",
            color: "#fff",
            px: 1,
            py: 0.5,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Before
        </Box>
      ) : (
        <Box
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            zIndex: 4,
            bgcolor: "primary.main",
            color: "#fff",
            px: 1,
            py: 0.5,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          After
        </Box>
      )}
    </Box>
  );
}

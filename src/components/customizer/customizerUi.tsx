"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CheckIcon from "@mui/icons-material/Check";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Desktop customizer breakpoint — sticky preview uses the same query.
 */
export const DESKTOP_MQ = "@media (min-width:1024px)";
export const XL_MQ = "@media (min-width:1280px)";

export function SelectableCard({
  selected,
  onClick,
  children,
  sx,
  ariaLabel,
}: {
  selected: boolean;
  onClick?: () => void;
  children: ReactNode;
  sx?: SxProps<Theme>;
  ariaLabel?: string;
}) {
  return (
    <ButtonBase
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onClick}
      sx={[
        {
          position: "relative",
          display: "block",
          width: "100%",
          textAlign: "left",
          overflow: "hidden",
          borderRadius: "10px",
          border: "2px solid",
          borderColor: selected ? "primary.main" : "divider",
          bgcolor: selected ? "primary.light" : "#FFFFFF",
          boxShadow: selected ? "0 0 0 1px rgba(23,79,58,0.14)" : "none",
          transition: "border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease",
          "&:hover": { borderColor: "primary.main" },
          "&.Mui-focusVisible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {selected ? (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            width: 22,
            height: 22,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "#fff",
            display: "grid",
            placeItems: "center",
          }}
        >
          <CheckIcon sx={{ fontSize: 14 }} />
        </Box>
      ) : null}
      {children}
    </ButtonBase>
  );
}

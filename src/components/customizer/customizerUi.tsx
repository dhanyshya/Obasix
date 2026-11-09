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
          borderRadius: "16px",
          border: "1px solid",
          borderColor: selected ? "#1B1D1C" : "#E5E5E0",
          bgcolor: "#FFFFFF",
          boxShadow: selected ? "0 0 0 1.5px #1B1D1C" : "none",
          transition: "border-color 160ms ease, box-shadow 200ms cubic-bezier(0.16,1,0.3,1)",
          "&:hover": { borderColor: selected ? "#1B1D1C" : "#B5B5AE" },
          "&.Mui-focusVisible": {
            outline: "2px solid #164E3B",
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
            top: 10,
            right: 10,
            zIndex: 2,
            width: 24,
            height: 24,
            borderRadius: "50%",
            bgcolor: "#1B1D1C",
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

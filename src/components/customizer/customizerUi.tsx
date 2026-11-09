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
          borderRadius: 0,
          border: "2px solid",
          borderColor: selected ? "#141917" : "#DCDFDA",
          bgcolor: "#FFFFFF",
          boxShadow: selected ? "inset 0 -4px 0 #EE6A1F" : "none",
          transition: "border-color 160ms ease, box-shadow 200ms cubic-bezier(0.16,1,0.3,1)",
          "&:hover": { borderColor: selected ? "#141917" : "#8A928C" },
          "&.Mui-focusVisible": {
            outline: "3px solid #EE6A1F",
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
            top: 0,
            right: 0,
            zIndex: 2,
            width: 26,
            height: 26,
            bgcolor: "#141917",
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

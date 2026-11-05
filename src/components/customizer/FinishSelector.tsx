"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";
import type { ColourOption } from "@/lib/types";

export function FinishSelector({
  colours,
  value,
  onChange,
}: {
  colours: ColourOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (colours.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No colour options listed for this board.
      </Typography>
    );
  }

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", justifyContent: "space-between", mb: 1.25 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Colour
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {colours.find((c) => c.id === value)?.name}
        </Typography>
      </Stack>
      <Stack direction="row" useFlexGap spacing={1.25} sx={{ flexWrap: "wrap" }}>
        {colours.map((colour) => {
          const selected = value === colour.id;
          return (
            <ToggleButton
              key={colour.id}
              value={colour.id}
              selected={selected}
              aria-pressed={selected}
              aria-label={colour.name}
              title={colour.name}
              // Always selects; never toggles a colour off.
              onChange={() => onChange(colour.id)}
              sx={{
                width: 44,
                height: 44,
                p: 0,
                minWidth: 0,
                borderRadius: "50%",
                border: "none",
                bgcolor: "transparent",
                boxShadow: selected ? (theme) => `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 4px ${theme.palette.primary.main}` : "none",
                "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "transparent" },
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid rgba(0,0,0,0.1)",
                  backgroundColor: colour.hex,
                }}
              />
            </ToggleButton>
          );
        })}
      </Stack>
    </Box>
  );
}

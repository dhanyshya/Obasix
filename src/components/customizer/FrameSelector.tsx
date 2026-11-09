"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FrameOption } from "@/lib/types";
import { SelectableCard } from "./customizerUi";

export function FrameSelector({
  frames,
  value,
  onChange,
  lockedNote,
}: {
  frames: FrameOption[];
  value: string;
  onChange: (id: FrameOption["id"]) => void;
  lockedNote?: string;
}) {
  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", justifyContent: "space-between", mb: 1.25 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Frame
        </Typography>
        {lockedNote ? (
          <Typography variant="caption" color="text.secondary">
            {lockedNote}
          </Typography>
        ) : null}
      </Stack>
      <Stack spacing={1}>
        {frames.map((frame) => (
          <SelectableCard
            key={frame.id}
            selected={value === frame.id}
            onClick={() => onChange(frame.id)}
            sx={{ px: 1.75, py: 1.5 }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                aria-hidden
                sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: 0,
                  border: "1px solid rgba(0,0,0,0.1)",
                  backgroundColor: frame.swatch,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" component="span" sx={{ fontWeight: 600, display: "block" }}>
                  {frame.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="span" sx={{ display: "block" }}>
                  {frame.description}
                </Typography>
              </Box>
            </Stack>
          </SelectableCard>
        ))}
      </Stack>
    </Box>
  );
}

"use client";

import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export type FeatureCardModel = {
  id: string;
  name: string;
  description: string;
  selected: boolean;
  toggleable: boolean;
  note?: string;
};

export function FeatureSelector({
  cards,
  onToggle,
}: {
  cards: FeatureCardModel[];
  onToggle: (id: string) => void;
}) {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.25 }}>
        Optional features
      </Typography>
      <Stack spacing={1}>
        {cards.map((feature) => {
          const noteId = `${feature.id}-note`;
          return (
            <Paper
              key={feature.id}
              variant="outlined"
              sx={{
                borderRadius: "16px",
                px: 1.5,
                py: 0.75,
                borderColor: feature.selected ? "primary.main" : "divider",
                bgcolor: feature.selected ? "primary.light" : "background.paper",
                opacity: feature.toggleable ? 1 : 0.7,
              }}
            >
              <FormControlLabel
                disabled={!feature.toggleable}
                sx={{ alignItems: "flex-start", m: 0, width: "100%" }}
                control={
                  <Checkbox
                    size="small"
                    checked={feature.selected}
                    onChange={() => {
                      if (feature.toggleable) onToggle(feature.id);
                    }}
                    slotProps={{
                      input: { "aria-describedby": feature.note ? noteId : undefined },
                    }}
                    sx={{ mt: 0.25 }}
                  />
                }
                label={
                  <Box sx={{ pt: 0.75, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {feature.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {feature.description}
                    </Typography>
                    {feature.note ? (
                      <Typography id={noteId} variant="caption" color="primary" sx={{ display: "block", mt: 0.5 }}>
                        {feature.note}
                      </Typography>
                    ) : null}
                  </Box>
                }
              />
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

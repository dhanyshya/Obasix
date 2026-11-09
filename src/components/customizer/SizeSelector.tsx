"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { SelectableCard } from "./customizerUi";

export function SizeSelector({
  sizeId,
  useCustomSize,
  customWidthFt,
  customHeightFt,
  sizes,
  allowCustom,
  listedPriceLabel,
  onChange,
}: {
  sizeId: string;
  useCustomSize: boolean;
  customWidthFt: number;
  customHeightFt: number;
  sizes: { id: string; label: string; widthFt: number; heightFt: number }[];
  allowCustom: boolean;
  listedPriceLabel?: string;
  onChange: (next: {
    sizeId?: string;
    useCustomSize?: boolean;
    customWidthFt?: number;
    customHeightFt?: number;
  }) => void;
}) {
  const widthInvalid = useCustomSize && !(customWidthFt >= 1 && customWidthFt <= 20);
  const heightInvalid = useCustomSize && !(customHeightFt >= 1 && customHeightFt <= 20);

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.25 }}>
          Standard size
        </Typography>
        <Grid container spacing={1}>
          {sizes.map((size) => {
            const selected = !useCustomSize && sizeId === size.id;
            return (
              <Grid key={size.id} size={6}>
                <SelectableCard
                  selected={selected}
                  onClick={() =>
                    onChange({
                      sizeId: size.id,
                      useCustomSize: false,
                      customWidthFt: size.widthFt,
                      customHeightFt: size.heightFt,
                    })
                  }
                  sx={{ px: 1.75, py: 1.5, height: "100%" }}
                >
                  <Typography variant="body2" component="span" sx={{ fontWeight: 600, display: "block" }}>
                    {size.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="span"
                   
                    sx={{ display: "block", mt: 0.25 }}
                  >
                    {size.widthFt} × {size.heightFt} ft
                  </Typography>
                  {selected && listedPriceLabel ? (
                    <Typography
                      variant="caption"
                      color="primary"
                     
                      component="span"
                     
                      sx={{ fontWeight: 600, display: "block", mt: 0.75 }}
                    >
                      {listedPriceLabel}
                    </Typography>
                  ) : null}
                </SelectableCard>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {allowCustom ? (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.25 }}>
            Custom size
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 0,
              borderColor: useCustomSize ? "primary.main" : "divider",
              bgcolor: useCustomSize ? "primary.light" : "background.paper",
              px: 1.5,
              py: 0.75,
            }}
          >
            <FormControlLabel
              sx={{ alignItems: "flex-start", m: 0, width: "100%" }}
              control={
                <Radio
                  name="size-mode"
                  size="small"
                  checked={useCustomSize}
                  onChange={() => onChange({ sizeId: "custom", useCustomSize: true })}
                  sx={{ mt: 0.25 }}
                />
              }
              label={
                <Box sx={{ pt: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Request custom dimensions
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Width and height in feet (1–20). Confirmed on quote.
                  </Typography>
                </Box>
              }
            />
          </Paper>

          {useCustomSize ? (
            <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Width (ft)"
                  value={customWidthFt}
                  error={widthInvalid}
                  helperText={widthInvalid ? "Enter 1–20 ft" : undefined}
                  onChange={(e) => onChange({ customWidthFt: Number(e.target.value) || 1 })}
                  slotProps={{ htmlInput: { min: 1, max: 20, step: 0.5 } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Height (ft)"
                  value={customHeightFt}
                  error={heightInvalid}
                  helperText={heightInvalid ? "Enter 1–20 ft" : undefined}
                  onChange={(e) => onChange({ customHeightFt: Number(e.target.value) || 1 })}
                  slotProps={{ htmlInput: { min: 1, max: 20, step: 0.5 } }}
                />
              </Grid>
            </Grid>
          ) : null}
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Custom sizing is not listed for this board.
        </Typography>
      )}
    </Stack>
  );
}

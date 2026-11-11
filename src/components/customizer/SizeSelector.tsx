"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { SelectableCard } from "./customizerUi";

/** Custom sizes accepted for a quote, in feet. */
export const CUSTOM_MIN_FT = 0.5;
export const CUSTOM_MAX_FT = 40;
type Unit = "ft" | "in" | "cm";
const PER_FT: Record<Unit, number> = { ft: 1, in: 12, cm: 30.48 };
const PRESETS: [number, number][] = [[2, 3], [3, 4], [4, 6], [4, 8], [5, 10], [6, 12]];
const toUnit = (ft: number, u: Unit) => Math.round(ft * PER_FT[u] * 10) / 10;
const fromUnit = (v: number, u: Unit) => Math.round((v / PER_FT[u]) * 100) / 100;

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
  const [unit, setUnit] = useState<Unit>("ft");
  const inRange = (ft: number) => ft >= CUSTOM_MIN_FT && ft <= CUSTOM_MAX_FT;
  const widthInvalid = useCustomSize && !inRange(customWidthFt);
  const heightInvalid = useCustomSize && !inRange(customHeightFt);
  const rangeText = `${toUnit(CUSTOM_MIN_FT, unit)}–${toUnit(CUSTOM_MAX_FT, unit)} ${unit}`;

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
              borderRadius: "16px",
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
                    Any width and height from 0.5 to 40 ft, in feet, inches or centimetres. Priced on quote.
                  </Typography>
                </Box>
              }
            />
          </Paper>

          {useCustomSize ? (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: 1 }}>
                <Typography variant="body2" color="text.secondary">Units</Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={unit}
                  aria-label="Size units"
                  onChange={(_, next: Unit | null) => next && setUnit(next)}
                  sx={{ "& .MuiToggleButton-root": { px: 1.75, py: 0.5, textTransform: "none", fontWeight: 600 } }}
                >
                  <ToggleButton value="ft">Feet</ToggleButton>
                  <ToggleButton value="in">Inches</ToggleButton>
                  <ToggleButton value="cm">cm</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={`Width (${unit})`}
                    value={toUnit(customWidthFt, unit)}
                    error={widthInvalid}
                    helperText={widthInvalid ? `Enter ${rangeText}` : undefined}
                    onChange={(e) => onChange({ customWidthFt: fromUnit(Number(e.target.value) || 0, unit) })}
                    slotProps={{ htmlInput: { min: toUnit(CUSTOM_MIN_FT, unit), max: toUnit(CUSTOM_MAX_FT, unit), step: unit === "ft" ? 0.5 : 1 } }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={`Height (${unit})`}
                    value={toUnit(customHeightFt, unit)}
                    error={heightInvalid}
                    helperText={heightInvalid ? `Enter ${rangeText}` : undefined}
                    onChange={(e) => onChange({ customHeightFt: fromUnit(Number(e.target.value) || 0, unit) })}
                    slotProps={{ htmlInput: { min: toUnit(CUSTOM_MIN_FT, unit), max: toUnit(CUSTOM_MAX_FT, unit), step: unit === "ft" ? 0.5 : 1 } }}
                  />
                </Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                Quick sizes (ft)
              </Typography>
              <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
                {PRESETS.map(([h, w]) => {
                  const on = customWidthFt === w && customHeightFt === h;
                  return (
                    <Box
                      key={`${h}x${w}`}
                      component="button"
                      type="button"
                      aria-pressed={on}
                      onClick={() => onChange({ customWidthFt: w, customHeightFt: h })}
                      sx={{
                        all: "unset",
                        cursor: "pointer",
                        px: 1.75,
                        py: 0.75,
                        borderRadius: 99,
                        fontSize: 14,
                        fontWeight: 500,
                        border: "1px solid",
                        borderColor: on ? "#1B1D1C" : "#E5E5E0",
                        bgcolor: on ? "#1B1D1C" : "#FFFFFF",
                        color: on ? "#FFFFFF" : "#1B1D1C",
                        "&:focus-visible": { outline: "2px solid #164E3B", outlineOffset: 2 },
                      }}
                    >
                      {h} × {w}
                    </Box>
                  );
                })}
              </Stack>
            </Box>
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

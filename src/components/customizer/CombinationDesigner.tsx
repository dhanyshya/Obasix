"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import type { CombinationLayout, CombinationMaterialId, Product } from "@/lib/types";
import {
  MAX_SECTIONS,
  MIN_SECTION_PERCENT,
  addSection,
  availableCombinationMaterials,
  getCombinationMaterial,
  removeSection,
  sectionDimensionLabel,
  setSectionPercent,
} from "@/lib/combination";
import { SelectableCard } from "./customizerUi";

export function CombinationDesigner({
  product,
  layout,
  widthFt,
  heightFt,
  onChange,
}: {
  product: Product;
  layout: CombinationLayout;
  widthFt: number;
  heightFt: number;
  onChange: (layout: CombinationLayout) => void;
}) {
  const materials = availableCombinationMaterials();
  const isCombination = layout.mode === "combination";

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
          Board type
        </Typography>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <ModeCard
            title="Single Surface Board"
            description={`Use the catalogue surface listed for ${product.shortName}.`}
            selected={!isCombination}
            onClick={() =>
              onChange({
                mode: "single",
                orientation: layout.orientation,
                sections: [
                  {
                    id: "section-a",
                    materialId: layout.sections[0]?.materialId ?? materials[0].id,
                    percent: 100,
                  },
                ],
              })
            }
          />
          <ModeCard
            title="Combination Board"
            description="Divide one board into sections with different catalogue materials. Priced on quote."
            selected={isCombination}
            onClick={() => {
              if (isCombination) return;
              const primary = layout.sections[0]?.materialId ?? materials[0].id;
              const secondary =
                materials.find((material) => material.id === "fabric-softboard" && material.id !== primary)?.id ??
                materials.find((material) => material.id !== primary)?.id ??
                primary;
              onChange({
                mode: "combination",
                orientation: "vertical",
                sections: [
                  { id: "section-a", materialId: primary, percent: 50 },
                  { id: "section-b", materialId: secondary, percent: 50 },
                ],
              });
            }}
          />
        </Box>
      </Box>

      {!isCombination ? (
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Uses this product’s listed surface. Switch to Combination Board to mix materials.
        </Typography>
      ) : (
        <>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Split direction
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={layout.orientation}
              aria-label="Split direction"
              onChange={(_, orientation: CombinationLayout["orientation"] | null) => {
                if (orientation) onChange({ ...layout, orientation });
              }}
              sx={{ flexWrap: "wrap", gap: 1, "& .MuiToggleButtonGroup-grouped": { borderRadius: "10px !important", border: 1, borderColor: "divider" } }}
            >
              <ToggleButton value="vertical" sx={{ gap: 1, px: 1.75, py: 1, textTransform: "none", fontWeight: 600 }}>
                <ViewColumnOutlinedIcon fontSize="small" aria-hidden />
                Vertical (left / right)
              </ToggleButton>
              <ToggleButton value="horizontal" sx={{ gap: 1, px: 1.75, py: 1, textTransform: "none", fontWeight: 600 }}>
                <TableRowsOutlinedIcon fontSize="small" aria-hidden />
                Horizontal (top / bottom)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Sections
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Total {layout.sections.reduce((sum, section) => sum + section.percent, 0)}%
              </Typography>
            </Stack>

            {layout.sections.map((section, index) => {
              const material = getCombinationMaterial(section.materialId);
              return (
                <Paper key={section.id} variant="outlined" sx={{ borderRadius: "12px", p: 1.75 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="overline" color="primary" sx={{ fontSize: 11, lineHeight: 1.6 }}>
                        Section {index + 1}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                        {material.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {section.percent}% ·{" "}
                        {sectionDimensionLabel(widthFt, heightFt, layout.orientation, section.percent)}
                      </Typography>
                    </Box>
                    {layout.sections.length > 2 ? (
                      <IconButton
                        size="small"
                        aria-label={`Remove section ${index + 1}`}
                        onClick={() => onChange(removeSection(layout, section.id, product))}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </Stack>

                  <TextField
                    select
                    fullWidth
                    label="Surface material"
                    value={section.materialId}
                    sx={{ mt: 2 }}
                    onChange={(event) => {
                      const materialId = event.target.value as CombinationMaterialId;
                      onChange({
                        ...layout,
                        sections: layout.sections.map((item) =>
                          item.id === section.id ? { ...item, materialId } : item,
                        ),
                      });
                    }}
                  >
                    {materials.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Typography variant="caption" component="p" sx={{ fontWeight: 600, mt: 2 }}>
                    Area share ({section.percent}%)
                  </Typography>
                  <Box sx={{ px: 1 }}>
                    <Slider
                      size="small"
                      aria-label={`Section ${index + 1} area share`}
                      min={MIN_SECTION_PERCENT}
                      max={100 - MIN_SECTION_PERCENT * (layout.sections.length - 1)}
                      step={5}
                      value={section.percent}
                      onChange={(_, value) =>
                        onChange(setSectionPercent(layout, section.id, Array.isArray(value) ? value[0] : value))
                      }
                    />
                  </Box>
                  <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                    {[30, 50, 70].map((preset) => (
                      <Chip
                        key={preset}
                        size="small"
                        clickable
                        label={`${preset}%`}
                        color={section.percent === preset ? "primary" : "default"}
                        variant={section.percent === preset ? "filled" : "outlined"}
                        onClick={() => onChange(setSectionPercent(layout, section.id, preset))}
                      />
                    ))}
                  </Stack>
                </Paper>
              );
            })}

            {layout.sections.length < MAX_SECTIONS ? (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => onChange(addSection(layout, product))}
                sx={{ borderStyle: "dashed", color: "primary.main", py: 1.25 }}
              >
                Add section (max {MAX_SECTIONS})
              </Button>
            ) : null}
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Combination layouts are confirmed on a quote.
          </Typography>
        </>
      )}
    </Stack>
  );
}

function ModeCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <SelectableCard selected={selected} onClick={onClick} sx={{ px: 1.75, py: 1.5 }}>
      <Typography variant="body2" component="span" sx={{ fontWeight: 600, display: "block" }}>
        {title}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        component="span"
       
        sx={{ display: "block", mt: 0.5, lineHeight: 1.6 }}
      >
        {description}
      </Typography>
    </SelectableCard>
  );
}

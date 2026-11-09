"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type {
  ApplicationType,
  BoardCategory,
  FrameType,
  ProductFilters as Filters,
  SurfaceType,
} from "@/lib/types";
import { colours, frames } from "@/data/catalogue";

const categories: { id: BoardCategory; label: string }[] = [
  { id: "magnetic-whiteboard", label: "Magnetic Whiteboards" },
  { id: "non-magnetic-whiteboard", label: "Non-Magnetic" },
  { id: "notice-board", label: "Notice Boards" },
  { id: "pin-up-board", label: "Pin-up Boards" },
  { id: "chalk-board", label: "Chalk Boards" },
  { id: "combination-board", label: "Combination" },
  { id: "wooden-product", label: "Wooden Products" },
  { id: "accessory", label: "Accessories" },
  { id: "stand", label: "Stands" },
  { id: "desk-accessory", label: "Desk Accessories" },
];

const boardTypes = [
  { id: "whiteboard", label: "Whiteboard" },
  { id: "magnetic-whiteboard", label: "Magnetic Whiteboard" },
  { id: "notice-board", label: "Notice Board" },
  { id: "pin-up-board", label: "Pin-up Board" },
  { id: "combination-board", label: "Combination" },
  { id: "chalk-board", label: "Chalk Board" },
] as const;

const surfaces: { id: SurfaceType; label: string }[] = [
  { id: "resin-coated", label: "Resin Coated" },
  { id: "melamine-hpl", label: "Melamine HPL" },
  { id: "ceramic-steel", label: "Ceramic Steel" },
  { id: "fabric-softboard", label: "Fabric Softboard" },
  { id: "chalkboard", label: "Chalkboard" },
  { id: "dual-side", label: "Dual Side" },
];

const applications: ApplicationType[] = [
  "office",
  "classroom",
  "meeting-room",
  "home",
  "studio",
  "reception",
  "retail",
  "commercial",
];

const sizeLabels = ["1x2", "1.5x2", "2x3", "3x4", "4x6", "4x8"];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProductFilters({
  filters,
  onChange,
  maxPrice,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  maxPrice: number;
}) {
  return (
    <Paper component="aside" variant="outlined" sx={{ p: 2.5, borderRadius: 0 }}>
      <Stack spacing={3}>
        <Field label="Search">
          <TextField
            fullWidth
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Whiteboard, pin-up, stand..."
            slotProps={{ htmlInput: { "aria-label": "Search" } }}
          />
        </Field>

        <Group title="Category">
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              active={filters.categories.includes(c.id)}
              onClick={() =>
                onChange({ ...filters, categories: toggleValue(filters.categories, c.id) })
              }
            >
              {c.label}
            </FilterChip>
          ))}
        </Group>

        <Group title="Board Type">
          {boardTypes.map((b) => (
            <FilterChip
              key={b.id}
              active={filters.boardTypes.includes(b.id)}
              onClick={() =>
                onChange({ ...filters, boardTypes: toggleValue(filters.boardTypes, b.id) })
              }
            >
              {b.label}
            </FilterChip>
          ))}
        </Group>

        <Group title="Size">
          {sizeLabels.map((s) => (
            <FilterChip
              key={s}
              active={filters.sizes.includes(s)}
              onClick={() => onChange({ ...filters, sizes: toggleValue(filters.sizes, s) })}
            >
              {s.replace("x", " × ")} ft
            </FilterChip>
          ))}
        </Group>

        <Group title="Frame">
          {frames.map((f) => (
            <FilterChip
              key={f.id}
              active={filters.frames.includes(f.id)}
              onClick={() =>
                onChange({
                  ...filters,
                  frames: toggleValue(filters.frames, f.id as FrameType),
                })
              }
            >
              {f.name}
            </FilterChip>
          ))}
        </Group>

        <Group title="Surface">
          {surfaces.map((s) => (
            <FilterChip
              key={s.id}
              active={filters.surfaces.includes(s.id)}
              onClick={() =>
                onChange({ ...filters, surfaces: toggleValue(filters.surfaces, s.id) })
              }
            >
              {s.label}
            </FilterChip>
          ))}
        </Group>

        <Group title="Colour">
          {colours.map((c) => {
            const selected = filters.colours.includes(c.id);
            return (
              <ButtonBase
                key={c.id}
                title={c.name}
                aria-label={c.name}
                aria-pressed={selected}
                onClick={() =>
                  onChange({ ...filters, colours: toggleValue(filters.colours, c.id) })
                }
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: 2,
                  borderColor: selected ? "primary.main" : "background.paper",
                  boxShadow: selected ? "none" : "inset 0 0 0 1px var(--mui-palette-divider)",
                  transform: selected ? "scale(1.1)" : "none",
                }}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </Group>

        <Group title="Application">
          {applications.map((a) => (
            <FilterChip
              key={a}
              active={filters.applications.includes(a)}
              onClick={() =>
                onChange({
                  ...filters,
                  applications: toggleValue(filters.applications, a),
                })
              }
            >
              {a.replace("-", " ")}
            </FilterChip>
          ))}
        </Group>

        <Field label="Price">
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <TextField
              type="number"
              value={filters.priceMin}
              onChange={(e) => onChange({ ...filters, priceMin: Number(e.target.value) || 0 })}
              slotProps={{ htmlInput: { "aria-label": "Minimum price" } }}
            />
            <Typography component="span">–</Typography>
            <TextField
              type="number"
              value={filters.priceMax}
              onChange={(e) =>
                onChange({ ...filters, priceMax: Number(e.target.value) || maxPrice })
              }
              slotProps={{ htmlInput: { "aria-label": "Maximum price" } }}
            />
          </Stack>
        </Field>

        <Field label="Sort">
          <TextField
            select
            fullWidth
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as Filters["sort"] })}
            slotProps={{ htmlInput: { "aria-label": "Sort" } }}
          >
            <MenuItem value="featured">Featured</MenuItem>
            <MenuItem value="price-asc">Price: Low to High</MenuItem>
            <MenuItem value="price-desc">Price: High to Low</MenuItem>
            <MenuItem value="name">Name</MenuItem>
          </TextField>
        </Field>

        <Button
          variant="outlined"
          fullWidth
          onClick={() =>
            onChange({
              search: "",
              categories: [],
              boardTypes: [],
              sizes: [],
              frames: [],
              surfaces: [],
              colours: [],
              applications: [],
              priceMin: 0,
              priceMax: maxPrice,
              sort: "featured",
            })
          }
        >
          Clear filters
        </Button>
      </Stack>
    </Paper>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="primary" sx={{ display: "block", mb: 1, lineHeight: 1.6 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Field label={title}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>{children}</Box>
    </Field>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Chip
      clickable
      onClick={onClick}
      aria-pressed={active}
      color="primary"
      variant={active ? "filled" : "outlined"}
      label={children}
      sx={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}
    />
  );
}

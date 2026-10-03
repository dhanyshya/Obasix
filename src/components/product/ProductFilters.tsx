"use client";

import type { ApplicationType, MaterialType, ProductFilters as Filters } from "@/lib/types";
import { colours } from "@/data/colours";
import { finishes } from "@/data/finishes";
import { cn } from "@/lib/format";

interface ProductFiltersProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  categories: string[];
  materials: MaterialType[];
  thicknesses: number[];
  maxPrice: number;
}

const applications: ApplicationType[] = [
  "kitchen",
  "bedroom",
  "wardrobe",
  "office",
  "wall",
  "furniture",
  "partition",
  "commercial",
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProductFilters({
  filters,
  onChange,
  categories,
  materials,
  thicknesses,
  maxPrice,
}: ProductFiltersProps) {
  return (
    <aside className="space-y-6 rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--obx-green)]">
          Search
        </label>
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Board, finish, use..."
          className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] bg-[var(--obx-mist)] px-3 py-2.5 text-sm outline-none focus:border-[var(--obx-green)] focus:bg-white"
        />
      </div>

      <FilterGroup title="Category">
        {categories.map((category) => (
          <Chip
            key={category}
            active={filters.categories.includes(category)}
            onClick={() =>
              onChange({
                ...filters,
                categories: toggleValue(filters.categories, category),
              })
            }
          >
            {category}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="Material">
        {materials.map((material) => (
          <Chip
            key={material}
            active={filters.materials.includes(material)}
            onClick={() =>
              onChange({
                ...filters,
                materials: toggleValue(filters.materials, material),
              })
            }
          >
            {material.replace("-", " ")}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="Thickness">
        {thicknesses.map((thickness) => (
          <Chip
            key={thickness}
            active={filters.thicknesses.includes(thickness)}
            onClick={() =>
              onChange({
                ...filters,
                thicknesses: toggleValue(filters.thicknesses, thickness),
              })
            }
          >
            {thickness}mm
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="Finish">
        {finishes.map((finish) => (
          <Chip
            key={finish.id}
            active={filters.finishes.includes(finish.id)}
            onClick={() =>
              onChange({
                ...filters,
                finishes: toggleValue(filters.finishes, finish.id),
              })
            }
          >
            {finish.name}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="Colour">
        <div className="flex flex-wrap gap-2">
          {colours.map((colour) => {
            const active = filters.colours.includes(colour.id);
            return (
              <button
                key={colour.id}
                type="button"
                title={colour.name}
                onClick={() =>
                  onChange({
                    ...filters,
                    colours: toggleValue(filters.colours, colour.id),
                  })
                }
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition",
                  active ? "border-[var(--obx-green)] scale-110" : "border-white shadow-[inset_0_0_0_1px_var(--obx-line)]",
                )}
                style={{ backgroundColor: colour.hex }}
              />
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Application">
        {applications.map((app) => (
          <Chip
            key={app}
            active={filters.applications.includes(app)}
            onClick={() =>
              onChange({
                ...filters,
                applications: toggleValue(filters.applications, app),
              })
            }
          >
            {app}
          </Chip>
        ))}
      </FilterGroup>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--obx-green)]">
          Price range
        </label>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="number"
            min={0}
            value={filters.priceMin}
            onChange={(e) =>
              onChange({ ...filters, priceMin: Number(e.target.value) || 0 })
            }
            className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] px-2 py-2"
          />
          <span className="text-[var(--obx-muted)]">–</span>
          <input
            type="number"
            min={0}
            max={maxPrice}
            value={filters.priceMax}
            onChange={(e) =>
              onChange({ ...filters, priceMax: Number(e.target.value) || maxPrice })
            }
            className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] px-2 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--obx-green)]">
          Sort
        </label>
        <select
          value={filters.sort}
          onChange={(e) =>
            onChange({
              ...filters,
              sort: e.target.value as Filters["sort"],
            })
          }
          className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--obx-green)]"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Name</option>
        </select>
      </div>

      <button
        type="button"
        className="btn btn-ghost w-full"
        onClick={() =>
          onChange({
            search: "",
            categories: [],
            materials: [],
            thicknesses: [],
            finishes: [],
            colours: [],
            applications: [],
            priceMin: 0,
            priceMax: maxPrice,
            sort: "featured",
          })
        }
      >
        Clear filters
      </button>
    </aside>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--obx-green)]">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition",
        active
          ? "bg-[var(--obx-green)] text-white"
          : "bg-[var(--obx-mist)] text-[var(--obx-charcoal)] hover:bg-[var(--obx-green-soft)]",
      )}
    >
      {children}
    </button>
  );
}

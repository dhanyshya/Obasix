"use client";

import type { ColourSwatch } from "@/lib/types";
import { cn } from "@/lib/format";

interface ColourSelectorProps {
  colours: ColourSwatch[];
  value: string;
  onChange: (id: string) => void;
}

export function ColourSelector({ colours, value, onChange }: ColourSelectorProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--obx-ink)]">Colour</p>
        <p className="text-xs text-[var(--obx-muted)]">
          {colours.find((c) => c.id === value)?.name}
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {colours.map((colour) => {
          const active = colour.id === value;
          return (
            <button
              key={colour.id}
              type="button"
              title={colour.name}
              onClick={() => onChange(colour.id)}
              className={cn(
                "h-10 w-10 rounded-full border-2 transition",
                active
                  ? "border-[var(--obx-green)] scale-110 shadow-[var(--shadow-sm)]"
                  : "border-white shadow-[inset_0_0_0_1px_var(--obx-line)] hover:scale-105",
              )}
              style={{ backgroundColor: colour.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}

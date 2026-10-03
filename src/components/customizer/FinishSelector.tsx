"use client";

import type { FinishOption } from "@/lib/types";
import { cn } from "@/lib/format";

interface FinishSelectorProps {
  finishes: FinishOption[];
  value: string;
  onChange: (id: string) => void;
}

export function FinishSelector({ finishes, value, onChange }: FinishSelectorProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[var(--obx-ink)]">Finish</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {finishes.map((finish) => {
          const active = finish.id === value;
          return (
            <button
              key={finish.id}
              type="button"
              onClick={() => onChange(finish.id)}
              className={cn(
                "rounded-[var(--radius-md)] border px-3 py-3 text-left transition",
                active
                  ? "border-[var(--obx-green)] bg-[var(--obx-green-soft)]"
                  : "border-[var(--obx-line)] bg-white hover:border-[var(--obx-green-muted)]",
              )}
            >
              <p className="text-sm font-semibold">{finish.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--obx-muted)]">
                {finish.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

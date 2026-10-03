"use client";

interface DimensionSelectorProps {
  widthMm: number;
  heightMm: number;
  thickness: number;
  quantity: number;
  thicknesses: number[];
  onChange: (next: {
    widthMm?: number;
    heightMm?: number;
    thickness?: number;
    quantity?: number;
  }) => void;
}

export function DimensionSelector({
  widthMm,
  heightMm,
  thickness,
  quantity,
  thicknesses,
  onChange,
}: DimensionSelectorProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[var(--obx-ink)]">Dimensions</p>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Width (mm)"
          value={widthMm}
          onChange={(v) => onChange({ widthMm: v })}
        />
        <Field
          label="Height (mm)"
          value={heightMm}
          onChange={(v) => onChange({ heightMm: v })}
        />
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--obx-muted)]">
            Thickness
          </label>
          <select
            value={thickness}
            onChange={(e) => onChange({ thickness: Number(e.target.value) })}
            className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--obx-green)]"
          >
            {thicknesses.map((t) => (
              <option key={t} value={t}>
                {t}mm
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Quantity"
          value={quantity}
          min={1}
          onChange={(v) => onChange({ quantity: v })}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--obx-muted)]">
        {label}
      </label>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--obx-green)]"
      />
    </div>
  );
}

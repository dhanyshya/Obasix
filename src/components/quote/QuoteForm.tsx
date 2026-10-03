"use client";

import { FormEvent, useState } from "react";
import type { QuoteRequest } from "@/lib/types";

interface QuoteFormProps {
  initial?: Partial<QuoteRequest>;
}

const projectTypes = [
  "Kitchen",
  "Bedroom",
  "Wardrobe",
  "Office",
  "Commercial",
  "Furniture",
  "Other",
];

export function QuoteForm({ initial }: QuoteFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<QuoteRequest>({
    name: initial?.name ?? "",
    company: initial?.company ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    projectType: initial?.projectType ?? "Kitchen",
    product: initial?.product ?? "",
    dimensions: initial?.dimensions ?? "",
    quantity: initial?.quantity ?? "",
    requirements: initial?.requirements ?? "",
    configurationSummary: initial?.configurationSummary ?? "",
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // UI-ready: wire to API / CRM later
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--obx-green)] bg-[var(--obx-green-soft)] p-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--obx-green)]">
          Quote request received
        </p>
        <p className="mt-2 text-sm text-[var(--obx-muted)]">
          Your configuration has been captured. Connect this form to your quote
          backend to notify the OBASIX team automatically.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--obx-line)] bg-white p-5 shadow-[var(--shadow-sm)] md:p-8"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Name"
          required
          value={form.name}
          onChange={(name) => setForm((f) => ({ ...f, name }))}
        />
        <Field
          label="Company"
          value={form.company}
          onChange={(company) => setForm((f) => ({ ...f, company }))}
        />
        <Field
          label="Phone"
          required
          value={form.phone}
          onChange={(phone) => setForm((f) => ({ ...f, phone }))}
        />
        <Field
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(email) => setForm((f) => ({ ...f, email }))}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--obx-green)]">
          Project type
        </label>
        <select
          value={form.projectType}
          onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
          className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--obx-green)]"
        >
          {projectTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="Product"
        value={form.product}
        onChange={(product) => setForm((f) => ({ ...f, product }))}
      />
      <Field
        label="Required dimensions"
        value={form.dimensions}
        onChange={(dimensions) => setForm((f) => ({ ...f, dimensions }))}
      />
      <Field
        label="Quantity"
        value={form.quantity}
        onChange={(quantity) => setForm((f) => ({ ...f, quantity }))}
      />

      {form.configurationSummary && (
        <div className="rounded-[var(--radius-md)] bg-[var(--obx-mist)] px-4 py-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--obx-green)]">
            Attached configuration
          </p>
          <p className="mt-1 text-[var(--obx-charcoal)]">{form.configurationSummary}</p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--obx-green)]">
          Additional requirements
        </label>
        <textarea
          rows={4}
          value={form.requirements}
          onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
          className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--obx-green)]"
          placeholder="Tell us about finishes, site constraints, timelines..."
        />
      </div>

      <button type="submit" className="btn btn-primary w-full md:w-auto">
        Submit Quote Request
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--obx-green)]">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius-md)] border border-[var(--obx-line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--obx-green)]"
      />
    </div>
  );
}

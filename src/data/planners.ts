/**
 * Planning and display boards: grids printed on our magnetic whiteboard.
 *
 * Made to order and priced on quote — there are no verified SKUs or prices
 * for printed planners yet. Print and size limits below are working rules
 * to confirm with the factory.
 */
export type PlannerLayout = "grid" | "columns" | "dashboard";

export interface PlannerTemplate {
  id: string;
  name: string;
  summary: string;
  audience: string;
  layout: PlannerLayout;
  title: string;
  columns: string[];
  /** Row labels. Empty for "columns" boards, where cards move left to right. */
  rows: string[];
  /** Dashboard only: the KPI tiles across the top. */
  tiles?: string[];
  maxColumns: number;
  maxRows: number;
  suggestedAccessories: string[];
}

export const plannerTemplates: PlannerTemplate[] = [
  {
    id: "weekly",
    name: "Weekly planner",
    summary: "Days across, people or rooms down. For team rotas, room bookings and home schedules.",
    audience: "Offices · Homes · Clinics",
    layout: "grid",
    title: "This week",
    columns: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    rows: ["Asha", "Ravi", "Meera", "Karan"],
    maxColumns: 7,
    maxRows: 12,
    suggestedAccessories: ["Magnetic name strips", "Fine-tip markers"],
  },
  {
    id: "monthly",
    name: "Monthly planner",
    summary: "A reusable month: write in the dates and plan deadlines, visits and leave.",
    audience: "Offices · Schools",
    layout: "grid",
    title: "Month",
    columns: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    rows: ["", "", "", "", ""],
    maxColumns: 7,
    maxRows: 6,
    suggestedAccessories: ["Coloured magnets", "Fine-tip markers"],
  },
  {
    id: "task",
    name: "Task board",
    summary: "Columns for each stage of work. Move cards or magnets as tasks progress.",
    audience: "Teams · Studios · Start-ups",
    layout: "columns",
    title: "Team tasks",
    columns: ["To do", "Doing", "Review", "Done"],
    rows: [],
    maxColumns: 8,
    maxRows: 0,
    suggestedAccessories: ["Magnetic cards", "Coloured magnets"],
  },
  {
    id: "production",
    name: "Production dashboard",
    summary: "Daily targets against actuals by hour or shift, with KPI tiles for safety, quality and output.",
    audience: "Factories · Warehouses · Service centres",
    layout: "dashboard",
    title: "Line 1 — daily production",
    tiles: ["Safety (days)", "Target", "Actual", "Rejects"],
    columns: ["Target", "Actual", "Gap", "Reason", "Action"],
    rows: ["08–09", "09–10", "10–11", "11–12", "12–13", "13–14", "14–15", "15–16"],
    maxColumns: 8,
    maxRows: 16,
    suggestedAccessories: ["Magnetic status indicators", "Card holders"],
  },
  {
    id: "society",
    name: "Society notice board",
    summary: "Printed sections for notices, events, maintenance and emergency contacts. For lift lobbies and clubhouses.",
    audience: "Housing societies · RWAs",
    layout: "columns",
    title: "Green Meadows RWA — Notices",
    columns: ["Notices", "Events", "Maintenance", "Emergency contacts"],
    rows: [],
    maxColumns: 5,
    maxRows: 0,
    suggestedAccessories: ["Coloured magnets", "Lockable glass cover (ask in the quote)"],
  },
  {
    id: "timetable",
    name: "School timetable",
    summary: "Periods across, days down. Printed once, filled in each term.",
    audience: "Schools · Coaching centres",
    layout: "grid",
    title: "Class 7B — Timetable",
    columns: ["1", "2", "3", "4", "Break", "5", "6", "7"],
    rows: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    maxColumns: 10,
    maxRows: 6,
    suggestedAccessories: ["Magnetic subject strips", "Fine-tip markers"],
  },
  {
    id: "shift-roster",
    name: "Shift roster",
    summary: "Shifts across, team members down: who is on morning, evening and night this week.",
    audience: "Hospitals · Hotels · Security · Factories",
    layout: "grid",
    title: "Nursing roster — Ward 3",
    columns: ["Morning", "Evening", "Night", "Off"],
    rows: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    maxColumns: 6,
    maxRows: 14,
    suggestedAccessories: ["Magnetic name strips", "Coloured magnets"],
  },
  {
    id: "sales-tracker",
    name: "Sales target tracker",
    summary: "Each salesperson's monthly target against what's closed, with a column for the month's total.",
    audience: "Sales teams · Showrooms",
    layout: "dashboard",
    title: "Sales — this month",
    tiles: ["Team target", "Closed", "Pipeline"],
    columns: ["Target", "Week 1", "Week 2", "Week 3", "Week 4", "Total"],
    rows: ["Priya", "Arjun", "Neha", "Rohit", "Sana"],
    maxColumns: 8,
    maxRows: 14,
    suggestedAccessories: ["Coloured magnets", "Marker set"],
  },
  {
    id: "housekeeping",
    name: "Housekeeping checklist",
    summary: "Areas down, checks across. Tick off cleaning rounds by time or shift.",
    audience: "Hotels · Hospitals · Offices · Societies",
    layout: "grid",
    title: "Housekeeping — Floor 2",
    columns: ["8 am", "11 am", "2 pm", "5 pm", "Checked by"],
    rows: ["Lobby", "Washrooms", "Pantry", "Corridor", "Meeting rooms"],
    maxColumns: 7,
    maxRows: 12,
    suggestedAccessories: ["Fine-tip markers", "Card holders"],
  },
  {
    id: "maintenance",
    name: "Maintenance schedule",
    summary: "Equipment down, months across: when each service is due and when it was done.",
    audience: "Factories · Facilities · Societies",
    layout: "grid",
    title: "Preventive maintenance",
    columns: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    rows: ["DG set", "Lifts", "Fire pumps", "Water tanks", "AC units"],
    maxColumns: 12,
    maxRows: 14,
    suggestedAccessories: ["Magnetic status indicators", "Coloured magnets"],
  },
  {
    id: "goals",
    name: "Goals board",
    summary: "Quarterly goals and their key results, with an owner and status for each.",
    audience: "Leadership teams · Start-ups",
    layout: "grid",
    title: "Q3 goals",
    columns: ["Key result", "Owner", "Status"],
    rows: ["Goal 1", "Goal 2", "Goal 3", "Goal 4"],
    maxColumns: 5,
    maxRows: 8,
    suggestedAccessories: ["Magnetic status indicators", "Marker set"],
  },
  {
    id: "training",
    name: "Training board",
    summary: "A clear writing area with a printed header and a side panel for the agenda or key points.",
    audience: "Training rooms · Classrooms",
    layout: "grid",
    title: "Session",
    columns: ["Agenda", "Notes"],
    rows: [""],
    maxColumns: 3,
    maxRows: 2,
    suggestedAccessories: ["Flipchart clamp", "Marker set"],
  },
];

export const plannerSizes = [
  { id: "3x2", label: "3 × 2 ft", widthCm: 90, heightCm: 60 },
  { id: "4x3", label: "4 × 3 ft", widthCm: 120, heightCm: 90 },
  { id: "6x4", label: "6 × 4 ft", widthCm: 180, heightCm: 120 },
  { id: "8x4", label: "8 × 4 ft", widthCm: 240, heightCm: 120 },
] as const;

export const plannerInks = [
  { id: "charcoal", name: "Charcoal", hex: "#2F3236" },
  { id: "navy", name: "Navy", hex: "#22406B" },
  { id: "green", name: "OBASIX green", hex: "#1F5A3F" },
  { id: "red", name: "Signal red", hex: "#B8322A" },
] as const;

export type PlannerSizeId = (typeof plannerSizes)[number]["id"];
export type PlannerInkId = (typeof plannerInks)[number]["id"];

export interface PlannerDesign {
  templateId: string;
  sizeId: PlannerSizeId;
  inkId: PlannerInkId;
  title: string;
  columns: string[];
  rows: string[];
  tiles: string[];
  logo: boolean;
  quantity: number;
}

/** Working limits for screen-printed grids. */
export const MIN_CELL_CM = { width: 8, height: 4 };
const LABEL_MAX = 24;

export const getPlannerTemplate = (id: string | null | undefined) => plannerTemplates.find((t) => t.id === id);

export function defaultPlanner(template: PlannerTemplate): PlannerDesign {
  return {
    templateId: template.id,
    sizeId: template.layout === "dashboard" ? "6x4" : "4x3",
    inkId: "charcoal",
    title: template.title,
    columns: [...template.columns],
    rows: [...template.rows],
    tiles: [...(template.tiles ?? [])],
    logo: false,
    quantity: 1,
  };
}

/** Geometry shared by the preview and the rules, in cm. */
export function plannerGeometry(template: PlannerTemplate, design: PlannerDesign) {
  const size = plannerSizes.find((s) => s.id === design.sizeId) ?? plannerSizes[1];
  const margin = Math.max(3, size.widthCm * 0.03);
  const headerH = Math.max(7, size.heightCm * 0.1);
  const tilesH = template.layout === "dashboard" ? size.heightCm * 0.16 : 0;
  const innerW = size.widthCm - margin * 2;
  // Row labels get a fixed gutter on grid and dashboard boards.
  const labelW = template.layout === "columns" || design.rows.every((r) => !r.trim()) ? 0 : Math.min(innerW * 0.16, 22);
  const colHeadH = Math.max(4.5, size.heightCm * 0.06);
  const bodyTop = margin + headerH + tilesH + (tilesH ? 2 : 0);
  const bodyH = size.heightCm - bodyTop - margin - colHeadH;
  const cellW = (innerW - labelW) / Math.max(design.columns.length, 1);
  const cellH = template.layout === "columns" ? bodyH : bodyH / Math.max(design.rows.length, 1);
  return { size, margin, headerH, tilesH, innerW, labelW, colHeadH, bodyTop, bodyH, cellW, cellH };
}

export type PlannerRule = { level: "error" | "warning" | "info"; message: string };

export function checkPlanner(template: PlannerTemplate, design: PlannerDesign): { results: PlannerRule[]; ok: boolean } {
  const results: PlannerRule[] = [];
  const g = plannerGeometry(template, design);
  if (!design.title.trim()) results.push({ level: "error", message: "Add a title for the header." });
  if (design.columns.length === 0) results.push({ level: "error", message: "Add at least one column." });
  if (design.columns.length > template.maxColumns) results.push({ level: "error", message: `A ${template.name.toLowerCase()} takes up to ${template.maxColumns} columns.` });
  if (template.layout !== "columns" && design.rows.length > template.maxRows) results.push({ level: "error", message: `A ${template.name.toLowerCase()} takes up to ${template.maxRows} rows.` });
  if ([design.title, ...design.columns, ...design.rows, ...design.tiles].some((label) => label.length > LABEL_MAX + 16)) {
    results.push({ level: "error", message: "Keep labels short; long text won't fit the printed cells." });
  }
  if (g.cellW < MIN_CELL_CM.width) {
    results.push({ level: "warning", message: `Columns would be about ${g.cellW.toFixed(1)} cm wide — too narrow to write in. Use fewer columns or a larger board.` });
  }
  if (template.layout !== "columns" && g.cellH < MIN_CELL_CM.height) {
    results.push({ level: "warning", message: `Rows would be about ${g.cellH.toFixed(1)} cm high — too tight for handwriting. Use fewer rows or a larger board.` });
  }
  if (design.logo) results.push({ level: "info", message: "Send your logo with the quote request. It's printed in the header and shown on the proof." });
  if (!Number.isInteger(design.quantity) || design.quantity < 1 || design.quantity > 999) {
    results.push({ level: "error", message: "Enter a quantity from 1 to 999." });
  } else if (design.quantity >= 10) {
    results.push({ level: "info", message: "Ten or more boards are quoted at project rates, with one proof for the set." });
  }
  return { results, ok: !results.some((r) => r.level === "error") };
}

export function describePlanner(template: PlannerTemplate, design: PlannerDesign): string {
  const size = plannerSizes.find((s) => s.id === design.sizeId)!;
  const ink = plannerInks.find((i) => i.id === design.inkId)!;
  const filledRows = design.rows.filter((r) => r.trim());
  return [
    template.name,
    `${size.label} magnetic whiteboard`,
    `${ink.name} print`,
    `Title: ${design.title.trim()}`,
    ...(design.tiles.length ? [`Tiles: ${design.tiles.join(", ")}`] : []),
    `Columns: ${design.columns.join(", ")}`,
    ...(template.layout === "columns"
      ? []
      : [filledRows.length ? `Rows: ${design.rows.join(", ")}` : `${design.rows.length} blank rows`]),
    ...(design.logo ? ["Logo in header"] : []),
  ].join(" · ");
}

/** Shareable link state. */
export function encodePlanner(design: PlannerDesign): string {
  const params = new URLSearchParams({ t: design.templateId, s: design.sizeId, i: design.inkId, h: design.title, q: String(design.quantity) });
  if (design.logo) params.set("logo", "1");
  design.columns.forEach((c) => params.append("c", c));
  design.rows.forEach((r) => params.append("r", r));
  design.tiles.forEach((k) => params.append("k", k));
  return params.toString();
}

export function decodePlanner(params: URLSearchParams): PlannerDesign | null {
  const template = getPlannerTemplate(params.get("t"));
  if (!template) return null;
  const base = defaultPlanner(template);
  const clip = (list: string[], max: number) => list.slice(0, max).map((v) => v.slice(0, LABEL_MAX));
  const sizeId = plannerSizes.find((s) => s.id === params.get("s"))?.id ?? base.sizeId;
  const inkId = plannerInks.find((i) => i.id === params.get("i"))?.id ?? base.inkId;
  const quantity = Number(params.get("q"));
  return {
    ...base,
    sizeId,
    inkId,
    title: (params.get("h") ?? base.title).slice(0, LABEL_MAX + 16),
    columns: params.has("c") ? clip(params.getAll("c"), template.maxColumns) : base.columns,
    rows: template.layout === "columns" ? [] : params.has("r") ? clip(params.getAll("r"), template.maxRows) : base.rows,
    tiles: params.has("k") ? clip(params.getAll("k"), 6) : base.tiles,
    logo: params.get("logo") === "1",
    quantity: Number.isInteger(quantity) && quantity >= 1 && quantity <= 999 ? quantity : base.quantity,
  };
}

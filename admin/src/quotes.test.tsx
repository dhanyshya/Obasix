import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { dayRange } from "./pages/Quotes";
import { admin, renderAt, stubApi } from "./test/render";

const quote = {
  reference: "OBX-QUOTE-DEMO-ABC123",
  createdAt: "2026-11-20T10:00:00.000Z",
  name: "Meera Iyer",
  company: "Iyer Schools",
  email: "meera@example.com",
  phone: "9876543210",
  location: "Pune",
  boardType: "Glass Board",
  product: "",
  dimensions: "6 × 4 ft",
  quantity: 2,
  configurationSummary: "",
  notes: "For two classrooms",
  lines: [{ productId: "cmwb6090", name: "Classic Board", sku: "CMWB6090", quantity: 2, catalogueUnitPrice: 1825, detail: "" }],
  catalogueListSubtotal: 3650,
  attachment: { name: "plan.pdf", type: "application/pdf", size: 120_000 },
};

describe("dayRange", () => {
  it("turns local days into the instants the API filters on", () => {
    const { since, until } = dayRange("2026-11-01", "2026-11-02");
    expect(new Date(since!).getTime()).toBe(new Date("2026-11-01T00:00:00").getTime());
    expect(new Date(until!).getTime() - new Date(since!).getTime()).toBe(2 * 86_400_000);
    expect(dayRange("", "")).toEqual({ since: undefined, until: undefined });
  });
});

describe("quotes page", () => {
  it("lists quotes, sends filters and order to the API, and shows details", async () => {
    const queries: URLSearchParams[] = [];
    stubApi((url) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (url.pathname === "/api/admin/quotes") {
        queries.push(url.searchParams);
        return { body: { ok: true, items: [quote], page: 1, pageSize: 25, total: 1 } };
      }
    });
    renderAt("/quotes");
    expect(await screen.findByText("OBX-QUOTE-DEMO-ABC123")).toBeInTheDocument();
    expect(screen.getByText("File: plan.pdf")).toBeInTheDocument();
    expect(screen.getByText("₹3,650")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Search"), "meera");
    await userEvent.click(screen.getByRole("combobox", { name: "File" }));
    await userEvent.click(screen.getByRole("option", { name: "With a file" }));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(queries.at(-1)?.get("q")).toBe("meera"));
    expect(queries.at(-1)?.get("attachment")).toBe("true");

    await userEvent.click(screen.getByRole("button", { name: "Received" }));
    await waitFor(() => expect(queries.at(-1)?.get("order")).toBe("asc"));

    await userEvent.click(screen.getByRole("button", { name: "Details for OBX-QUOTE-DEMO-ABC123" }));
    const dialog = await screen.findByRole("dialog", { name: "Quote OBX-QUOTE-DEMO-ABC123" });
    expect(within(dialog).getByText("meera@example.com")).toBeInTheDocument();
    expect(within(dialog).getByText(/2 × Classic Board \(CMWB6090\)/)).toBeInTheDocument();
    expect(within(dialog).getByText(/plan.pdf \(117 KB\)/)).toBeInTheDocument();
  });

  it("checks the date range before asking the API", async () => {
    const calls: string[] = [];
    stubApi((url) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (url.pathname === "/api/admin/quotes") {
        calls.push(url.search);
        return { body: { ok: true, items: [], page: 1, pageSize: 25, total: 0 } };
      }
    });
    renderAt("/quotes");
    expect(await screen.findByText("No quotes match.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("From"), "2026-11-10");
    await userEvent.type(screen.getByLabelText("To"), "2026-11-01");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByText("“From” must be on or before “To”.")).toBeInTheDocument();
    expect(calls).toHaveLength(1);
  });
});

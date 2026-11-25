import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { admin, clerk, renderAt, stubApi } from "./test/render";

function stub(handlers: Record<string, unknown>, posts: unknown[], me = admin) {
  return stubApi((url, init) => {
    if (url.pathname === "/api/admin/me") return { body: { ok: true, ...me } };
    if (init.method === "POST") {
      posts.push({ path: url.pathname, ...JSON.parse(String(init.body)) });
      return { body: { ok: true } };
    }
    if (url.pathname in handlers) return { body: { ok: true, items: handlers[url.pathname] } };
  });
}

describe("associates", () => {
  it("pays selected payable commissions with a bank reference", async () => {
    const posts: unknown[] = [];
    stub(
      {
        "/api/admin/associates": [{ code: "ASHA2345", name: "Asha", email: "a@x.com", status: "active", city: "Pune", profession: "", orders: 1, referredSales: 1000, awaiting: 0, payable: 50, paid: 0, quotes: 0 }],
        "/api/admin/commissions": [
          { id: "COM-1", orderId: "OBX-A", code: "ASHA2345", associateName: "Asha", amount: 50, baseAmount: 1000, state: "Payable", orderStatus: "Delivered", payoutRef: "", voidReason: "", createdAt: "" },
          { id: "COM-2", orderId: "OBX-B", code: "ASHA2345", associateName: "Asha", amount: 70, baseAmount: 1400, state: "Awaiting delivery", orderStatus: "Processing", payoutRef: "", voidReason: "", createdAt: "" },
        ],
      },
      posts,
    );
    renderAt("/associates");
    await userEvent.click(await screen.findByRole("checkbox", { name: "Select COM-1" }));
    expect(screen.queryByRole("checkbox", { name: "Select COM-2" })).toBeNull(); // not payable yet
    await userEvent.click(screen.getByRole("button", { name: "Pay 1 selected" }));
    const dialog = await screen.findByRole("dialog", { name: "Pay 1 commission" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark paid" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Enter the bank transfer or UTR reference");
    await userEvent.type(within(dialog).getByLabelText("Bank or UTR reference"), "UTR777");
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark paid" }));
    await waitFor(() => expect(posts).toEqual([{ path: "/api/admin/associates", action: "pay", ids: ["COM-1"], payoutRef: "UTR777" }]));
  });
});

describe("distributors", () => {
  it("sends a full decision, and staff can't decide", async () => {
    const posts: unknown[] = [];
    const d = { userId: "u1", businessName: "Sharma Traders", businessType: "", gstin: "27AAPFU0939F1ZV", city: "Pune", state: "MH", territoryRequest: "Pune district", status: "pending", tier: "silver", territory: "", creditLimit: 0, quarterlyTarget: 0, reviewDate: "", name: "", email: "d@x.com", creditUsed: 0, quarterPurchases: 0, orderCount: 0 };
    stub({ "/api/admin/distributors": [d], "/api/admin/trade-orders": [] }, posts);
    const view = renderAt("/distributors");
    await userEvent.click(await screen.findByRole("button", { name: "Decide Sharma Traders" }));
    const dialog = await screen.findByRole("dialog", { name: "Decide Sharma Traders" });
    await userEvent.clear(within(dialog).getByLabelText("Credit limit (₹)"));
    await userEvent.type(within(dialog).getByLabelText("Credit limit (₹)"), "50000");
    await userEvent.type(within(dialog).getByLabelText("Next territory review"), "2027-03-31");
    await userEvent.click(within(dialog).getByRole("button", { name: "Save decision" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toMatchObject({ action: "decide", userId: "u1", status: "approved", tier: "silver", territory: "Pune district", creditLimit: 50000, reviewDate: "2027-03-31" });
    view.unmount();

    stub({ "/api/admin/distributors": [d], "/api/admin/trade-orders": [] }, posts, clerk);
    renderAt("/distributors");
    await screen.findByText("Sharma Traders");
    expect(screen.queryByRole("button", { name: "Decide Sharma Traders" })).toBeNull();
  });
});

describe("partners", () => {
  it("quotes a project with value and margin as numbers", async () => {
    const posts: unknown[] = [];
    stub(
      {
        "/api/admin/partners": [],
        "/api/admin/projects": [{ id: "PRJ-ABC123", clientName: "ABC School", city: "Pune", sector: "School or college", partnerCompany: "Fitout Co", expectedValue: 250000, status: "Submitted", quotedValue: 0, marginRate: 0, earning: 0, conflictWith: "", linkedOrderId: null, payoutRef: "" }],
      },
      posts,
    );
    renderAt("/partners");
    await userEvent.click(await screen.findByRole("button", { name: "Quote" }));
    const dialog = await screen.findByRole("dialog", { name: "Quote PRJ-ABC123" });
    await userEvent.type(within(dialog).getByLabelText("Partner margin (%)"), "7.5");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(posts).toEqual([{ path: "/api/admin/partners", action: "quote", projectId: "PRJ-ABC123", quotedValue: 250000, marginPercent: 7.5, note: "" }]));
  });
});

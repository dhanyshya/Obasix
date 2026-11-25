import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { admin, renderAt, stubApi } from "./test/render";

const base = {
  id: "OBX-1A2B3C4D",
  method: "online",
  email: "ravi@example.com",
  phone: "9876543210",
  customerName: "Ravi Kumar",
  items: [{ productId: "cmwb6090", name: "Classic Board", quantity: 2, unitPrice: 1825, lineTotal: 3650 }],
  subtotal: 3650,
  status: "Processing",
  shippingAddress: { line: "12 MG Road", city: "Bengaluru", state: "KA", postal: "560001", country: "India" },
  createdAt: "2026-11-22T10:00:00.000Z",
  paymentStatus: "paid",
  staffNote: "",
  updatedBy: null,
  providerPaymentId: "pay_1",
  nextStatus: "Dispatched",
};

function stub(order: object, posts: unknown[]) {
  return stubApi((url, init) => {
    if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
    if (url.pathname === "/api/admin/orders" && init.method === "POST") {
      posts.push(JSON.parse(String(init.body)));
      return { body: { ok: true } };
    }
    if (url.pathname === "/api/admin/orders") return { body: { ok: true, items: [order], page: 1, pageSize: 25, total: 1 } };
  });
}

describe("orders page", () => {
  it("dispatch needs a courier and tracking number, then sends them", async () => {
    const posts: unknown[] = [];
    stub(base, posts);
    renderAt("/orders");
    await userEvent.click(await screen.findByRole("button", { name: "Manage OBX-1A2B3C4D" }));
    const dialog = await screen.findByRole("dialog", { name: "Order OBX-1A2B3C4D" });
    expect(within(dialog).getByText("Razorpay payment pay_1")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Mark Dispatched" }));
    expect(within(dialog).getByText(/The customer is emailed the courier and tracking number/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm: Dispatched" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Enter the courier and tracking number");
    expect(posts).toEqual([]);
    await userEvent.type(within(dialog).getByLabelText("Courier"), "Delhivery");
    await userEvent.type(within(dialog).getByLabelText("Tracking number"), "DLV123");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm: Dispatched" }));
    await waitFor(() => expect(posts).toEqual([{ orderId: "OBX-1A2B3C4D", action: "advance", courier: "Delhivery", trackingNumber: "DLV123" }]));
    expect(await screen.findByText("OBX-1A2B3C4D is now Dispatched.")).toBeInTheDocument();
  });

  it("cancel needs a reason, and unpaid orders can't advance", async () => {
    const posts: unknown[] = [];
    stub({ ...base, paymentStatus: "pending", status: "Pending Payment", nextStatus: null, method: "online" }, posts);
    renderAt("/orders");
    await userEvent.click(await screen.findByRole("button", { name: "Manage OBX-1A2B3C4D" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: /^Mark/ })).toBeNull();
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel order" }));
    await userEvent.type(within(dialog).getByLabelText("Reason (shown to staff)"), "no");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm cancellation" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Add a note explaining the cancellation.");
    await userEvent.type(within(dialog).getByLabelText("Reason (shown to staff)"), " stock left");
    await userEvent.click(within(dialog).getByRole("button", { name: "Confirm cancellation" }));
    await waitFor(() => expect(posts).toEqual([{ orderId: "OBX-1A2B3C4D", action: "cancel", note: "no stock left" }]));
  });

  it("sends filters to the API", async () => {
    const queries: URLSearchParams[] = [];
    stubApi((url) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (url.pathname === "/api/admin/orders") {
        queries.push(url.searchParams);
        return { body: { ok: true, items: [], page: 1, pageSize: 25, total: 0 } };
      }
    });
    renderAt("/orders?kind=live&payment=paid&status=Processing");
    await screen.findByText("No orders match.");
    expect(queries[0].get("kind")).toBe("live");
    expect(queries[0].get("payment")).toBe("paid");
    expect(queries[0].get("status")).toBe("Processing");
  });
});

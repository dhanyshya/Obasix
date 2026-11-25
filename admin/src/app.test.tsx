import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { admin, clerk, renderApp, renderAt, stubApi } from "./test/render";

const notFound = { status: 404, body: { ok: false, message: "Not found." } };
const stockPage = (items: unknown[]) => ({ body: { ok: true, items, page: 1, pageSize: 25, total: items.length } });
const row = { productId: "cmwb6090", name: "Classic Magnetic Whiteboard 2×3", sku: "CMWB6090", onHand: 5, state: "low", updatedBy: "boss@example.com", updatedAt: "2026-11-25T10:00:00.000Z" };

describe("sign-in", () => {
  it("shows the sign-in form when not signed in, and signs a staff member in", async () => {
    let signedIn = false;
    stubApi((url, init) => {
      if (url.pathname === "/api/admin/me") return signedIn ? { body: { ok: true, ...admin } } : notFound;
      if (url.pathname === "/api/auth" && url.searchParams.get("action") === "login") {
        expect(JSON.parse(String(init.body))).toEqual({ email: "boss@example.com", password: "pw-123456" });
        signedIn = true;
        return { body: { ok: true } };
      }
      if (url.pathname === "/api/admin/stock") return stockPage([]);
      if (url.pathname === "/api/admin/audit") return { body: { ok: true, items: [], page: 1, pageSize: 8, total: 0 } };
    });
    renderApp();
    await userEvent.type(await screen.findByLabelText(/Email/), "boss@example.com");
    await userEvent.type(screen.getByLabelText(/Password/), "pw-123456");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByText("boss@example.com · admin")).toBeInTheDocument();
  });

  it("refuses a customer account and signs it straight out again", async () => {
    const actions: string[] = [];
    stubApi((url) => {
      if (url.pathname === "/api/admin/me") return notFound;
      if (url.pathname === "/api/auth") {
        actions.push(url.searchParams.get("action")!);
        return { body: { ok: true } };
      }
    });
    renderApp();
    await userEvent.type(await screen.findByLabelText(/Email/), "customer@example.com");
    await userEvent.type(screen.getByLabelText(/Password/), "pw-123456");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("doesn't have staff access");
    expect(actions).toEqual(["login", "logout"]);
  });

  it("checks the form before sending anything", async () => {
    const calls = stubApi((url) => (url.pathname === "/api/admin/me" ? notFound : undefined));
    renderApp();
    await userEvent.click(await screen.findByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter your staff email address.");
    expect(calls).toHaveLength(1); // only the initial "am I signed in?" check
  });
});

describe("permissions", () => {
  it("a staff-role member sees no Audit or Staff links and gets 'No access' by URL", async () => {
    stubApi((url) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...clerk } };
      if (url.pathname === "/api/admin/stock") return stockPage([]);
    });
    renderAt("/staff");
    expect(await screen.findByRole("heading", { name: "No access" })).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Admin sections" });
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual(["Overview", "Orders", "Stock", "Quotes", "Proofs"]);
  });

  it("goes back to sign-in when the API says the role is gone", async () => {
    let calls = 0;
    stubApi((url) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (url.pathname === "/api/admin/staff") return calls++ === 0 ? notFound : undefined;
    });
    renderAt("/staff");
    expect(await screen.findByText(/Your session ended or your role changed/)).toBeInTheDocument();
  });
});

describe("stock", () => {
  it("validates before saving, saves, and asks before stopping tracking", async () => {
    const posts: unknown[] = [];
    stubApi((url, init) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (url.pathname === "/api/admin/stock" && init.method === "POST") {
        posts.push(JSON.parse(String(init.body)));
        return { body: { ok: true } };
      }
      if (url.pathname === "/api/admin/stock") return stockPage([row]);
    });
    renderAt("/stock");
    const input = await screen.findByLabelText("On hand for Classic Magnetic Whiteboard 2×3");
    await userEvent.clear(input);
    await userEvent.type(input, "2.5");
    expect(screen.getByText("Enter a whole number from 0 to 100,000.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, "12");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Classic Magnetic Whiteboard 2×3: on hand set to 12.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Stop tracking" }));
    const dialog = await screen.findByRole("dialog", { name: "Stop tracking Classic Magnetic Whiteboard 2×3?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(posts).toEqual([{ productId: "cmwb6090", onHand: 12 }]);

    await userEvent.click(screen.getByRole("button", { name: "Stop tracking" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Stop tracking" }));
    await waitFor(() => expect(posts).toEqual([{ productId: "cmwb6090", onHand: 12 }, { productId: "cmwb6090", onHand: null }]));
  });

  it("a double click on confirm sends one request", async () => {
    let posts = 0;
    stubApi((url, init) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (init.method === "POST") {
        posts += 1;
        return { body: { ok: true } };
      }
      if (url.pathname === "/api/admin/stock") return stockPage([row]);
    });
    renderAt("/stock");
    await userEvent.click(await screen.findByRole("button", { name: "Stop tracking" }));
    await userEvent.dblClick(within(await screen.findByRole("dialog")).getByRole("button", { name: "Stop tracking" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(posts).toBe(1);
  });

  it("sends search, filter, sort and page to the API", async () => {
    const queries: string[] = [];
    stubApi((url) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (url.pathname === "/api/admin/stock") {
        queries.push(url.search);
        return stockPage([row]);
      }
    });
    renderAt("/stock?state=low&sort=onHand&order=desc&page=1");
    await screen.findByText("Classic Magnetic Whiteboard 2×3");
    expect(queries[0]).toContain("state=low");
    expect(queries[0]).toContain("sort=onHand");
    expect(queries[0]).toContain("order=desc");
    await userEvent.click(screen.getByRole("button", { name: "SKU" }));
    await waitFor(() => expect(queries.at(-1)).toContain("sort=sku"));
    await userEvent.type(screen.getByLabelText("Search name or SKU"), "CMWB");
    await waitFor(() => expect(queries.at(-1)).toContain("q=CMWB"));
  });

  it("shows the server's message and reference when a save is refused", async () => {
    stubApi((url, init) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (init.method === "POST") return { status: 403, body: { ok: false, message: "You don't have permission to do that." } };
      if (url.pathname === "/api/admin/stock") return stockPage([row]);
    });
    renderAt("/stock");
    const input = await screen.findByLabelText("On hand for Classic Magnetic Whiteboard 2×3");
    await userEvent.clear(input);
    await userEvent.type(input, "7");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("You don't have permission to do that. (ref srv012345678)");
  });
});

describe("staff", () => {
  it("can't change config admins, confirms before removing, and checks duplicates", async () => {
    const deletes: string[] = [];
    stubApi((url, init) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (url.pathname === "/api/admin/staff" && init.method === "DELETE") {
        deletes.push(url.searchParams.get("email")!);
        return { body: { ok: true } };
      }
      if (url.pathname === "/api/admin/staff")
        return { body: { ok: true, items: [{ email: "boss@example.com", role: "admin", source: "config" }, { email: "clerk@example.com", role: "staff", source: "granted", grantedBy: "boss@example.com" }] } };
    });
    renderAt("/staff");
    const bossRow = (await screen.findByText("boss@example.com (you)")).closest("tr")!;
    expect(within(bossRow).queryByRole("button")).toBeNull();
    expect(within(bossRow).getByText("Server setting")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Email"), "Clerk@Example.com");
    await userEvent.click(screen.getByRole("button", { name: "Give role" }));
    expect(screen.getByText("That email already has a role. Change it in the table.")).toBeInTheDocument();

    const clerkRow = screen.getByText("clerk@example.com").closest("tr")!;
    await userEvent.click(within(clerkRow).getByRole("button", { name: "Remove" }));
    const dialog = await screen.findByRole("dialog", { name: "Remove clerk@example.com's role?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Remove role" }));
    await waitFor(() => expect(deletes).toEqual(["clerk@example.com"]));
  });
});

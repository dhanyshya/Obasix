import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { proofFileError } from "./pages/Proofs";
import { admin, renderAt, stubApi } from "./test/render";

const proof = {
  id: "PRF-1A2B3C4D",
  quoteReference: "OBX-QUOTE-DEMO-ABC123",
  version: 2,
  fileName: "logo.png",
  mimeType: "image/png",
  size: 2048,
  staffNote: "Bigger logo",
  uploadedBy: "boss@example.com",
  createdAt: "2026-11-21T10:00:00.000Z",
  status: "changes",
  decidedAt: "2026-11-21T12:00:00.000Z",
  decidedBy: "meera@example.com",
  customerComment: "Use the blue logo",
};

describe("proofFileError (same checks as the API)", () => {
  const file = (type: string, size: number) => new File([new Uint8Array(size)], "f", { type });
  it("explains each problem", () => {
    expect(proofFileError(null)).toBe("Choose the proof file.");
    expect(proofFileError(file("image/gif", 10))).toBe("Upload the proof as a PNG, JPEG, WebP or PDF.");
    expect(proofFileError(file("application/pdf", 5 * 1024 * 1024 + 1))).toBe("The proof must be 5 MB or smaller.");
    expect(proofFileError(file("image/png", 10))).toBe("");
  });
});

describe("proofs page", () => {
  it("lists proofs with the customer's reply and a file link", async () => {
    stubApi((url) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (url.pathname === "/api/admin/proofs") return { body: { ok: true, items: [proof], page: 1, pageSize: 25, total: 1 } };
    });
    renderAt("/proofs?quoteReference=OBX-QUOTE-DEMO-ABC123");
    const table = await screen.findByRole("table", { name: "Proofs" });
    await within(table).findByText("Changes requested");
    expect(within(table).getByText("“Use the blue logo”")).toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "logo.png" })).toHaveAttribute("href", "/api/proofs/PRF-1A2B3C4D/file");
  });

  it("checks the form, asks before sending, and uploads as a form", async () => {
    const uploads: FormData[] = [];
    stubApi((url, init) => {
      if (url.pathname === "/api/admin/me") return { body: { ok: true, ...admin } };
      if (url.pathname === "/api/admin/proofs" && init.method === "POST") {
        uploads.push(init.body as FormData);
        return { body: { ok: true, version: 3 } };
      }
      if (url.pathname === "/api/admin/proofs") return { body: { ok: true, items: [], page: 1, pageSize: 25, total: 0 } };
    });
    renderAt("/proofs");
    await screen.findByText("No proofs match.");
    await userEvent.click(screen.getByRole("button", { name: "Send proof" }));
    expect(screen.getByText("Enter the quote reference.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Choose the proof file.");

    await userEvent.type(screen.getByLabelText("Quote reference"), "obx-quote-demo-abc123");
    await userEvent.type(screen.getByLabelText("Note to the customer"), "New colours");
    await userEvent.upload(screen.getByLabelText("Proof file"), new File([new Uint8Array([137, 80, 78, 71])], "logo.png", { type: "image/png" }));
    await userEvent.click(screen.getByRole("button", { name: "Send proof" }));
    const dialog = await screen.findByRole("dialog", { name: "Send this proof for OBX-QUOTE-DEMO-ABC123?" });
    expect(uploads).toHaveLength(0);
    await userEvent.click(within(dialog).getByRole("button", { name: "Send proof" }));
    await waitFor(() => expect(uploads).toHaveLength(1));
    expect(uploads[0].get("quoteReference")).toBe("OBX-QUOTE-DEMO-ABC123");
    expect(uploads[0].get("note")).toBe("New colours");
    expect((uploads[0].get("file") as File).name).toBe("logo.png");
    expect(await screen.findByText("Version 3 sent to the customer for OBX-QUOTE-DEMO-ABC123.")).toBeInTheDocument();
  });
});

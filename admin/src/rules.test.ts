import { describe, expect, it } from "vitest";
import { actionLabel } from "./pages/Audit";
import { onHandError } from "./pages/Stock";

describe("onHandError (same rule as the API)", () => {
  it.each([
    ["0", ""],
    ["100000", ""],
    ["42", ""],
    ["", "Enter a number."],
    ["-1", "Enter a whole number from 0 to 100,000."],
    ["2.5", "Enter a whole number from 0 to 100,000."],
    ["100001", "Enter a whole number from 0 to 100,000."],
    ["abc", "Enter a whole number from 0 to 100,000."],
  ])("%j → %j", (value, message) => expect(onHandError(value)).toBe(message));
});

describe("actionLabel", () => {
  const entry = (action: string, detail: Record<string, unknown>, targetId = "cmwb6090") => ({ action, detail, targetId, targetType: "product" });
  it("describes each audited action", () => {
    expect(actionLabel(entry("stock.set", { before: null, after: 5 }))).toBe("set stock for cmwb6090: none → 5");
    expect(actionLabel(entry("stock.untrack", { before: 5, after: null }))).toBe("stopped tracking cmwb6090 (was 5)");
    expect(actionLabel(entry("staff.grant", { before: null, after: "staff" }, "a@b.co"))).toBe("gave a@b.co the staff role");
    expect(actionLabel(entry("staff.grant", { before: "staff", after: "admin" }, "a@b.co"))).toBe("changed a@b.co from staff to admin");
    expect(actionLabel(entry("staff.revoke", { before: "admin", after: null }, "a@b.co"))).toBe("removed a@b.co's admin role");
    expect(actionLabel(entry("orders.cancel", {}, "OBX-1"))).toBe("orders.cancel product OBX-1");
  });
});

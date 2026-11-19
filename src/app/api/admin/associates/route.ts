import { readAdminSession } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/auth/session";
import { markCommissionsPaid, setAssociateStatus, voidCommission } from "@/lib/associates/store";
import { commerceMode } from "@/lib/commerce/mode";
import { advanceDemoOrderStatus } from "@/lib/commerce/order-store";

export const runtime = "nodejs";

function clean(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  // Same answer as a missing route, so the endpoint isn't advertised.
  if (!(await readAdminSession())) return fail("Not found.", 404);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = clean(body?.action, 30);

  if (action === "pause" || action === "activate") {
    const ok = await setAssociateStatus(clean(body?.code, 12), action === "pause" ? "paused" : "active");
    return ok ? Response.json({ ok: true }) : fail("No associate has that code.", 404);
  }

  if (action === "pay") {
    const ids = Array.isArray(body?.ids) ? body.ids.map((id) => clean(id, 20)).filter(Boolean).slice(0, 200) : [];
    const payoutRef = clean(body?.payoutRef, 60);
    if (ids.length === 0) return fail("Select at least one payable commission.");
    if (payoutRef.length < 3) return fail("Enter the bank transfer or UTR reference for this payout.");
    const result = await markCommissionsPaid(ids, payoutRef);
    return Response.json({ ok: true, ...result });
  }

  if (action === "void") {
    const reason = clean(body?.reason, 200);
    if (reason.length < 3) return fail("Give a reason for voiding this commission.");
    return await voidCommission(clean(body?.id, 20), reason)
      ? Response.json({ ok: true })
      : fail("Only unpaid commissions can be voided.", 409);
  }

  if (action === "advance-order") {
    if (commerceMode() !== "demo") return fail("Order status is managed by the order system.", 409);
    const order = await advanceDemoOrderStatus(clean(body?.orderId, 40));
    return order ? Response.json({ ok: true, status: order.status }) : fail("No order has that reference.", 404);
  }

  return fail("Unknown action.");
}

import { readAdminSession } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { distributorTiers, type DistributorTierId } from "@/lib/distributors/program";
import { decideDistributor, updateTradeOrder } from "@/lib/distributors/store";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1e9 ? Math.round(n) : null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readAdminSession();
  if (!session) return fail("Not found.", 404);
  const staffEmail = session.user.email;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = cleanText(body?.action, 30);

  if (action === "decide") {
    const status = body?.status;
    if (status !== "approved" && status !== "rejected" && status !== "suspended") return fail("Choose a decision.");
    const tier = cleanText(body?.tier, 20) as DistributorTierId;
    if (!distributorTiers.some((t) => t.id === tier)) return fail("Choose a tier.");
    const creditLimit = money(body?.creditLimit);
    const quarterlyTarget = money(body?.quarterlyTarget);
    if (creditLimit === null || quarterlyTarget === null) return fail("Credit limit and target must be amounts in rupees.");
    const territory = cleanText(body?.territory, 200);
    const reviewDate = cleanText(body?.reviewDate, 10);
    const note = cleanText(body?.note, 500);
    if (status === "approved") {
      if (territory.length < 2) return fail("Assign a territory before approving.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate)) return fail("Set the next territory review date.");
    }
    if (status !== "approved" && note.length < 3) return fail("Add a note explaining the decision.");
    const ok = decideDistributor({
      userId: cleanText(body?.userId, 60),
      status,
      tier,
      territory,
      creditLimit,
      quarterlyTarget,
      reviewDate,
      note,
      staffEmail,
    });
    return ok ? Response.json({ ok: true }) : fail("No distributor application found.", 404);
  }

  if (action === "record-payment" || action === "advance" || action === "cancel") {
    const paymentRef = cleanText(body?.paymentRef, 60);
    if (action === "record-payment" && paymentRef.length < 3) return fail("Enter the payment or UTR reference.");
    const result = updateTradeOrder({ id: cleanText(body?.orderId, 40), action, paymentRef, staffEmail });
    return result.ok ? Response.json({ ok: true, order: result.order }) : fail(result.message, 409);
  }

  return fail("Unknown action.");
}

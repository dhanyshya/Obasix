import { readAdminSession } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { decidePartner, updateProject } from "@/lib/partners/store";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readAdminSession();
  if (!session) return fail("Not found.", 404);
  const staffEmail = session.user.email;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = cleanText(body?.action, 30);
  const note = cleanText(body?.note, 500);

  if (action === "decide") {
    const status = body?.status;
    if (status !== "approved" && status !== "rejected" && status !== "suspended") return fail("Choose a decision.");
    if (status !== "approved" && note.length < 3) return fail("Add a note explaining the decision.");
    return await decidePartner({ userId: cleanText(body?.userId, 60), status, note, staffEmail })
      ? Response.json({ ok: true })
      : fail("No partner application found.", 404);
  }

  const projectId = cleanText(body?.projectId, 20);
  let result;
  switch (action) {
    case "quote": {
      const quotedValue = Math.round(Number(body?.quotedValue));
      const marginPercent = Number(body?.marginPercent);
      if (!Number.isFinite(quotedValue) || quotedValue > 1e9) return fail("Enter the quoted value in rupees.");
      if (!Number.isFinite(marginPercent)) return fail("Enter the negotiated margin as a percentage.");
      result = await updateProject(projectId, { action: "quote", quotedValue, marginRate: Math.round(marginPercent * 10) / 1000, note }, staffEmail);
      break;
    }
    case "advance":
      result = await updateProject(projectId, { action: "advance", linkedOrderId: cleanText(body?.linkedOrderId, 40) || undefined, note }, staffEmail);
      break;
    case "lose":
      result = await updateProject(projectId, { action: "lose", note }, staffEmail);
      break;
    case "pay":
      result = await updateProject(projectId, { action: "pay", payoutRef: cleanText(body?.payoutRef, 60) }, staffEmail);
      break;
    default:
      return fail("Unknown action.");
  }
  return result.ok ? Response.json(result) : fail(result.message, 409);
}

import { readSession, sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { customerCanSeeQuote, decideProof, findProof } from "@/lib/proofs/store";
import { sendEmail, staffAlertEmails } from "@/lib/email/send";
import { staffProofDecisionEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

/** The customer approves a proof or asks for changes. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readSession();
  if (!session) return fail("Sign in to review your proofs.", 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const decision = body?.decision;
  if (decision !== "approved" && decision !== "changes") return fail("Choose approve or request changes.");
  const found = findProof(cleanText(body?.proofId, 20));
  // Same answer for "doesn't exist" and "not yours", so proof IDs can't be probed.
  if (!found || !(await customerCanSeeQuote(found.proof.quoteReference, session.user.id, session.user.email))) {
    return fail("That proof wasn't found.", 404);
  }
  if (decision === "approved" && body?.confirm !== true) {
    return fail("Confirm you've checked the wording, sizes and colours.");
  }
  const comment = cleanText(body?.comment, 1000);
  if (decision === "changes" && comment.length < 5) return fail("Tell us what to change.");
  const result = decideProof({
    proofId: found.proof.id,
    decision,
    comment,
    customerEmail: session.user.email,
  });
  if (!result.ok) return fail(result.message, 409);
  await sendEmail({
    to: staffAlertEmails(),
    ...staffProofDecisionEmail({ reference: found.proof.quoteReference, version: found.proof.version, decision, comment, customer: session.user.email }),
  });
  return Response.json({ ok: true });
}

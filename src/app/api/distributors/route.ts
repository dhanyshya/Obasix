import { readSession, sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { businessTypes, isValidGstin, type BusinessType } from "@/lib/distributors/program";
import { applyAsDistributor, findDistributor } from "@/lib/distributors/store";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

/** Apply to become a distributor. Staff review every application. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readSession();
  if (!session) return fail("Sign in to apply.", 401);

  const existing = findDistributor(session.user.id);
  if (existing && existing.status !== "rejected") return Response.json({ ok: true, distributor: existing });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const businessName = cleanText(body?.businessName, 100);
  const businessType = body?.businessType;
  const gstin = cleanText(body?.gstin, 15).toUpperCase().replace(/\s/g, "");
  const city = cleanText(body?.city, 60);
  const state = cleanText(body?.state, 60);
  const territoryRequest = cleanText(body?.territoryRequest, 200);
  const notes = cleanText(body?.notes, 1000);

  if (businessName.length < 2) return fail("Enter your registered business name.");
  if (!businessTypes.includes(businessType as BusinessType)) return fail("Choose your type of business.");
  if (!isValidGstin(gstin)) return fail("Enter a valid 15-character GSTIN.");
  if (city.length < 2 || state.length < 2) return fail("Enter your city and state.");
  if (territoryRequest.length < 2) return fail("Tell us which area you want to cover.");
  if (body?.accept !== true) return fail("Accept the distributor terms to apply.");

  const distributor = applyAsDistributor({
    userId: session.user.id,
    businessName,
    businessType: businessType as BusinessType,
    gstin,
    city,
    state,
    territoryRequest,
    notes,
  });
  return Response.json({ ok: true, distributor });
}

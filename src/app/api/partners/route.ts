import { readSession, sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { isValidGstin } from "@/lib/distributors/program";
import { partnerTypes, projectSectors, type PartnerType, type ProjectSector } from "@/lib/partners/program";
import { applyAsPartner, findPartner, registerProject } from "@/lib/partners/store";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

/** Apply as a project partner, or (once approved) register a client project. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readSession();
  if (!session) return fail("Sign in first.", 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const partner = findPartner(session.user.id);

  if (body?.action === "apply") {
    if (partner && partner.status !== "rejected") return Response.json({ ok: true });
    const companyName = cleanText(body.companyName, 100);
    const gstin = cleanText(body.gstin, 15).toUpperCase().replace(/\s/g, "");
    const city = cleanText(body.city, 60);
    const state = cleanText(body.state, 60);
    const notes = cleanText(body.notes, 1000);
    const sectors = Array.isArray(body.sectors)
      ? [...new Set(body.sectors.filter((s): s is ProjectSector => projectSectors.includes(s as ProjectSector)))]
      : [];
    if (companyName.length < 2) return fail("Enter your registered company name.");
    if (!partnerTypes.includes(body.partnerType as PartnerType)) return fail("Choose your type of business.");
    if (!isValidGstin(gstin)) return fail("Enter a valid 15-character GSTIN.");
    if (city.length < 2 || state.length < 2) return fail("Enter your city and state.");
    if (sectors.length === 0) return fail("Choose at least one sector you work in.");
    if (body.accept !== true) return fail("Accept the partner terms to apply.");
    applyAsPartner({ userId: session.user.id, companyName, partnerType: body.partnerType as PartnerType, gstin, city, state, sectors, notes });
    return Response.json({ ok: true });
  }

  if (body?.action === "register-project") {
    if (partner?.status !== "approved") return fail("Only approved partners can register projects.", 403);
    const clientName = cleanText(body.clientName, 120);
    const city = cleanText(body.city, 60);
    const scope = cleanText(body.scope, 1500);
    const expectedDate = cleanText(body.expectedDate, 10);
    const expectedValue = Math.round(Number(body.expectedValue));
    if (clientName.length < 2) return fail("Enter the client's name.");
    if (city.length < 2) return fail("Enter the project city.");
    if (!projectSectors.includes(body.sector as ProjectSector)) return fail("Choose the project's sector.");
    if (scope.length < 10) return fail("Describe the scope: rooms, boards, signage and quantities.");
    if (!Number.isFinite(expectedValue) || expectedValue < 1 || expectedValue > 1e9) return fail("Enter the expected project value in rupees.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expectedDate) || Number.isNaN(Date.parse(expectedDate))) return fail("Enter the expected order date.");
    const result = registerProject({
      partnerUserId: session.user.id,
      clientName,
      city,
      sector: body.sector as ProjectSector,
      scope,
      expectedValue,
      expectedDate,
    });
    // Only the new id: a held registration mustn't reveal the earlier partner's project.
    return result.ok ? Response.json({ ok: true, id: result.project.id }) : fail(result.message, 409);
  }

  return fail("Unknown action.");
}

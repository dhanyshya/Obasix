import { readSession, sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import {
  addMember,
  createCompany,
  deleteReorderList,
  findMembership,
  linesFromOrder,
  removeMember,
  saveReorderList,
  setMemberRole,
  type CompanyRole,
} from "@/lib/company/store";
import { isValidGstin } from "@/lib/distributors/program";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });
const done = () => Response.json({ ok: true });
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isRole = (value: unknown): value is CompanyRole => value === "owner" || value === "buyer";

/** Company reorder accounts: create a company, manage colleagues, save and delete reorder lists. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readSession();
  if (!session) return fail("Sign in to manage your company account.", 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body?.action;
  const me = session.user.email;

  if (action === "create") {
    const name = cleanText(body?.name, 100);
    const gstin = cleanText(body?.gstin, 15).toUpperCase().replace(/\s/g, "");
    const billingAddress = cleanText(body?.billingAddress, 300);
    if (name.length < 2) return fail("Enter your company name.");
    if (gstin && !isValidGstin(gstin)) return fail("Enter a valid 15-character GSTIN, or leave it blank.");
    const result = createCompany({ ownerEmail: me, name, gstin, billingAddress });
    return result.ok ? done() : fail(result.message, 409);
  }

  const membership = findMembership(me);
  if (!membership) return fail("You're not part of a company account.", 403);
  const companyId = membership.company.id;
  const isOwner = membership.role === "owner";

  switch (action) {
    case "add-member":
    case "remove-member":
    case "set-role": {
      if (!isOwner) return fail("Only company owners can manage people.", 403);
      const email = cleanText(body?.email, 120).toLowerCase();
      if (!isEmail(email)) return fail("Enter a valid email address.");
      if (action === "add-member") {
        const role = isRole(body?.role) ? body.role : "buyer";
        const result = addMember(companyId, email, role, me);
        return result.ok ? done() : fail(result.message, 409);
      }
      if (action === "set-role") {
        if (!isRole(body?.role)) return fail("Choose owner or buyer.");
        const result = setMemberRole(companyId, email, body.role);
        return result.ok ? done() : fail(result.message, 409);
      }
      const result = removeMember(companyId, email);
      return result.ok ? done() : fail(result.message, 409);
    }

    case "save-list": {
      const name = cleanText(body?.name, 80);
      if (name.length < 2) return fail("Give the list a name, such as \"Branch office standard\".");
      let lines: unknown = body?.lines;
      let source = "Saved from cart";
      if (typeof body?.orderId === "string") {
        const fromOrder = linesFromOrder(body.orderId, session.user.id);
        if (!fromOrder) return fail("That order wasn't found in your account.", 404);
        lines = fromOrder;
        source = `Saved from order ${body.orderId}`;
      }
      const result = saveReorderList({ companyId, name, lines, source, createdBy: me });
      return result.ok ? Response.json({ ok: true, id: result.id }) : fail(result.message);
    }

    case "delete-list": {
      if (!isOwner) return fail("Only company owners can delete shared lists.", 403);
      const listId = cleanText(body?.listId, 20);
      return deleteReorderList(companyId, listId) ? done() : fail("That list wasn't found.", 404);
    }

    default:
      return fail("Unknown action.");
  }
}

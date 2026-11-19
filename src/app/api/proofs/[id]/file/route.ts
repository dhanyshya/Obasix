import { readAdminSession } from "@/lib/admin/auth";
import { readSession } from "@/lib/auth/session";
import { customerCanSeeQuote, findProof, readProofFile } from "@/lib/proofs/store";

export const runtime = "nodejs";

const notFound = () => new Response("Not found", { status: 404 });

/** Serves a proof file to staff or to the customer whose quote it belongs to. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const found = findProof(id.slice(0, 20));
  if (!found) return notFound();
  const staff = await readAdminSession();
  if (!staff) {
    const session = await readSession();
    if (!session || !(await customerCanSeeQuote(found.proof.quoteReference, session.user.id, session.user.email))) return notFound();
  }
  const bytes = await readProofFile(found.storedAs).catch(() => null);
  if (!bytes) return notFound();
  const name = `${found.proof.quoteReference}-v${found.proof.version}.${found.storedAs.split(".").pop()}`;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": found.proof.mimeType,
      "content-disposition": `inline; filename="${name}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

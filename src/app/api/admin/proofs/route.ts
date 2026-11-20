import { readAdminSession } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/auth/session";
import { cleanText } from "@/lib/clean";
import { fileExtensions, sniffType } from "@/lib/files";
import { proofMaxBytes, uploadProof } from "@/lib/proofs/store";
import { sendEmail } from "@/lib/email/send";
import { proofReadyEmail } from "@/lib/email/templates";
import { findDemoQuote } from "@/lib/quotes/demo-store";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

/** Staff upload a new proof version for a quote. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  const session = await readAdminSession();
  if (!session) return fail("Not found.", 404);

  const form = await request.formData().catch(() => null);
  if (!form) return fail("Send the proof as a form upload.");
  const quoteReference = cleanText(form.get("quoteReference"), 40).toUpperCase();
  const staffNote = cleanText(form.get("note"), 600);
  const file = form.get("file");
  if (!quoteReference) return fail("Enter the quote reference.");
  if (!(file instanceof File) || file.size === 0) return fail("Choose the proof file.");
  if (file.size > proofMaxBytes) return fail("The proof must be 5 MB or smaller.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffType(bytes);
  if (!mimeType || !fileExtensions[mimeType]) return fail("Upload the proof as a PNG, JPEG, WebP or PDF.");

  const result = await uploadProof({
    quoteReference,
    fileName: cleanText(file.name, 120) || `proof.${fileExtensions[mimeType]}`,
    mimeType,
    bytes,
    staffNote,
    staffEmail: session.user.email,
  });
  if (!result.ok) return fail(result.message, 409);
  const quote = await findDemoQuote(quoteReference);
  if (quote) await sendEmail({ to: quote.email, ...proofReadyEmail({ reference: quoteReference, version: result.version, note: staffNote }) });
  return Response.json({ ok: true, version: result.version });
}

import { readSession } from "@/lib/auth/session";
import { canViewQuote } from "@/lib/quotes/access";
import { allowQuoteAttempt, findDemoQuote } from "@/lib/quotes/demo-store";
import { clientAddress } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** A saved quote, for the person who sent it (see lib/quotes/access.ts). */
export async function GET(request: Request, context: { params: Promise<{ reference: string }> }) {
  if (!(await allowQuoteAttempt(`lookup:${clientAddress(request)}`, 60, 10 * 60 * 1000))) {
    return Response.json({ ok: false, message: "Too many lookups. Wait a few minutes and try again." }, { status: 429 });
  }
  const { reference } = await context.params;
  if (!reference.startsWith("OBX-QUOTE-DEMO-")) {
    return Response.json(
      { ok: false, message: "This reference is not a demo quote. No quote database is connected." },
      { status: 404 },
    );
  }
  const quote = await findDemoQuote(reference);
  // Same answer for "no such quote" and "not yours", so references can't be probed.
  if (!quote || !(await canViewQuote(quote, await readSession()))) {
    return Response.json({ ok: false, message: "No saved demo quote matches that reference." }, { status: 404 });
  }
  return Response.json({
    ok: true,
    mode: "demo",
    notified: false,
    quote: {
      reference: quote.reference,
      boardType: quote.boardType,
      dimensions: quote.dimensions,
      quantity: quote.quantity,
      product: quote.product,
      productId: quote.productId,
      frame: quote.frame,
      colour: quote.colour,
      surface: quote.surface ?? "",
      location: quote.location ?? "",
      features: quote.features,
      accessories: quote.accessories,
      branding: quote.branding,
      notes: quote.notes,
      configurationSummary: quote.configurationSummary,
      lines: quote.lines.map((line) => ({
        productId: line.productId,
        name: line.name,
        sku: line.sku,
        quantity: line.quantity,
        catalogueUnitPrice: line.catalogueUnitPrice,
        detail: line.detail,
      })),
      catalogueListSubtotal: quote.catalogueListSubtotal,
      attachmentName: quote.attachment?.name ?? null,
    },
  });
}

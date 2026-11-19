import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { signType } from "@/components/home/directory/sign";
import { requireAdmin } from "@/lib/admin/auth";
import { formatPrice } from "@/lib/format";
import { listAllProofs, type Proof } from "@/lib/proofs/store";
import { listDemoQuotes } from "@/lib/quotes/demo-store";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata: Metadata = { title: "Quotes · Staff" };

const proofText: Record<Proof["status"], string> = {
  pending: "waiting for customer",
  approved: "approved",
  changes: "changes requested",
  superseded: "superseded",
};

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AdminQuotesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin(); // Before loading data: see requireAdmin.
  const q = String((await searchParams).q ?? "").trim().toLowerCase().slice(0, 80);
  const all = await listDemoQuotes();
  const quotes = (q
    ? all.filter((quote) =>
        [quote.reference, quote.name, quote.company, quote.email, quote.phone, quote.location, quote.boardType, quote.product]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : all
  ).slice(0, 100);

  // Latest proof per quote.
  const latestProof = new Map<string, Proof>();
  for (const proof of listAllProofs(1000)) {
    const current = latestProof.get(proof.quoteReference);
    if (!current || proof.version > current.version) latestProof.set(proof.quoteReference, proof);
  }

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box>
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>Quote requests</Typography>
        <Typography sx={{ color: brand.body, mt: 1 }}>
          {all.length} {all.length === 1 ? "request" : "requests"} stored on this server. Custom work needs an approved proof before production.
        </Typography>
      </Box>
      <Box component="form" method="get" role="search" sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField name="q" size="small" label="Search reference, name, company, email, city" defaultValue={q} sx={{ minWidth: { xs: "100%", sm: 380 } }} />
        <Button type="submit" variant="outlined">Search</Button>
        {q ? <Button component={Link} href="/admin/quotes">Clear</Button> : null}
      </Box>

      {quotes.length === 0 ? (
        <Typography sx={{ color: brand.muted }}>{q ? "No quotes match that search." : "No quote requests yet."}</Typography>
      ) : (
        quotes.map((quote) => {
          const proof = latestProof.get(quote.reference);
          return (
            <Paper key={quote.reference} variant="outlined" component="details" sx={{ p: 2, "& > summary": { cursor: "pointer", listStyle: "none" } }}>
              <Box component="summary" sx={{ display: "grid", gap: 0.5, gridTemplateColumns: { md: "1.2fr 1.5fr 1fr 1fr" }, alignItems: "center" }}>
                <Typography sx={{ ...signType.code, fontSize: 13 }}>{quote.reference}</Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {quote.name}{quote.company ? ` · ${quote.company}` : ""}
                </Typography>
                <Typography sx={{ fontSize: 14, color: brand.body }}>{quote.boardType} × {quote.quantity}</Typography>
                <Typography sx={{ fontSize: 14, color: proof?.status === "approved" ? brand.forest : brand.muted }}>
                  {proof ? `Proof v${proof.version}: ${proofText[proof.status]}` : when(quote.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ mt: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
                <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "140px 1fr", gap: 0.75, fontSize: 14, "& dt": { color: brand.muted }, "& dd": { m: 0, overflowWrap: "anywhere" } }}>
                  <dt>Received</dt><dd>{when(quote.createdAt)}</dd>
                  <dt>Email</dt><dd><a href={`mailto:${quote.email}`}>{quote.email}</a></dd>
                  <dt>Phone</dt><dd><a href={`tel:${quote.phone.replace(/[^\d+]/g, "")}`}>{quote.phone}</a></dd>
                  <dt>Location</dt><dd>{quote.location || "—"}</dd>
                  <dt>Product</dt><dd>{quote.product || "—"}</dd>
                  <dt>Size</dt><dd>{quote.dimensions || "—"}</dd>
                  {quote.frame ? <><dt>Frame</dt><dd>{quote.frame}</dd></> : null}
                  {quote.colour ? <><dt>Colour</dt><dd>{quote.colour}</dd></> : null}
                  {quote.branding ? <><dt>Branding</dt><dd>{quote.branding}</dd></> : null}
                </Box>
                <Box sx={{ display: "grid", gap: 1.5, alignContent: "start", fontSize: 14 }}>
                  {quote.configurationSummary ? <Box><Typography sx={{ fontWeight: 600, fontSize: 14 }}>Configuration</Typography><Typography sx={{ fontSize: 14 }}>{quote.configurationSummary}</Typography></Box> : null}
                  {quote.notes ? <Box><Typography sx={{ fontWeight: 600, fontSize: 14 }}>Notes</Typography><Typography sx={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{quote.notes}</Typography></Box> : null}
                  {quote.lines.length > 0 ? (
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Catalogue lines (list {formatPrice(quote.catalogueListSubtotal)})</Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {quote.lines.map((line, i) => <li key={i}>{line.quantity} × {line.name} ({line.sku}){line.detail ? ` — ${line.detail}` : ""}</li>)}
                      </Box>
                    </Box>
                  ) : null}
                  {quote.attachment ? (
                    quote.attachment.storedAs ? (
                      <a href={`/api/admin/quotes/${quote.reference}/file`}>Download attachment ({quote.attachment.name})</a>
                    ) : <span>Attachment {quote.attachment.name} wasn&apos;t stored.</span>
                  ) : null}
                  <Box>
                    {proof?.status === "approved" ? (
                      <Link href="/admin/proofs">Approved proof v{proof.version}</Link>
                    ) : (
                      <Button component={Link} href={`/admin/proofs?ref=${encodeURIComponent(quote.reference)}`} variant="contained" size="small">
                        {proof ? "Send a revised proof" : "Send a proof"}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          );
        })
      )}
    </Box>
  );
}

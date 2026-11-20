import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { signType } from "@/components/home/directory/sign";
import { ProofDecision } from "@/components/proofs/ProofDecision";
import { readSession } from "@/lib/auth/session";
import { listProofsForQuote, quoteReferencesForCustomer, type Proof } from "@/lib/proofs/store";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata: Metadata = { title: "Proofs" };

const statusText: Record<Proof["status"], string> = {
  pending: "Waiting for your review",
  approved: "Approved for production",
  changes: "Changes requested",
  superseded: "Replaced by a newer version",
};

const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function AccountProofsPage() {
  const session = await readSession();
  if (!session) return null; // The account layout redirects signed-out visitors.
  const references = [...(await quoteReferencesForCustomer(session.user.id, session.user.email))];
  const threads = (await Promise.all(references.map(async (reference) => ({ reference, proofs: await listProofsForQuote(reference) }))))
    .filter((thread) => thread.proofs.length > 0)
    .sort((a, b) => b.proofs[0].createdAt.localeCompare(a.proofs[0].createdAt));

  return (
    <Box>
      <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>Design proofs</Typography>
      <Typography sx={{ color: brand.body, mt: 1.5, mb: 4, maxWidth: 640, lineHeight: 1.65 }}>
        For nameplates, signage and branded boards we send a proof before anything is made. Check every word, size and colour:
        we make it exactly as the version you approve.
      </Typography>

      {threads.length === 0 ? (
        <Typography sx={{ color: brand.muted }}>
          No proofs yet. When you <Link href="/signage/design">design a sign</Link> or request a quote for a branded board, our team
          sends the proof here.
        </Typography>
      ) : (
        <Box sx={{ display: "grid", gap: 3 }}>
          {threads.map(({ reference, proofs }) => {
            const latest = proofs[0];
            return (
              <Paper key={reference} variant="outlined" component="section" aria-labelledby={`q-${reference}`} sx={{ p: { xs: 2, md: 3 } }}>
                <Typography id={`q-${reference}`} sx={{ ...signType.code, fontSize: 14 }}>{reference}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 20, mt: 0.5, color: latest.status === "approved" ? brand.forest : brand.signalInk }}>
                  Version {latest.version} · {statusText[latest.status]}
                </Typography>
                {latest.staffNote ? <Typography sx={{ mt: 1, color: brand.body }}>{latest.staffNote}</Typography> : null}
                <Box sx={{ mt: 2, mb: 2 }}>
                  {latest.mimeType === "application/pdf" ? (
                    <Link href={`/api/proofs/${latest.id}/file`} target="_blank" rel="noopener">Open proof (PDF, opens in a new tab)</Link>
                  ) : (
                    <a href={`/api/proofs/${latest.id}/file`} target="_blank" rel="noopener">
                      {/* eslint-disable-next-line @next/next/no-img-element -- private, authenticated file */}
                      <img
                        src={`/api/proofs/${latest.id}/file`}
                        alt={`Proof version ${latest.version} for ${reference}`}
                        style={{ maxWidth: "100%", maxHeight: 520, border: `1px solid ${brand.line}`, background: "#fff" }}
                      />
                    </a>
                  )}
                </Box>
                {latest.status === "pending" ? <ProofDecision proofId={latest.id} version={latest.version} /> : null}
                {latest.status === "changes" ? (
                  <Typography sx={{ color: brand.body }}>
                    You asked: “{latest.customerComment}”. We&apos;ll send a new version here.
                  </Typography>
                ) : null}
                {latest.status === "approved" && latest.decidedAt ? (
                  <Typography sx={{ color: brand.body }}>Approved on {date(latest.decidedAt)}. This version goes into production.</Typography>
                ) : null}

                {proofs.length > 1 ? (
                  <Box component="details" sx={{ mt: 2 }}>
                    <Box component="summary" sx={{ cursor: "pointer", fontWeight: 600 }}>Earlier versions</Box>
                    <Box component="ul" sx={{ pl: 2.5, mt: 1, display: "grid", gap: 0.75 }}>
                      {proofs.slice(1).map((proof) => (
                        <li key={proof.id}>
                          <Link href={`/api/proofs/${proof.id}/file`} target="_blank" rel="noopener">Version {proof.version}</Link>
                          {" "}· {date(proof.createdAt)} · {statusText[proof.status]}
                          {proof.customerComment ? ` — “${proof.customerComment}”` : ""}
                        </li>
                      ))}
                    </Box>
                  </Box>
                ) : null}
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

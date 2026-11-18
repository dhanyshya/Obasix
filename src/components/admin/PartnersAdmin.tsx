"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { signType } from "@/components/home/directory/sign";
import { formatPrice } from "@/lib/format";
import { maxMarginRate, nextProjectStatus } from "@/lib/partners/program";
import type { PartnerStatus, PartnerSummary, ProjectWithPartner } from "@/lib/partners/store";
import { brandTokens as brand } from "@/theme/brandTokens";

const statusLabel: Record<PartnerStatus, { text: string; colour: string }> = {
  pending: { text: "Awaiting review", colour: brand.signalInk },
  approved: { text: "Approved", colour: brand.forest },
  suspended: { text: "Suspended", colour: brand.action },
  rejected: { text: "Rejected", colour: brand.muted },
};

const tableSx = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
  "& th, & td": { textAlign: "left", px: 1.5, py: 1.1, borderBottom: `1px solid ${brand.line}`, verticalAlign: "top" },
  "& th": { color: brand.muted, fontWeight: 500, whiteSpace: "nowrap" },
  "& .num": { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" },
} as const;
const frameSx = { overflowX: "auto", border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, bgcolor: brand.white, mt: 1.5 } as const;
const h2 = { ...signType.plate, fontSize: 24 } as const;

type Draft = { quotedValue: string; marginPercent: string; note: string; linkedOrderId: string; payoutRef: string };
const emptyDraft: Draft = { quotedValue: "", marginPercent: "", note: "", linkedOrderId: "", payoutRef: "" };

export function PartnersAdmin({ partners, projects }: { partners: PartnerSummary[]; projects: ProjectWithPartner[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const post = async (payload: Record<string, unknown>, success: string) => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setNotice({ severity: "error", text: data.message ?? "That didn't work. Try again." });
        return false;
      }
      setNotice({ severity: "success", text: success });
      router.refresh();
      return true;
    } catch {
      setNotice({ severity: "error", text: "Couldn't reach the server." });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openFor = (p: ProjectWithPartner) => {
    setOpenProject(openProject === p.id ? null : p.id);
    setDraft({
      ...emptyDraft,
      quotedValue: p.quotedValue ? String(p.quotedValue) : String(p.expectedValue),
      marginPercent: p.marginRate ? String(+(p.marginRate * 100).toFixed(1)) : "",
      note: p.staffNote,
    });
  };
  const field = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [key]: e.target.value }));
  const close = (ok: boolean) => ok && setOpenProject(null);

  const pending = partners.filter((p) => p.status === "pending").length;
  const toQuote = projects.filter((p) => p.status === "Submitted").length;
  const payable = projects.filter((p) => p.status === "Delivered").reduce((s, p) => s + p.earning, 0);

  return (
    <Box sx={{ display: "grid", gap: 5 }}>
      <Box>
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>Project partners</Typography>
        <Typography sx={{ color: brand.body, mt: 1 }}>
          {pending} {pending === 1 ? "application" : "applications"} to review · {toQuote} {toQuote === 1 ? "project" : "projects"} to quote · {formatPrice(payable)} margin payable
        </Typography>
      </Box>

      <Box aria-live="polite">{notice ? <Alert severity={notice.severity}>{notice.text}</Alert> : null}</Box>

      <Box component="section" aria-labelledby="partners">
        <Typography id="partners" component="h2" sx={h2}>Partners</Typography>
        {partners.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 1 }}>No applications yet.</Typography>
        ) : (
          <Box sx={frameSx}>
            <Box component="table" sx={{ ...tableSx, minWidth: 860 }}>
              <thead>
                <tr>
                  <th scope="col">Partner</th>
                  <th scope="col">Type and sectors</th>
                  <th scope="col" className="num">Won value</th>
                  <th scope="col">Status</th>
                  <th scope="col">Decision</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.userId}>
                    <td>
                      <Box sx={{ fontWeight: 600 }}>{p.companyName}</Box>
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>
                        {p.name} · {p.email} · {p.phone || "no phone"}
                      </Box>
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>
                        {p.city}, {p.state} · GSTIN {p.gstin}
                      </Box>
                      {p.notes ? <Box sx={{ fontSize: 13, mt: 0.5, maxWidth: 320 }}>{p.notes}</Box> : null}
                    </td>
                    <td>
                      {p.partnerType}
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>{p.sectors.join(", ")}</Box>
                    </td>
                    <td className="num">
                      {formatPrice(p.wonValue)}
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>{p.projects} {p.projects === 1 ? "project" : "projects"}</Box>
                    </td>
                    <td>
                      <Box component="span" sx={{ fontWeight: 600, color: statusLabel[p.status].colour }}>{statusLabel[p.status].text}</Box>
                      {p.decidedBy ? <Box sx={{ color: brand.muted, fontSize: 13 }}>by {p.decidedBy}</Box> : null}
                    </td>
                    <td>
                      <Box sx={{ display: "grid", gap: 1, minWidth: 220 }}>
                        <TextField
                          size="small"
                          label="Note to partner"
                          value={notes[p.userId] ?? p.decisionNote}
                          onChange={(e) => setNotes((n) => ({ ...n, [p.userId]: e.target.value }))}
                          slotProps={{ htmlInput: { maxLength: 500 } }}
                        />
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          {(["approved", "rejected", "suspended"] as const)
                            .filter((s) => s !== p.status)
                            .map((s) => (
                              <Button
                                key={s}
                                size="small"
                                variant={s === "approved" ? "contained" : "text"}
                                disabled={busy}
                                onClick={() => post({ action: "decide", userId: p.userId, status: s, note: notes[p.userId] ?? p.decisionNote }, `${p.companyName}: ${statusLabel[s].text.toLowerCase()}.`)}
                              >
                                {s === "approved" ? "Approve" : s === "rejected" ? "Reject" : "Suspend"}
                              </Button>
                            ))}
                        </Box>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
      </Box>

      <Box component="section" aria-labelledby="projects">
        <Typography id="projects" component="h2" sx={h2}>Projects</Typography>
        {projects.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 1 }}>No projects registered yet.</Typography>
        ) : (
          <Box sx={frameSx}>
            <Box component="table" sx={{ ...tableSx, minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Partner</th>
                  <th scope="col" className="num">Value</th>
                  <th scope="col" className="num">Margin</th>
                  <th scope="col">Status</th>
                  <th scope="col"><Box component="span" sx={visuallyHidden}>Actions</Box></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const next = nextProjectStatus[p.status];
                  const canQuote = p.status === "Submitted" || p.status === "Quoted";
                  const canLose = !["Delivered", "Paid", "Lost"].includes(p.status);
                  const isOpen = openProject === p.id;
                  return (
                    <Box component="tr" key={p.id} sx={{ bgcolor: p.conflictWith ? "rgba(194, 99, 32, 0.06)" : undefined }}>
                      <td>
                        <Box sx={{ fontWeight: 600 }}>{p.clientName}</Box>
                        <Box sx={{ color: brand.muted, fontSize: 13 }}>
                          {p.id} · {p.city} · {p.sector} · order by {p.expectedDate}
                        </Box>
                        <Box sx={{ fontSize: 13, mt: 0.5, maxWidth: 360 }}>{p.scope}</Box>
                        {p.conflictWith ? (
                          <Box sx={{ color: brand.signalInk, fontSize: 13, fontWeight: 600, mt: 0.5 }}>
                            Same client registered earlier in {p.conflictWith}. That registration stands.
                          </Box>
                        ) : null}
                        {p.linkedOrderId ? <Box sx={{ color: brand.muted, fontSize: 13 }}>Website order {p.linkedOrderId}</Box> : null}
                        {p.updatedBy ? <Box sx={{ color: brand.muted, fontSize: 13 }}>Last change by {p.updatedBy}</Box> : null}

                        {isOpen ? (
                          <Box sx={{ display: "grid", gap: 1.25, mt: 1.5, p: 1.5, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, maxWidth: 420 }}>
                            {canQuote ? (
                              <>
                                <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 120px" }}>
                                  <TextField size="small" type="number" label="Quoted value (₹)" value={draft.quotedValue} onChange={field("quotedValue")} />
                                  <TextField size="small" type="number" label="Margin %" value={draft.marginPercent} onChange={field("marginPercent")} slotProps={{ htmlInput: { min: 0, max: maxMarginRate * 100, step: 0.5 } }} />
                                </Box>
                                {Number(draft.quotedValue) > 0 && Number(draft.marginPercent) >= 0 ? (
                                  <Typography sx={{ fontSize: 13, color: brand.body }}>
                                    Partner earns {formatPrice(Math.round((Number(draft.quotedValue) * Number(draft.marginPercent)) / 100))} on delivery.
                                  </Typography>
                                ) : null}
                              </>
                            ) : null}
                            {next === "Won" ? <TextField size="small" label="Website order ID when won (optional)" value={draft.linkedOrderId} onChange={field("linkedOrderId")} /> : null}
                            {p.status === "Delivered" ? <TextField size="small" label="Payment or UTR reference" value={draft.payoutRef} onChange={field("payoutRef")} /> : null}
                            <TextField size="small" label="Note to partner" value={draft.note} onChange={field("note")} slotProps={{ htmlInput: { maxLength: 500 } }} />
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                              {canQuote ? (
                                <Button size="small" variant="contained" disabled={busy} onClick={async () => close(await post({ action: "quote", projectId: p.id, quotedValue: Number(draft.quotedValue), marginPercent: Number(draft.marginPercent), note: draft.note }, `${p.id} quoted.`))}>
                                  {p.status === "Quoted" ? "Update quote" : "Save quote"}
                                </Button>
                              ) : null}
                              {next ? (
                                <Button size="small" variant={canQuote ? "outlined" : "contained"} disabled={busy} onClick={async () => close(await post({ action: "advance", projectId: p.id, linkedOrderId: draft.linkedOrderId, note: draft.note }, `${p.id} moved to ${next}.`))}>
                                  Mark {next.toLowerCase()}
                                </Button>
                              ) : null}
                              {p.status === "Delivered" ? (
                                <Button size="small" variant="contained" disabled={busy} onClick={async () => close(await post({ action: "pay", projectId: p.id, payoutRef: draft.payoutRef }, `${formatPrice(p.earning)} recorded as paid to ${p.partnerCompany}.`))}>
                                  Record margin paid
                                </Button>
                              ) : null}
                              {canLose ? (
                                <Button size="small" disabled={busy} onClick={async () => close(await post({ action: "lose", projectId: p.id, note: draft.note }, `${p.id} marked lost.`))}>
                                  Mark lost
                                </Button>
                              ) : null}
                            </Box>
                          </Box>
                        ) : null}
                      </td>
                      <td>
                        {p.partnerCompany}
                        <Box sx={{ color: brand.muted, fontSize: 13 }}>{p.partnerEmail}</Box>
                      </td>
                      <td className="num">
                        {formatPrice(p.quotedValue || p.expectedValue)}
                        <Box sx={{ color: brand.muted, fontSize: 13 }}>{p.quotedValue ? "quoted" : "expected"}</Box>
                      </td>
                      <td className="num">
                        {p.quotedValue ? formatPrice(p.earning) : "—"}
                        {p.quotedValue ? <Box sx={{ color: brand.muted, fontSize: 13 }}>{+(p.marginRate * 100).toFixed(1)}%</Box> : null}
                      </td>
                      <td>
                        <Box sx={{ fontWeight: 600 }}>{p.status}</Box>
                        {p.payoutRef ? <Box sx={{ color: brand.muted, fontSize: 13 }}>Ref {p.payoutRef}</Box> : null}
                      </td>
                      <td>
                        {p.status !== "Paid" && p.status !== "Lost" ? (
                          <Button size="small" variant="outlined" onClick={() => openFor(p)} aria-expanded={isOpen}>
                            {isOpen ? "Close" : "Manage"}
                          </Button>
                        ) : null}
                      </td>
                    </Box>
                  );
                })}
              </tbody>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

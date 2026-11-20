"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { signType } from "@/components/home/directory/sign";
import { distributorTiers, territoryReviewMonths } from "@/lib/distributors/program";
import type { AdminTradeOrder, DistributorStatus, DistributorSummary } from "@/lib/distributors/store";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

const statusLabel: Record<DistributorStatus, { text: string; colour: string }> = {
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

function inMonths(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

type Draft = {
  tier: string;
  territory: string;
  creditLimit: string;
  quarterlyTarget: string;
  reviewDate: string;
  note: string;
};

export function DistributorsAdmin({ distributors, orders }: { distributors: DistributorSummary[]; orders: AdminTradeOrder[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  const post = async (payload: Record<string, unknown>, success: string) => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/distributors", {
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

  const openReview = (d: DistributorSummary) => {
    setOpen(d.userId);
    setDraft({
      tier: d.tier,
      territory: d.territory || d.territoryRequest,
      creditLimit: String(d.creditLimit || 0),
      quarterlyTarget: String(d.quarterlyTarget || 0),
      reviewDate: d.reviewDate || inMonths(territoryReviewMonths),
      note: d.decisionNote,
    });
  };

  const decide = async (d: DistributorSummary, status: "approved" | "rejected" | "suspended") => {
    if (!draft) return;
    const ok = await post(
      { action: "decide", userId: d.userId, status, ...draft },
      `${d.businessName}: ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "suspended"}.`,
    );
    if (ok) {
      setOpen(null);
      setDraft(null);
    }
  };

  const orderAction = async (order: AdminTradeOrder, action: "record-payment" | "advance" | "cancel") => {
    if (action === "record-payment") {
      const paymentRef = window.prompt(`Payment or UTR reference for ${order.id} (${formatPrice(order.netTotal)})`);
      if (!paymentRef) return;
      await post({ action, orderId: order.id, paymentRef }, `Payment recorded for ${order.id}.`);
    } else if (action === "cancel") {
      if (!window.confirm(`Cancel ${order.id} for ${order.businessName}?`)) return;
      await post({ action, orderId: order.id }, `${order.id} cancelled.`);
    } else {
      await post({ action, orderId: order.id }, `${order.id} moved forward.`);
    }
  };

  const pending = distributors.filter((d) => d.status === "pending").length;
  const approved = distributors.filter((d) => d.status === "approved");
  const outstanding = approved.reduce((s, d) => s + d.creditUsed, 0);
  const awaitingPayment = orders.filter((o) => o.status === "Awaiting payment").length;

  const stats = [
    { label: "Applications to review", value: String(pending) },
    { label: "Active distributors", value: String(approved.length) },
    { label: "Credit outstanding", value: formatPrice(outstanding) },
    { label: "Orders awaiting payment", value: String(awaitingPayment) },
  ];

  return (
    <Box sx={{ display: "grid", gap: { xs: 4, md: 5 } }}>
      <Box>
        <Typography component="h1" sx={{ ...signType.title, fontSize: { xs: "2rem", md: "2.6rem" } }}>
          Distributors
        </Typography>
        <Typography sx={{ color: brand.body, mt: 1, maxWidth: 680 }}>
          Review applications, set tier, territory, credit and quarterly target, and manage trade orders.
        </Typography>
      </Box>

      <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
        {stats.map((stat) => (
          <Box key={stat.label} sx={{ bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: 2 }}>
            <Typography component="dt" sx={{ fontSize: 13, color: brand.muted }}>
              {stat.label}
            </Typography>
            <Typography component="dd" sx={{ m: 0, mt: 0.5, ...signType.plate, fontSize: { xs: 20, md: 24 }, fontVariantNumeric: "tabular-nums" }}>
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {notice ? (
        <Alert severity={notice.severity} onClose={() => setNotice(null)} role="status">
          {notice.text}
        </Alert>
      ) : null}

      <Box component="section" aria-labelledby="accounts">
        <Typography id="accounts" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>
          Accounts · {distributors.length}
        </Typography>
        {distributors.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 1 }}>No applications yet.</Typography>
        ) : (
          <Box sx={frameSx}>
            <Box component="table" sx={{ ...tableSx, minWidth: 960 }}>
              <thead>
                <tr>
                  <th scope="col">Business</th>
                  <th scope="col">Territory</th>
                  <th scope="col">Terms</th>
                  <th scope="col" className="num">This quarter</th>
                  <th scope="col">Status</th>
                  <th scope="col"><Box component="span" sx={visuallyHidden}>Actions</Box></th>
                </tr>
              </thead>
              <tbody>
                {distributors.map((d) => {
                  const tier = distributorTiers.find((t) => t.id === d.tier)!;
                  const isOpen = open === d.userId && draft;
                  return [
                    <tr key={d.userId}>
                      <td>
                        <Box sx={{ fontWeight: 600 }}>{d.businessName}</Box>
                        <Box sx={{ color: brand.muted, fontSize: 13 }}>
                          {d.businessType} · GSTIN {d.gstin}
                        </Box>
                        <Box sx={{ color: brand.muted, fontSize: 13 }}>
                          {d.name} · {d.email}
                          {d.phone ? ` · ${d.phone}` : ""}
                        </Box>
                      </td>
                      <td>
                        <Box>{d.status === "approved" ? d.territory : `Asked for: ${d.territoryRequest}`}</Box>
                        <Box sx={{ color: brand.muted, fontSize: 13 }}>
                          {d.city}, {d.state}
                          {d.reviewDate ? ` · review ${d.reviewDate}` : ""}
                        </Box>
                      </td>
                      <td>
                        {d.status === "approved" ? (
                          <>
                            <Box>
                              {tier.name} · {Math.round(tier.discount * 100)}%
                            </Box>
                            <Box sx={{ color: brand.muted, fontSize: 13 }}>
                              Credit {formatPrice(d.creditUsed)} / {formatPrice(d.creditLimit)}
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ color: brand.muted }}>—</Box>
                        )}
                      </td>
                      <td className="num">
                        <Box>{formatPrice(d.quarterPurchases)}</Box>
                        {d.quarterlyTarget > 0 ? (
                          <Box sx={{ color: brand.muted, fontSize: 13 }}>
                            of {formatPrice(d.quarterlyTarget)} · {Math.round((d.quarterPurchases / d.quarterlyTarget) * 100)}%
                          </Box>
                        ) : null}
                      </td>
                      <td>
                        <Box component="span" sx={{ fontWeight: 600, color: statusLabel[d.status].colour }}>
                          {statusLabel[d.status].text}
                        </Box>
                        {d.decidedBy ? (
                          <Box sx={{ color: brand.muted, fontSize: 12.5 }}>
                            by {d.decidedBy} · {d.decidedAt?.slice(0, 10)}
                          </Box>
                        ) : null}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Button size="small" variant={d.status === "pending" ? "contained" : "text"} onClick={() => (isOpen ? setOpen(null) : openReview(d))}>
                          {isOpen ? "Close" : d.status === "pending" ? "Review" : "Edit"}
                        </Button>
                      </td>
                    </tr>,
                    isOpen ? (
                      <tr key={`${d.userId}-review`}>
                        <td colSpan={6} style={{ background: brand.ivory }}>
                          {d.notes ? (
                            <Typography sx={{ fontSize: 14, color: brand.body, mb: 1.5 }}>
                              <strong>From the applicant:</strong> {d.notes}
                            </Typography>
                          ) : null}
                          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
                            <TextField select size="small" label="Tier" value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value })}>
                              {distributorTiers.map((t) => (
                                <MenuItem key={t.id} value={t.id}>
                                  {t.name} · {Math.round(t.discount * 100)}%
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField size="small" label="Territory (not exclusive)" value={draft.territory} onChange={(e) => setDraft({ ...draft, territory: e.target.value })} />
                            <TextField size="small" type="date" label="Next review" value={draft.reviewDate} onChange={(e) => setDraft({ ...draft, reviewDate: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
                            <TextField size="small" type="number" label="Credit limit (₹)" value={draft.creditLimit} onChange={(e) => setDraft({ ...draft, creditLimit: e.target.value })} slotProps={{ htmlInput: { min: 0, step: 5000 } }} />
                            <TextField size="small" type="number" label="Quarterly target (₹)" value={draft.quarterlyTarget} onChange={(e) => setDraft({ ...draft, quarterlyTarget: e.target.value })} slotProps={{ htmlInput: { min: 0, step: 10000 } }} />
                            <TextField size="small" label="Note (required to reject or suspend)" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                            <Button variant="contained" disabled={busy} onClick={() => decide(d, "approved")}>
                              {d.status === "approved" ? "Save terms" : "Approve"}
                            </Button>
                            {d.status === "approved" ? (
                              <Button color="error" disabled={busy} onClick={() => decide(d, "suspended")}>
                                Suspend
                              </Button>
                            ) : d.status === "pending" ? (
                              <Button color="error" disabled={busy} onClick={() => decide(d, "rejected")}>
                                Reject
                              </Button>
                            ) : null}
                          </Box>
                        </td>
                      </tr>
                    ) : null,
                  ];
                })}
              </tbody>
            </Box>
          </Box>
        )}
      </Box>

      <Box component="section" aria-labelledby="trade-orders">
        <Typography id="trade-orders" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>
          Trade orders · {orders.length}
        </Typography>
        {orders.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 1 }}>No trade orders yet.</Typography>
        ) : (
          <Box sx={frameSx}>
            <Box component="table" sx={{ ...tableSx, minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Distributor</th>
                  <th scope="col">Items</th>
                  <th scope="col" className="num">Trade total</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Status</th>
                  <th scope="col"><Box component="span" sx={visuallyHidden}>Actions</Box></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Box>{o.id}</Box>
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>
                        {o.createdAt.slice(0, 10)}
                        {o.reference ? ` · PO ${o.reference}` : ""}
                      </Box>
                    </td>
                    <td>{o.businessName}</td>
                    <td style={{ fontSize: 13 }}>
                      {o.items.map((i) => (
                        <Box key={i.productId}>
                          {i.quantity} × {i.name}
                        </Box>
                      ))}
                    </td>
                    <td className="num">
                      <Box>{formatPrice(o.netTotal)}</Box>
                      <Box sx={{ color: brand.muted, fontSize: 12.5 }}>{Math.round(o.discountRate * 100)}% off {formatPrice(o.listSubtotal)}</Box>
                    </td>
                    <td>
                      <Box>{o.paymentTerms === "credit" ? "Credit" : "Advance"}</Box>
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>{o.paidAt ? `Paid · ${o.paymentRef}` : "Unpaid"}</Box>
                    </td>
                    <td>
                      <Box sx={{ fontWeight: 600 }}>{o.status}</Box>
                      {o.updatedBy ? <Box sx={{ color: brand.muted, fontSize: 12.5 }}>by {o.updatedBy}</Box> : null}
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {!o.paidAt && o.status !== "Cancelled" ? (
                        <Button size="small" disabled={busy} onClick={() => orderAction(o, "record-payment")}>
                          Record payment
                        </Button>
                      ) : null}
                      {o.status === "Confirmed" || o.status === "Dispatched" ? (
                        <Button size="small" disabled={busy} onClick={() => orderAction(o, "advance")}>
                          {o.status === "Confirmed" ? "Dispatch" : "Mark delivered"}
                        </Button>
                      ) : null}
                      {o.status === "Awaiting payment" || o.status === "Confirmed" ? (
                        <Button size="small" color="error" disabled={busy} onClick={() => orderAction(o, "cancel")}>
                          Cancel
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

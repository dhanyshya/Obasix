"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { signType } from "@/components/home/directory/sign";
import type { AdminCommission, AssociateSummary, CommissionState } from "@/lib/associates/store";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

type Filter = "All" | CommissionState;
const filters: Filter[] = ["Payable", "Awaiting delivery", "Paid", "Void", "All"];

const stateColour: Record<CommissionState, string> = {
  "Awaiting delivery": brand.signalInk,
  Payable: brand.forest,
  Paid: brand.muted,
  Void: brand.muted,
};

const tableSx = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
  "& th, & td": { textAlign: "left", px: 1.5, py: 1.1, borderBottom: `1px solid ${brand.line}`, verticalAlign: "middle" },
  "& tbody tr:last-of-type td": { borderBottom: 0 },
  "& th": { color: brand.muted, fontWeight: 500, whiteSpace: "nowrap" },
  "& .num": { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" },
} as const;

const frameSx = {
  overflowX: "auto",
  border: `1px solid ${brand.line}`,
  borderRadius: `${brand.radius}px`,
  bgcolor: brand.white,
  mt: 1.5,
} as const;

export function AssociatesAdmin({
  associates,
  commissions,
  demoOrders,
}: {
  associates: AssociateSummary[];
  commissions: AdminCommission[];
  demoOrders: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("Payable");
  const [selected, setSelected] = useState<string[]>([]);
  const [payoutRef, setPayoutRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(null);

  const visible = filter === "All" ? commissions : commissions.filter((c) => c.state === filter);
  const payableIds = new Set(commissions.filter((c) => c.state === "Payable").map((c) => c.id));
  const selectedPayable = selected.filter((id) => payableIds.has(id));
  const selectedTotal = commissions.filter((c) => selectedPayable.includes(c.id)).reduce((s, c) => s + c.amount, 0);
  const visiblePayable = visible.filter((c) => c.state === "Payable").map((c) => c.id);
  const allVisibleSelected = visiblePayable.length > 0 && visiblePayable.every((id) => selected.includes(id));

  const totals = (state: CommissionState) =>
    commissions.filter((c) => c.state === state).reduce((s, c) => s + c.amount, 0);

  const post = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/associates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setNotice({ severity: "error", text: data.message ?? "That didn't work. Try again." });
        return null;
      }
      router.refresh();
      return data;
    } catch {
      setNotice({ severity: "error", text: "Couldn't reach the server." });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    const data = await post({ action: "pay", ids: selectedPayable, payoutRef });
    if (!data) return;
    setSelected([]);
    setPayoutRef("");
    setNotice({
      severity: data.skipped.length ? "info" : "success",
      text: `${data.paid.length} commission${data.paid.length === 1 ? "" : "s"} marked paid.${
        data.skipped.length ? ` ${data.skipped.length} skipped because they were no longer payable.` : ""
      }`,
    });
  };

  const voidOne = async (entry: AdminCommission) => {
    const reason = window.prompt(`Why is the commission on ${entry.orderId} being voided?`);
    if (!reason) return;
    if (await post({ action: "void", id: entry.id, reason })) {
      setNotice({ severity: "success", text: `Commission on ${entry.orderId} voided.` });
    }
  };

  const exportCsv = () => {
    const header = ["Commission", "Associate", "Code", "Order", "Order status", "Order value", "Commission amount", "State", "Paid on", "Payout ref", "Void reason", "Created"];
    const rows = visible.map((c) => [
      c.id, c.associateName, c.code, c.orderId, c.orderStatus, c.baseAmount, c.amount, c.state,
      c.paidAt?.slice(0, 10) ?? "", c.payoutRef, c.voidReason, c.createdAt.slice(0, 10),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `associate-commissions-${filter.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: "Active associates", value: String(associates.filter((a) => a.status === "active").length) },
    { label: "Awaiting delivery", value: formatPrice(totals("Awaiting delivery")) },
    { label: "Payable now", value: formatPrice(totals("Payable")) },
    { label: "Paid to date", value: formatPrice(totals("Paid")) },
  ];

  return (
    <Box sx={{ display: "grid", gap: { xs: 4, md: 5 } }}>
      <Box>
        <Typography component="h1" sx={{ ...signType.title, fontSize: { xs: "2rem", md: "2.6rem" } }}>
          Associates
        </Typography>
        <Typography sx={{ color: brand.body, mt: 1, maxWidth: 680 }}>
          Approve and pause associates, and pay commission on delivered orders. Each order carries at most one commission.
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

      {/* Commissions */}
      <Box component="section" aria-labelledby="commissions">
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "baseline", justifyContent: "space-between" }}>
          <Typography id="commissions" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>
            Commissions
          </Typography>
          <Button size="small" color="inherit" onClick={exportCsv} disabled={visible.length === 0}>
            Export CSV
          </Button>
        </Box>
        <Box role="tablist" aria-label="Commission status" sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
          {filters.map((option) => {
            const count = option === "All" ? commissions.length : commissions.filter((c) => c.state === option).length;
            const active = option === filter;
            return (
              <ButtonBase
                key={option}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(option)}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? brand.white : brand.charcoal,
                  bgcolor: active ? brand.forest : brand.white,
                  border: `1px solid ${active ? brand.forest : brand.line}`,
                  "&.Mui-focusVisible": { outline: `2px solid ${brand.signal}`, outlineOffset: 2 },
                }}
              >
                {option} · {count}
              </ButtonBase>
            );
          })}
        </Box>

        {selectedPayable.length > 0 ? (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: "center",
              bgcolor: brand.paleGreen,
              border: `1px solid ${brand.forest}`,
              borderRadius: "12px",
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
              {selectedPayable.length} selected · {formatPrice(selectedTotal)}
            </Typography>
            <TextField
              size="small"
              label="Bank transfer / UTR reference"
              value={payoutRef}
              onChange={(e) => setPayoutRef(e.target.value)}
              slotProps={{ htmlInput: { maxLength: 60 } }}
              sx={{ minWidth: 240, flex: { xs: "1 1 100%", sm: "0 1 auto" }, bgcolor: brand.white }}
            />
            <Button variant="contained" disabled={busy || payoutRef.trim().length < 3} onClick={pay}>
              Mark paid
            </Button>
            <Button color="inherit" onClick={() => setSelected([])}>
              Clear
            </Button>
          </Box>
        ) : null}

        {visible.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 2 }}>No commissions in this view.</Typography>
        ) : (
          <Box sx={frameSx}>
            <Box component="table" sx={{ ...tableSx, minWidth: 880 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: 44 }}>
                    <Checkbox
                      size="small"
                      checked={allVisibleSelected}
                      disabled={visiblePayable.length === 0}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? Array.from(new Set([...prev, ...visiblePayable]))
                            : prev.filter((id) => !visiblePayable.includes(id)),
                        )
                      }
                      slotProps={{ input: { "aria-label": "Select all payable commissions in this view" } }}
                    />
                  </th>
                  <th scope="col">Associate</th>
                  <th scope="col">Order</th>
                  <th scope="col" className="num">Order value</th>
                  <th scope="col" className="num">Commission</th>
                  <th scope="col">Status</th>
                  <th scope="col">Details</th>
                  <th scope="col"><Box component="span" sx={visuallyHidden}>Actions</Box></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {entry.state === "Payable" ? (
                        <Checkbox
                          size="small"
                          checked={selected.includes(entry.id)}
                          onChange={(e) =>
                            setSelected((prev) => (e.target.checked ? [...prev, entry.id] : prev.filter((id) => id !== entry.id)))
                          }
                          slotProps={{ input: { "aria-label": `Select commission on ${entry.orderId}` } }}
                        />
                      ) : null}
                    </td>
                    <td>
                      <Box sx={{ fontWeight: 600 }}>{entry.associateName}</Box>
                      <Box sx={{ color: brand.muted, fontSize: 13, ...signType.code }}>{entry.code}</Box>
                    </td>
                    <td>
                      <Box>{entry.orderId}</Box>
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>
                        {entry.createdAt.slice(0, 10)} · {entry.orderStatus}
                      </Box>
                    </td>
                    <td className="num">{formatPrice(entry.baseAmount)}</td>
                    <td className="num">{formatPrice(entry.amount)}</td>
                    <td>
                      <Box component="span" sx={{ color: stateColour[entry.state], fontWeight: 600 }}>
                        {entry.state}
                      </Box>
                    </td>
                    <td style={{ color: brand.muted, fontSize: 13 }}>
                      {entry.state === "Paid" ? `${entry.paidAt?.slice(0, 10) ?? ""} · ${entry.payoutRef}` : entry.voidReason}
                    </td>
                    <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                      {demoOrders && entry.state === "Awaiting delivery" ? (
                        <Button size="small" disabled={busy} onClick={() => post({ action: "advance-order", orderId: entry.orderId })}>
                          Advance order
                        </Button>
                      ) : null}
                      {entry.state === "Awaiting delivery" || entry.state === "Payable" ? (
                        <Button size="small" color="error" disabled={busy} onClick={() => voidOne(entry)}>
                          Void
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
        {demoOrders ? (
          <Typography sx={{ color: brand.muted, fontSize: 13, mt: 1 }}>
            Demo mode: &ldquo;Advance order&rdquo; moves a demo order one step towards delivery so you can test payouts.
          </Typography>
        ) : null}
      </Box>

      {/* Associates */}
      <Box component="section" aria-labelledby="people">
        <Typography id="people" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>
          Associates · {associates.length}
        </Typography>
        {associates.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 1 }}>No one has joined yet.</Typography>
        ) : (
          <Box sx={frameSx}>
            <Box component="table" sx={{ ...tableSx, minWidth: 900 }}>
              <thead>
                <tr>
                  <th scope="col">Associate</th>
                  <th scope="col">Work</th>
                  <th scope="col" className="num">Orders</th>
                  <th scope="col" className="num">Referred sales</th>
                  <th scope="col" className="num">Payable</th>
                  <th scope="col" className="num">Paid</th>
                  <th scope="col" className="num">Quotes</th>
                  <th scope="col">Status</th>
                  <th scope="col"><Box component="span" sx={visuallyHidden}>Actions</Box></th>
                </tr>
              </thead>
              <tbody>
                {associates.map((a) => (
                  <tr key={a.code}>
                    <td>
                      <Box sx={{ fontWeight: 600 }}>
                        {a.name} <Box component="span" sx={{ ...signType.code, color: brand.muted, fontWeight: 400, fontSize: 13 }}>{a.code}</Box>
                      </Box>
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>
                        {a.email}
                        {a.phone ? ` · ${a.phone}` : ""}
                      </Box>
                    </td>
                    <td>
                      <Box>{a.profession}</Box>
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>
                        {[a.firm, a.city].filter(Boolean).join(" · ")} · joined {a.createdAt.slice(0, 10)}
                      </Box>
                    </td>
                    <td className="num">{a.orders}</td>
                    <td className="num">{formatPrice(a.referredSales)}</td>
                    <td className="num">{formatPrice(a.payable)}</td>
                    <td className="num">{formatPrice(a.paid)}</td>
                    <td className="num">{a.quotes}</td>
                    <td>
                      <Box component="span" sx={{ fontWeight: 600, color: a.status === "active" ? brand.forest : brand.signalInk }}>
                        {a.status === "active" ? "Active" : "Paused"}
                      </Box>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Button
                        size="small"
                        color={a.status === "active" ? "inherit" : "primary"}
                        disabled={busy}
                        onClick={() => post({ action: a.status === "active" ? "pause" : "activate", code: a.code })}
                      >
                        {a.status === "active" ? "Pause" : "Reactivate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
        <Typography sx={{ color: brand.muted, fontSize: 13, mt: 1 }}>
          Pausing stops new referrals and quotes being credited. Commission already earned is kept.
        </Typography>
      </Box>
    </Box>
  );
}

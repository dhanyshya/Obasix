import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { ActionDialog } from "../components/ActionDialog";
import { describeError } from "../components/Notifications";
import { useLoad } from "../useLoad";

type Distributor = { userId: string; businessName: string; businessType: string; gstin: string; city: string; state: string; territoryRequest: string; status: string; tier: string; territory: string; creditLimit: number; quarterlyTarget: number; reviewDate: string; name: string; email: string; creditUsed: number; quarterPurchases: number; orderCount: number };
type TradeOrder = { id: string; businessName: string; netTotal: number; paymentTerms: "credit" | "advance"; status: string; paidAt: string | null; paymentRef: string; reference: string; createdAt: string };
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const tiers = ["silver", "gold", "platinum"];

type Pending = { kind: "decide"; d: Distributor } | { kind: "trade"; order: TradeOrder; action: "record-payment" | "advance" | "cancel" } | null;

export function Distributors() {
  const { can } = useAuth();
  const list = useLoad(() => api<{ items: Distributor[] }>("/api/admin/distributors"), "distributors");
  const orders = useLoad(() => api<{ items: TradeOrder[] }>("/api/admin/trade-orders"), "trade-orders");
  const reload = () => {
    list.reload();
    orders.reload();
  };
  const [pending, setPending] = useState<Pending>(null);

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Distributors
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
        Approve applications with a tier, credit limit and territory, then handle trade orders: record advance payments, dispatch and deliver.
      </Typography>
      {list.error ? <Alert severity="error">{describeError(list.error)}</Alert> : null}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small" aria-label="Distributors">
            <TableHead>
              <TableRow>
                <TableCell>Business</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Terms</TableCell>
                <TableCell align="right">Credit used</TableCell>
                <TableCell>
                  <span className="visually-hidden">Actions</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data?.items.map((d) => (
                <TableRow key={d.userId}>
                  <TableCell>
                    {d.businessName}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {d.email} · {d.gstin} · {d.city}, {d.state} · wants {d.territoryRequest}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={d.status} color={d.status === "approved" ? "success" : d.status === "pending" ? "warning" : "default"} />
                  </TableCell>
                  <TableCell>{d.status === "approved" ? `${d.tier} · ${d.territory} · limit ${rupees(d.creditLimit)}` : "—"}</TableCell>
                  <TableCell align="right">{rupees(d.creditUsed)}</TableCell>
                  <TableCell>
                    {can("distributors:approve") ? (
                      <Button size="small" onClick={() => setPending({ kind: "decide", d })} aria-label={`Decide ${d.businessName}`}>
                        Decide
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {list.data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No applications yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Typography component="h2" variant="h6" gutterBottom>
        Trade orders
      </Typography>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label="Trade orders">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Distributor</TableCell>
                <TableCell align="right">Net</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <span className="visually-hidden">Actions</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.data?.items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell sx={{ fontFamily: "monospace" }}>{o.id}</TableCell>
                  <TableCell>{o.businessName}</TableCell>
                  <TableCell align="right">{rupees(o.netTotal)}</TableCell>
                  <TableCell>
                    {o.status}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {o.paymentTerms} · {o.paidAt ? `paid ${o.paymentRef}` : "unpaid"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {can("distributors:write") ? (
                      <>
                        {!o.paidAt && o.status !== "Cancelled" ? (
                          <Button size="small" onClick={() => setPending({ kind: "trade", order: o, action: "record-payment" })}>
                            Record payment
                          </Button>
                        ) : null}
                        {o.status === "Confirmed" || o.status === "Dispatched" ? (
                          <Button size="small" onClick={() => setPending({ kind: "trade", order: o, action: "advance" })}>
                            Mark {o.status === "Confirmed" ? "dispatched" : "delivered"}
                          </Button>
                        ) : null}
                        {o.status === "Awaiting payment" || o.status === "Confirmed" ? (
                          <Button size="small" color="error" onClick={() => setPending({ kind: "trade", order: o, action: "cancel" })}>
                            Cancel
                          </Button>
                        ) : null}
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {pending?.kind === "decide" ? (
        <ActionDialog
          title={`Decide ${pending.d.businessName}`}
          fields={[
            { name: "status", label: "Decision", options: ["approved", "rejected", "suspended"], initial: pending.d.status === "pending" ? "approved" : pending.d.status },
            { name: "tier", label: "Tier", options: tiers, initial: pending.d.tier },
            { name: "territory", label: "Territory", initial: pending.d.territory || pending.d.territoryRequest },
            { name: "creditLimit", label: "Credit limit (₹)", type: "number", initial: String(pending.d.creditLimit) },
            { name: "quarterlyTarget", label: "Quarterly target (₹)", type: "number", initial: String(pending.d.quarterlyTarget) },
            { name: "reviewDate", label: "Next territory review", type: "date", initial: pending.d.reviewDate },
            { name: "note", label: "Note (required unless approving)" },
          ]}
          confirmLabel="Save decision"
          endpoint="/api/admin/distributors"
          build={(v) => ({ action: "decide", userId: pending.d.userId, status: v.status, tier: v.tier, territory: v.territory, creditLimit: Number(v.creditLimit), quarterlyTarget: Number(v.quarterlyTarget), reviewDate: v.reviewDate, note: v.note })}
          success={`Saved the decision for ${pending.d.businessName}.`}
          onDone={reload}
          onClose={() => setPending(null)}
        />
      ) : null}
      {pending?.kind === "trade" ? (
        <ActionDialog
          title={`${pending.action === "record-payment" ? "Record payment for" : pending.action === "advance" ? "Move forward" : "Cancel"} ${pending.order.id}`}
          fields={pending.action === "record-payment" ? [{ name: "paymentRef", label: "Payment or UTR reference" }] : []}
          confirmLabel={pending.action === "cancel" ? "Cancel order" : "Confirm"}
          danger={pending.action === "cancel"}
          endpoint="/api/admin/distributors"
          build={(v) => ({ action: pending.action, orderId: pending.order.id, paymentRef: v.paymentRef ?? "" })}
          success={`${pending.order.id} updated.`}
          onDone={reload}
          onClose={() => setPending(null)}
        />
      ) : null}
    </Box>
  );
}

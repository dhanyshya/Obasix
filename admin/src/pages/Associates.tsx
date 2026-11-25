import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
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

type Associate = { code: string; name: string; email: string; status: "active" | "paused"; city: string; profession: string; orders: number; referredSales: number; awaiting: number; payable: number; paid: number; quotes: number };
type Commission = { id: string; orderId: string; code: string; associateName: string; amount: number; baseAmount: number; state: string; orderStatus: string; payoutRef: string; voidReason: string; createdAt: string };
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function Associates() {
  const { can } = useAuth();
  const writable = can("associates:write");
  const people = useLoad(() => api<{ items: Associate[] }>("/api/admin/associates"), "associates");
  const ledger = useLoad(() => api<{ items: Commission[] }>("/api/admin/commissions"), "commissions");
  const reload = () => {
    people.reload();
    ledger.reload();
  };
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState<null | { kind: "pay" } | { kind: "void"; id: string } | { kind: "status"; code: string; to: "pause" | "activate" }>(null);
  const payable = ledger.data?.items.filter((c) => c.state === "Payable") ?? [];

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Associates
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
        Referral partners earn 5% on referred paid orders. Commission becomes payable once the order is delivered; pay it with a bank reference, or void it with a
        reason.
      </Typography>
      {people.error ? <Alert severity="error">{describeError(people.error)}</Alert> : null}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small" aria-label="Associates">
            <TableHead>
              <TableRow>
                <TableCell>Associate</TableCell>
                <TableCell>Code</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Referred sales</TableCell>
                <TableCell align="right">Payable</TableCell>
                <TableCell align="right">Paid</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {people.data?.items.map((a) => (
                <TableRow key={a.code}>
                  <TableCell>
                    {a.name}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {a.email} · {a.city}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>{a.code}</TableCell>
                  <TableCell align="right">{a.orders}</TableCell>
                  <TableCell align="right">{rupees(a.referredSales)}</TableCell>
                  <TableCell align="right">{rupees(a.payable)}</TableCell>
                  <TableCell align="right">{rupees(a.paid)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={a.status} color={a.status === "active" ? "success" : "default"} />
                    {writable ? (
                      <Button size="small" onClick={() => setDialog({ kind: "status", code: a.code, to: a.status === "active" ? "pause" : "activate" })}>
                        {a.status === "active" ? "Pause" : "Activate"}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {people.data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>No associates yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 1 }}>
        <Typography component="h2" variant="h6">
          Commissions
        </Typography>
        {writable ? (
          <Button variant="contained" disabled={selected.length === 0} onClick={() => setDialog({ kind: "pay" })}>
            Pay {selected.length || ""} selected
          </Button>
        ) : null}
      </Stack>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label="Commissions">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <span className="visually-hidden">Select</span>
                </TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Associate</TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell>State</TableCell>
                <TableCell>
                  <span className="visually-hidden">Actions</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ledger.data?.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell padding="checkbox">
                    {writable && c.state === "Payable" ? (
                      <Checkbox
                        checked={selected.includes(c.id)}
                        onChange={(e) => setSelected((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))}
                        slotProps={{ input: { "aria-label": `Select ${c.id}` } }}
                      />
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>{c.orderId}</TableCell>
                  <TableCell>{c.associateName}</TableCell>
                  <TableCell align="right">{rupees(c.amount)}</TableCell>
                  <TableCell>
                    {c.state}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {c.payoutRef ? `Paid · ${c.payoutRef}` : c.voidReason ? `Void · ${c.voidReason}` : `Order ${c.orderStatus}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {writable && (c.state === "Payable" || c.state === "Awaiting delivery") ? (
                      <Button size="small" color="error" onClick={() => setDialog({ kind: "void", id: c.id })}>
                        Void
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {payable.length === 0 && ledger.data ? (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Nothing is payable right now.
        </Typography>
      ) : null}

      {dialog?.kind === "pay" ? (
        <ActionDialog
          title={`Pay ${selected.length} commission${selected.length === 1 ? "" : "s"}`}
          intro="Record the bank transfer that paid these. Only payable commissions change; the rest are reported back."
          fields={[{ name: "payoutRef", label: "Bank or UTR reference" }]}
          confirmLabel="Mark paid"
          endpoint="/api/admin/associates"
          build={(v) => (v.payoutRef.trim().length < 3 ? "Enter the bank transfer or UTR reference for this payout." : { action: "pay", ids: selected, payoutRef: v.payoutRef.trim() })}
          success="Commissions marked paid."
          onDone={() => {
            setSelected([]);
            reload();
          }}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "void" ? (
        <ActionDialog
          title={`Void ${dialog.id}?`}
          fields={[{ name: "reason", label: "Reason" }]}
          confirmLabel="Void commission"
          danger
          endpoint="/api/admin/associates"
          build={(v) => (v.reason.trim().length < 3 ? "Give a reason for voiding this commission." : { action: "void", id: dialog.id, reason: v.reason.trim() })}
          success={`${dialog.id} voided.`}
          onDone={reload}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "status" ? (
        <ActionDialog
          title={`${dialog.to === "pause" ? "Pause" : "Activate"} ${dialog.code}?`}
          intro={dialog.to === "pause" ? "A paused associate's links stop crediting new referrals. Commission already earned stays." : "Their links credit referrals again."}
          fields={[]}
          confirmLabel={dialog.to === "pause" ? "Pause" : "Activate"}
          danger={dialog.to === "pause"}
          endpoint="/api/admin/associates"
          build={() => ({ action: dialog.to, code: dialog.code })}
          success={`${dialog.code} ${dialog.to === "pause" ? "paused" : "activated"}.`}
          onDone={reload}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </Box>
  );
}

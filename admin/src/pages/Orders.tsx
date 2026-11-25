import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { api, type Page, type StaffOrder } from "../api";
import { useAuth } from "../auth";
import { describeError, useNotify } from "../components/Notifications";
import { useLoad } from "../useLoad";
import { dayRange } from "./Quotes";

export const statuses = ["Pending Payment", "Order Placed", "Payment Confirmed", "Processing", "Dispatched", "Out for Delivery", "Delivered", "Cancelled"];
const cancellable = ["Pending Payment", "Order Placed", "Payment Confirmed", "Processing"];
const methodLabel: Record<StaffOrder["method"], string> = { upi: "UPI", card: "Card", cod: "Cash on Delivery", online: "Online (Razorpay)" };
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const filterKeys = ["q", "status", "payment", "kind", "from", "to"] as const;
type Filters = Record<(typeof filterKeys)[number], string>;

export const isDemo = (id: string) => id.startsWith("OBX-DEMO-");

export function Orders() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = [10, 25, 50, 100].includes(Number(params.get("pageSize"))) ? Number(params.get("pageSize")) : 25;
  const [form, setForm] = useState<Filters>(() => Object.fromEntries(filterKeys.map((k) => [k, params.get(k) ?? ""])) as Filters);
  const [formError, setFormError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => setForm(Object.fromEntries(filterKeys.map((k) => [k, params.get(k) ?? ""])) as Filters), [params]);

  const { since, until } = dayRange(params.get("from") ?? "", params.get("to") ?? "");
  const list = useLoad(
    () =>
      api<Page<StaffOrder>>("/api/admin/orders", {
        query: { q: params.get("q") ?? undefined, status: params.get("status") ?? undefined, payment: params.get("payment") ?? undefined, kind: params.get("kind") ?? undefined, since, until, page, pageSize },
      }),
    params.toString(),
  );
  const open = list.data?.items.find((o) => o.id === openId) ?? null;

  const set = (changes: Record<string, string | number | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    if (resetPage) next.delete("page");
    setParams(next, { replace: true });
  };

  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (form.from && form.to && form.from > form.to) return setFormError("“From” must be on or before “To”.");
    setFormError("");
    set({ ...form, q: form.q.trim() });
  };

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Orders
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
        Move paid orders towards delivery, or cancel before dispatch. Refunds for cancelled paid orders are issued in the Razorpay dashboard. Demo orders are
        simulations from the demo checkout.
      </Typography>
      <Paper component="form" onSubmit={apply} noValidate variant="outlined" sx={{ p: 2, mb: 2 }} aria-label="Filter orders">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ flexWrap: "wrap", rowGap: 2, alignItems: { md: "center" } }}>
          <TextField size="small" label="Search" placeholder="Order, name, email, phone" value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} sx={{ minWidth: 240 }} />
          <TextField select size="small" label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ minWidth: 190 }}>
            <MenuItem value="">Any status</MenuItem>
            {statuses.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Payment" value={form.payment} onChange={(e) => setForm({ ...form, payment: e.target.value })} sx={{ minWidth: 140 }}>
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="pending">Not paid yet</MenuItem>
          </TextField>
          <TextField select size="small" label="Kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} sx={{ minWidth: 130 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="live">Live</MenuItem>
            <MenuItem value="demo">Demo</MenuItem>
          </TextField>
          <TextField size="small" type="date" label="From" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="To" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <Button type="submit" variant="contained">
            Apply
          </Button>
          <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear</Button>
        </Stack>
        {formError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        ) : null}
      </Paper>
      {list.error ? <Alert severity="error" sx={{ mb: 2 }}>{describeError(list.error)}</Alert> : null}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label="Orders" aria-busy={list.loading}>
            <TableHead>
              <TableRow>
                <TableCell>Placed</TableCell>
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>
                  <span className="visually-hidden">Details</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data?.items.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>
                    {o.id}
                    {isDemo(o.id) ? <Chip size="small" label="Demo" variant="outlined" sx={{ ml: 1 }} /> : null}
                  </TableCell>
                  <TableCell>
                    {o.customerName}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {o.email}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{rupees(o.subtotal)}</TableCell>
                  <TableCell>
                    {o.status}
                    {o.paymentStatus === "pending" ? (
                      <Typography variant="caption" color="warning.main" sx={{ display: "block" }}>
                        Not paid yet
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setOpenId(o.id)} aria-label={`Manage ${o.id}`}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.data && list.data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">No orders match.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={list.data?.total ?? 0}
          page={page - 1}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, next) => set({ page: next + 1 }, false)}
          onRowsPerPageChange={(e) => set({ pageSize: e.target.value })}
        />
      </Paper>
      {open ? <OrderDialog order={open} onClose={() => setOpenId(null)} onChanged={list.reload} /> : null}
    </Box>
  );
}

function OrderDialog({ order, onClose, onChanged }: { order: StaffOrder; onClose: () => void; onChanged: () => void }) {
  const { can } = useAuth();
  const notify = useNotify();
  const [mode, setMode] = useState<"view" | "advance" | "cancel">("view");
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const dispatching = order.nextStatus === "Dispatched";
  const writable = can("orders:write");
  const canAdvance = writable && order.paymentStatus === "paid" && Boolean(order.nextStatus);
  const canCancel = writable && cancellable.includes(order.status);

  const send = async () => {
    if (inFlight.current) return;
    if (mode === "advance" && dispatching && (!courier.trim() || !tracking.trim())) return setError("Enter the courier and tracking number to mark the order dispatched.");
    if (mode === "cancel" && note.trim().length < 5) return setError("Add a note explaining the cancellation.");
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/orders", {
        method: "POST",
        body: mode === "advance" ? { orderId: order.id, action: "advance", courier: courier.trim(), trackingNumber: tracking.trim() } : { orderId: order.id, action: "cancel", note: note.trim() },
      });
      notify.success(mode === "advance" ? `${order.id} is now ${order.nextStatus}.` : `${order.id} cancelled.`);
      setMode("view");
      onChanged();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const a = order.shippingAddress;
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth aria-labelledby="order-title">
      <DialogTitle id="order-title">Order {order.id}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography>
            <strong>{order.status}</strong> · {order.paymentStatus === "paid" ? "paid" : "not paid yet"} · {methodLabel[order.method]}
          </Typography>
          <Typography>
            {order.customerName} · {order.email} · {order.phone}
          </Typography>
          <Typography>{[a?.line, a?.city, a?.state, a?.postal, a?.country].filter(Boolean).join(", ")}</Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {order.items.map((i) => (
              <li key={i.productId + i.lineTotal}>
                {i.quantity} × {i.name} — {rupees(i.lineTotal)}
              </li>
            ))}
          </Box>
          <Typography>Total {rupees(order.subtotal)}</Typography>
          {order.providerPaymentId ? <Typography variant="body2">Razorpay payment {order.providerPaymentId}</Typography> : null}
          {order.courier ? (
            <Typography variant="body2">
              {order.courier} · tracking {order.trackingNumber}
            </Typography>
          ) : null}
          {order.staffNote ? <Typography variant="body2">Note: {order.staffNote}</Typography> : null}
          {order.updatedBy ? (
            <Typography variant="caption" color="text.secondary">
              Last change by {order.updatedBy}
            </Typography>
          ) : null}

          {mode === "advance" ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography gutterBottom>
                Move to <strong>{order.nextStatus}</strong>?{dispatching && !isDemo(order.id) ? " The customer is emailed the courier and tracking number." : ""}
              </Typography>
              {dispatching ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField size="small" label="Courier" value={courier} onChange={(e) => setCourier(e.target.value)} />
                  <TextField size="small" label="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                </Stack>
              ) : null}
            </Paper>
          ) : null}
          {mode === "cancel" ? (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography gutterBottom>
                Cancel this order?{order.paymentStatus === "paid" && !isDemo(order.id) ? " Issue the refund in the Razorpay dashboard." : ""}
              </Typography>
              <TextField size="small" fullWidth label="Reason (shown to staff)" value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} />
            </Paper>
          ) : null}
          {error ? (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        {mode === "view" ? (
          <>
            {canCancel ? (
              <Button color="error" onClick={() => setMode("cancel")}>
                Cancel order
              </Button>
            ) : null}
            {canAdvance ? (
              <Button variant="contained" onClick={() => setMode("advance")}>
                Mark {order.nextStatus}
              </Button>
            ) : null}
            <Button onClick={onClose} autoFocus>
              Close
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => { setMode("view"); setError(""); }} disabled={busy}>
              Back
            </Button>
            <Button variant="contained" color={mode === "cancel" ? "error" : "primary"} disabled={busy} onClick={() => void send()}>
              {mode === "cancel" ? "Confirm cancellation" : `Confirm: ${order.nextStatus}`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

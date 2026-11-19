"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { isDemoOrder } from "@/lib/commerce/demo-orders";
import type { StaffOrder } from "@/lib/commerce/order-store";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

type Filter = "action" | "all" | "pending" | "done";

const nextLabel: Record<string, string> = {
  "Payment Confirmed": "Start processing",
  Processing: "Mark dispatched",
  Dispatched: "Mark out for delivery",
  "Out for Delivery": "Mark delivered",
};

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Manage({ order }: { order: StaffOrder }) {
  const router = useRouter();
  const [courier, setCourier] = useState(order.courier ?? "");
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [note, setNote] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canCancel = ["Pending Payment", "Order Placed", "Payment Confirmed", "Processing"].includes(order.status);
  const next = nextLabel[order.status];

  const send = async (payload: Record<string, unknown>) => {
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: order.id, ...payload }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) return setError(data.message ?? "That didn't go through.");
      setCancelling(false);
      router.refresh();
    } catch {
      setError("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 1.5, mt: 1.5 }}>
      {order.status === "Processing" ? (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <TextField size="small" label="Courier" value={courier} onChange={(e) => setCourier(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} />
          <TextField size="small" label="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} />
        </Box>
      ) : null}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {next && order.paymentStatus !== "pending" ? (
          <Button variant="contained" size="small" disabled={busy} onClick={() => void send({ action: "advance", courier, trackingNumber: tracking })}>
            {next}
          </Button>
        ) : null}
        {canCancel && !cancelling ? (
          <Button variant="outlined" color="error" size="small" disabled={busy} onClick={() => setCancelling(true)}>Cancel order</Button>
        ) : null}
      </Box>
      {cancelling ? (
        <Box sx={{ display: "grid", gap: 1, maxWidth: 520 }}>
          <TextField size="small" label="Reason for cancelling" value={note} onChange={(e) => setNote(e.target.value)} slotProps={{ htmlInput: { maxLength: 300 } }} />
          {order.paymentStatus === "paid" && !isDemoOrder(order) ? (
            <Typography sx={{ fontSize: 13, color: brand.signalInk }}>
              This order is paid. Issue the refund in the Razorpay dashboard (payment {order.providerPaymentId ?? "—"}).
            </Typography>
          ) : null}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" color="error" size="small" disabled={busy} onClick={() => void send({ action: "cancel", note })}>Confirm cancellation</Button>
            <Button size="small" disabled={busy} onClick={() => setCancelling(false)}>Keep order</Button>
          </Box>
        </Box>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Box>
  );
}

export function OrdersAdmin({ orders, live }: { orders: StaffOrder[]; live: boolean }) {
  const [filter, setFilter] = useState<Filter>("action");
  const needsAction = (o: StaffOrder) => o.paymentStatus === "paid" && Boolean(nextLabel[o.status]);
  const shown = orders.filter((o) =>
    filter === "all" ? true : filter === "action" ? needsAction(o) : filter === "pending" ? o.paymentStatus === "pending" : ["Delivered", "Cancelled"].includes(o.status),
  );
  const count = (f: Filter) => orders.filter((o) => (f === "action" ? needsAction(o) : f === "pending" ? o.paymentStatus === "pending" : f === "done" ? ["Delivered", "Cancelled"].includes(o.status) : true)).length;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box>
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>Orders</Typography>
        <Typography sx={{ color: brand.body, mt: 1 }}>
          {live ? "Live payments are on: orders are paid through Razorpay before they appear as ready to process." : "Demo mode: orders here are simulations; no payment was taken."}
        </Typography>
      </Box>
      <ToggleButtonGroup exclusive size="small" value={filter} onChange={(_, v: Filter | null) => v && setFilter(v)} sx={{ flexWrap: "wrap" }}>
        <ToggleButton value="action">To process ({count("action")})</ToggleButton>
        <ToggleButton value="pending">Awaiting payment ({count("pending")})</ToggleButton>
        <ToggleButton value="done">Delivered or cancelled ({count("done")})</ToggleButton>
        <ToggleButton value="all">All ({count("all")})</ToggleButton>
      </ToggleButtonGroup>
      {shown.length === 0 ? <Typography sx={{ color: brand.muted }}>No orders here.</Typography> : null}
      {shown.map((order) => (
        <Box key={order.id} component="section" aria-label={`Order ${order.id}`} sx={{ border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, bgcolor: brand.white, p: 2 }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: 700 }}>{order.id}</Typography>
            <Chip size="small" label={order.status} color={order.status === "Cancelled" ? "default" : order.paymentStatus === "pending" ? "warning" : "success"} variant="outlined" />
            {isDemoOrder(order) ? <Chip size="small" label="Demo" variant="outlined" /> : null}
            <Typography sx={{ fontSize: 14, color: brand.muted, ml: "auto" }}>{order.createdAt ? when(order.createdAt) : ""} · {formatPrice(order.subtotal)}</Typography>
          </Box>
          <Typography sx={{ fontSize: 14, mt: 0.75 }}>
            {order.customerName} · {order.email} · {order.phone}
          </Typography>
          <Typography sx={{ fontSize: 14, color: brand.body }}>
            {[order.shippingAddress?.line, order.shippingAddress?.city, order.shippingAddress?.state, order.shippingAddress?.postal].filter(Boolean).join(", ")}
          </Typography>
          <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, fontSize: 14 }}>
            {order.items.map((item, i) => <li key={i}>{item.quantity} × {item.name}</li>)}
          </Box>
          {order.trackingNumber ? <Typography sx={{ fontSize: 13, color: brand.muted, mt: 0.5 }}>{order.courier} · {order.trackingNumber}</Typography> : null}
          {order.staffNote ? <Typography sx={{ fontSize: 13, color: brand.muted, mt: 0.5 }}>Note: {order.staffNote}</Typography> : null}
          {order.updatedBy ? <Typography sx={{ fontSize: 12, color: brand.muted, mt: 0.5 }}>Last updated by {order.updatedBy}</Typography> : null}
          <Manage order={order} />
        </Box>
      ))}
    </Box>
  );
}

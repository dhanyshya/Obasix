"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  advanceDemoOrder,
  contactMatches,
  findDemoOrder,
  type DemoOrder,
} from "@/lib/commerce/demo-orders";
import { formatPrice } from "@/lib/format";
import type { CommerceResponse } from "@/lib/commerce/types";

export function TrackOrder() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommerceResponse | null>(null);
  const [demo, setDemo] = useState<DemoOrder | null>(null);
  const [unknown, setUnknown] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setResult(null);
    setDemo(null);
    setUnknown(false);
    if (orderNumber.trim().length < 4) {
      setError("Enter the order number from your confirmation.");
      return;
    }
    if (contact.trim().length < 5) {
      setError("Enter the email or phone used at checkout.");
      return;
    }
    setError("");
    const local = findDemoOrder(orderNumber.trim());
    if (local) {
      if (!contactMatches(local, contact)) {
        setUnknown(true);
        return;
      }
      setDemo(local);
      return;
    }
    if (orderNumber.trim().toUpperCase().startsWith("OBX-DEMO-")) {
      setUnknown(true);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/commerce/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), contact: contact.trim() }),
      });
      setResult((await response.json()) as CommerceResponse);
    } catch {
      setResult({
        ok: false,
        code: "tracking_unavailable",
        charged: false,
        orderCreated: false,
        message: "Tracking could not be reached. No order was looked up.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      component="form"
      variant="outlined"
      onSubmit={onSubmit}
      noValidate
      sx={{ p: { xs: 2.5, sm: 3, md: 4 }, borderRadius: 1.5, width: "100%", boxSizing: "border-box" }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          id="track-order"
          label="Order number"
          value={orderNumber}
          onChange={(event) => setOrderNumber(event.target.value)}
          fullWidth
          size="medium"
          slotProps={{ htmlInput: { autoComplete: "off", style: { boxSizing: "border-box" } } }}
        />
        <TextField
          id="track-contact"
          label="Email or phone"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          fullWidth
          size="medium"
          slotProps={{ htmlInput: { autoComplete: "email", style: { boxSizing: "border-box" } } }}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ mt: 0.5, minHeight: 48 }}
        >
          {loading ? "Checking" : "Track Order"}
        </Button>
        {error ? (
          <Alert
            severity="error"
            sx={{ width: "100%", boxSizing: "border-box", alignItems: "center", px: 2, py: 1.25 }}
          >
            {error}
          </Alert>
        ) : null}
      </Box>
      {unknown ? (
        <Alert severity="info" role="status" sx={{ mt: 2 }}>
          No demo order matches that order number and contact.
        </Alert>
      ) : null}
      {demo ? (
        <Alert severity="success" icon={false} role="status" sx={{ mt: 2, alignItems: "flex-start" }}>
          <Typography variant="overline" sx={{ display: "block", lineHeight: 1.6 }}>
            DEMO MODE — NO REAL PAYMENT
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
            {demo.id}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Status: {demo.status}
          </Typography>
          <Box component="ul" sx={{ m: 0, mt: 1.5, p: 0, listStyle: "none", fontSize: 14 }}>
            {demo.items.map((item) => (
              <li key={item.productId}>
                {item.name} · Qty {item.quantity} · {formatPrice(item.lineTotal)}
              </li>
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 600 }}>
            Catalogue subtotal {formatPrice(demo.subtotal)}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            Courier, tracking number, and delivery date are not available for this demo.
          </Typography>
          {demo.status !== "Delivered" ? (
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => {
                const next = advanceDemoOrder(demo.id);
                if (next) setDemo(next);
              }}
            >
              Advance demo status
            </Button>
          ) : null}
        </Alert>
      ) : null}
      {result ? (
        <Alert severity={result.ok ? "success" : "info"} role="status" sx={{ mt: 2 }}>
          {result.message}
        </Alert>
      ) : null}
    </Paper>
  );
}

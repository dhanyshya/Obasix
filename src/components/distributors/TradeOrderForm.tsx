"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { signType } from "@/components/home/directory/sign";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

export type TradeProduct = {
  id: string;
  name: string;
  sku: string;
  group: string;
  listPrice: number;
  tradePrice: number;
};

export function TradeOrderForm({
  products,
  creditAvailable,
  minimumOrder,
}: {
  products: TradeProduct[];
  creditAvailable: number;
  minimumOrder: number;
}) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [terms, setTerms] = useState<"credit" | "advance">(creditAvailable > 0 ? "credit" : "advance");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  const q = query.trim().toLowerCase();
  const visible = q
    ? products.filter((p) => `${p.name} ${p.sku} ${p.group}`.toLowerCase().includes(q))
    : products;
  const lines = products.filter((p) => (quantities[p.id] ?? 0) > 0);
  const listTotal = lines.reduce((s, p) => s + p.listPrice * quantities[p.id], 0);
  const netTotal = lines.reduce((s, p) => s + p.tradePrice * quantities[p.id], 0);
  const belowMinimum = netTotal < minimumOrder;
  const overCredit = terms === "credit" && netTotal > creditAvailable;

  const setQty = (id: string, value: string) => {
    const n = Math.max(0, Math.min(5000, Math.floor(Number(value) || 0)));
    setQuantities((prev) => ({ ...prev, [id]: n }));
    idempotencyKey.current = null; // A changed basket is a new order.
  };

  const submit = async () => {
    setSubmitting(true);
    setMessage(null);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/distributors/orders", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey.current },
        body: JSON.stringify({
          paymentTerms: terms,
          reference,
          lines: lines.map((p) => ({ productId: p.id, quantity: quantities[p.id] })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setMessage({ severity: "error", text: data.message ?? "The order wasn't placed. Try again." });
        return;
      }
      setQuantities({});
      setReference("");
      idempotencyKey.current = null;
      setMessage({
        severity: "success",
        text:
          data.order.status === "Awaiting payment"
            ? `Order ${data.order.id} placed. We'll send the proforma invoice for advance payment.`
            : `Order ${data.order.id} confirmed on credit.`,
      });
      router.refresh();
    } catch {
      setMessage({ severity: "error", text: "We couldn't reach the server. Your order was not placed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(0,1.6fr) minmax(280px,1fr)" }, alignItems: "start" }}>
      <Box sx={{ minWidth: 0 }}>
        <TextField
          size="small"
          fullWidth
          label="Search products or SKU"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mb: 1.5, bgcolor: brand.white }}
        />
        <Box sx={{ border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, bgcolor: brand.white, maxHeight: 520, overflow: "auto" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              "& th, & td": { px: 1.5, py: 1, borderBottom: `1px solid ${brand.line}`, textAlign: "left" },
              "& th": { color: brand.muted, fontWeight: 500, position: "sticky", top: 0, bgcolor: brand.white, zIndex: 1 },
              "& .num": { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" },
            }}
          >
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className="num">List</th>
                <th scope="col" className="num">Trade</th>
                <th scope="col" className="num">Qty</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Box sx={{ fontWeight: 600 }}>{p.name}</Box>
                    <Box sx={{ color: brand.muted, fontSize: 12.5 }}>
                      {p.sku} · {p.group}
                    </Box>
                  </td>
                  <td className="num" style={{ color: brand.muted }}>{formatPrice(p.listPrice)}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{formatPrice(p.tradePrice)}</td>
                  <td className="num" style={{ width: 96 }}>
                    <TextField
                      size="small"
                      type="number"
                      value={quantities[p.id] || ""}
                      placeholder="0"
                      onChange={(e) => setQty(p.id, e.target.value)}
                      slotProps={{ htmlInput: { min: 0, max: 5000, inputMode: "numeric", "aria-label": `Quantity of ${p.name}`, style: { textAlign: "right" } } }}
                    />
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: brand.muted }}>No products match.</td>
                </tr>
              ) : null}
            </tbody>
          </Box>
        </Box>
      </Box>

      <Box sx={{ position: { lg: "sticky" }, top: { lg: 96 }, bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: 2.5, display: "grid", gap: 1.5 }}>
        <Typography component="h3" sx={{ ...signType.plate, fontSize: 18 }}>
          Order summary
        </Typography>
        {lines.length === 0 ? (
          <Typography sx={{ color: brand.muted, fontSize: 14 }}>Enter quantities to build your order.</Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 0.5, fontSize: 14 }}>
            {lines.map((p) => (
              <Box component="li" key={p.id} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                <span>
                  {quantities[p.id]} × {p.name}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatPrice(p.tradePrice * quantities[p.id])}</span>
              </Box>
            ))}
          </Box>
        )}
        <Box sx={{ borderTop: `1px solid ${brand.line}`, pt: 1.5, display: "grid", gap: 0.5, fontSize: 14 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", color: brand.muted }}>
            <span>At list price</span>
            <span>{formatPrice(listTotal)}</span>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17 }}>
            <span>Trade total</span>
            <span>{formatPrice(netTotal)}</span>
          </Box>
          <Typography sx={{ color: brand.muted, fontSize: 12.5 }}>Before GST and freight, which are added on the invoice.</Typography>
        </Box>

        <RadioGroup value={terms} onChange={(e) => setTerms(e.target.value as "credit" | "advance")} aria-label="Payment terms">
          <FormControlLabel
            value="credit"
            disabled={creditAvailable <= 0}
            control={<Radio size="small" />}
            label={<Typography variant="body2">On credit · {formatPrice(Math.max(creditAvailable, 0))} available</Typography>}
          />
          <FormControlLabel value="advance" control={<Radio size="small" />} label={<Typography variant="body2">Advance payment (proforma invoice)</Typography>} />
        </RadioGroup>
        <TextField size="small" label="Your PO number (optional)" value={reference} onChange={(e) => setReference(e.target.value)} slotProps={{ htmlInput: { maxLength: 60 } }} />

        {lines.length > 0 && belowMinimum ? (
          <Alert severity="info" variant="outlined">Minimum trade order is {formatPrice(minimumOrder)}. Add {formatPrice(minimumOrder - netTotal)} more.</Alert>
        ) : null}
        {overCredit && !belowMinimum ? (
          <Alert severity="warning" variant="outlined">This is more than your available credit. Choose advance payment or reduce the order.</Alert>
        ) : null}
        {message ? <Alert severity={message.severity} role="status">{message.text}</Alert> : null}

        <Button variant="contained" size="large" disabled={submitting || lines.length === 0 || belowMinimum || overCredit} onClick={submit}>
          {submitting ? "Placing order…" : "Place trade order"}
        </Button>
      </Box>
    </Box>
  );
}

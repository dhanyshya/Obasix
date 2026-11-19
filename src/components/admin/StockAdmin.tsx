"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { brandTokens as brand } from "@/theme/brandTokens";

type Row = { id: string; name: string; sku: string; onHand: number | null; updatedBy: string | null };

function StockRow({ row }: { row: Row }) {
  const router = useRouter();
  const [value, setValue] = useState(row.onHand === null ? "" : String(row.onHand));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (onHand: number | null) => {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: row.id, onHand }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) return setStatus(data.message ?? "Not saved.");
      setStatus("Saved");
      if (onHand === null) setValue("");
      router.refresh();
    } catch {
      setStatus("We couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const tracked = row.onHand !== null;
  const changed = value !== (row.onHand === null ? "" : String(row.onHand));
  return (
    <Box component="tr">
      <td>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{row.name}</Typography>
        <Typography sx={{ fontSize: 12, color: brand.muted }}>{row.sku}</Typography>
      </td>
      <td>
        <TextField
          size="small"
          type="number"
          value={value}
          placeholder="Not tracked"
          onChange={(e) => setValue(e.target.value)}
          slotProps={{ htmlInput: { min: 0, inputMode: "numeric", "aria-label": `On hand for ${row.name}` } }}
          sx={{ width: 130 }}
        />
      </td>
      <td>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Button size="small" variant="contained" disabled={busy || !changed || value === ""} onClick={() => void save(Number(value))}>Save</Button>
          {tracked ? <Button size="small" disabled={busy} onClick={() => void save(null)}>Stop tracking</Button> : null}
          <Typography role="status" sx={{ fontSize: 13, color: status === "Saved" ? brand.forest : brand.signalInk }}>{status}</Typography>
        </Box>
      </td>
      <Box component="td" sx={{ fontSize: 13, color: brand.muted }}>
        {!tracked ? "Not shown to customers" : row.onHand === 0 ? "Shows “Made to order”" : row.onHand! <= 5 ? `Shows “Only ${row.onHand} left”` : "Shows “In stock”"}
        {row.updatedBy ? ` · last change: ${row.updatedBy}` : ""}
      </Box>
    </Box>
  );
}

export function StockAdmin({ rows }: { rows: Row[] }) {
  const tracked = rows.filter((r) => r.onHand !== null).length;
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box>
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>Stock</Typography>
        <Typography sx={{ color: brand.body, mt: 1, maxWidth: 760 }}>
          {tracked} of {rows.length} catalogue products tracked. Products you don&apos;t track show no availability to customers.
          Paid website orders reduce these counts automatically; enter 0 when a product is made to order.
        </Typography>
      </Box>
      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& th, & td": { textAlign: "left", p: 1.25, borderBottom: `1px solid ${brand.line}`, verticalAlign: "middle" }, "& th": { fontSize: 13 } }}>
          <thead>
            <tr><th>Product</th><th>On hand</th><th>Update</th><th>Customers see</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => <StockRow key={row.id} row={row} />)}
          </tbody>
        </Box>
      </Box>
    </Box>
  );
}

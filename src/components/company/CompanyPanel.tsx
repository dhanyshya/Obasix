"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { signType } from "@/components/home/directory/sign";
import { useCart } from "@/context/CartContext";
import { getProductById } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import { defaultCartConfiguration } from "@/lib/productActions";
import type { CartConfiguration } from "@/lib/types";
import { brandTokens as brand } from "@/theme/brandTokens";

type Role = "owner" | "buyer";
export type PanelLine = { productId: string; quantity: number; configuration?: CartConfiguration; name: string; unitPrice: number };
export type PanelList = { id: string; name: string; lines: PanelLine[]; droppedLines: number; total: number; source: string; createdBy: string; createdAt: string };
export type PanelOrder = { id: string; createdAt: string; status: string; total: number; lines: PanelLine[] };
export type PanelMember = { email: string; role: Role };

const card = { bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: { xs: 2, md: 3 } } as const;
const h2 = { ...signType.plate, fontSize: 22 } as const;

/** POSTs to the company API; returns an error message, or null on success. */
async function post(payload: Record<string, unknown>): Promise<string | null> {
  try {
    const response = await fetch("/api/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
    return response.ok && data.ok ? null : (data.message ?? "That didn't work. Try again.");
  } catch {
    return "We couldn't reach the server. Check your connection and try again.";
  }
}

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (payload: Record<string, unknown>, onDone?: () => void) => {
    setBusy(true);
    setError("");
    const message = await post(payload);
    setBusy(false);
    if (message) setError(message);
    else {
      onDone?.();
      router.refresh();
    }
  };
  return { busy, error, run };
}

/** Adds every line to the cart with its saved size, frame and colour. */
function useReorder() {
  const { addItem } = useCart();
  return (lines: PanelLine[]) => {
    for (const line of lines) {
      const product = getProductById(line.productId);
      if (!product) continue;
      addItem(product.id, line.configuration ?? defaultCartConfiguration(product), line.quantity);
    }
  };
}

export function CreateCompanyForm() {
  const { busy, error, run } = useAction();
  const [form, setForm] = useState({ name: "", gstin: "", billingAddress: "" });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        run({ action: "create", ...form });
      }}
      sx={{ ...card, display: "grid", gap: 2, maxWidth: 640 }}
    >
      <TextField label="Company name" required value={form.name} onChange={set("name")} slotProps={{ htmlInput: { maxLength: 100 } }} />
      <TextField label="GSTIN (optional)" value={form.gstin} onChange={set("gstin")} helperText="Printed on invoices for input tax credit." slotProps={{ htmlInput: { maxLength: 15 } }} />
      <TextField label="Billing address (optional)" multiline minRows={2} value={form.billingAddress} onChange={set("billingAddress")} slotProps={{ htmlInput: { maxLength: 300 } }} />
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box>
        <Button type="submit" variant="contained" disabled={busy}>
          {busy ? "Creating…" : "Create company account"}
        </Button>
      </Box>
    </Box>
  );
}

export function MembersSection({ members, me, isOwner }: { members: PanelMember[]; me: string; isOwner: boolean }) {
  const { busy, error, run } = useAction();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  return (
    <Box component="section" aria-labelledby="people" sx={card}>
      <Typography id="people" component="h2" sx={h2}>People</Typography>
      <Typography sx={{ color: brand.body, fontSize: 14, mt: 0.5, mb: 2 }}>
        Buyers can reorder and save lists. Owners can also manage people and delete lists. Colleagues join when they sign in with the email you add.
      </Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {members.map((m) => (
          <Box component="li" key={m.email} sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", justifyContent: "space-between", py: 1.25, borderTop: `1px solid ${brand.line}` }}>
            <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
              {m.email}
              {m.email === me ? <Box component="span" sx={{ color: brand.muted }}> (you)</Box> : null}
              <Box component="span" sx={{ ml: 1, fontSize: 13, color: m.role === "owner" ? brand.forest : brand.muted, fontWeight: 600 }}>
                {m.role === "owner" ? "Owner" : "Buyer"}
              </Box>
            </Box>
            {isOwner ? (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" disabled={busy} onClick={() => run({ action: "set-role", email: m.email, role: m.role === "owner" ? "buyer" : "owner" })}>
                  Make {m.role === "owner" ? "buyer" : "owner"}
                </Button>
                <Button size="small" disabled={busy} onClick={() => run({ action: "remove-member", email: m.email })}>
                  Remove
                </Button>
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
      {isOwner ? (
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            run({ action: "add-member", email, role }, () => setEmail(""));
          }}
          sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2, alignItems: "flex-start" }}
        >
          <TextField label="Colleague's email" type="email" required size="small" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ flex: "1 1 240px" }} />
          <TextField select label="Role" size="small" value={role} onChange={(e) => setRole(e.target.value as Role)} sx={{ width: 130 }}>
            <MenuItem value="buyer">Buyer</MenuItem>
            <MenuItem value="owner">Owner</MenuItem>
          </TextField>
          <Button type="submit" variant="outlined" disabled={busy}>Add</Button>
        </Box>
      ) : null}
      {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
    </Box>
  );
}

export function ReorderLists({ lists, isOwner }: { lists: PanelList[]; isOwner: boolean }) {
  const { busy, error, run } = useAction();
  const reorder = useReorder();
  const { items } = useCart();
  const [name, setName] = useState("");
  const [addedId, setAddedId] = useState("");

  const cartLines = items.map((i) => ({ productId: i.productId, quantity: i.quantity, configuration: i.configuration }));

  return (
    <Box component="section" aria-labelledby="lists" sx={card}>
      <Typography id="lists" component="h2" sx={h2}>Reorder lists</Typography>
      <Typography sx={{ color: brand.body, fontSize: 14, mt: 0.5, mb: 2 }}>
        Standard sets your company buys again and again, shared with everyone in the account. Prices are always today&apos;s catalogue prices.
      </Typography>

      {lists.length === 0 ? (
        <Typography sx={{ color: brand.muted, py: 1 }}>No lists yet. Save one from your cart below, or from a past order.</Typography>
      ) : (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {lists.map((list) => (
            <Box key={list.id} sx={{ border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: 2 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", alignItems: "baseline" }}>
                <Typography component="h3" sx={{ fontWeight: 600, fontSize: 17 }}>{list.name}</Typography>
                <Typography sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatPrice(list.total)}</Typography>
              </Box>
              <Typography sx={{ fontSize: 13, color: brand.muted }}>
                {list.source} · {list.createdBy} · {list.createdAt.slice(0, 10)}
              </Typography>
              <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, fontSize: 14, color: brand.body }}>
                {list.lines.map((line, i) => (
                  <li key={`${line.productId}-${i}`}>{line.quantity} × {line.name}</li>
                ))}
              </Box>
              {list.droppedLines > 0 ? (
                <Typography sx={{ fontSize: 13, color: brand.signalInk, mt: 0.5 }}>
                  {list.droppedLines} {list.droppedLines === 1 ? "product is" : "products are"} no longer in the catalogue and won&apos;t be added.
                </Typography>
              ) : null}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5, alignItems: "center" }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    reorder(list.lines);
                    setAddedId(list.id);
                  }}
                >
                  Add all to cart
                </Button>
                {isOwner ? (
                  <Button size="small" disabled={busy} onClick={() => run({ action: "delete-list", listId: list.id })}>
                    Delete
                  </Button>
                ) : null}
                {addedId === list.id ? (
                  <Typography role="status" sx={{ fontSize: 14, color: brand.forest }}>
                    Added. <Link href="/cart">Review the cart</Link>
                  </Typography>
                ) : null}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          run({ action: "save-list", name, lines: cartLines }, () => setName(""));
        }}
        sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2.5, pt: 2.5, borderTop: `1px solid ${brand.line}`, alignItems: "flex-start" }}
      >
        <TextField
          label="Save current cart as a list"
          placeholder="Branch office standard"
          size="small"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: "1 1 260px" }}
          helperText={cartLines.length === 0 ? "Your cart is empty." : `${cartLines.length} ${cartLines.length === 1 ? "line" : "lines"} in your cart.`}
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
        <Button type="submit" variant="outlined" disabled={busy || cartLines.length === 0}>Save list</Button>
      </Box>
      {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
    </Box>
  );
}

export function RecentOrders({ orders, canSave }: { orders: PanelOrder[]; canSave: boolean }) {
  const { busy, error, run } = useAction();
  const reorder = useReorder();
  const [naming, setNaming] = useState("");
  const [name, setName] = useState("");
  const [addedId, setAddedId] = useState("");

  return (
    <Box component="section" aria-labelledby="past" sx={card}>
      <Typography id="past" component="h2" sx={h2}>Your past orders</Typography>
      {orders.length === 0 ? (
        <Typography sx={{ color: brand.muted, mt: 1 }}>
          Orders you place while signed in appear here, ready to reorder. <Link href="/products">Browse the collections</Link>.
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mt: 1 }}>
          {orders.map((order) => (
            <Box component="li" key={order.id} sx={{ py: 1.5, borderTop: `1px solid ${brand.line}` }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{order.id}</Typography>
                  <Typography sx={{ fontSize: 13, color: brand.muted }}>
                    {order.createdAt.slice(0, 10)} · {order.status} · {order.lines.map((l) => `${l.quantity} × ${l.name}`).join(", ")}
                  </Typography>
                </Box>
                <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{formatPrice(order.total)}</Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, alignItems: "center" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    reorder(order.lines);
                    setAddedId(order.id);
                  }}
                >
                  Reorder
                </Button>
                {canSave ? (
                  <Button size="small" onClick={() => { setNaming(naming === order.id ? "" : order.id); setName(""); }}>
                    Save as list
                  </Button>
                ) : null}
                {addedId === order.id ? (
                  <Typography role="status" sx={{ fontSize: 14, color: brand.forest }}>
                    Added at today&apos;s prices. <Link href="/cart">Review the cart</Link>
                  </Typography>
                ) : null}
              </Box>
              {naming === order.id ? (
                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run({ action: "save-list", name, orderId: order.id }, () => setNaming(""));
                  }}
                  sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1.5 }}
                >
                  <TextField label="List name" size="small" required autoFocus value={name} onChange={(e) => setName(e.target.value)} sx={{ flex: "1 1 240px" }} slotProps={{ htmlInput: { maxLength: 80 } }} />
                  <Button type="submit" variant="contained" size="small" disabled={busy}>Save</Button>
                </Box>
              ) : null}
            </Box>
          ))}
        </Box>
      )}
      {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
    </Box>
  );
}

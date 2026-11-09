"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { demoPaymentMethodLabel, type DemoOrder } from "@/lib/commerce/demo-orders";
import { formatPrice } from "@/lib/format";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; orders: DemoOrder[]; available: boolean };

export function OrdersPanel() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    fetch("/api/account")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { orders?: DemoOrder[]; ordersAvailable?: boolean }) => {
        if (active) setState({ kind: "ready", orders: data.orders ?? [], available: Boolean(data.ordersAvailable) });
      })
      .catch(() => active && setState({ kind: "error" }));
    return () => {
      active = false;
    };
  }, []);

  return (
    <Box>
      <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>
        Orders
      </Typography>
      {state.kind === "loading" ? (
        <Typography variant="body2" sx={{ mt: 1.5 }}>
          Loading orders…
        </Typography>
      ) : null}
      {state.kind === "error" ? (
        <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
          Orders could not be loaded. Refresh to try again.
        </Typography>
      ) : null}
      {state.kind === "ready" && !state.available ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 560 }}>
          Order history is not available. No order service is connected to this store yet.
        </Typography>
      ) : null}
      {state.kind === "ready" && state.available ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, maxWidth: 620 }}>
            Demo mode: these orders were placed while signed in on this server. No payment was taken.
          </Typography>
          {state.orders.length === 0 ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2">You have not placed any orders yet.</Typography>
              <Button component={Link} href="/products" variant="contained" sx={{ mt: 2 }}>
                Browse products
              </Button>
            </Box>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 2.5 }}>
              {state.orders.map((order) => (
                <Paper key={order.id} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {order.id}
                    </Typography>
                    <Chip size="small" label={order.status} color="success" variant="outlined" />
                    <Chip size="small" label="Demo" variant="outlined" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    {order.createdAt?.slice(0, 10)} · {demoPaymentMethodLabel[order.method]} ·{" "}
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                  </Typography>
                  <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.25, fontSize: 14 }}>
                    {order.items.map((item) => (
                      <li key={item.productId}>
                        {item.name} × {item.quantity} — {formatPrice(item.lineTotal)}
                      </li>
                    ))}
                  </Box>
                  <Stack direction="row" sx={{ mt: 1.5, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Subtotal {formatPrice(order.subtotal)}
                    </Typography>
                    <Button component={Link} href={`/orders/track?order=${order.id}`} size="small">
                      Track
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </>
      ) : null}
    </Box>
  );
}

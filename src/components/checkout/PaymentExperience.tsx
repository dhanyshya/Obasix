"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PurchaseSteps } from "@/components/checkout/PurchaseSteps";
import { getProductById } from "@/data/catalogue";
import { useCart } from "@/context/CartContext";
import { useCheckoutDraft } from "@/context/CheckoutDraftContext";
import {
  rememberDemoOrder,
  type DemoOrder,
  type DemoPaymentMethod,
} from "@/lib/commerce/demo-orders";
import { formatPrice } from "@/lib/format";
import type { CommerceResponse } from "@/lib/commerce/types";
import { commerceRequirements } from "@/lib/commerce/types";
import { PageMasthead } from "@/components/layout/PageMasthead";
import type { CartItem } from "@/lib/types";

type CommerceMode = "demo" | "real" | "unconfigured";
type Attempt = "idle" | "loading" | "blocked" | "cancelled" | "failed";

const methods: { id: DemoPaymentMethod; label: string }[] = [
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" },
  { id: "cod", label: "Cash on Delivery" },
];

function isQuoted(item: CartItem) {
  return item.configuration.customWidthFt != null && item.configuration.customHeightFt != null;
}

export function PaymentExperience() {
  const router = useRouter();
  const { items, itemCount, clearCart } = useCart();
  const priced = items.filter((item) => !isQuoted(item));
  const catalogueSubtotal = priced.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const { draft } = useCheckoutDraft();
  const [mode, setMode] = useState<CommerceMode | "loading">("loading");
  const [attempt, setAttempt] = useState<Attempt>("idle");
  const [result, setResult] = useState<CommerceResponse | null>(null);
  const [method, setMethod] = useState<DemoPaymentMethod | "">("");
  const [methodError, setMethodError] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/commerce/mode")
      .then((response) => response.json())
      .then((body: { mode?: CommerceMode }) => {
        if (active) setMode(body.mode === "demo" || body.mode === "real" ? body.mode : "unconfigured");
      })
      .catch(() => {
        if (active) setMode("unconfigured");
      });
    return () => {
      active = false;
    };
  }, []);

  const startPayment = async () => {
    if (!draft || mode === "demo") return;
    setAttempt("loading");
    setResult(null);
    try {
      const response = await fetch("/api/commerce/payment", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": draft.idempotencyKey,
        },
        body: JSON.stringify({ idempotencyKey: draft.idempotencyKey }),
      });
      const body = (await response.json()) as CommerceResponse;
      setResult(body);
      setAttempt("blocked");
    } catch {
      setResult({
        ok: false,
        code: "provider_not_configured",
        charged: false,
        orderCreated: false,
        message: "Payment could not be reached. Nothing was charged.",
      });
      setAttempt("blocked");
    }
  };

  const simulateSuccess = async () => {
    if (!draft || placing) return;
    if (!method) {
      setMethodError("Choose UPI, Card, or Cash on Delivery.");
      return;
    }
    setPlacing(true);
    setMethodError("");
    try {
      // The server re-prices every line from the catalogue and stores the demo order.
      const response = await fetch("/api/commerce/orders", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": draft.idempotencyKey },
        body: JSON.stringify({
          method,
          details: { name: draft.details.name, email: draft.details.email, phone: draft.details.phone, shipping: draft.details.shipping },
          lines: priced.map((item) => ({ productId: item.productId, quantity: item.quantity, configuration: item.configuration })),
        }),
      });
      const body = (await response.json()) as { ok: boolean; order?: DemoOrder; message?: string };
      if (!response.ok || !body.ok || !body.order) {
        setMethodError(body.message ?? "The demo order was not created.");
        setPlacing(false);
        return;
      }
      rememberDemoOrder(body.order);
      clearCart();
      router.push(`/checkout/confirmation?order=${body.order.id}`);
    } catch {
      setMethodError("The order service could not be reached. No order was created.");
      setPlacing(false);
    }
  };

  const ready = Boolean(draft) && items.length > 0;

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <PageMasthead
        code="Step 02 · Payment"
        title="Payment"
        crumbs={[{ href: "/cart", label: "Cart" }, { href: "/checkout", label: "Checkout" }, { label: "Payment" }]}
        compact
        lede={
          mode === "demo"
            ? "DEMO MODE — NO REAL PAYMENT. This simulation does not charge a card, send your details, or place an order."
            : "Card details are not collected here. A payment starts only after the server verifies a provider."
        }
      >
        <PurchaseSteps current={1} />
      </PageMasthead>

      <Container sx={{ py: 5 }}>
        <Grid container spacing={{ xs: 4, lg: 5 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            {!ready ? (
              <Box
                component="section"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: "16px",
                  bgcolor: "background.paper",
                  px: 3,
                  py: 6,
                }}
              >
                <Typography variant="h5" component="h2">
                  Checkout details are missing
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Return to checkout and continue after the customer and address fields are valid.
                </Typography>
                <Button component={Link} href="/checkout" variant="contained" sx={{ mt: 3 }}>
                  Back to checkout
                </Button>
              </Box>
            ) : mode === "loading" ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Checking checkout…
                </Typography>
              </Stack>
            ) : mode === "demo" ? (
              <Paper component="section" variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderTop: 0 }}>
                <Alert severity="info" sx={{ fontWeight: 600 }}>
                  DEMO MODE — NO REAL PAYMENT
                </Alert>
                <Typography variant="h5" component="h2" sx={{ mt: 2.5 }}>
                  Simulate a payment
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {draft?.details.name} · {itemCount} {itemCount === 1 ? "item" : "items"}. No UPI id, card number, or cash is collected.
                </Typography>
                <FormControl component="fieldset" error={Boolean(methodError)} sx={{ mt: 3 }}>
                  <FormLabel component="legend" sx={{ fontSize: 13, fontWeight: 600 }}>
                    Payment option
                  </FormLabel>
                  <RadioGroup
                    name="demo-method"
                    value={method}
                    onChange={(event) => {
                      setMethod(event.target.value as DemoPaymentMethod);
                      setMethodError("");
                    }}
                    sx={{ mt: 1 }}
                  >
                    {methods.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        value={option.id}
                        control={<Radio />}
                        label={option.label}
                      />
                    ))}
                  </RadioGroup>
                  {methodError ? <FormHelperText role="alert">{methodError}</FormHelperText> : null}
                </FormControl>
                <Stack direction={{ xs: "column", sm: "row" }} useFlexGap spacing={1.5} sx={{ mt: 3, flexWrap: "wrap" }}>
                  <Button variant="contained" onClick={() => void simulateSuccess()} disabled={placing}>
                    {placing ? "Placing order…" : "Simulate Successful Payment"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => {
                      setAttempt("failed");
                      setResult(null);
                    }}
                  >
                    Simulate Payment Failure
                  </Button>
                </Stack>
                {attempt === "failed" ? (
                  <Alert
                    severity="warning"
                    sx={{ mt: 2.5 }}
                    action={
                      <Button color="inherit" size="small" onClick={() => setAttempt("idle")}>
                        Try Again
                      </Button>
                    }
                  >
                    Demo payment failed. Nothing was charged and no order was created.
                  </Alert>
                ) : null}
              </Paper>
            ) : (
              <Paper component="section" variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderTop: 0 }}>
                <Typography variant="h5" component="h2">
                  Ready to pay
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {draft?.details.name} · {draft?.details.email} · {itemCount} {itemCount === 1 ? "item" : "items"} · catalogue subtotal shown in the summary.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.65 }}>
                  Shipping and tax still need confirmation. They are not added to this amount.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                  <Button variant="contained" onClick={startPayment} disabled={attempt === "loading"}>
                    {attempt === "loading" ? "Checking payment" : "Continue to payment"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => {
                      setAttempt("cancelled");
                      setResult(null);
                    }}
                  >
                    Cancel
                  </Button>
                </Stack>
                {attempt === "cancelled" ? (
                  <Alert severity="info" role="status" sx={{ mt: 2.5 }}>
                    Payment was cancelled before a provider was contacted. Nothing was charged.
                  </Alert>
                ) : null}
                {result ? (
                  <Alert
                    severity="warning"
                    sx={{ mt: 2.5 }}
                    action={
                      <Button color="inherit" size="small" onClick={startPayment} disabled={attempt === "loading"}>
                        Try again
                      </Button>
                    }
                  >
                    <AlertTitle>{result.message}</AlertTitle>
                    Charged: no. Order created: no.
                    {result.required ? (
                      <Box component="span" sx={{ display: "block", mt: 0.5 }}>
                        Server settings still required: {result.required.join(", ")}.
                      </Box>
                    ) : null}
                  </Alert>
                ) : null}
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Paper component="aside" variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: "16px", height: "fit-content" }}>
              <Typography variant="h6" component="h2">
                Amount
              </Typography>
              <Stack component="ul" spacing={1} sx={{ m: 0, mt: 2, p: 0, listStyle: "none" }}>
                {items.map((item) => {
                  const product = getProductById(item.productId);
                  const quoted = isQuoted(item);
                  return (
                    <Stack key={item.id} component="li" direction="row" spacing={1.5} sx={{ justifyContent: "space-between" }}>
                      <Typography variant="body2">
                        {product?.shortName ?? item.productId} · Qty {item.quantity}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {quoted ? "Quote" : formatPrice(item.unitPrice * item.quantity)}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Catalogue subtotal
              </Typography>
              <Typography variant="h5" component="p" sx={{ fontWeight: 700 }}>
                {items.length === 0 ? "—" : formatPrice(catalogueSubtotal)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Shipping and tax will be confirmed later.
              </Typography>
              {mode === "unconfigured" ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Real payment needs server settings: {commerceRequirements.join(", ")}.
                </Typography>
              ) : null}
              <Button component={Link} href="/checkout" color="inherit" fullWidth sx={{ mt: 2.5 }}>
                Return to checkout
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

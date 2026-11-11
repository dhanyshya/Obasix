"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PurchaseSteps } from "@/components/checkout/PurchaseSteps";
import { colours, featureOptions, frames, getProductById } from "@/data/catalogue";
import { useCart } from "@/context/CartContext";
import { useCheckoutDraft } from "@/context/CheckoutDraftContext";
import { formatPrice } from "@/lib/format";
import { PageMasthead } from "@/components/layout/PageMasthead";
import type { CartItem } from "@/lib/types";

type Address = {
  line: string;
  city: string;
  state: string;
  postal: string;
  country: string;
};

type Details = {
  name: string;
  email: string;
  phone: string;
  billing: Address;
  shipping: Address;
  sameAsBilling: boolean;
};

type FieldErrors = Partial<Record<string, string>>;

const emptyAddress: Address = { line: "", city: "", state: "", postal: "", country: "India" };

const initialDetails: Details = {
  name: "",
  email: "",
  phone: "",
  billing: { ...emptyAddress },
  shipping: { ...emptyAddress },
  sameAsBilling: true,
};

function isCustomSize(item: CartItem) {
  return item.configuration.customWidthFt != null && item.configuration.customHeightFt != null;
}

function sizeLabel(item: CartItem) {
  const product = getProductById(item.productId);
  if (isCustomSize(item)) {
    return `${item.configuration.customWidthFt} × ${item.configuration.customHeightFt} ft`;
  }
  return product?.sizes.find((size) => size.id === item.configuration.sizeId)?.label ?? "Standard";
}

function featureLabel(id: string) {
  return featureOptions.find((feature) => feature.id === id)?.name ?? id;
}

function validate(details: Details): FieldErrors {
  const errors: FieldErrors = {};
  if (details.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (details.phone.replace(/\D/g, "").length < 8) errors.phone = "Enter a phone number.";
  validateAddress(details.billing, "billing", errors);
  if (!details.sameAsBilling) validateAddress(details.shipping, "shipping", errors);
  return errors;
}

function validateAddress(address: Address, prefix: "billing" | "shipping", errors: FieldErrors) {
  if (address.line.trim().length < 4) errors[`${prefix}.line`] = "Enter the street address.";
  if (address.city.trim().length < 2) errors[`${prefix}.city`] = "Enter the city.";
  if (address.state.trim().length < 2) errors[`${prefix}.state`] = "Enter the state.";
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{2,11}$/.test(address.postal.trim())) {
    errors[`${prefix}.postal`] = "Enter a PIN or postal code.";
  }
  if (address.country.trim().length < 2) errors[`${prefix}.country`] = "Enter the country.";
}

export function CheckoutExperience() {
  const { items, subtotal, itemCount } = useCart();
  const { saveDraft } = useCheckoutDraft();
  const router = useRouter();
  const formId = useId();
  const [details, setDetails] = useState<Details>(initialDetails);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  const catalogueItems = items.filter((item) => !isCustomSize(item));
  const quoteItems = items.filter(isCustomSize);
  const catalogueSubtotal = catalogueItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const onContinue = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(details);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("");
      const first = Object.keys(nextErrors)[0];
      document.getElementById(`${formId}-${first.replace(".", "-")}`)?.focus();
      return;
    }
    if (quoteItems.length > 0) {
      setFormError("A custom size needs a quote before payment. It is not included in the catalogue subtotal.");
      return;
    }
    setFormError("");
    saveDraft({
      ...details,
      name: details.name.trim(),
      email: details.email.trim(),
      phone: details.phone.trim(),
      shipping: details.sameAsBilling ? details.billing : details.shipping,
    });
    router.push("/checkout/payment");
  };

  if (items.length === 0) {
    return (
      <Box sx={{ bgcolor: "background.default" }}>
        <CheckoutHeader />
        <Container sx={{ py: 7 }}>
          <Box
            sx={{
              mx: "auto",
              maxWidth: 576,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "16px",
              bgcolor: "background.paper",
              px: 3,
              py: 8,
              textAlign: "center",
            }}
          >
            <Typography variant="h5" component="h2">
              Your cart is empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add a board or accessory before reviewing an order.
            </Typography>
            <Button component={Link} href="/products" variant="contained" sx={{ mt: 3 }}>
              Explore Products
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.default" }}>
      <CheckoutHeader />
      <Container sx={{ py: 5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: "minmax(0, 3fr) minmax(0, 2fr)",
            },
            gap: { xs: 4, md: 5, lg: 6 },
            alignItems: "start",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Box component="form" onSubmit={onContinue} noValidate>
              <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3, md: 3.75 }, borderRadius: "16px" }}>
                <Stack spacing={4} divider={<Divider flexItem />}>
                  <Box component="section">
                    <Typography variant="h5" component="h2">
                      Customer details
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Field
                        id={`${formId}-name`}
                        label="Full name"
                        autoComplete="name"
                        value={details.name}
                        error={errors.name}
                        onChange={(name) => setDetails((current) => ({ ...current, name }))}
                      />
                      <Field
                        id={`${formId}-email`}
                        label="Email"
                        type="email"
                        autoComplete="email"
                        value={details.email}
                        error={errors.email}
                        onChange={(email) => setDetails((current) => ({ ...current, email }))}
                      />
                      <Field
                        id={`${formId}-phone`}
                        label="Phone"
                        type="tel"
                        autoComplete="tel"
                        value={details.phone}
                        error={errors.phone}
                        onChange={(phone) => setDetails((current) => ({ ...current, phone }))}
                      />
                    </Stack>
                  </Box>

                  <AddressSection
                    formId={formId}
                    title="Billing address"
                    prefix="billing"
                    autoCompletePrefix="billing"
                    address={details.billing}
                    errors={errors}
                    onChange={(billing) => setDetails((current) => ({ ...current, billing }))}
                  />

                  <Box component="section">
                    <Typography variant="h5" component="h2">
                      Shipping address
                    </Typography>
                    <FormControlLabel
                      sx={{ mt: 1 }}
                      control={
                        <Checkbox
                          checked={details.sameAsBilling}
                          onChange={(event) =>
                            setDetails((current) => ({ ...current, sameAsBilling: event.target.checked }))
                          }
                        />
                      }
                      label="Same as billing address"
                    />
                    {details.sameAsBilling ? null : (
                      <Box sx={{ mt: 2 }}>
                        <AddressFields
                          formId={formId}
                          prefix="shipping"
                          autoCompletePrefix="shipping"
                          address={details.shipping}
                          errors={errors}
                          onChange={(shipping) => setDetails((current) => ({ ...current, shipping }))}
                        />
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Paper>

              {formError ? (
                <Alert severity="error" sx={{ mt: 3 }}>
                  {formError}
                </Alert>
              ) : null}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                <Button component={Link} href="/cart" variant="outlined" color="inherit">
                  Return to cart
                </Button>
                <Button type="submit" variant="contained">
                  Continue to Payment
                </Button>
              </Stack>
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Paper
              component="aside"
              variant="outlined"
              sx={{ p: { xs: 2.5, sm: 3, md: 3.75 }, borderRadius: "16px", height: "fit-content", position: { lg: "sticky" }, top: { lg: 112 } }}
            >
              <Typography variant="h6" component="h2">
                Order summary
              </Typography>
              <Stack component="ul" spacing={2} sx={{ m: 0, mt: 2, p: 0, listStyle: "none" }}>
                {items.map((item) => (
                  <SummaryLine key={item.id} item={item} />
                ))}
              </Stack>
              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Items
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {itemCount}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
                    {formatPrice(quoteItems.length > 0 ? catalogueSubtotal : subtotal)}
                  </Typography>
                </Stack>
                {quoteItems.length > 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {quoteItems.length === 1 ? "1 custom size" : `${quoteItems.length} custom sizes`} will be confirmed on a quote and {quoteItems.length === 1 ? "is" : "are"} not included in this subtotal.
                  </Typography>
                ) : null}
                <Typography variant="body2" color="text.secondary">
                  Shipping and tax will be confirmed later. This page does not add those charges.
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function CheckoutHeader() {
  return (
    <PageMasthead
      code="Step 01 · Checkout"
      title="Checkout"
      crumbs={[{ href: "/", label: "Home" }, { href: "/cart", label: "Cart" }, { label: "Checkout" }]}
      compact
      lede={
        <>
          <Box component="p" sx={{ m: 0 }}>
            <Box component={Link} href="/login?next=/checkout" sx={{ color: "#164E3B", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 4 }}>
              Sign in
            </Box>{" "}
            to keep this cart with your account. You can also continue as a guest.
          </Box>
          <Box component="p" sx={{ m: 0, mt: 1 }}>
            Review your OBASIX setup and your contact details. Payment starts only on the next step, and only when the server can reach a provider.
          </Box>
        </>
      }
    >
      <PurchaseSteps current={0} />
    </PageMasthead>
  );
}

function SummaryLine({ item }: { item: CartItem }) {
  const product = getProductById(item.productId);
  if (!product) return null;
  const frame = frames.find((entry) => entry.id === item.configuration.frameId);
  const colour = colours.find((entry) => entry.id === item.configuration.colourId);
  const quote = isCustomSize(item);
  const accessory = product.category === "accessory" || product.category === "desk-accessory";
  const lineTotal = item.unitPrice * item.quantity;

  return (
    <Box component="li" sx={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 1.5 }}>
      <Box sx={{ position: "relative", height: 72, overflow: "hidden", borderRadius: "16px", bgcolor: "background.default" }}>
        {product.images[0] ? (
          <Image src={product.images[0]} alt="" fill className="object-contain p-1" sizes="72px" />
        ) : null}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {product.shortName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {accessory ? "Accessory" : "Board"} · {sizeLabel(item)}
          {frame ? ` · ${frame.name}` : ""}
          {colour ? ` · ${colour.name}` : ""}
        </Typography>
        {item.configuration.features?.length ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {item.configuration.features.map(featureLabel).join(", ")}
          </Typography>
        ) : null}
        <Typography variant="body2" sx={{ mt: 1 }}>
          Qty {item.quantity}
          {quote ? (
            <Box component="span" sx={{ display: "block", mt: 0.5, fontWeight: 600 }}>
              Custom size · request a quote
            </Box>
          ) : (
            <Box component="span" sx={{ display: "block", mt: 0.5 }}>
              {formatPrice(item.unitPrice)} each · {formatPrice(lineTotal)}
            </Box>
          )}
        </Typography>
      </Box>
    </Box>
  );
}

function AddressSection({
  formId,
  title,
  prefix,
  autoCompletePrefix,
  address,
  errors,
  onChange,
}: {
  formId: string;
  title: string;
  prefix: "billing" | "shipping";
  autoCompletePrefix: string;
  address: Address;
  errors: FieldErrors;
  onChange: (address: Address) => void;
}) {
  return (
    <Box component="section">
      <Typography variant="h5" component="h2">
        {title}
      </Typography>
      <Box sx={{ mt: 2 }}>
        <AddressFields
          formId={formId}
          prefix={prefix}
          autoCompletePrefix={autoCompletePrefix}
          address={address}
          errors={errors}
          onChange={onChange}
        />
      </Box>
    </Box>
  );
}

function AddressFields({
  formId,
  prefix,
  autoCompletePrefix,
  address,
  errors,
  onChange,
}: {
  formId: string;
  prefix: "billing" | "shipping";
  autoCompletePrefix: string;
  address: Address;
  errors: FieldErrors;
  onChange: (address: Address) => void;
}) {
  return (
    <Stack spacing={2}>
      <Field
        id={`${formId}-${prefix}-line`}
        label="Address"
        autoComplete={`${autoCompletePrefix} street-address`}
        value={address.line}
        error={errors[`${prefix}.line`]}
        onChange={(line) => onChange({ ...address, line })}
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            id={`${formId}-${prefix}-city`}
            label="City"
            autoComplete={`${autoCompletePrefix} address-level-2`}
            value={address.city}
            error={errors[`${prefix}.city`]}
            onChange={(city) => onChange({ ...address, city })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            id={`${formId}-${prefix}-state`}
            label="State"
            autoComplete={`${autoCompletePrefix} address-level-1`}
            value={address.state}
            error={errors[`${prefix}.state`]}
            onChange={(state) => onChange({ ...address, state })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            id={`${formId}-${prefix}-postal`}
            label="PIN / postal code"
            autoComplete={`${autoCompletePrefix} postal-code`}
            value={address.postal}
            error={errors[`${prefix}.postal`]}
            onChange={(postal) => onChange({ ...address, postal })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Field
            id={`${formId}-${prefix}-country`}
            label="Country"
            autoComplete={`${autoCompletePrefix} country-name`}
            value={address.country}
            error={errors[`${prefix}.country`]}
            onChange={(country) => onChange({ ...address, country })}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <TextField
      id={id}
      label={label}
      type={type}
      value={value}
      fullWidth
      error={Boolean(error)}
      helperText={error}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        htmlInput: { autoComplete },
        formHelperText: { role: "alert" },
      }}
      sx={{
        "& .MuiOutlinedInput-root": { height: 48, alignItems: "center" },
        "& .MuiOutlinedInput-input": { paddingTop: 0, paddingBottom: 0 },
      }}
    />
  );
}

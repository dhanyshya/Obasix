"use client";

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Link from "@/components/Link";
import { useCart } from "@/context/CartContext";
import { colours, frames, getProductById } from "@/data/catalogue";
import { buildCustomizeHref } from "@/lib/format";
import {
  describeCartConfiguration,
  quoteAttachmentMaxBytes,
  quoteBoardLabel,
  quoteBoardTypes,
  quoteSurfaceLabel,
  validateQuoteFields,
} from "@/lib/quotes/schema";
import type { QuoteRequest } from "@/lib/types";
import { quoteTheme } from "./quoteTheme";

type QuoteInitial = Partial<QuoteRequest> & {
  product?: string;
  productId?: string;
  frame?: string;
  surface?: string;
  accessories?: string;
  location?: string;
  dimensionsRequired?: boolean;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: quoteTheme.white,
    borderRadius: 1,
    "& fieldset": { borderColor: quoteTheme.line },
    "&:hover fieldset": { borderColor: quoteTheme.oak },
    "&.Mui-focused fieldset": { borderColor: quoteTheme.forest, borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: quoteTheme.muted },
  "& .MuiInputLabel-root.Mui-focused": { color: quoteTheme.forest },
  "& .MuiFormHelperText-root": { mx: 0 },
} as const;

export function QuoteForm({ initial }: { initial?: QuoteInitial }) {
  const router = useRouter();
  const cart = useCart();
  const idempotencyKey = useRef(crypto.randomUUID());
  const requestedProduct = initial?.productId ? getProductById(initial.productId) : undefined;
  const requestedBoard = initial?.boardType ?? "";
  const requestedBoardKnown =
    Boolean(requestedBoard) &&
    quoteBoardTypes.includes(requestedBoard as (typeof quoteBoardTypes)[number]);
  const startingBoard = requestedBoardKnown
    ? requestedBoard
    : requestedProduct
      ? quoteBoardLabel(requestedProduct)
      : requestedBoard
        ? "Custom Board"
        : "Magnetic Whiteboard";
  const knownBoard = quoteBoardTypes.includes(startingBoard as (typeof quoteBoardTypes)[number]);
  const defaultFrame =
    initial?.frame ||
    (requestedProduct ? frames.find((item) => item.id === requestedProduct.frame)?.name : "") ||
    "";
  const defaultColour =
    initial?.colour ||
    (requestedProduct
      ? requestedProduct.colours
          .map((id) => colours.find((item) => item.id === id)?.name ?? id)
          .join(", ")
      : "") ||
    "";
  const defaultSurface = initial?.surface || quoteSurfaceLabel(requestedProduct?.surface);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    company: initial?.company ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    location: initial?.location ?? "",
    boardType: startingBoard,
    dimensions: initial?.customSize ?? "",
    quantity: initial?.quantity || "1",
    product: initial?.product || requestedProduct?.shortName || "",
    productId: initial?.productId ?? "",
    frame: defaultFrame,
    colour: defaultColour,
    surface: defaultSurface,
    features: initial?.features ?? "",
    accessories: initial?.accessories ?? "",
    branding: initial?.branding ?? "",
    notes: initial?.requirements ?? "",
    configurationSummary: [requestedBoardKnown ? "" : requestedBoard, initial?.configurationSummary ?? ""]
      .filter(Boolean)
      .join(" · "),
  });
  const [dimensionsRequired, setDimensionsRequired] = useState(
    Boolean(initial?.dimensionsRequired) || (!knownBoard && requestedBoard !== ""),
  );

  const product = useMemo(
    () => (form.productId ? getProductById(form.productId) : undefined),
    [form.productId],
  );

  const cartLines = useMemo(
    () =>
      cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        detail: describeCartConfiguration(item.configuration),
      })),
    [cart.items],
  );

  const customizeHref = product
    ? buildCustomizeHref({
        productId: product.id,
        boardType: product.boardType,
      })
    : "/customize";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const needsDimensions = dimensionsRequired || form.boardType === "Custom Board";
    const nextErrors = validateQuoteFields({
      name: form.name,
      phone: form.phone,
      email: form.email,
      location: form.location,
      boardType: form.boardType,
      dimensions: form.dimensions,
      dimensionsRequired: needsDimensions,
      quantity: form.quantity,
      file: file ? { type: file.type, size: file.size } : null,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Check the highlighted fields before submitting.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.set(key, value));
    body.set("dimensionsRequired", needsDimensions ? "1" : "0");
    body.set(
      "lines",
      JSON.stringify(
        linesForSubmit(form.productId, Number(form.quantity), form.configurationSummary, cartLines),
      ),
    );
    if (file) body.set("file", file);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey.current },
        body,
      });
      const result = (await response.json()) as {
        ok?: boolean;
        saved?: boolean;
        reference?: string;
        message?: string;
        required?: string[];
      };
      if (!response.ok || !result.saved || !result.reference) {
        setFormError(
          [result.message, result.required?.length ? `Missing server settings: ${result.required.join(", ")}.` : ""]
            .filter(Boolean)
            .join(" "),
        );
        setSubmitting(false);
        return;
      }
      router.push(`/quote/confirmation?ref=${encodeURIComponent(result.reference)}`);
    } catch {
      setFormError("The quote could not be sent. Your details are still in the form.");
      setSubmitting(false);
    }
  };

  const requireDimensions = dimensionsRequired || form.boardType === "Custom Board";
  const hasLockedProduct = Boolean(product);

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      noValidate
      sx={{
        display: "grid",
        gap: { xs: 3.5, lg: 4.5 },
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.5fr) minmax(280px, 1fr)" },
        alignItems: "start",
      }}
    >
      <Stack spacing={{ xs: 3, md: 3.5 }} sx={{ minWidth: 0 }}>
        <Alert
          severity="info"
          icon={false}
          sx={{
            bgcolor: quoteTheme.beige,
            color: quoteTheme.charcoal,
            border: `1px solid ${quoteTheme.line}`,
            borderRadius: 1,
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: quoteTheme.charcoal }}>
            Demo mode — quotes are saved for this storefront demo only
          </Typography>
          <Typography sx={{ mt: 0.35, fontSize: 12.5, color: quoteTheme.muted }}>
            Catalogue prices are checked on the server. This form does not invent a quote total.
          </Typography>
        </Alert>

        {formError ? (
          <Alert severity="error" role="alert" sx={{ borderRadius: 1 }}>
            {formError}
          </Alert>
        ) : null}

        <Section
          index="01"
          title="Your Quote Requirements"
          description="These details are pre-filled from your customization. Adjust anything you need before submitting."
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                id="quote-board"
                label="Board Type"
                fullWidth
                value={form.boardType}
                error={Boolean(errors.boardType)}
                helperText={errors.boardType}
                onChange={(event) => {
                  const boardType = event.target.value;
                  setForm((current) => ({ ...current, boardType }));
                  if (boardType === "Custom Board") setDimensionsRequired(true);
                }}
                sx={fieldSx}
                slotProps={{ formHelperText: { role: "alert" } }}
              >
                {quoteBoardTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-product"
                label="Product / Model"
                value={form.product}
                onChange={(productName) => setForm((current) => ({ ...current, product: productName }))}
                helperText={
                  hasLockedProduct
                    ? `Linked to catalogue SKU ${product?.sku ?? form.productId}`
                    : undefined
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-dimensions"
                label={requireDimensions ? "Custom Dimensions" : "Dimensions"}
                required={requireDimensions}
                value={form.dimensions}
                error={errors.dimensions}
                onChange={(dimensions) => setForm((current) => ({ ...current, dimensions }))}
                placeholder="e.g. 6 × 4 ft"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-quantity"
                label="Quantity"
                type="number"
                required
                value={form.quantity}
                error={errors.quantity}
                onChange={(quantity) => setForm((current) => ({ ...current, quantity }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-frame"
                label="Frame Type"
                value={form.frame}
                onChange={(frame) => setForm((current) => ({ ...current, frame }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-colour"
                label="Colour"
                value={form.colour}
                onChange={(colour) => setForm((current) => ({ ...current, colour }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-surface"
                label="Surface"
                value={form.surface}
                onChange={(surface) => setForm((current) => ({ ...current, surface }))}
                placeholder="Resin coated, ceramic steel…"
              />
            </Grid>
            <Grid size={12}>
              <Field
                id="quote-features"
                label="Required Features"
                value={form.features}
                onChange={(features) => setForm((current) => ({ ...current, features }))}
                placeholder="Magnetic surface, marker tray, calendar section…"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-accessories"
                label="Accessories"
                value={form.accessories}
                onChange={(accessories) => setForm((current) => ({ ...current, accessories }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-branding"
                label="Logo / Customization"
                value={form.branding}
                onChange={(branding) => setForm((current) => ({ ...current, branding }))}
                placeholder="Yes / No / placement notes"
              />
            </Grid>
          </Grid>

          {(form.configurationSummary || cartLines.length > 0) && (
            <Box
              sx={{
                mt: 2.5,
                px: 2,
                py: 1.75,
                borderRadius: 1,
                bgcolor: quoteTheme.beige,
                border: `1px solid ${quoteTheme.line}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: quoteTheme.forest,
                }}
              >
                Configuration captured
              </Typography>
              {form.configurationSummary ? (
                <Typography sx={{ mt: 0.75, fontSize: 14, lineHeight: 1.65, color: quoteTheme.charcoal }}>
                  {form.configurationSummary}
                </Typography>
              ) : null}
              {cartLines.length > 0 ? (
                <Box component="ul" sx={{ m: 0, mt: 1, pl: 2, color: quoteTheme.muted, fontSize: 13.5 }}>
                  {cartLines.map((line) => (
                    <li key={`${line.productId}-${line.detail}`}>
                      {getProductById(line.productId)?.shortName ?? line.productId} · qty {line.quantity}
                      {line.detail ? ` · ${line.detail}` : ""}
                    </li>
                  ))}
                </Box>
              ) : null}
            </Box>
          )}
        </Section>

        <Section
          index="02"
          title="Your Details"
          description="Tell us how to reach you so we can share your personalised quotation."
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-name"
                label="Full Name"
                required
                value={form.name}
                error={errors.name}
                onChange={(name) => setForm((current) => ({ ...current, name }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-email"
                label="Email Address"
                type="email"
                required
                value={form.email}
                error={errors.email}
                onChange={(email) => setForm((current) => ({ ...current, email }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-phone"
                label="Mobile Number"
                type="tel"
                required
                value={form.phone}
                error={errors.phone}
                onChange={(phone) => setForm((current) => ({ ...current, phone }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-company"
                label="Company Name (Optional)"
                value={form.company}
                onChange={(company) => setForm((current) => ({ ...current, company }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field
                id="quote-location"
                label="Location / City"
                required
                value={form.location}
                error={errors.location}
                onChange={(location) => setForm((current) => ({ ...current, location }))}
                placeholder="e.g. Mumbai, Maharashtra"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                id="quote-notes"
                label="Additional Requirements (Optional)"
                multiline
                minRows={3}
                fullWidth
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Mounting, branding placement, delivery window, site constraints…"
                sx={fieldSx}
              />
            </Grid>
          </Grid>
        </Section>

        <Section
          index="03"
          title="Supporting Reference (Optional)"
          description="Attach artwork, a logo or site details if it helps us prepare your quote."
        >
          <Box
            sx={{
              p: { xs: 2, md: 2.25 },
              borderRadius: 1,
              border: `1px dashed ${quoteTheme.oak}`,
              bgcolor: quoteTheme.white,
            }}
          >
            <Typography sx={{ fontWeight: 600, fontSize: 14, color: quoteTheme.charcoal }}>
              Reference file
            </Typography>
            <Typography id="quote-file-hint" sx={{ mt: 0.5, fontSize: 13, color: quoteTheme.muted, lineHeight: 1.6 }}>
              Optional PNG, JPEG, WebP, or PDF up to {Math.round(quoteAttachmentMaxBytes / (1024 * 1024))} MB.
              The selected file name is recorded with your request. The binary file itself is not stored by this
              demo API.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ alignItems: { sm: "center" }, mt: 1.75 }}
              useFlexGap
            >
              <Button
                component="label"
                htmlFor="quote-file"
                variant="outlined"
                color={errors.file ? "error" : "inherit"}
                startIcon={<UploadFileIcon />}
                sx={{
                  borderColor: errors.file ? undefined : quoteTheme.oak,
                  color: quoteTheme.charcoal,
                  bgcolor: quoteTheme.ivory,
                  "&:hover": { borderColor: quoteTheme.forest, bgcolor: quoteTheme.beige },
                  "&:focus-within": {
                    outline: "2px solid",
                    outlineColor: quoteTheme.forest,
                    outlineOffset: 2,
                  },
                }}
              >
                Choose file
                <Box
                  component="input"
                  id="quote-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  aria-invalid={Boolean(errors.file)}
                  aria-describedby={errors.file ? "quote-file-error" : "quote-file-hint"}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setFile(event.target.files?.[0] ?? null)
                  }
                  sx={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    m: "-1px",
                    p: 0,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                  }}
                />
              </Button>
              <Typography sx={{ fontSize: 13.5, color: quoteTheme.muted }}>
                {file ? file.name : "No file selected"}
              </Typography>
            </Stack>
            {errors.file ? (
              <Typography id="quote-file-error" role="alert" sx={{ mt: 1, fontSize: 12.5, color: "error.main" }}>
                {errors.file}
              </Typography>
            ) : null}
          </Box>
        </Section>

        <Box
          sx={{
            pt: 1,
            pb: { xs: 2, md: 1 },
            borderTop: `1px solid ${quoteTheme.line}`,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Box sx={{ maxWidth: 420 }}>
              <Typography sx={{ fontSize: 13.5, color: quoteTheme.muted, lineHeight: 1.65 }}>
                Our team will review your requirements and contact you with a personalised quotation.
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexShrink: 0 }}>
              <Button
                component={Link}
                href="/products"
                variant="outlined"
                sx={{
                  borderColor: quoteTheme.oak,
                  color: quoteTheme.charcoal,
                  "&:hover": { borderColor: quoteTheme.forest, bgcolor: quoteTheme.beige },
                }}
              >
                Browse products
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                sx={{
                  minWidth: 220,
                  bgcolor: quoteTheme.forest,
                  color: quoteTheme.white,
                  px: 3,
                  py: 1.35,
                  fontWeight: 700,
                  "&:hover": { bgcolor: quoteTheme.forestDeep },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: quoteTheme.forest,
                    outlineOffset: 3,
                  },
                  "&.Mui-disabled": {
                    bgcolor: quoteTheme.beige,
                    color: quoteTheme.muted,
                  },
                }}
              >
                {submitting ? "Submitting…" : "Submit Quote Request"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      <Box
        sx={{
          position: { lg: "sticky" },
          top: { lg: 96 },
          minWidth: 0,
        }}
      >
        <ProductSummary
          productId={form.productId}
          productName={form.product}
          boardType={form.boardType}
          dimensions={form.dimensions}
          frame={form.frame}
          colour={form.colour}
          surface={form.surface}
          features={form.features}
          accessories={form.accessories}
          branding={form.branding}
          quantity={form.quantity}
          configurationSummary={form.configurationSummary}
          customizeHref={customizeHref}
        />
      </Box>
    </Box>
  );
}

function Section({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Box
      component="section"
      sx={{
        p: { xs: 2.25, md: 3 },
        borderRadius: 1.25,
        bgcolor: quoteTheme.white,
        border: `1px solid ${quoteTheme.line}`,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", mb: 0.75 }}>
        <Typography
          component="span"
          sx={{
            fontFamily: 'var(--font-display), var(--font-body), sans-serif',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.08em",
            color: quoteTheme.forest,
          }}
        >
          {index}.
        </Typography>
        <Typography
          component="h2"
          sx={{
            fontFamily: 'var(--font-display), var(--font-body), sans-serif',
            fontWeight: 600,
            fontSize: { xs: "1.2rem", md: "1.35rem" },
            letterSpacing: "-0.02em",
            color: quoteTheme.charcoal,
          }}
        >
          {title}
        </Typography>
      </Stack>
      <Typography sx={{ mb: 2.5, fontSize: 14, color: quoteTheme.muted, lineHeight: 1.65, maxWidth: 520 }}>
        {description}
      </Typography>
      {children}
    </Box>
  );
}

function ProductSummary({
  productId,
  productName,
  boardType,
  dimensions,
  frame,
  colour,
  surface,
  features,
  accessories,
  branding,
  quantity,
  configurationSummary,
  customizeHref,
}: {
  productId: string;
  productName: string;
  boardType: string;
  dimensions: string;
  frame: string;
  colour: string;
  surface: string;
  features: string;
  accessories: string;
  branding: string;
  quantity: string;
  configurationSummary: string;
  customizeHref: string;
}) {
  const product = productId ? getProductById(productId) : undefined;
  const image = product?.images?.[0];
  const frameLabel =
    frame ||
    (product ? frames.find((item) => item.id === product.frame)?.name : undefined) ||
    "—";
  const colourLabel =
    colour ||
    (product
      ? product.colours.map((id) => colours.find((c) => c.id === id)?.name ?? id).join(", ")
      : undefined) ||
    "—";
  const surfaceLabel = surface || quoteSurfaceLabel(product?.surface) || "—";
  const sizeLabel =
    dimensions ||
    product?.sizes?.[0]?.label ||
    "—";
  const featureList =
    features ||
    (product?.features?.length ? product.features.slice(0, 4).join(", ") : "—");
  const accessoryList =
    accessories ||
    (product?.accessories?.length
      ? product.accessories
          .map((id) => getProductById(id)?.shortName)
          .filter(Boolean)
          .slice(0, 4)
          .join(", ")
      : "—");

  const rows: { label: string; value: string }[] = [
    { label: "Board type", value: boardType || "—" },
    { label: "Dimensions", value: sizeLabel },
    { label: "Frame", value: frameLabel },
    { label: "Surface", value: surfaceLabel },
    { label: "Colour", value: colourLabel },
    { label: "Features", value: featureList },
    { label: "Accessories", value: accessoryList || "—" },
    { label: "Quantity", value: quantity || "1" },
    { label: "Logo / customization", value: branding || "—" },
  ];

  return (
    <Box
      component="aside"
      aria-label="Selected product summary"
      sx={{
        p: { xs: 2.25, md: 2.75 },
        borderRadius: 1.25,
        bgcolor: quoteTheme.white,
        border: `1px solid ${quoteTheme.line}`,
        boxShadow: "0 12px 36px rgba(37, 42, 38, 0.05)",
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: quoteTheme.forest,
        }}
      >
        Selected board
      </Typography>
      <Typography
        component="h2"
        sx={{
          mt: 0.75,
          fontFamily: 'var(--font-display), var(--font-body), sans-serif',
          fontWeight: 600,
          fontSize: "1.2rem",
          letterSpacing: "-0.02em",
          color: quoteTheme.charcoal,
          lineHeight: 1.3,
        }}
      >
        {product?.shortName || productName || "No product selected yet"}
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: 12.5, color: quoteTheme.muted }}>
        {product?.sku ? `SKU ${product.sku}` : "Catalogue item not linked"}
      </Typography>

      <Box
        sx={{
          position: "relative",
          mt: 2,
          aspectRatio: "5 / 4",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: quoteTheme.beige,
          border: `1px solid ${quoteTheme.line}`,
        }}
      >
        {image ? (
          <Image
            src={image}
            alt={product?.shortName || productName || "Selected OBASIX product"}
            fill
            className="object-contain p-4"
            sizes="360px"
          />
        ) : (
          <Stack sx={{ height: "100%", alignItems: "center", justifyContent: "center", px: 2 }}>
            <Typography sx={{ fontSize: 13, color: quoteTheme.muted, textAlign: "center" }}>
              Product image will appear when a catalogue item is linked
            </Typography>
          </Stack>
        )}
      </Box>

      <Box
        sx={{
          mt: 2.75,
          pt: 2,
          borderTop: `1px solid ${quoteTheme.line}`,
        }}
      >
        <Typography
          component="h3"
          sx={{
            fontFamily: 'var(--font-display), var(--font-body), sans-serif',
            fontWeight: 600,
            fontSize: "1.05rem",
            letterSpacing: "-0.01em",
            color: quoteTheme.charcoal,
          }}
        >
          Your Quote Summary
        </Typography>
        <Typography sx={{ mt: 0.35, fontSize: 12.5, color: quoteTheme.muted }}>
          Confirm the details we will use to prepare your quotation.
        </Typography>
      </Box>

      <Stack component="dl" spacing={1.25} sx={{ m: 0, mt: 2 }}>
        {rows.map((row) => (
          <Box
            key={row.label}
            sx={{
              display: "grid",
              gridTemplateColumns: "110px 1fr",
              gap: 1,
              pb: 1.1,
              borderBottom: `1px solid ${quoteTheme.line}`,
              "&:last-of-type": { borderBottom: 0, pb: 0 },
            }}
          >
            <Typography component="dt" sx={{ m: 0, fontSize: 12, fontWeight: 600, color: quoteTheme.muted }}>
              {row.label}
            </Typography>
            <Typography
              component="dd"
              sx={{
                m: 0,
                fontSize: 13.5,
                color: quoteTheme.charcoal,
                lineHeight: 1.5,
                textTransform: row.label === "Surface" ? "capitalize" : undefined,
              }}
            >
              {row.value}
            </Typography>
          </Box>
        ))}
      </Stack>

      {configurationSummary ? (
        <Typography sx={{ mt: 2, fontSize: 12.5, color: quoteTheme.muted, lineHeight: 1.6 }}>
          {configurationSummary}
        </Typography>
      ) : null}

      <Typography sx={{ mt: 2, fontSize: 12.5, color: quoteTheme.muted, lineHeight: 1.6 }}>
        Pricing is confirmed by OBASIX after review. No estimated total is shown on this page.
      </Typography>

      <Stack spacing={1} sx={{ mt: 2.5 }}>
        <Button
          component={Link}
          href={customizeHref}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: quoteTheme.forest,
            color: quoteTheme.white,
            fontWeight: 700,
            "&:hover": { bgcolor: quoteTheme.forestDeep },
          }}
        >
          Edit Customization
        </Button>
        <Button
          component={Link}
          href={product ? `/products/${product.id}` : "/products"}
          variant="text"
          fullWidth
          sx={{ color: quoteTheme.forest, fontWeight: 600 }}
        >
          {product ? "View product details" : "Browse catalogue"}
        </Button>
      </Stack>
    </Box>
  );
}

function linesForSubmit(
  productId: string,
  quantity: number,
  detail: string,
  cartLines: { productId: string; quantity: number; detail: string }[],
) {
  const lines = [...cartLines];
  if (productId && !lines.some((line) => line.productId === productId)) {
    lines.unshift({ productId, quantity: Number.isFinite(quantity) ? quantity : 1, detail });
  }
  return lines;
}

function Field({
  id,
  label,
  value,
  onChange,
  required,
  type = "text",
  error,
  helperText,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
}) {
  return (
    <TextField
      id={id}
      label={label}
      type={type}
      required={required}
      fullWidth
      value={value}
      error={Boolean(error)}
      helperText={error || helperText}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      sx={fieldSx}
      slotProps={{
        htmlInput: { min: type === "number" ? 1 : undefined },
        formHelperText: { role: error ? "alert" : undefined },
        inputLabel: { shrink: true },
      }}
    />
  );
}

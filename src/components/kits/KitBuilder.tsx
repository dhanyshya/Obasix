"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { signType } from "@/components/home/directory/sign";
import { useCart } from "@/context/CartContext";
import { getProductById } from "@/data/catalogue";
import { getKit, lineQuantity, plannerHref, signStudioHref } from "@/data/kits";
import { getPlannerTemplate } from "@/data/planners";
import { getSignType } from "@/data/signage";
import { formatPrice } from "@/lib/format";
import { defaultCartConfiguration } from "@/lib/productActions";
import { brandTokens as brand } from "@/theme/brandTokens";

/** The cart caps each line at 99; larger kits go through a quote. */
const CART_LINE_MAX = 99;

const row = {
  display: "grid",
  gridTemplateColumns: { xs: "auto 1fr auto", sm: "auto 1fr 90px 120px" },
  gap: { xs: 1, sm: 2 },
  alignItems: "center",
  py: 1.5,
  borderTop: `1px solid ${brand.line}`,
} as const;

export function KitBuilder({ kitId }: { kitId: string }) {
  const kit = getKit(kitId)!;
  const { addItem } = useCart();
  const [units, setUnits] = useState(kit.defaultUnits);
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  const [added, setAdded] = useState(false);

  const setUnitCount = (value: number) => {
    setAdded(false);
    setUnits(Math.max(1, Math.min(kit.maxUnits, Math.floor(Number.isFinite(value) ? value : 1))));
  };
  const toggle = (key: string) => {
    setAdded(false);
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const productLines = kit.products.map((line) => {
    const product = getProductById(line.productId)!;
    const quantity = lineQuantity(line, units);
    const included = !skipped.has(`p:${line.productId}`);
    return { line, product, quantity, included, total: product.price * quantity };
  });
  const signLines = kit.signs.map((line) => ({
    line,
    type: getSignType(line.typeId)!,
    quantity: lineQuantity(line, units),
    included: !skipped.has(`s:${line.typeId}`),
  }));

  const plannerLines = kit.planners.map((line) => ({
    line,
    template: getPlannerTemplate(line.templateId)!,
    quantity: lineQuantity(line, units),
    included: !skipped.has(`b:${line.templateId}`),
  }));

  const chosenProducts = productLines.filter((l) => l.included);
  const chosenSigns = signLines.filter((l) => l.included);
  const chosenPlanners = plannerLines.filter((l) => l.included);
  const madeToOrderCount = [...chosenSigns, ...chosenPlanners].reduce((s, l) => s + l.quantity, 0);
  const boardsTotal = chosenProducts.reduce((sum, l) => sum + l.total, 0);
  const tooBigForCart = chosenProducts.some((l) => l.quantity > CART_LINE_MAX);
  const isProject = units >= kit.projectThreshold;
  const unitLabel = units === 1 ? kit.unit.singular : kit.unit.plural;

  const quoteHref = (() => {
    const summary = [
      `${kit.name} for ${units} ${unitLabel}`,
      ...chosenProducts.map((l) => `${l.quantity} × ${l.product.shortName} (${l.product.sku})`),
      ...chosenSigns.map((l) => `${l.quantity} × ${l.type.name} (made to order)`),
      ...chosenPlanners.map((l) => `${l.quantity} × ${l.template.name} (printed, made to order)`),
    ].join(" · ");
    const params = new URLSearchParams({
      product: kit.name,
      quantity: String(units),
      config: summary,
      notes:
        chosenSigns.length + chosenPlanners.length > 0
          ? "Please include the signs and printed boards in the quote. I can share names, numbers and layouts for each."
          : "",
    });
    return `/quote?${params.toString()}`;
  })();

  const addToCart = () => {
    chosenProducts.forEach(({ product, quantity }) => addItem(product.id, defaultCartConfiguration(product), quantity));
    setAdded(true);
  };

  return (
    <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" }, alignItems: "start" }}>
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <Typography component="label" htmlFor="kit-units" sx={{ ...signType.plate, fontSize: 18 }}>
            Number of {kit.unit.plural}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton aria-label={`One fewer ${kit.unit.singular}`} onClick={() => setUnitCount(units - 1)} disabled={units <= 1} sx={{ border: `1px solid ${brand.line}` }}>
              <Box component="span" aria-hidden sx={{ width: 20, lineHeight: 1 }}>−</Box>
            </IconButton>
            <TextField
              id="kit-units"
              type="number"
              size="small"
              value={units}
              onChange={(e) => setUnitCount(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 1, max: kit.maxUnits, inputMode: "numeric", style: { textAlign: "center", width: 56 } } }}
            />
            <IconButton aria-label={`One more ${kit.unit.singular}`} onClick={() => setUnitCount(units + 1)} disabled={units >= kit.maxUnits} sx={{ border: `1px solid ${brand.line}` }}>
              <Box component="span" aria-hidden sx={{ width: 20, lineHeight: 1 }}>+</Box>
            </IconButton>
          </Box>
        </Box>

        <Typography component="h2" sx={{ ...signType.plate, fontSize: 20, mb: 1 }}>
          Boards and accessories
        </Typography>
        <Box role="list" sx={{ borderBottom: `1px solid ${brand.line}` }}>
          {productLines.map(({ line, product, quantity, included, total }) => (
            <Box role="listitem" key={line.productId} sx={{ ...row, opacity: included ? 1 : 0.55 }}>
              <Checkbox
                checked={included}
                disabled={!line.optional}
                onChange={() => toggle(`p:${line.productId}`)}
                slotProps={{ input: { "aria-label": `Include ${product.shortName}` } }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Box component={Link} href={`/products/${product.slug}`} sx={{ fontWeight: 600 }}>{product.shortName}</Box>
                <Typography sx={{ fontSize: 13, color: brand.muted }}>
                  {line.role} · {line.per === "unit" ? `${line.quantity} per ${kit.unit.singular}` : "one per kit"}
                  {line.optional ? " · optional" : ""}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 14, fontVariantNumeric: "tabular-nums", textAlign: { xs: "right", sm: "left" } }}>× {quantity}</Typography>
              <Typography sx={{ fontSize: 14, fontVariantNumeric: "tabular-nums", textAlign: "right", gridColumn: { xs: "2 / 4", sm: "auto" } }}>
                {formatPrice(total)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography component="h2" sx={{ ...signType.plate, fontSize: 20, mt: 4, mb: 0.5 }}>
          Signs and printed boards, made to order
        </Typography>
        <Typography sx={{ fontSize: 14, color: brand.body, mb: 1 }}>
          These carry your names, numbers and layouts, so they&apos;re quoted. Open any of them to design it with the kit&apos;s quantity filled in.
        </Typography>
        <Box role="list" sx={{ borderBottom: `1px solid ${brand.line}` }}>
          {signLines.map(({ line, type, quantity, included }) => (
            <Box role="listitem" key={line.typeId} sx={{ ...row, opacity: included ? 1 : 0.55 }}>
              <Checkbox
                checked={included}
                disabled={!line.optional}
                onChange={() => toggle(`s:${line.typeId}`)}
                slotProps={{ input: { "aria-label": `Include ${type.name}` } }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600 }}>{type.name}</Typography>
                <Typography sx={{ fontSize: 13, color: brand.muted }}>
                  {line.role} · {line.per === "unit" ? `${line.quantity} per ${kit.unit.singular}` : `${line.quantity} per kit`}
                  {line.optional ? " · optional" : ""}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 14, fontVariantNumeric: "tabular-nums", textAlign: { xs: "right", sm: "left" } }}>× {quantity}</Typography>
              <Box sx={{ textAlign: "right", gridColumn: { xs: "2 / 4", sm: "auto" } }}>
                <Box component={Link} href={signStudioHref(line, units)} sx={{ fontSize: 14, fontWeight: 600 }}>Design sign</Box>
              </Box>
            </Box>
          ))}
          {plannerLines.map(({ line, template, quantity, included }) => (
            <Box role="listitem" key={line.templateId} sx={{ ...row, opacity: included ? 1 : 0.55 }}>
              <Checkbox
                checked={included}
                disabled={!line.optional}
                onChange={() => toggle(`b:${line.templateId}`)}
                slotProps={{ input: { "aria-label": `Include ${template.name}` } }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600 }}>{template.name}</Typography>
                <Typography sx={{ fontSize: 13, color: brand.muted }}>
                  {line.role} · {line.per === "unit" ? `${line.quantity} per ${kit.unit.singular}` : `${line.quantity} per kit`}
                  {line.optional ? " · optional" : ""}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 14, fontVariantNumeric: "tabular-nums", textAlign: { xs: "right", sm: "left" } }}>× {quantity}</Typography>
              <Box sx={{ textAlign: "right", gridColumn: { xs: "2 / 4", sm: "auto" } }}>
                <Box component={Link} href={plannerHref(line, units)} sx={{ fontSize: 14, fontWeight: 600 }}>Design board</Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        component="aside"
        aria-label="Kit summary"
        sx={{ position: { lg: "sticky" }, top: { lg: 96 }, bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: 3, display: "grid", gap: 2 }}
      >
        <Typography sx={{ ...signType.plate, fontSize: 20 }}>
          {kit.name} · {units} {unitLabel}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Typography sx={{ color: brand.body }}>Boards and accessories</Typography>
          <Typography sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatPrice(boardsTotal)}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Typography sx={{ color: brand.body }}>Made to order</Typography>
          <Typography sx={{ color: brand.muted }}>{madeToOrderCount > 0 ? `${madeToOrderCount} ${madeToOrderCount === 1 ? "item" : "items"}, quoted` : "None"}</Typography>
        </Box>
        <Typography sx={{ fontSize: 13, color: brand.muted }}>Catalogue prices. Freight and installation are confirmed with your order.</Typography>

        {isProject ? (
          <Alert severity="info">
            {units} {unitLabel} is a project order. Request a quote for project pricing and a single delivery and installation schedule.
          </Alert>
        ) : null}

        <Button variant="contained" size="large" component={Link} href={quoteHref}>
          Request a quote for the whole kit
        </Button>
        {tooBigForCart ? (
          <Typography sx={{ fontSize: 13, color: brand.muted }}>
            This kit is larger than online checkout allows ({CART_LINE_MAX} of any item), so it goes through a quote.
          </Typography>
        ) : (
          <Button variant="outlined" size="large" onClick={addToCart} disabled={chosenProducts.length === 0}>
            Add boards to cart · {formatPrice(boardsTotal)}
          </Button>
        )}
        {added ? (
          <Alert severity="success" role="status">
            Boards added. <Link href="/cart">View cart</Link>. Design the signs and printed boards separately and request a quote for them.
          </Alert>
        ) : null}
      </Box>
    </Box>
  );
}

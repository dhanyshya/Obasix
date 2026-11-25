import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { DistributorApplyForm } from "@/components/distributors/DistributorApplyForm";
import { TradeOrderForm, type TradeProduct } from "@/components/distributors/TradeOrderForm";
import { signType } from "@/components/home/directory/sign";
import { getAllProducts, getProductCategoryLabel } from "@/data/catalogue";
import { readSession } from "@/lib/auth/session";
import { readFromFastApi } from "@/lib/fastApiServer";
import { financialQuarter, minimumTradeOrder, tierById } from "@/lib/distributors/program";
import { creditUsed, findDistributor, listTradeOrders, quarterPurchases, tradePrice, type TradeOrderStatus } from "@/lib/distributors/store";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata: Metadata = { title: "Distributor" };

const statusColour: Record<TradeOrderStatus, string> = {
  "Awaiting payment": brand.signalInk,
  Confirmed: brand.forest,
  Dispatched: brand.forest,
  Delivered: brand.muted,
  Cancelled: brand.muted,
};

type Account = {
  distributor: NonNullable<Awaited<ReturnType<typeof findDistributor>>>;
  orders: Awaited<ReturnType<typeof listTradeOrders>>;
  creditUsed: number;
  quarter: string;
  quarterPurchases: number;
};

// Through FastAPI once the distributors area is switched on; otherwise straight from the database.
async function readAccount(userId: string): Promise<Account | null> {
  const remote = await readFromFastApi<Account>("/api/distributors/me");
  if (remote !== undefined) return remote;
  const distributor = await findDistributor(userId);
  if (!distributor) return null;
  return {
    distributor,
    orders: await listTradeOrders(userId),
    creditUsed: await creditUsed(userId),
    quarter: financialQuarter(new Date()).label,
    quarterPurchases: await quarterPurchases(userId),
  };
}

const heading = { fontSize: { xs: 34, md: 46 } } as const;

export default async function AccountDistributorPage() {
  const session = await readSession();
  if (!session) return null; // The account layout redirects signed-out visitors.
  const account = await readAccount(session.user.id);
  const distributor = account?.distributor;

  if (!distributor || distributor.status === "rejected") {
    return (
      <Box>
        <Typography component="h1" variant="h2" sx={heading}>
          Become a distributor
        </Typography>
        <Typography sx={{ color: brand.body, mt: 1.5, mb: 3, maxWidth: 640, lineHeight: 1.65 }}>
          Buy OBASIX boards at trade price and supply schools, offices and institutions in your area. Our team reviews every
          application. <Link href="/distributors">How distribution works</Link>.
        </Typography>
        {distributor?.status === "rejected" ? (
          <Alert severity="info" sx={{ mb: 3, maxWidth: 640 }}>
            Your earlier application wasn&apos;t approved{distributor.decisionNote ? `: ${distributor.decisionNote}` : "."} You can apply again with updated details.
          </Alert>
        ) : null}
        <DistributorApplyForm />
      </Box>
    );
  }

  if (distributor.status === "pending" || distributor.status === "suspended") {
    return (
      <Box sx={{ maxWidth: 680 }}>
        <Typography component="h1" variant="h2" sx={heading}>
          {distributor.status === "pending" ? "Application received" : "Trade account on hold"}
        </Typography>
        <Typography sx={{ color: brand.body, mt: 1.5, lineHeight: 1.65 }}>
          {distributor.status === "pending"
            ? `Thank you, ${distributor.businessName}. Our channel team will review your application for ${distributor.territoryRequest} and contact you, usually within a few working days.`
            : `Trade ordering for ${distributor.businessName} is paused. ${distributor.decisionNote} Contact the OBASIX channel team to resolve this.`}
        </Typography>
        <Typography sx={{ color: brand.muted, mt: 2, fontSize: 14 }}>
          Submitted {distributor.createdAt.slice(0, 10)} · GSTIN {distributor.gstin}
        </Typography>
      </Box>
    );
  }

  const tier = tierById(distributor.tier);
  const { orders, creditUsed: used, quarterPurchases: purchases } = account!;
  const available = Math.max(distributor.creditLimit - used, 0);
  const quarter = { label: account!.quarter };
  const progress = distributor.quarterlyTarget > 0 ? Math.min(purchases / distributor.quarterlyTarget, 1) : 0;

  const products: TradeProduct[] = getAllProducts()
    .filter((p) => p.price > 0)
    .map((p) => ({
      id: p.id,
      name: p.shortName,
      sku: p.sku,
      group: getProductCategoryLabel(p),
      listPrice: p.price,
      tradePrice: tradePrice(p.price, tier.discount),
    }));

  const stats = [
    { label: "Tier", value: `${tier.name} · ${Math.round(tier.discount * 100)}% off list` },
    { label: "Credit available", value: `${formatPrice(available)} of ${formatPrice(distributor.creditLimit)}` },
    { label: `Purchases ${quarter.label}`, value: formatPrice(purchases) },
    { label: "Territory", value: distributor.territory },
  ];

  return (
    <Box sx={{ display: "grid", gap: { xs: 4, md: 5 } }}>
      <Box>
        <Typography component="h1" variant="h2" sx={heading}>
          Trade account
        </Typography>
        <Typography sx={{ color: brand.body, mt: 1 }}>
          {distributor.businessName} · GSTIN {distributor.gstin}
        </Typography>
      </Box>

      <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
        {stats.map((stat) => (
          <Box key={stat.label} sx={{ bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: 2, minWidth: 0 }}>
            <Typography component="dt" sx={{ fontSize: 13, color: brand.muted }}>
              {stat.label}
            </Typography>
            <Typography component="dd" sx={{ m: 0, mt: 0.5, ...signType.plate, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {distributor.quarterlyTarget > 0 ? (
        <Box component="section" aria-labelledby="target">
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, alignItems: "baseline" }}>
            <Typography id="target" component="h2" sx={{ ...signType.plate, fontSize: 18 }}>
              {quarter.label} target
            </Typography>
            <Typography sx={{ fontSize: 14, color: brand.body, fontVariantNumeric: "tabular-nums" }}>
              {formatPrice(purchases)} of {formatPrice(distributor.quarterlyTarget)} · {Math.round(progress * 100)}%
            </Typography>
          </Box>
          <Box
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label={`${quarter.label} purchase target`}
            sx={{ mt: 1, height: 8, borderRadius: 999, bgcolor: brand.line, overflow: "hidden" }}
          >
            <Box sx={{ width: `${progress * 100}%`, height: "100%", bgcolor: brand.forest }} />
          </Box>
          <Typography sx={{ color: brand.muted, fontSize: 13, mt: 1 }}>
            Territory review on {distributor.reviewDate}. Territories are reviewed quarterly against target and aren&apos;t exclusive.
          </Typography>
        </Box>
      ) : null}

      <Box component="section" aria-labelledby="order">
        <Typography id="order" component="h2" sx={{ ...signType.plate, fontSize: 22, mb: 1.5 }}>
          New trade order
        </Typography>
        <TradeOrderForm products={products} creditAvailable={available} minimumOrder={minimumTradeOrder} />
      </Box>

      <Box component="section" aria-labelledby="history">
        <Typography id="history" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>
          Trade orders
        </Typography>
        {orders.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 1 }}>No trade orders yet.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto", mt: 1.5, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, bgcolor: brand.white }}>
            <Box
              component="table"
              sx={{
                width: "100%",
                minWidth: 640,
                borderCollapse: "collapse",
                fontSize: 14,
                "& th, & td": { textAlign: "left", px: 2, py: 1.25, borderBottom: `1px solid ${brand.line}` },
                "& tbody tr:last-of-type td": { borderBottom: 0 },
                "& th": { color: brand.muted, fontWeight: 500 },
                "& .num": { textAlign: "right", fontVariantNumeric: "tabular-nums" },
              }}
            >
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Items</th>
                  <th scope="col" className="num">Trade total</th>
                  <th scope="col">Terms</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Box>{order.id}</Box>
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>
                        {order.createdAt.slice(0, 10)}
                        {order.reference ? ` · PO ${order.reference}` : ""}
                      </Box>
                    </td>
                    <td>{order.items.reduce((s, i) => s + i.quantity, 0)} units · {order.items.length} {order.items.length === 1 ? "product" : "products"}</td>
                    <td className="num">{formatPrice(order.netTotal)}</td>
                    <td>
                      {order.paymentTerms === "credit" ? "Credit" : "Advance"}
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>{order.paidAt ? "Paid" : order.status === "Cancelled" ? "—" : "Unpaid"}</Box>
                    </td>
                    <td>
                      <Box component="span" sx={{ fontWeight: 600, color: statusColour[order.status] }}>
                        {order.status}
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

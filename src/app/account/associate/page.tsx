import type { Metadata } from "next";
import { headers } from "next/headers";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { AssociateApplyForm } from "@/components/associates/AssociateApplyForm";
import { ShareLinks } from "@/components/associates/ShareLinks";
import { signType } from "@/components/home/directory/sign";
import { readSession } from "@/lib/auth/session";
import { associateCommissionRate, referralWindowDays } from "@/lib/associates/program";
import { findAssociateByUser, listAttributedQuotes, listCommissions, type CommissionState } from "@/lib/associates/store";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata: Metadata = { title: "Associate" };

const stateColour: Record<CommissionState, string> = {
  "Awaiting delivery": brand.signalInk,
  Payable: brand.forest,
  Paid: brand.muted,
  Void: brand.muted,
};

export default async function AccountAssociatePage() {
  const session = await readSession();
  if (!session) return null; // The account layout redirects signed-out visitors.
  const associate = findAssociateByUser(session.user.id);

  if (!associate) {
    return (
      <Box>
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>
          Become an associate
        </Typography>
        <Typography sx={{ color: brand.body, mt: 1.5, mb: 3, maxWidth: 620, lineHeight: 1.65 }}>
          Refer clients to OBASIX, or prepare their quotes yourself, and earn {associateCommissionRate * 100}% on every
          delivered order. No stock to hold. <Link href="/associates">How the programme works</Link>.
        </Typography>
        <AssociateApplyForm />
      </Box>
    );
  }

  const host = (await headers()).get("host") ?? "localhost:3000";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const commissions = listCommissions(associate.code);
  const quotes = listAttributedQuotes(associate.code);
  const sum = (state: CommissionState) =>
    commissions.filter((c) => c.state === state).reduce((total, c) => total + c.amount, 0);
  const referredSales = commissions.filter((c) => c.state !== "Void").reduce((total, c) => total + c.baseAmount, 0);

  const stats = [
    { label: "Referred sales", value: formatPrice(referredSales) },
    { label: "Awaiting delivery", value: formatPrice(sum("Awaiting delivery")) },
    { label: "Payable", value: formatPrice(sum("Payable")) },
    { label: "Quotes prepared or referred", value: String(quotes.length) },
  ];

  return (
    <Box sx={{ display: "grid", gap: { xs: 4, md: 5 } }}>
      <Box>
        <Typography component="h1" variant="h2" sx={{ fontSize: { xs: 34, md: 46 } }}>
          Associate dashboard
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: { xs: 1, md: 2 }, mt: 1.5 }}>
          <Typography sx={{ color: brand.body }}>Your referral code</Typography>
          <Typography sx={{ ...signType.code, fontSize: { xs: 26, md: 30 }, fontWeight: 600, letterSpacing: "0.08em", color: brand.charcoal }}>
            {associate.code}
          </Typography>
          <Typography sx={{ color: brand.muted, fontSize: 14 }}>
            {associate.profession} · {associate.city}
          </Typography>
        </Box>
      </Box>

      <Box
        component="dl"
        sx={{ m: 0, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}
      >
        {stats.map((stat) => (
          <Box key={stat.label} sx={{ bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: 2 }}>
            <Typography component="dt" sx={{ fontSize: 13, color: brand.muted }}>
              {stat.label}
            </Typography>
            <Typography component="dd" sx={{ m: 0, mt: 0.5, ...signType.plate, fontSize: { xs: 20, md: 24 }, fontVariantNumeric: "tabular-nums" }}>
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box component="section" aria-labelledby="share">
        <Typography id="share" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>
          Share a link
        </Typography>
        <Typography sx={{ color: brand.body, mt: 0.75, mb: 2, fontSize: 15, maxWidth: 640 }}>
          Anyone who opens one of these links is credited to you for {referralWindowDays} days. To prepare a quote for a
          client yourself, open the <Link href="/signage/design">sign studio</Link> or{" "}
          <Link href="/customize">board customizer</Link> while signed in, then enter the client&apos;s details on the quote form.
        </Typography>
        <ShareLinks code={associate.code} origin={origin} />
      </Box>

      <Box component="section" aria-labelledby="ledger">
        <Typography id="ledger" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>
          Commissions
        </Typography>
        {commissions.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 1 }}>
            No referred orders yet. Commission appears here as soon as a referred client places an order.
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto", mt: 1.5, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, bgcolor: brand.white }}>
            <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 560, "& th, & td": { textAlign: "left", px: 2, py: 1.25, borderBottom: `1px solid ${brand.line}` }, "& tr:last-of-type td": { borderBottom: 0 }, "& th": { color: brand.muted, fontWeight: 500 }, "& .num": { textAlign: "right", fontVariantNumeric: "tabular-nums" } }}>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Date</th>
                  <th scope="col" className="num">Order value</th>
                  <th scope="col" className="num">Commission</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.orderId}</td>
                    <td>{entry.createdAt.slice(0, 10)}</td>
                    <td className="num">{formatPrice(entry.baseAmount)}</td>
                    <td className="num">{formatPrice(entry.amount)}</td>
                    <td>
                      <Box component="span" sx={{ color: stateColour[entry.state], fontWeight: 600 }}>
                        {entry.state}
                      </Box>
                      {entry.state === "Awaiting delivery" ? (
                        <Box component="span" sx={{ color: brand.muted }}> · {entry.orderStatus}</Box>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
      </Box>

      <Box component="section" aria-labelledby="quotes">
        <Typography id="quotes" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>
          Client quotes
        </Typography>
        {quotes.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 1 }}>No quotes yet.</Typography>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mt: 1.5, display: "grid", gap: 1 }}>
            {quotes.map((quote) => (
              <Box component="li" key={quote.reference} sx={{ bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: "12px", p: 2 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                  {quote.customer || "Client"} · <Box component="span" sx={{ color: brand.muted, fontWeight: 400 }}>{quote.reference}</Box>
                </Typography>
                <Typography sx={{ fontSize: 14, color: brand.body, mt: 0.25 }}>{quote.summary}</Typography>
                <Typography sx={{ fontSize: 13, color: brand.muted, mt: 0.25 }}>{quote.createdAt.slice(0, 10)}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CreateCompanyForm, MembersSection, RecentOrders, ReorderLists, type PanelOrder } from "@/components/company/CompanyPanel";
import { getProductById } from "@/data/catalogue";
import { readSession } from "@/lib/auth/session";
import { listDemoOrdersForUser } from "@/lib/commerce/order-store";
import { findMembership, listMembers, listReorderLists } from "@/lib/company/store";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata: Metadata = { title: "Company" };

const heading = { fontSize: { xs: 34, md: 46 } } as const;

export default async function AccountCompanyPage() {
  const session = await readSession();
  if (!session) return null; // The account layout redirects signed-out visitors.
  const me = session.user.email.toLowerCase();
  const membership = findMembership(me);

  // Past orders, priced at today's catalogue; retired products drop out.
  const orders: PanelOrder[] = listDemoOrdersForUser(session.user.id)
    .slice(0, 10)
    .map((order) => {
      const lines = order.items.flatMap((item) => {
        const product = getProductById(item.productId);
        return product
          ? [{ productId: product.id, quantity: Math.min(item.quantity, 99), configuration: item.configuration, name: product.shortName, unitPrice: product.price }]
          : [];
      });
      return { id: order.id, createdAt: order.createdAt ?? "", status: order.status, total: order.subtotal, lines };
    })
    .filter((order) => order.lines.length > 0);

  if (!membership) {
    return (
      <Box sx={{ display: "grid", gap: 4 }}>
        <Box>
          <Typography component="h1" variant="h2" sx={heading}>
            Company account
          </Typography>
          <Typography sx={{ color: brand.body, mt: 1.5, maxWidth: 680, lineHeight: 1.65 }}>
            Buying for an office, school or chain of branches? Set up a company account to save standard reorder lists and share them with
            colleagues, so the next branch or the next term is ordered in one click.
          </Typography>
        </Box>
        <CreateCompanyForm />
        <RecentOrders orders={orders} canSave={false} />
      </Box>
    );
  }

  const { company, role } = membership;
  const isOwner = role === "owner";
  const members = listMembers(company.id).map((m) => ({ email: m.email, role: m.role }));
  const lists = listReorderLists(company.id);

  return (
    <Box sx={{ display: "grid", gap: { xs: 3, md: 4 } }}>
      <Box>
        <Typography component="h1" variant="h2" sx={heading}>
          {company.name}
        </Typography>
        <Typography sx={{ color: brand.body, mt: 1 }}>
          {[company.gstin && `GSTIN ${company.gstin}`, company.billingAddress, `You're ${isOwner ? "an owner" : "a buyer"}`].filter(Boolean).join(" · ")}
        </Typography>
      </Box>
      <ReorderLists lists={lists} isOwner={isOwner} />
      <RecentOrders orders={orders} canSave />
      <MembersSection members={members} me={me} isOwner={isOwner} />
    </Box>
  );
}

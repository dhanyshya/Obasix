import type { Metadata } from "next";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { signType } from "@/components/home/directory/sign";
import { PartnerApplyForm, ProjectRegisterForm } from "@/components/partners/PartnerForms";
import { readSession } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import type { ProjectStatus } from "@/lib/partners/program";
import { findPartner, listPartnerProjects, type Project } from "@/lib/partners/store";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata: Metadata = { title: "Partner" };

const heading = { fontSize: { xs: 34, md: 46 } } as const;

const statusColour: Record<ProjectStatus, string> = {
  Submitted: brand.signalInk,
  Quoted: brand.signalInk,
  Won: brand.forest,
  "In production": brand.forest,
  Delivered: brand.forest,
  Paid: brand.muted,
  Lost: brand.muted,
};

/** What the partner sees about their margin at each stage. */
function earningText(p: Project) {
  if (p.status === "Submitted") return p.conflictWith ? "Under review" : "Awaiting quote";
  if (p.status === "Lost") return "—";
  const amount = `${formatPrice(p.earning)} · ${+(p.marginRate * 100).toFixed(1)}%`;
  if (p.status === "Paid") return `${amount} · paid`;
  if (p.status === "Delivered") return `${amount} · payable`;
  return amount;
}

export default async function AccountPartnerPage() {
  const session = await readSession();
  if (!session) return null; // The account layout redirects signed-out visitors.
  const partner = findPartner(session.user.id);

  if (!partner || partner.status === "rejected") {
    return (
      <Box>
        <Typography component="h1" variant="h2" sx={heading}>Become a project partner</Typography>
        <Typography sx={{ color: brand.body, mt: 1.5, mb: 3, maxWidth: 640, lineHeight: 1.65 }}>
          For contractors, facility managers, developers and procurement consultants who deliver boards and signage across whole
          schools, hospitals, hotels and offices. <Link href="/partners">How the partner channel works</Link>.
        </Typography>
        {partner?.status === "rejected" ? (
          <Alert severity="info" sx={{ mb: 3, maxWidth: 640 }}>
            Your earlier application wasn&apos;t approved{partner.decisionNote ? `: ${partner.decisionNote}` : "."} You can apply again with updated details.
          </Alert>
        ) : null}
        <PartnerApplyForm />
      </Box>
    );
  }

  if (partner.status !== "approved") {
    return (
      <Box sx={{ maxWidth: 680 }}>
        <Typography component="h1" variant="h2" sx={heading}>
          {partner.status === "pending" ? "Application received" : "Partner account on hold"}
        </Typography>
        <Typography sx={{ color: brand.body, mt: 1.5, lineHeight: 1.65 }}>
          {partner.status === "pending"
            ? `Thank you, ${partner.companyName}. Our projects team will review your application and contact you, usually within a few working days.`
            : `Project registration for ${partner.companyName} is paused. ${partner.decisionNote} Contact the OBASIX projects team to resolve this.`}
        </Typography>
      </Box>
    );
  }

  const projects = listPartnerProjects(session.user.id);
  const open = projects.filter((p) => ["Submitted", "Quoted"].includes(p.status));
  const won = projects.filter((p) => ["Won", "In production", "Delivered", "Paid"].includes(p.status));
  const stats = [
    { label: "Open projects", value: String(open.length) },
    { label: "Won value", value: formatPrice(won.reduce((s, p) => s + p.quotedValue, 0)) },
    { label: "Margin payable", value: formatPrice(projects.filter((p) => p.status === "Delivered").reduce((s, p) => s + p.earning, 0)) },
    { label: "Margin paid", value: formatPrice(projects.filter((p) => p.status === "Paid").reduce((s, p) => s + p.earning, 0)) },
  ];

  return (
    <Box sx={{ display: "grid", gap: { xs: 4, md: 5 } }}>
      <Box>
        <Typography component="h1" variant="h2" sx={heading}>Projects</Typography>
        <Typography sx={{ color: brand.body, mt: 1 }}>
          {partner.companyName} · {partner.partnerType} · GSTIN {partner.gstin}
        </Typography>
      </Box>

      <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
        {stats.map((stat) => (
          <Box key={stat.label} sx={{ bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: 2, minWidth: 0 }}>
            <Typography component="dt" sx={{ fontSize: 13, color: brand.muted }}>{stat.label}</Typography>
            <Typography component="dd" sx={{ m: 0, mt: 0.5, ...signType.plate, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{stat.value}</Typography>
          </Box>
        ))}
      </Box>

      <Box component="section" aria-labelledby="register" sx={{ bgcolor: brand.white, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, p: { xs: 2, md: 3 } }}>
        <Typography id="register" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>Register a project</Typography>
        <Typography sx={{ color: brand.body, fontSize: 14, mt: 0.5, mb: 2 }}>
          Register before you quote the client. The first partner to register a client and city is protected for that project.
        </Typography>
        <ProjectRegisterForm />
      </Box>

      <Box component="section" aria-labelledby="pipeline">
        <Typography id="pipeline" component="h2" sx={{ ...signType.plate, fontSize: 22 }}>Your projects</Typography>
        {projects.length === 0 ? (
          <Typography sx={{ color: brand.muted, mt: 1 }}>No projects registered yet.</Typography>
        ) : (
          <Box sx={{ overflowX: "auto", mt: 1.5, border: `1px solid ${brand.line}`, borderRadius: `${brand.radius}px`, bgcolor: brand.white }}>
            <Box
              component="table"
              sx={{
                width: "100%",
                minWidth: 720,
                borderCollapse: "collapse",
                fontSize: 14,
                "& th, & td": { textAlign: "left", px: 2, py: 1.25, borderBottom: `1px solid ${brand.line}`, verticalAlign: "top" },
                "& tbody tr:last-of-type td": { borderBottom: 0 },
                "& th": { color: brand.muted, fontWeight: 500 },
                "& .num": { textAlign: "right", fontVariantNumeric: "tabular-nums" },
              }}
            >
              <thead>
                <tr>
                  <th scope="col">Project</th>
                  <th scope="col">Sector</th>
                  <th scope="col" className="num">Value</th>
                  <th scope="col">Status</th>
                  <th scope="col">Your margin</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Box sx={{ fontWeight: 600 }}>{p.clientName}</Box>
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>
                        {p.id} · {p.city} · protected to {p.protectedUntil.slice(0, 10)}
                      </Box>
                      {p.staffNote ? <Box sx={{ color: brand.body, fontSize: 13, mt: 0.5 }}>OBASIX: {p.staffNote}</Box> : null}
                    </td>
                    <td>{p.sector}</td>
                    <td className="num">
                      {formatPrice(p.quotedValue || p.expectedValue)}
                      <Box sx={{ color: brand.muted, fontSize: 13 }}>{p.quotedValue ? "quoted" : "expected"}</Box>
                    </td>
                    <td>
                      <Box component="span" sx={{ fontWeight: 600, color: statusColour[p.status] }}>{p.status}</Box>
                    </td>
                    <td>{earningText(p)}</td>
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

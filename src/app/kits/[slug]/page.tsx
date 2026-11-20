import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { pageMax, pagePad } from "@/components/home/directory/sign";
import { KitBuilder } from "@/components/kits/KitBuilder";
import { getKit, kits } from "@/data/kits";
import { brandTokens as brand } from "@/theme/brandTokens";

export const dynamicParams = false;

export function generateStaticParams() {
  return kits.map((kit) => ({ slug: kit.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kit = getKit(slug);
  return kit ? { title: kit.name, description: kit.summary } : {};
}

export default async function KitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kit = getKit(slug);
  if (!kit) notFound();
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.ivory }}>
      <PageMasthead
        code={kit.audience}
        title={kit.headline}
        lede={kit.summary}
        crumbs={[{ href: "/", label: "Home" }, { href: "/kits", label: "Solution Kits" }, { label: kit.name }]}
      />
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 4, md: 6 } }}>
        <KitBuilder kitId={kit.id} />
      </Box>
    </Box>
  );
}

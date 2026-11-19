import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { pageMax, pagePad } from "@/components/home/directory/sign";
import { MaterialBuilder } from "@/components/materials/MaterialBuilder";
import { getMaterialRange, materialRanges } from "@/data/materials";
import { brandTokens as brand } from "@/theme/brandTokens";

export const dynamicParams = false;
export const generateStaticParams = () => materialRanges.map((range) => ({ slug: range.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const range = getMaterialRange((await params).slug);
  return range ? { title: range.name, description: range.summary } : {};
}

export default async function MaterialRangePage({ params }: { params: Promise<{ slug: string }> }) {
  const range = getMaterialRange((await params).slug);
  if (!range) notFound();
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="Made to order"
        title={range.name}
        lede={range.summary}
        crumbs={[{ href: "/", label: "Home" }, { href: "/materials", label: "Glass, Cork, Felt & Fabric" }, { label: range.name }]}
      />
      <Box sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
        <MaterialBuilder range={range} />
      </Box>
      <Box component="section" aria-label="Details" sx={{ ...pageMax, ...pagePad, pb: { xs: 6, md: 9 }, display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
        {[
          { title: "How it's made", items: range.build },
          { title: "Good for", items: range.goodFor },
          { title: "Care", items: [range.care] },
        ].map((block) => (
          <Box key={block.title}>
            <Typography component="h2" sx={{ fontWeight: 700, fontSize: 20, mb: 1 }}>{block.title}</Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 0.75, color: brand.body, lineHeight: 1.6 }}>
              {block.items.map((item) => <li key={item}>{item}</li>)}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

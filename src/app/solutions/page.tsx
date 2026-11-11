import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignArrow, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { getSolutionProducts, getVisibleSolutions } from "@/data/solutions";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata = { title: "Solutions" };

export default function SolutionsPage() {
  const solutions = getVisibleSolutions();

  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="Spaces"
        title="What do you need for this space?"
        lede="Choose a space. See the OBASIX boards and accessories listed for it."
        crumbs={[{ href: "/", label: "Home" }, { label: "Spaces" }]}
      />

      <Box component="section" aria-label="Spaces" sx={{ ...pageMax, ...pagePad, py: { xs: 4, md: 8 } }}>
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
          {solutions.map((solution, i) => {
            const count = getSolutionProducts(solution.id).length;
            const lead = i === 0;
            return (
              <Box component="li" key={solution.id} sx={{ gridColumn: { lg: lead ? "span 2" : "auto" } }}>
                <Box
                  component={Link}
                  href={`/solutions/${solution.id}`}
                  sx={{
                    position: "relative",
                    display: "block",
                    height: { xs: 300, md: 380 },
                    borderRadius: "28px",
                    overflow: "hidden",
                    color: brand.white,
                    bgcolor: brand.ivory,
                    "&:hover img": { transform: "scale(1.04)" },
                    "&:hover .cta": { gap: 1.25 },
                    "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 3 },
                  }}
                >
                  <Image src={solution.image} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{ objectFit: "cover", transition: "transform 900ms cubic-bezier(0.16,1,0.3,1)" }} />
                  <Box aria-hidden sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,14,12,0.72) 0%, rgba(10,14,12,0.05) 60%)" }} />
                  <Box sx={{ position: "absolute", top: 20, left: 20, px: 1.5, py: 0.5, borderRadius: 99, bgcolor: "rgba(255,255,255,0.88)", backdropFilter: "blur(10px)", color: brand.charcoal, fontSize: 13, fontWeight: 500 }}>
                    {count} {count === 1 ? "product" : "products"}
                  </Box>
                  <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, p: { xs: 3, md: 3.5 } }}>
                    <Typography component="h2" sx={{ ...signType.plate, fontSize: { xs: 26, md: lead ? 36 : 28 }, letterSpacing: "-0.03em", color: brand.white }}>
                      {solution.name}
                    </Typography>
                    <Typography sx={{ mt: 0.75, color: "rgba(255,255,255,0.85)", fontSize: 15, maxWidth: 460, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {solution.summary}
                    </Typography>
                    <Box className="cta" sx={{ color: "#FFFFFF", mt: 1.75, display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 15, fontWeight: 500, transition: "gap 240ms cubic-bezier(0.16,1,0.3,1)" }}>
                      Explore <SignArrow size={16} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

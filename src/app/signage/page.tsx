import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { SignArrow, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { SignPreview } from "@/components/signage/SignPreview";
import { defaultDesign, getSignMaterial, signFamilies, signMaterials, signTypesByFamily, type SignMaterialId, type SignType } from "@/data/signage";

/** Show the range: each card in a material that suits it. */
const showcase: Record<string, SignMaterialId> = {
  "villa-nameplate": "ss-gold-mirror",
  "flat-nameplate": "wood-look",
  "house-number": "brass",
  "desk-nameplate": "acrylic-gloss",
  "cabin-door-sign": "acrylic-frosted",
  "reception-sign": "ss-brushed",
  "tower-directory": "acrylic-gloss",
  "floor-directory": "ss-brushed",
  "flat-number-plate": "ss-gold-mirror",
  "wayfinding-sign": "aluminium-composite",
};

function cardDesign(type: SignType) {
  const base = defaultDesign(type);
  const materialId = showcase[type.id] ?? base.materialId;
  const material = getSignMaterial(materialId);
  return { ...base, materialId, letteringId: material.lettering[0] };
}
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata = {
  title: "Nameplates & Signage",
  description:
    "Custom nameplates, office signs, building directories and wayfinding, designed online and made to your specification by OBASIX.",
};

const projectQuote =
  "/quote?boardType=" +
  encodeURIComponent("Nameplate / Signage") +
  "&config=" +
  encodeURIComponent("Signage project: residential society, commercial building or multi-office rollout");

export default function SignagePage() {
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="Signage"
        title="Nameplates and signs, made to your specification"
        lede="Design a nameplate, door sign or building directory, check it against our manufacturing rules, and send it for a quotation. Hindi and English lettering on every sign."
        crumbs={[{ href: "/", label: "Home" }, { label: "Nameplates & Signage" }]}
      />

      {signFamilies.map((family) => (
        <Box
          key={family.id}
          component="section"
          aria-labelledby={`family-${family.id}`}
          sx={{ ...pageMax, ...pagePad, py: { xs: 4, md: 6 }, borderBottom: `1px solid ${brand.line}` }}
        >
          <Typography sx={{ ...signType.code, fontSize: 13, color: brand.signalInk, textTransform: "uppercase" }}>
            {family.code}
          </Typography>
          <Typography id={`family-${family.id}`} component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" }, mt: 0.5 }}>
            {family.name}
          </Typography>
          <Typography sx={{ color: brand.body, mt: 1, maxWidth: 620, lineHeight: 1.6 }}>{family.description}</Typography>

          <Box
            component="ul"
            sx={{
              listStyle: "none",
              m: 0,
              p: 0,
              mt: 3,
              display: "grid",
              gap: { xs: 1.5, md: 2 },
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
            }}
          >
            {signTypesByFamily(family.id).map((type) => (
              <Box component="li" key={type.id}>
                <Box
                  component={Link}
                  href={`/signage/design?type=${type.id}`}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    textDecoration: "none",
                    color: brand.charcoal,
                    border: `1px solid ${brand.line}`,
                    borderRadius: `${brand.radius}px`,
                    overflow: "hidden",
                    transition: "border-color 150ms ease",
                    "&:hover": { borderColor: brand.forest },
                    "&:hover .sign-go": { transform: "translateX(4px)" },
                    "&:focus-visible": { outline: `2px solid ${brand.signal}`, outlineOffset: 2 },
                  }}
                >
                  <Box sx={{ bgcolor: brand.ivory, aspectRatio: "4 / 3", p: { xs: 3, md: 2.5 }, display: "grid", placeItems: "center" }}>
                    <Box sx={{ width: "100%", height: "100%" }}>
                      <SignPreview type={type} design={cardDesign(type)} idPrefix={`card-${type.id}`} />
                    </Box>
                  </Box>
                  <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 0.75, flex: 1 }}>
                    <Typography component="h3" sx={{ ...signType.plate, fontSize: "1.1rem" }}>
                      {type.name}
                    </Typography>
                    <Typography sx={{ color: brand.body, fontSize: 14, lineHeight: 1.55, flex: 1 }}>{type.description}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: brand.forest, fontWeight: 600, fontSize: 14, mt: 1 }}>
                      Design this sign
                      <SignArrow size={18} sx={{ transition: "transform 150ms ease" }} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      <Box component="section" aria-labelledby="materials" sx={{ bgcolor: brand.ivory }}>
        <Box sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 } }}>
          <Typography id="materials" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>
            Materials
          </Typography>
          <Box
            component="ul"
            sx={{ listStyle: "none", m: 0, p: 0, mt: 3, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" } }}
          >
            {signMaterials.map((material) => (
              <Box component="li" key={material.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: "8px",
                    background: `linear-gradient(135deg, ${material.sheen ?? material.face}, ${material.face})`,
                    border: `1px solid ${brand.line}`,
                  }}
                />
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{material.name}</Typography>
                  <Typography sx={{ color: brand.body, fontSize: 14, lineHeight: 1.5 }}>{material.description}</Typography>
                  <Typography sx={{ color: brand.muted, fontSize: 13, mt: 0.25 }}>
                    {material.outdoor ? "Indoor and outdoor" : "Indoor only"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="section" aria-labelledby="projects" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 8 } }}>
        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" }, alignItems: "end" }}>
          <Box>
            <Typography id="projects" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" } }}>
              Signing a whole building?
            </Typography>
            <Typography sx={{ color: brand.body, mt: 1, maxWidth: 620, lineHeight: 1.6 }}>
              For housing societies, developers and companies opening new offices, we plan the full set: flat numbers,
              floor and tower directories, wayfinding and cabin signs. You approve one proof, and every unit is made to that
              standard, so the next tower or office can be reordered without redesigning anything.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: { md: "flex-end" } }}>
            <Box
              component={Link}
              href={projectQuote}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 3,
                py: 1.5,
                borderRadius: 999,
                bgcolor: brand.forest,
                color: `${brand.white} !important`,
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { bgcolor: brand.forestDark },
                "&:focus-visible": { outline: `2px solid ${brand.signal}`, outlineOffset: 2 },
              }}
            >
              Discuss a signage project
              <SignArrow size={18} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { PageMasthead } from "@/components/layout/PageMasthead";
import { pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { PremiumBrief, type BriefKind } from "@/components/premium/PremiumBrief";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata = {
  title: "Premium & Smart Displays",
  description: "Acoustic panels, illuminated signs, modular display walls and interactive displays, planned with a site survey and quoted per project.",
};

const sections: { kind: BriefKind; code: string; summary: string; points: string[]; more?: { href: string; label: string } }[] = [
  {
    code: "Illuminated",
    summary: "Backlit name plates, lit letters and lightboxes for receptions, shopfronts and building entrances.",
    points: [
      "Every illuminated sign is engineered to order: we survey the wall, power point and viewing distance first.",
      "Indoor signs run on a plug-in or wired driver; outdoor signs are built and sealed for weather.",
      "Design the face in the sign studio, then add this brief so we can plan the lighting.",
    ],
    more: { href: "/signage/design?type=reception-sign", label: "Design the sign face" },
    kind: {
      id: "illuminated",
      quoteBoardType: "Illuminated Sign",
      name: "Illuminated sign",
      fields: [
        { id: "style", label: "Style", options: ["Backlit plate", "Lit letters", "Lightbox"] },
        { id: "where", label: "Where", options: ["Indoor", "Outdoor"] },
        { id: "width", label: "Approximate width (cm)", type: "number", placeholder: "e.g. 180" },
        { id: "power", label: "Power point nearby?", options: ["Yes", "No", "Not sure"] },
      ],
    },
  },
  {
    code: "Modular",
    summary: "A rail on the wall that takes whiteboards, pin-up panels, shelves and display holders you can move and swap.",
    points: [
      "One wall system for meeting rooms, studios and classrooms: rearrange panels without new drilling.",
      "Panels use our existing writing and pin-up surfaces, so they match the rest of the room.",
      "We plan the rail length and panel mix from your wall width.",
    ],
    kind: {
      id: "modular",
      quoteBoardType: "Modular Display System",
      name: "Modular display wall",
      fields: [
        { id: "wall", label: "Wall width (m)", type: "number", placeholder: "e.g. 4.5" },
        { id: "mix", label: "Main use", options: ["Writing", "Pin-up and display", "Mixed"] },
        { id: "room", label: "Room", options: ["Meeting room", "Classroom", "Studio", "Open office", "Other"] },
        { id: "rooms", label: "Number of rooms", type: "number", placeholder: "e.g. 3" },
      ],
    },
  },
  {
    code: "Digital",
    summary: "Interactive flat panels for classrooms and boardrooms, supplied and fitted alongside your boards.",
    points: [
      "We're adding selected interactive displays to the range. Tell us what you need and we'll come back with options and prices.",
      "We fit them with the same team that installs your boards, on a wall mount or a mobile stand.",
    ],
    kind: {
      id: "interactive",
      quoteBoardType: "Interactive Display",
      name: "Interactive display",
      fields: [
        { id: "size", label: "Screen size", options: ["55 inch", "65 inch", "75 inch", "86 inch", "Not sure"] },
        { id: "use", label: "Use", options: ["Classroom", "Boardroom", "Training room", "Other"] },
        { id: "mount", label: "Mounting", options: ["Wall mount", "Mobile stand"] },
      ],
    },
  },
];

export default function PremiumPage() {
  return (
    <Box sx={{ overflowX: "hidden", bgcolor: brand.white }}>
      <PageMasthead
        code="Premium & smart"
        title="Premium and smart displays."
        lede="Acoustic panels, illuminated signs, modular display walls and interactive displays. Each one is planned with a site survey and quoted for your project."
        crumbs={[{ href: "/", label: "Home" }, { label: "Premium & Smart Displays" }]}
      />

      <Box component="section" aria-labelledby="acoustic" sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 }, borderBottom: `1px solid ${brand.line}` }}>
        <Typography sx={{ ...signType.code, fontSize: 13, color: brand.signalInk }}>Acoustic</Typography>
        <Typography id="acoustic" component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" }, mt: 0.5 }}>Acoustic panels</Typography>
        <Typography sx={{ color: brand.body, mt: 1, maxWidth: 680, lineHeight: 1.65 }}>
          Felt-faced panels that soften echo and still take pins. Choose sizes and colours, and see the layout before you ask for a price.
        </Typography>
        <Box component={Link} href="/materials/acoustic" sx={{ display: "inline-block", mt: 2, fontWeight: 600 }}>Design acoustic panels</Box>
      </Box>

      {sections.map((section) => (
        <Box key={section.kind.id} component="section" aria-labelledby={section.kind.id} sx={{ borderBottom: `1px solid ${brand.line}` }}>
          <Box sx={{ ...pageMax, ...pagePad, py: { xs: 5, md: 7 }, display: "grid", gap: { xs: 3, md: 6 }, gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr" } }}>
            <Box>
              <Typography sx={{ ...signType.code, fontSize: 13, color: brand.signalInk }}>{section.code}</Typography>
              <Typography id={section.kind.id} component="h2" sx={{ ...signType.plate, fontSize: { xs: "1.6rem", md: "2rem" }, mt: 0.5 }}>{section.kind.name}</Typography>
              <Typography sx={{ color: brand.body, mt: 1, lineHeight: 1.65 }}>{section.summary}</Typography>
              <Box component="ul" sx={{ m: 0, mt: 2, pl: 2.5, display: "grid", gap: 1, color: brand.body, lineHeight: 1.6 }}>
                {section.points.map((p) => <li key={p}>{p}</li>)}
              </Box>
              {section.more ? <Box component={Link} href={section.more.href} sx={{ display: "inline-block", mt: 2, fontWeight: 600 }}>{section.more.label}</Box> : null}
            </Box>
            <Box sx={{ bgcolor: brand.ivory, borderRadius: `${brand.radius}px`, p: { xs: 2.5, md: 3 } }}>
              <Typography component="h3" sx={{ fontWeight: 700, mb: 2 }}>Tell us about the project</Typography>
              <PremiumBrief kind={section.kind} />
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

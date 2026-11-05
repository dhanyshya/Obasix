import type { Metadata } from "next";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { buttonSx } from "@/theme/buttonStyles";
import { getProductById } from "@/data/catalogue";
import { images } from "@/data/images";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "About",
  description:
    "OBASIX creates thoughtfully engineered writing surfaces, boards and workspace solutions for offices, classrooms, homes and commercial spaces.",
  openGraph: {
    title: "About OBASIX",
    description:
      "Thoughtfully designed. Purposefully made. Writing surfaces and workspace solutions for the way people work, learn and collaborate.",
    images: ["/hero-workspace-photo.jpg"],
  },
};

const about = {
  forest: "#174D38",
  forestDark: "#0F3A29",
  ivory: "#F5F1E9",
  beige: "#E8DFD2",
  oak: "#D8C3A5",
  charcoal: "#252A26",
  white: "#FFFFFF",
  body: "#565C56",
  muted: "#777B75",
  line: "#E3DACC",
} as const;

const shell = {
  width: "100%",
  maxWidth: 1440,
  mx: "auto",
  px: { xs: 2.5, sm: 4, md: 6, lg: 8 },
} as const;

const displayFont = 'var(--font-display), Georgia, serif';
const bodyFont = 'var(--font-body), "Segoe UI", sans-serif';

const primaryButtonSx = buttonSx.primary;

const outlineButtonSx = buttonSx.secondary;

const values = [
  {
    number: "01",
    title: "Purpose in Every Detail",
    body: "Every frame, surface and accessory serves a clear purpose. We focus on functional design, practical usability and details that make a meaningful difference.",
  },
  {
    number: "02",
    title: "Quality Materials. Lasting Performance.",
    body: "From durable aluminium and natural oak to high-performance ceramic steel, we select materials for their quality, reliability and long-term performance.",
  },
  {
    number: "03",
    title: "Designed for Every Space",
    body: "From compact home offices to large corporate environments and educational institutions, our solutions are designed to complement different spaces and requirements.",
  },
];

const collection = [
  {
    number: "01",
    title: "Magnetic Whiteboards",
    body: "Versatile writing surfaces designed for planning, presentations, collaboration and everyday communication.",
    image: images.magneticWhiteboard,
    href: "/products?category=magnetic-whiteboard",
  },
  {
    number: "02",
    title: "Non-Magnetic Whiteboards",
    body: "Practical dry-erase surfaces for classrooms, offices and everyday writing requirements.",
    image: images.nonMagneticWhiteboard,
    href: "/products?category=non-magnetic-whiteboard",
  },
  {
    number: "03",
    title: "Ceramic Steel Boards",
    body: "Premium writing surfaces engineered for durability, frequent use and long-term performance.",
    image: images.magneticWhiteboardAlt,
    href: "/products/scuv90120",
  },
  {
    number: "04",
    title: "Notice & Pin-up Boards",
    body: "Functional display solutions in fabric, cork and felt for organising information and sharing important updates.",
    image: images.noticeBoard,
    href: "/products?category=notice-board",
  },
  {
    number: "05",
    title: "Combination Boards",
    body: "Multi-functional surfaces that bring different writing and display requirements together in one practical solution.",
    image: images.combinationBoard,
    href: "/products?category=combination-board",
  },
  {
    number: "06",
    title: "Stands & Accessories",
    body: "Purpose-built stands and complementary accessories designed to enhance usability, mobility and organisation.",
    image: images.whiteboardStand,
    href: "/products?category=stand",
  },
];

const featuredProduct = getProductById("smwbpcb90120");

const signatureProducts = [
  {
    product: getProductById("smwbpcb90120"),
    name: "OBASIX® Superior Series Magnetic White Board 3×4 Feet | Black Frame",
  },
  {
    product: getProductById("cmwb90120"),
    name: "OBASIX® Classic Series White Board 3×4 Feet (Magnetic)",
  },
  {
    product: getProductById("pwmwb90120"),
    name: "OBASIX® Magnetic White Board 3×4 Feet | Natural Pine Wood Frame",
  },
  {
    product: getProductById("scuv90120"),
    name: "OBASIX® 3×4 Feet Ceramic Steel White Dry Erase Board",
  },
].filter(
  (item): item is { product: Product; name: string } => Boolean(item.product),
);

const spaces = [
  {
    number: "01",
    name: "Office",
    title: "Create Clarity. Improve Collaboration.",
    body: "Professional writing and planning solutions for daily operations, project management and focused work.",
    image: images.wallModernOffice,
    href: "/solutions/office",
  },
  {
    number: "02",
    name: "Meeting Room",
    title: "Bring Ideas and Decisions Together.",
    body: "Purpose-built boards for presentations, brainstorming, discussions and collaborative decision-making.",
    image: images.wallMeetingRoom,
    href: "/solutions/meeting-room",
  },
  {
    number: "03",
    name: "Classroom",
    title: "Better Tools for Better Learning.",
    body: "Reliable, spacious writing surfaces designed to support teaching, communication and everyday classroom activities.",
    image: images.wallClassroom,
    href: "/solutions/classroom",
  },
];

const studioOptions = [
  {
    number: "01",
    title: "Custom dimensions",
    body: "From compact boards to large wall installations.",
  },
  {
    number: "02",
    title: "Frame finishes",
    body: "Choose from six available frame finishes.",
  },
  {
    number: "03",
    title: "Writing surfaces",
    body: "Select from three available surface options.",
  },
  {
    number: "04",
    title: "Personalised layouts",
    body: "Add branding, grids, calendars and custom layouts.",
  },
  {
    number: "05",
    title: "Expert guidance",
    body: "Support from initial selection through customisation and installation planning.",
  },
];

const visualiseSteps = [
  { number: "01", title: "Choose Your Room" },
  { number: "02", title: "Set Your Wall Dimensions" },
  { number: "03", title: "Position and Preview Your Board" },
];

const finishes = ["Natural Aluminium", "Solid Oak", "Ceramic Steel", "Powder Coat"];

const accessories = [
  {
    number: "01",
    product: getProductById("mobile-3x4"),
    title: "Mobile Double-Sided Magnetic Board with Stand (3×4)",
    body: "A versatile mobile writing solution for flexible workspaces and collaborative environments.",
  },
  {
    number: "02",
    product: getProductById("magnets-40mm"),
    title: "40 mm Magnetic Buttons (Pack of 10)",
    body: "Convenient magnetic buttons for organising and displaying information on compatible magnetic boards.",
  },
  {
    number: "03",
    product: getProductById("marker-holder-black"),
    title: "Marker & Duster Holder – Black Aluminium",
    body: "A practical storage solution that keeps writing essentials organised and accessible.",
  },
].filter(
  (item): item is { number: string; product: Product; title: string; body: string } =>
    Boolean(item.product),
);

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  const color = light ? about.oak : about.forest;

  return (
    <Typography
      component="p"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.1,
        color,
        fontFamily: bodyFont,
        fontSize: { xs: 10, md: 10.5 },
        fontWeight: 700,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
      }}
    >
      <Box component="span" sx={{ width: { xs: 22, md: 34 }, height: "1px", bgcolor: "currentColor", opacity: 0.6 }} />
      {children}
    </Typography>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
  action,
  light = false,
  titleMaxWidth = "14ch",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: { href: string; label: string };
  light?: boolean;
  titleMaxWidth?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { md: "flex-end" },
        justifyContent: "space-between",
        gap: { xs: 3, md: 6 },
        mb: { xs: 5, md: 7 },
      }}
    >
      <Reveal>
        <Box sx={{ maxWidth: 760 }}>
          <Eyebrow light={light}>{eyebrow}</Eyebrow>
          <Typography
            component="h2"
            sx={{
              mt: { xs: 2.5, md: 3 },
              maxWidth: titleMaxWidth,
              fontFamily: displayFont,
              fontSize: { xs: "2.8rem", sm: "3.5rem", md: "4.35rem" },
              fontWeight: 500,
              lineHeight: 0.98,
              letterSpacing: "-0.03em",
              color: light ? about.ivory : about.charcoal,
            }}
          >
            {title}
          </Typography>
          {body ? (
            <Typography
              sx={{
                mt: { xs: 2.5, md: 3 },
                maxWidth: 560,
                fontSize: { xs: 15, md: 15.5 },
                lineHeight: 1.8,
                color: light ? "rgba(245,241,233,0.66)" : about.body,
              }}
            >
              {body}
            </Typography>
          ) : null}
        </Box>
      </Reveal>
      {action ? (
        <Reveal delay={100}>
          <Box
            component={Link}
            href={action.href}
            className="premium-link"
            sx={{
              color: light ? about.ivory : about.forest,
              minHeight: 44,
              alignSelf: { xs: "flex-start", md: "auto" },
              mb: { md: 1 },
              "&:hover": { color: light ? about.oak : about.forestDark },
            }}
          >
            {action.label}
            <ArrowForwardIcon sx={{ fontSize: 15 }} aria-hidden />
          </Box>
        </Reveal>
      ) : null}
    </Box>
  );
}

function CollectionCard({
  item,
  index,
}: {
  item: (typeof collection)[number];
  index: number;
}) {
  return (
    <Reveal delay={index * 70} sx={{ display: "flex" }}>
      <Box
        component={Link}
        href={item.href}
        className="group"
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          border: `1px solid ${about.line}`,
          bgcolor: about.white,
          transition: "border-color 0.22s ease",
          "&:hover": { borderColor: about.forest },
          "&:focus-visible": { outline: `2px solid ${about.forest}`, outlineOffset: 2 },
        }}
      >
        <Box sx={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", bgcolor: about.ivory }}>
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="image-zoom"
            style={{ objectFit: "contain", padding: "clamp(22px, 4vw, 44px)" }}
          />
          <Box sx={{ position: "absolute", left: 16, top: 16, fontFamily: displayFont, fontSize: 18, color: about.forest }}>
            {item.number}
          </Box>
        </Box>
        <Box sx={{ p: { xs: 2.25, md: 2.75 }, borderTop: `1px solid ${about.line}` }}>
          <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
            <Typography sx={{ fontFamily: displayFont, fontSize: { xs: 24, md: 27 }, lineHeight: 1.06 }}>
              {item.title}
            </Typography>
            <ArrowOutwardIcon
              sx={{
                mt: 0.5,
                fontSize: 19,
                color: about.forest,
                flexShrink: 0,
                transition: "transform 0.3s ease",
                ".group:hover &": { transform: "translate(3px, -3px)" },
              }}
              aria-hidden
            />
          </Stack>
          <Typography sx={{ mt: 1.5, maxWidth: 310, fontSize: 13.5, lineHeight: 1.75, color: about.body }}>
            {item.body}
          </Typography>
        </Box>
      </Box>
    </Reveal>
  );
}

export default function AboutPage() {
  return (
    <Box sx={{ bgcolor: about.white, color: about.charcoal }}>
      <Box
        component="section"
        id="point-of-view"
        aria-labelledby="point-of-view-heading"
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: about.ivory,
          borderBottom: `1px solid ${about.line}`,
          scrollMarginTop: 100,
        }}
      >
        <Typography
          aria-hidden
          sx={{
            position: "absolute",
            right: { xs: "-0.15em", md: "-0.04em" },
            top: { xs: "-0.22em", md: "-0.2em" },
            fontFamily: displayFont,
            fontSize: { xs: "19rem", md: "33rem" },
            lineHeight: 0.7,
            color: "rgba(23,77,56,0.035)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          O
        </Typography>

        <Box sx={shell}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(12, minmax(0, 1fr))" },
              columnGap: { lg: 7 },
              rowGap: { xs: 6, md: 8 },
              alignItems: "center",
              py: { xs: 8, sm: 10, md: 12, lg: 14 },
            }}
          >
            <Box sx={{ gridColumn: { lg: "1 / 7" }, position: "relative", zIndex: 1 }}>
              <Reveal>
                <Eyebrow>Our point of view</Eyebrow>
                <Typography
                  id="point-of-view-heading"
                  component="h1"
                  sx={{
                    mt: { xs: 2.5, md: 3.5 },
                    maxWidth: "11ch",
                    fontFamily: displayFont,
                    fontSize: { xs: "3rem", sm: "4rem", md: "5rem", lg: "5.7rem" },
                    fontWeight: 500,
                    lineHeight: 0.96,
                    letterSpacing: "-0.035em",
                    color: about.charcoal,
                  }}
                >
                  Thoughtfully Designed.{" "}
                  <Box component="span" sx={{ fontStyle: "italic", color: about.forest }}>
                    Purposefully Made.
                  </Box>
                </Typography>
                <Typography sx={{ mt: { xs: 3, md: 3.5 }, maxWidth: 520, fontSize: { xs: 15.5, md: 17 }, lineHeight: 1.8, color: about.body }}>
                  At OBASIX, we believe that the spaces where people work, learn and collaborate deserve
                  more than ordinary products.
                </Typography>
                <Typography sx={{ mt: 2, maxWidth: 520, fontSize: { xs: 15.5, md: 16.5 }, lineHeight: 1.8, color: about.body }}>
                  We create thoughtfully engineered writing surfaces that bring ideas to life, support
                  better communication and make everyday spaces more productive.
                </Typography>
                <Typography sx={{ mt: 2, maxWidth: 520, fontSize: { xs: 15.5, md: 16.5 }, lineHeight: 1.8, color: about.body }}>
                  From planning and teaching to brainstorming and decision-making, our products are
                  designed to make every interaction more effective.
                </Typography>
              </Reveal>

              <Reveal delay={120}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
                  <Button component={Link} href="/products" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={primaryButtonSx}>
                    Explore products
                  </Button>
                  <Button component={Link} href="/quote" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={outlineButtonSx}>
                    Start a project
                  </Button>
                </Stack>
              </Reveal>
            </Box>

            <Box sx={{ gridColumn: { lg: "8 / 13" }, position: "relative" }}>
              <Reveal variant="clip" delay={100}>
                <Box
                  sx={{
                    position: "relative",
                    minHeight: { xs: 390, sm: 520, lg: 620 },
                    overflow: "hidden",
                    bgcolor: about.beige,
                    border: `1px solid ${about.line}`,
                  }}
                >
                  <Image
                    src={images.heroWorkspace}
                    alt="An OBASIX whiteboard in a warm, light-filled workspace"
                    fill
                    priority
                    sizes="(max-width: 1200px) 100vw, 48vw"
                    className="image-zoom"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      left: { xs: 16, md: 22 },
                      right: { xs: 16, md: 22 },
                      bottom: { xs: 16, md: 22 },
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: 2,
                      p: { xs: 2, md: 2.5 },
                      bgcolor: "rgba(245,241,233,0.93)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: about.forest }}>
                        Designed in India
                      </Typography>
                      <Typography sx={{ mt: 0.75, fontFamily: displayFont, fontSize: { xs: 22, md: 27 }, lineHeight: 1.05 }}>
                        Made for real rooms.
                      </Typography>
                    </Box>
                    <Typography sx={{ display: { xs: "none", sm: "block" }, fontSize: 11, color: about.muted, textAlign: "right", maxWidth: 180 }}>
                      Considered surfaces, planned around the way a space is used.
                    </Typography>
                  </Box>
                </Box>
              </Reveal>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              borderTop: `1px solid ${about.line}`,
              pb: { xs: 7, md: 9 },
            }}
          >
            {values.map((value, index) => (
              <Reveal key={value.number} delay={index * 70}>
                <Box
                  sx={{
                    height: "100%",
                    pt: { xs: 3.5, md: 4 },
                    pr: { md: 4 },
                    pl: { md: index === 0 ? 0 : 4 },
                    borderLeft: { md: index === 0 ? "none" : `1px solid ${about.line}` },
                    borderTop: { xs: index === 0 ? "none" : `1px solid ${about.line}`, md: "none" },
                    mt: { xs: index === 0 ? 0 : 3, md: 0 },
                  }}
                >
                  <Typography sx={{ fontFamily: displayFont, fontSize: 19, color: about.forest }}>
                    {value.number} <Box component="span" sx={{ color: about.oak }}>—</Box>
                  </Typography>
                  <Typography sx={{ mt: 1.25, fontFamily: displayFont, fontSize: { xs: 25, md: 29 }, lineHeight: 1.05 }}>
                    {value.title}
                  </Typography>
                  <Typography sx={{ mt: 1.5, maxWidth: 340, fontSize: 13.5, lineHeight: 1.75, color: about.body }}>
                    {value.body}
                  </Typography>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        id="collection"
        aria-labelledby="collection-heading"
        sx={{ bgcolor: about.white, py: { xs: 8, sm: 10, md: 13 }, scrollMarginTop: 100 }}
      >
        <Box sx={shell}>
          <SectionIntro
            eyebrow="Our collection"
            title="The Right Surface for Every Idea."
            body="Explore a versatile range of writing boards and workspace solutions, thoughtfully developed to support different working, learning and communication needs."
            action={{ href: "/products", label: "Explore all products" }}
            titleMaxWidth="15ch"
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            {collection.map((item, index) => (
              <CollectionCard key={item.title} item={item} index={index} />
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        id="signature"
        aria-labelledby="signature-heading"
        sx={{
          bgcolor: about.ivory,
          py: { xs: 8, sm: 10, md: 13 },
          borderTop: `1px solid ${about.line}`,
          borderBottom: `1px solid ${about.line}`,
          scrollMarginTop: 100,
        }}
      >
        <Box sx={shell}>
          <SectionIntro
            eyebrow="Signature collection"
            title="Our Featured Boards. Selected for Performance."
            body="Discover a selection of OBASIX boards that combine functional design, quality materials and dependable everyday performance."
            action={{ href: "/products", label: "Explore the full collection" }}
            titleMaxWidth="15ch"
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(12, minmax(0, 1fr))" },
              columnGap: { lg: 6 },
              rowGap: { xs: 4, md: 5 },
              alignItems: "stretch",
            }}
          >
            {featuredProduct ? (
              <Box sx={{ gridColumn: { lg: "1 / 7" } }}>
                <Reveal>
                  <Box
                    component={Link}
                    href={`/products/${featuredProduct.id}`}
                    className="group"
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      bgcolor: about.white,
                      border: `1px solid ${about.line}`,
                      "&:hover": { borderColor: about.forest },
                      "&:focus-visible": { outline: `2px solid ${about.forest}`, outlineOffset: 2 },
                    }}
                  >
                    <Box sx={{ position: "relative", aspectRatio: { xs: "4 / 3", md: "16 / 10" }, bgcolor: about.beige, overflow: "hidden" }}>
                      <Image
                        src={featuredProduct.images[0] ?? images.heroWorkspace}
                        alt={featuredProduct.name}
                        fill
                        sizes="(max-width: 1200px) 100vw, 52vw"
                        className="image-zoom"
                        style={{ objectFit: "contain", padding: "clamp(24px, 5vw, 56px)" }}
                      />
                      <Box sx={{ position: "absolute", left: 18, top: 18, px: 1.25, py: 0.55, bgcolor: "rgba(255,255,255,0.9)", color: about.forest, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.17em", textTransform: "uppercase" }}>
                        Featured product
                      </Box>
                    </Box>
                    <Box sx={{ p: { xs: 2.5, md: 3.25 }, borderTop: `1px solid ${about.line}` }}>
                      <Typography sx={{ fontFamily: displayFont, fontSize: { xs: 30, md: 38 }, lineHeight: 1.02 }}>
                        Superior Magnetic Whiteboard 3×4
                      </Typography>
                      <Typography sx={{ mt: 1.25, fontSize: 14, fontWeight: 600, color: about.forest }}>
                        {formatPrice(featuredProduct.price)}
                      </Typography>
                      <Typography sx={{ mt: 1.5, maxWidth: 500, fontSize: 13.5, lineHeight: 1.75, color: about.body }}>
                        Premium magnetic writing surface with a durable black aluminium frame, designed
                        for professional workspaces.
                      </Typography>
                      <Stack direction="row" sx={{ mt: 2.5, alignItems: "center", gap: 1, color: about.forest, fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                        View product
                        <ArrowOutwardIcon sx={{ fontSize: 17, transition: "transform 0.3s ease", ".group:hover &": { transform: "translate(3px, -3px)" } }} aria-hidden />
                      </Stack>
                    </Box>
                  </Box>
                </Reveal>
              </Box>
            ) : null}

            <Box sx={{ gridColumn: { lg: "7 / 13" }, display: "flex", flexDirection: "column", gap: 3 }}>
              <Reveal delay={100}>
                <Box sx={{ borderTop: `1px solid ${about.line}` }}>
                  <Typography sx={{ pt: 2, fontFamily: displayFont, fontSize: { xs: 24, md: 28 }, lineHeight: 1.1 }}>
                    Explore the selection
                  </Typography>
                  <Stack component="ol" sx={{ mt: 1, p: 0, listStyle: "none" }}>
                    {signatureProducts.map((item, index) => (
                      <Box
                        key={item.product.id}
                        component={Link}
                        href={`/products/${item.product.id}`}
                        className="group"
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "auto minmax(0, 1fr) auto",
                          alignItems: "baseline",
                          gap: 1.5,
                          py: 1.5,
                          borderTop: index === 0 ? "none" : `1px solid ${about.line}`,
                          "&:hover": { color: about.forest },
                          "&:focus-visible": { outline: `2px solid ${about.forest}`, outlineOffset: 2 },
                        }}
                      >
                        <Typography sx={{ fontFamily: displayFont, fontSize: 14, color: about.forest }}>
                          {String(index + 1).padStart(2, "0")}.
                        </Typography>
                        <Typography sx={{ fontSize: 13, lineHeight: 1.55, color: "inherit" }}>
                          {item.name}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: about.forest, whiteSpace: "nowrap" }}>
                          From {formatPrice(item.product.price)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Reveal>

              <Reveal delay={180}>
                <Box sx={{ bgcolor: about.white, border: `1px solid ${about.line}`, p: { xs: 2.5, md: 3 } }}>
                  <Typography sx={{ fontFamily: displayFont, fontSize: { xs: 24, md: 28 }, lineHeight: 1.1 }}>
                    Materials &amp; finishes
                  </Typography>
                  <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2.5 }}>
                    <Box>
                      <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: about.forest }}>
                        Surfaces
                      </Typography>
                      <Typography sx={{ mt: 1, fontSize: 13, lineHeight: 1.7, color: about.body }}>
                        Resin-coated, melamine and ceramic steel writing surfaces.
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: about.forest }}>
                        Frames
                      </Typography>
                      <Typography sx={{ mt: 1, fontSize: 13, lineHeight: 1.7, color: about.body }}>
                        Durable aluminium and natural pine finishes, available in six options.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Reveal>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        id="spaces"
        aria-labelledby="spaces-heading"
        sx={{ bgcolor: about.white, py: { xs: 8, sm: 10, md: 13 }, scrollMarginTop: 100 }}
      >
        <Box sx={shell}>
          <SectionIntro
            eyebrow="Solutions for every space"
            title="Designed Around Your Workspace."
            body="Every environment has different requirements. Our board solutions are designed to support the way people communicate, collaborate, teach and work."
            action={{ href: "/solutions", label: "Explore all spaces" }}
            titleMaxWidth="13ch"
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: { xs: 3, md: 2.5 },
            }}
          >
            {spaces.map((space, index) => (
              <Reveal key={space.name} delay={index * 80} sx={{ display: "flex" }}>
                <Box
                  component={Link}
                  href={space.href}
                  className="group"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    border: `1px solid ${about.line}`,
                    bgcolor: about.white,
                    "&:hover": { borderColor: about.forest },
                    "&:focus-visible": { outline: `2px solid ${about.forest}`, outlineOffset: 2 },
                  }}
                >
                  <Box sx={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", bgcolor: about.ivory }}>
                    <Image
                      src={space.image}
                      alt={`${space.name} workspace`}
                      fill
                      sizes="(max-width: 900px) 100vw, 33vw"
                      className="image-zoom"
                      style={{ objectFit: "cover" }}
                    />
                    <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(37,42,38,0) 45%, rgba(37,42,38,0.48) 100%)" }} />
                    <Typography sx={{ position: "absolute", left: 18, bottom: 16, fontFamily: displayFont, fontSize: 16, color: about.ivory }}>
                      {space.number} — {space.name}
                    </Typography>
                  </Box>
                  <Box sx={{ p: { xs: 2.5, md: 3 }, borderTop: `1px solid ${about.line}` }}>
                    <Typography sx={{ fontFamily: displayFont, fontSize: { xs: 25, md: 28 }, lineHeight: 1.05 }}>
                      {space.title}
                    </Typography>
                    <Typography sx={{ mt: 1.5, fontSize: 13.5, lineHeight: 1.75, color: about.body }}>
                      {space.body}
                    </Typography>
                    <Stack direction="row" sx={{ mt: 2.5, alignItems: "center", gap: 1, color: about.forest, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                      Explore space
                      <ArrowOutwardIcon sx={{ fontSize: 16, transition: "transform 0.3s ease", ".group:hover &": { transform: "translate(3px, -3px)" } }} aria-hidden />
                    </Stack>
                  </Box>
                </Box>
              </Reveal>
            ))}
          </Box>

          <Reveal delay={180}>
            <Box
              sx={{
                mt: { xs: 5, md: 7 },
                p: { xs: 3, md: 4.5 },
                bgcolor: about.forest,
                color: about.ivory,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { md: "center" },
                justifyContent: "space-between",
                gap: 3,
              }}
            >
              <Box>
                <Typography sx={{ fontFamily: displayFont, fontSize: { xs: 27, md: 34 }, lineHeight: 1.05 }}>
                  Have a larger requirement?
                </Typography>
                <Typography sx={{ mt: 1.25, maxWidth: 620, fontSize: 13.5, lineHeight: 1.75, color: "rgba(245,241,233,0.68)" }}>
                  From individual workspaces to complete institutional and commercial projects, our team
                  can help plan the right solution.
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/quote"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                sx={{
                  ...buttonSx.secondary,
                  alignSelf: { xs: "flex-start", md: "center" },
                  whiteSpace: "nowrap",
                }}
              >
                Talk to our team
              </Button>
            </Box>
          </Reveal>
        </Box>
      </Box>

      <Box
        component="section"
        id="studio"
        aria-labelledby="studio-heading"
        sx={{
          bgcolor: about.ivory,
          py: { xs: 8, sm: 10, md: 13 },
          borderTop: `1px solid ${about.line}`,
          borderBottom: `1px solid ${about.line}`,
          scrollMarginTop: 100,
        }}
      >
        <Box sx={shell}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(12, minmax(0, 1fr))" },
              columnGap: { lg: 7 },
              rowGap: { xs: 5, md: 7 },
              alignItems: "center",
            }}
          >
            <Box sx={{ gridColumn: { lg: "1 / 7" } }}>
              <Reveal>
                <Eyebrow>Custom design studio</Eyebrow>
                <Typography
                  id="studio-heading"
                  component="h2"
                  sx={{ mt: { xs: 2.5, md: 3 }, maxWidth: "12ch", fontFamily: displayFont, fontSize: { xs: "2.8rem", sm: "3.5rem", md: "4.35rem" }, fontWeight: 500, lineHeight: 0.98, letterSpacing: "-0.03em" }}
                >
                  Designed to Fit. Made to Measure.
                </Typography>
                <Typography sx={{ mt: { xs: 2.5, md: 3 }, maxWidth: 540, fontSize: { xs: 15, md: 15.5 }, lineHeight: 1.8, color: about.body }}>
                  Your workspace has its own dimensions, requirements and identity. Our customisation
                  solutions help you create a writing surface that fits your environment and workflow.
                </Typography>
                <Typography sx={{ mt: 2, maxWidth: 540, fontSize: { xs: 15, md: 15.5 }, lineHeight: 1.8, color: about.body }}>
                  Choose the dimensions, materials, frame finishes and functional details that work best
                  for your space.
                </Typography>
              </Reveal>

              <Box sx={{ mt: { xs: 4, md: 5 }, borderTop: `1px solid ${about.line}` }}>
                {studioOptions.map((option, index) => (
                  <Reveal key={option.number} delay={index * 50}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "auto minmax(0, 1fr)", sm: "auto 190px minmax(0, 1fr)" },
                        gap: { xs: 1.5, sm: 2.5 },
                        alignItems: "baseline",
                        py: 2,
                        borderBottom: `1px solid ${about.line}`,
                      }}
                    >
                      <Typography sx={{ fontFamily: displayFont, fontSize: 14, color: about.forest }}>
                        {option.number}.
                      </Typography>
                      <Typography sx={{ fontFamily: displayFont, fontSize: { xs: 21, sm: 22 }, lineHeight: 1.15 }}>
                        {option.title}
                      </Typography>
                      <Typography sx={{ gridColumn: { xs: "2", sm: "auto" }, fontSize: 13, lineHeight: 1.7, color: about.body }}>
                        {option.body}
                      </Typography>
                    </Box>
                  </Reveal>
                ))}
              </Box>

              <Reveal delay={150}>
                <Button component={Link} href="/customize" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={{ ...primaryButtonSx, mt: 4 }}>
                  Design your board
                </Button>
              </Reveal>
            </Box>

            <Box sx={{ gridColumn: { lg: "8 / 13" } }}>
              <Reveal variant="clip" delay={100}>
                <Box sx={{ position: "relative", aspectRatio: { xs: "4 / 4.3", md: "4 / 4.8" }, overflow: "hidden", bgcolor: about.beige }}>
                  <Image
                    src={images.heroWhiteboard}
                    alt="A custom magnetic whiteboard with a light aluminium frame"
                    fill
                    sizes="(max-width: 1200px) 100vw, 42vw"
                    className="image-zoom"
                    style={{ objectFit: "cover" }}
                  />
                  <Box sx={{ position: "absolute", left: 18, bottom: 18, px: 1.25, py: 0.55, bgcolor: "rgba(245,241,233,0.92)", color: about.forest, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.17em", textTransform: "uppercase" }}>
                    Six frame finishes · Three surfaces
                  </Box>
                </Box>
              </Reveal>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        id="visualise"
        aria-labelledby="visualise-heading"
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: about.forest,
          color: about.ivory,
          py: { xs: 8, sm: 10, md: 13 },
          scrollMarginTop: 100,
        }}
      >
        <Typography
          aria-hidden
          sx={{
            position: "absolute",
            right: { xs: "-0.1em", md: "0.02em" },
            bottom: { xs: "-0.28em", md: "-0.3em" },
            fontFamily: displayFont,
            fontSize: { xs: "13rem", md: "25rem" },
            lineHeight: 0.7,
            color: "rgba(245,241,233,0.035)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          O
        </Typography>

        <Box sx={shell}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(12, minmax(0, 1fr))" },
              columnGap: { lg: 7 },
              rowGap: { xs: 5, md: 7 },
              alignItems: "center",
            }}
          >
            <Box sx={{ gridColumn: { lg: "1 / 7" }, position: "relative", zIndex: 1 }}>
              <Reveal>
                <Eyebrow light>Smart space visualisation</Eyebrow>
                <Typography
                  id="visualise-heading"
                  component="h2"
                  sx={{ mt: { xs: 2.5, md: 3 }, maxWidth: "12ch", fontFamily: displayFont, fontSize: { xs: "2.8rem", sm: "3.5rem", md: "4.35rem" }, fontWeight: 500, lineHeight: 0.98, letterSpacing: "-0.03em", color: about.ivory }}
                >
                  See How It Fits Before You Choose.
                </Typography>
                <Typography sx={{ mt: { xs: 2.5, md: 3 }, maxWidth: 540, fontSize: { xs: 15.5, md: 16.5 }, lineHeight: 1.8, color: "rgba(245,241,233,0.68)" }}>
                  Make confident design decisions by previewing your selected board in a sample room or
                  your own workspace.
                </Typography>
                <Typography sx={{ mt: 2, maxWidth: 540, fontSize: { xs: 15.5, md: 16.5 }, lineHeight: 1.8, color: "rgba(245,241,233,0.68)" }}>
                  Explore different sizes, frame finishes and surface options to understand how the final
                  product will complement your environment.
                </Typography>
              </Reveal>

              <Box sx={{ mt: { xs: 4, md: 5 }, borderTop: "1px solid rgba(245,241,233,0.16)" }}>
                {visualiseSteps.map((step, index) => (
                  <Reveal key={step.number} delay={index * 60}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr)",
                        gap: 2,
                        alignItems: "baseline",
                        py: 2,
                        borderBottom: "1px solid rgba(245,241,233,0.16)",
                      }}
                    >
                      <Typography sx={{ fontFamily: displayFont, fontSize: 16, color: about.oak }}>
                        {step.number}.
                      </Typography>
                      <Typography sx={{ fontFamily: displayFont, fontSize: { xs: 24, md: 28 }, lineHeight: 1.08, color: about.ivory }}>
                        {step.title}
                      </Typography>
                    </Box>
                  </Reveal>
                ))}
              </Box>

              <Reveal delay={150}>
                <Box sx={{ mt: 3 }}>
                  <Typography sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,241,233,0.4)" }}>
                    Explore available finishes
                  </Typography>
                  <Stack direction="row" spacing={{ xs: 1.5, md: 2.5 }} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
                    {finishes.map((finish) => (
                      <Typography key={finish} sx={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(245,241,233,0.68)" }}>
                        {finish}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                <Button
                  component={Link}
                  href="/visualize"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={{ ...buttonSx.secondary, mt: 4 }}
                >
                  Visualise your space
                </Button>
              </Reveal>
            </Box>

            <Box sx={{ gridColumn: { lg: "8 / 13" }, position: "relative" }}>
              <Reveal variant="clip" delay={100}>
                <Box sx={{ position: "relative", aspectRatio: { xs: "4 / 4.3", md: "4 / 4.8" }, overflow: "hidden", bgcolor: about.forestDark }}>
                  <Image
                    src={images.wallMeetingRoom}
                    alt="A meeting room visualised with a wall-mounted OBASIX board"
                    fill
                    sizes="(max-width: 1200px) 100vw, 42vw"
                    className="image-zoom"
                    style={{ objectFit: "cover" }}
                  />
                  <Box sx={{ position: "absolute", left: 18, bottom: 18, px: 1.25, py: 0.55, bgcolor: "rgba(245,241,233,0.92)", color: about.forest, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.17em", textTransform: "uppercase" }}>
                    Live preview
                  </Box>
                </Box>
              </Reveal>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        id="accessories"
        aria-labelledby="accessories-heading"
        sx={{ bgcolor: about.white, py: { xs: 8, sm: 10, md: 13 }, scrollMarginTop: 100 }}
      >
        <Box sx={shell}>
          <SectionIntro
            eyebrow="Accessories & finishing touches"
            title="Complete Your Workspace."
            body="The right accessories make everyday tasks easier. Explore practical additions designed to complement your OBASIX writing surfaces and improve workspace organisation."
            action={{ href: "/products?category=accessory", label: "Shop all accessories" }}
            titleMaxWidth="13ch"
          />
          <Reveal>
            <Typography sx={{ maxWidth: 620, mt: { xs: -2.5, md: -3 }, mb: { xs: 5, md: 7 }, fontSize: 14.5, lineHeight: 1.8, color: about.body }}>
              From magnetic buttons and marker holders to mobile stands, every accessory has a functional role.
            </Typography>
          </Reveal>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: { xs: 2.5, md: 2.5 },
            }}
          >
            {accessories.map((item, index) => (
              <Reveal key={item.product.id} delay={index * 70} sx={{ display: "flex" }}>
                <Box
                  component={Link}
                  href={`/products/${item.product.id}`}
                  className="group"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    border: `1px solid ${about.line}`,
                    bgcolor: about.white,
                    "&:hover": { borderColor: about.forest },
                    "&:focus-visible": { outline: `2px solid ${about.forest}`, outlineOffset: 2 },
                  }}
                >
                  <Box sx={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", bgcolor: about.ivory }}>
                    <Image
                      src={item.product.images[0] ?? images.heroWorkspace}
                      alt={item.title}
                      fill
                      sizes="(max-width: 900px) 100vw, 33vw"
                      className="image-zoom"
                      style={{ objectFit: "contain", padding: "clamp(22px, 4vw, 44px)" }}
                    />
                    <Typography sx={{ position: "absolute", left: 16, top: 14, fontFamily: displayFont, fontSize: 17, color: about.forest }}>
                      {item.number}
                    </Typography>
                  </Box>
                  <Box sx={{ p: { xs: 2.5, md: 3 }, borderTop: `1px solid ${about.line}`, display: "flex", flexDirection: "column", flex: 1 }}>
                    <Typography sx={{ fontFamily: displayFont, fontSize: { xs: 24, md: 27 }, lineHeight: 1.05 }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ mt: 1, fontSize: 14, fontWeight: 600, color: about.forest }}>
                      {formatPrice(item.product.price)}
                    </Typography>
                    <Typography sx={{ mt: 1.5, fontSize: 13.5, lineHeight: 1.75, color: about.body }}>
                      {item.body}
                    </Typography>
                    <Stack direction="row" sx={{ mt: "auto", pt: 2.5, alignItems: "center", gap: 1, color: about.forest, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                      View product
                      <ArrowOutwardIcon sx={{ fontSize: 16, transition: "transform 0.3s ease", ".group:hover &": { transform: "translate(3px, -3px)" } }} aria-hidden />
                    </Stack>
                  </Box>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        id="start-project"
        aria-labelledby="start-project-heading"
        sx={{
          bgcolor: about.ivory,
          py: { xs: 8, sm: 10, md: 13 },
          borderTop: `1px solid ${about.line}`,
          scrollMarginTop: 100,
        }}
      >
        <Box sx={shell}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(12, minmax(0, 1fr))" },
              columnGap: 7,
              rowGap: { xs: 5, md: 6 },
              alignItems: "end",
            }}
          >
            <Box sx={{ gridColumn: { lg: "1 / 8" } }}>
              <Reveal>
                <Eyebrow>Start a project</Eyebrow>
                <Typography
                  id="start-project-heading"
                  component="h2"
                  sx={{
                    mt: { xs: 2.5, md: 3 },
                    maxWidth: "12ch",
                    fontFamily: displayFont,
                    fontSize: { xs: "2.9rem", sm: "3.7rem", md: "4.8rem" },
                    fontWeight: 500,
                    lineHeight: 0.98,
                    letterSpacing: "-0.035em",
                  }}
                >
                  Let&apos;s Create a Better Workspace Together.
                </Typography>
              </Reveal>
            </Box>
            <Box sx={{ gridColumn: { lg: "9 / 13" } }}>
              <Reveal delay={100}>
                <Typography sx={{ maxWidth: 390, fontSize: { xs: 15, md: 15.5 }, lineHeight: 1.8, color: about.body }}>
                  Whether you need a single writing board, a customised solution or a complete workspace
                  installation, OBASIX is ready to help.
                </Typography>
                <Typography sx={{ mt: 2, maxWidth: 390, fontSize: { xs: 15, md: 15.5 }, lineHeight: 1.8, color: about.body }}>
                  Share your requirements with our team and discover solutions designed around your space,
                  preferences and functional needs.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3.5 }}>
                  <Button component={Link} href="/quote" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={primaryButtonSx}>
                    Start your project
                  </Button>
                  <Button component={Link} href="/products" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={outlineButtonSx}>
                    Browse products
                  </Button>
                </Stack>
              </Reveal>
            </Box>
          </Box>

          <Reveal delay={120}>
            <Box
              sx={{
                mt: { xs: 6, md: 8 },
                pt: 3,
                borderTop: `1px solid ${about.line}`,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { sm: "center" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: about.muted }}>
                Homes · Offices · Educational Institutions · Commercial Spaces
              </Typography>
              <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: about.muted }}>
                Studio consultations available by appointment
              </Typography>
            </Box>
          </Reveal>
        </Box>
      </Box>
    </Box>
  );
}

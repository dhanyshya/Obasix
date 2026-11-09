import type { Metadata } from "next";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { Roundel, SignArrow, SignTick, StripeSpine, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { colours, frames, getProductById, products } from "@/data/catalogue";
import { company } from "@/data/company";
import { images } from "@/data/images";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

export const metadata: Metadata = {
  title: "About",
  description:
    "OBASIX makes whiteboards, notice boards, stands and accessories at its factory in Bawana, Delhi, for offices, classrooms, homes and commercial spaces.",
  openGraph: {
    title: "About OBASIX",
    description: "Boards for working spaces, made in Delhi.",
    images: ["/hero-workspace-photo.jpg"],
  },
};

const peach = "#FFC59E";

const principles = [
  {
    title: "Purpose in every detail",
    body: "Every frame, surface and accessory has a job. We design for the way a board is actually written on, wiped, moved and read.",
  },
  {
    title: "Materials chosen to last",
    body: "Aluminium and powder-coated frames, natural pine, magnetic steel and ceramic steel surfaces, selected for everyday use.",
  },
  {
    title: "Made for many spaces",
    body: "From a home study to a lecture hall, the same range scales in size, frame and surface to fit the room.",
  },
];

const range = [
  { title: "Magnetic whiteboards", body: "For planning, presenting and everyday communication.", image: images.magneticWhiteboard, href: "/products?category=magnetic-whiteboard" },
  { title: "Non-magnetic whiteboards", body: "Practical dry-erase surfaces for classrooms and offices.", image: images.nonMagneticWhiteboard, href: "/products?category=non-magnetic-whiteboard" },
  { title: "Ceramic steel boards", body: "Hard-wearing writing surfaces for frequent use.", image: images.magneticWhiteboardAlt, href: "/products/scuv90120" },
  { title: "Notice and pin-up boards", body: "Fabric, cork and felt for notices and updates.", image: images.noticeBoard, href: "/products?category=notice-board" },
  { title: "Combination boards", body: "Writing and display surfaces in a single frame.", image: images.combinationBoard, href: "/products?category=combination-board" },
  { title: "Stands and accessories", body: "Stands, magnets, markers and holders.", image: images.whiteboardStand, href: "/products?category=stand" },
];

const spaces = [
  { name: "Office", line: "Planning and daily operations.", image: images.wallModernOffice, href: "/solutions/office" },
  { name: "Meeting room", line: "Presentations and decisions.", image: images.wallMeetingRoom, href: "/solutions/meeting-room" },
  { name: "Classroom", line: "Teaching and everyday learning.", image: images.wallClassroom, href: "/solutions/classroom" },
];

const studio = [
  { title: "Custom dimensions", body: "Compact boards to large wall installations, quoted to size." },
  { title: `${frames.length} frame finishes`, body: frames.map((f) => f.name).join(", ") + "." },
  { title: `${colours.length} board colours`, body: "From white and grey to chalkboard green and natural pine." },
  { title: "Logo and layout", body: "Add a company logo, a calendar section, a marker tray or a custom layout." },
];

const featured = ["smwbpcb90120", "cmwb90120", "pwmwb90120", "scuv90120"].map((id) => getProductById(id)).filter((p) => p !== undefined);

function Label({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25 }}>
      <Box aria-hidden sx={{ width: 10, height: 10, bgcolor: brand.signal }} />
      <Typography component="p" sx={{ ...signType.code, fontSize: 13, textTransform: "uppercase", color: light ? peach : brand.signalInk }}>
        {children}
      </Typography>
    </Box>
  );
}

function SectionHead({ label, title, body, light, action }: { label: string; title: string; body?: string; light?: boolean; action?: { href: string; label: string } }) {
  return (
    <Box sx={{ display: "grid", gap: { xs: 2.5, md: 6 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.2fr) minmax(0, 1fr)" }, alignItems: "end", mb: { xs: 5, md: 7 } }}>
      <Box>
        <Label light={light}>{label}</Label>
        <Typography component="h2" sx={{ ...signType.title, mt: 2, color: light ? brand.white : brand.charcoal, maxWidth: "16ch", textWrap: "balance" }}>
          {title}
        </Typography>
      </Box>
      <Box>
        {body ? <Typography sx={{ color: light ? "rgba(255,255,255,0.8)" : brand.body, fontSize: { md: 17 }, maxWidth: 520 }}>{body}</Typography> : null}
        {action ? (
          <Box component={Link} href={action.href} sx={{ mt: 2, display: "inline-flex", alignItems: "center", gap: 1, ...signType.plate, fontSize: 16, color: light ? brand.white : brand.charcoal, borderBottom: `2px solid ${brand.signal}`, pb: 0.5, "&:hover svg": { transform: "translateX(4px)" }, "& svg": { transition: "transform 220ms cubic-bezier(0.16,1,0.3,1)" } }}>
            {action.label}
            <SignArrow size={16} color={brand.signal} />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

const ghostButtonSx = { "&&": { color: brand.white, borderColor: "rgba(255,255,255,0.5)", bgcolor: "transparent" }, "&&:hover": { borderColor: brand.white, bgcolor: "rgba(255,255,255,0.08)" } } as const;

export default function AboutPage() {
  const hero = getProductById("smwbpcb90120");
  const stats = [
    { value: String(products.length), label: "products in the catalogue" },
    { value: String(frames.length), label: "frame finishes" },
    { value: String(colours.length), label: "board colours" },
    { value: "ISO", label: "9001:2015 certified" },
  ];

  return (
    <Box sx={{ bgcolor: brand.ivory, overflowX: "hidden" }}>
      {/* 1. Masthead: statement + workspace photograph */}
      <Box component="section" aria-labelledby="about-title" sx={{ bgcolor: brand.forestDeep, color: brand.white }}>
        <Box sx={{ ...pageMax, ...pagePad, pt: { xs: 5, md: 8 }, pb: { xs: 5, md: 8 }, display: "grid", gap: { xs: 5, md: 6, lg: 8 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.15fr) minmax(0, 1fr)" }, alignItems: "center" }}>
          <Box>
            <Label light>About OBASIX</Label>
            <Typography id="about-title" component="h1" sx={{ ...signType.mega, mt: 2.5, color: brand.white, maxWidth: "12ch", textWrap: "balance" }}>
              Boards for working spaces, made in Delhi.
            </Typography>
            <Typography sx={{ mt: 3, maxWidth: 540, color: "rgba(255,255,255,0.82)", fontSize: { xs: 16, md: 18 }, lineHeight: 1.65 }}>
              OBASIX makes whiteboards, notice boards, stands and accessories at our factory in Bawana, Delhi, for the places where people work, learn and decide.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 4 }}>
              <Button component={Link} href="/products" variant="contained" size="large" endIcon={<SignArrow size={18} />}>
                Explore the range
              </Button>
              <Button component={Link} href="/quote" variant="outlined" size="large" sx={ghostButtonSx}>
                Start a project
              </Button>
            </Box>
          </Box>
          <Box sx={{ position: "relative" }}>
            <Box sx={{ position: "relative", aspectRatio: { xs: "4 / 3", md: "4 / 5" }, overflow: "hidden" }}>
              <Image src={images.heroWorkspace} alt="A whiteboard in a meeting space" fill priority sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: "cover" }} />
            </Box>
            {hero ? (
              <Box component={Link} href={`/products/${hero.id}`} sx={{ position: { md: "absolute" }, left: { md: -48 }, bottom: { md: 32 }, display: "flex", gap: 2, alignItems: "center", bgcolor: brand.white, color: brand.charcoal, p: 2, pr: 3, maxWidth: { md: 360 }, boxShadow: "0 30px 60px -24px rgba(0,0,0,0.5)", "&:hover .t": { textDecoration: "underline", textUnderlineOffset: 3 } }}>
                <Box sx={{ position: "relative", width: 72, height: 72, flexShrink: 0, bgcolor: brand.ivory }}>
                  <Image src={hero.images[0]} alt="" fill sizes="72px" style={{ objectFit: "contain", padding: 6 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ ...signType.code, fontSize: 11.5, color: brand.forest }}>{hero.sku}</Typography>
                  <Typography className="t" sx={{ ...signType.plate, fontSize: 16, mt: 0.25 }}>{hero.shortName}</Typography>
                  <Typography sx={{ ...signType.plate, fontSize: 15, color: brand.body, mt: 0.25 }}>{hero.price > 0 ? formatPrice(hero.price) : "On quote"}</Typography>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Box>
        {/* Fact rail */}
        <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.14)" }}>
          <Box component="dl" sx={{ ...pageMax, ...pagePad, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
            {stats.map((s, i) => (
              <Box key={s.label} sx={{ display: "flex", flexDirection: "column-reverse", justifyContent: "flex-end", py: { xs: 2.5, md: 3.5 }, pl: { md: i ? 3 : 0 }, borderLeft: { md: i ? "1px solid rgba(255,255,255,0.14)" : 0 }, borderTop: { xs: i > 1 ? "1px solid rgba(255,255,255,0.14)" : 0, md: 0 } }}>
                <Box component="dt" sx={{ mt: 0.75, color: "rgba(255,255,255,0.75)", fontSize: 14.5 }}>{s.label}</Box>
                <Box component="dd" sx={{ m: 0, ...signType.title, fontSize: { xs: "2.25rem", md: "3rem" }, color: brand.white, fontVariantNumeric: "tabular-nums" }}>{s.value}</Box>
              </Box>
            ))}
          </Box>
        </Box>
        <StripeSpine height={6} />
      </Box>

      {/* 2. Principles */}
      <Box component="section" sx={{ bgcolor: brand.white, py: { xs: 8, md: 12 } }}>
        <Box sx={{ ...pageMax, ...pagePad }}>
          <SectionHead label="Our point of view" title="Thoughtfully designed. Purposefully made." body="At OBASIX, we believe the spaces where people work, learn and collaborate deserve better than ordinary products." />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, borderTop: `2px solid ${brand.charcoal}` }}>
            {principles.map((p, i) => (
              <Reveal key={p.title} delay={i * 80}>
                <Box sx={{ pt: 3, pb: { xs: 4, md: 0 }, pr: { md: 5 }, pl: { md: i ? 4 : 0 }, borderLeft: { md: i ? `1px solid ${brand.line}` : 0 }, height: "100%" }}>
                  <Typography sx={{ ...signType.code, fontSize: 13, color: brand.signalInk }}>{String(i + 1).padStart(2, "0")}</Typography>
                  <Typography component="h3" sx={{ ...signType.plate, fontSize: { xs: 24, md: 27 }, mt: 1.5, color: brand.charcoal }}>{p.title}</Typography>
                  <Typography sx={{ mt: 1.5 }}>{p.body}</Typography>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 3. The range */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ ...pageMax, ...pagePad }}>
          <SectionHead label="The range" title="Six families, one standard." body="Every OBASIX board starts from the same frames, surfaces and fittings, so a room can mix types and still look like one set." action={{ href: "/products", label: "Browse all products" }} />
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
            {range.map((r, i) => (
              <Box component="li" key={r.title}>
                <Box component={Link} href={r.href} sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: brand.white, color: brand.charcoal, boxShadow: "inset 0 4px 0 transparent", transition: "box-shadow 220ms cubic-bezier(0.16,1,0.3,1)", "&:hover": { boxShadow: `inset 0 4px 0 ${brand.signal}` }, "&:hover img": { transform: "scale(1.04)" }, "&:hover svg": { transform: "translateX(4px)" } }}>
                  <Box sx={{ position: "relative", aspectRatio: "16 / 10", overflow: "hidden", bgcolor: brand.white, borderBottom: `1px solid ${brand.line}` }}>
                    <Image src={r.image} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{ objectFit: "contain", padding: "8%", transition: "transform 500ms cubic-bezier(0.16,1,0.3,1)" }} />
                  </Box>
                  <Box sx={{ p: { xs: 2.5, md: 3 }, display: "flex", gap: 2, alignItems: "flex-start" }}>
                    <Box sx={{ ...signType.code, fontSize: 13, color: brand.muted, pt: 0.5 }}>{String(i + 1).padStart(2, "0")}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography component="h3" sx={{ ...signType.plate, fontSize: 21 }}>{r.title}</Typography>
                      <Typography sx={{ mt: 0.75, fontSize: 15 }}>{r.body}</Typography>
                    </Box>
                    <SignArrow size={20} color={brand.signal} sx={{ mt: 0.5, transition: "transform 220ms cubic-bezier(0.16,1,0.3,1)" }} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 4. Studio */}
      <Box component="section" id="studio" sx={{ bgcolor: brand.forestDeep, color: brand.white, py: { xs: 8, md: 12 }, scrollMarginTop: 100 }}>
        <Box sx={{ ...pageMax, ...pagePad, display: "grid", gap: { xs: 6, md: 8 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" }, alignItems: "start" }}>
          <Box sx={{ position: { md: "sticky" }, top: { md: 120 } }}>
            <Label light>The studio</Label>
            <Typography component="h2" sx={{ ...signType.title, mt: 2, color: brand.white, maxWidth: "13ch" }}>
              Made to your size, frame and finish.
            </Typography>
            <Typography sx={{ mt: 2.5, maxWidth: 480, color: "rgba(255,255,255,0.8)", fontSize: { md: 17 } }}>
              Design a board in the browser, see it on your own wall, then send it to us for a quote.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 4 }}>
              <Button component={Link} href="/customize" variant="contained" endIcon={<SignArrow size={18} />}>
                Design your board
              </Button>
              <Button component={Link} href="/visualize" variant="outlined" sx={ghostButtonSx}>
                See it on your wall
              </Button>
            </Box>
          </Box>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, borderTop: "2px solid rgba(255,255,255,0.25)" }}>
            {studio.map((s, i) => (
              <Box component="li" key={s.title} sx={{ display: "flex", gap: 2.5, py: 3, borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
                <Roundel>{String(i + 1).padStart(2, "0")}</Roundel>
                <Box>
                  <Typography component="h3" sx={{ ...signType.plate, fontSize: { xs: 21, md: 24 }, color: brand.white }}>{s.title}</Typography>
                  <Typography sx={{ mt: 0.75, color: "rgba(255,255,255,0.78)" }}>{s.body}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 5. Signature boards */}
      {featured.length ? (
        <Box component="section" sx={{ bgcolor: brand.white, py: { xs: 8, md: 12 } }}>
          <Box sx={{ ...pageMax, ...pagePad }}>
            <SectionHead label="Signature boards" title="Where to start." body="Four 3×4 ft boards that show the range: superior, classic, pine wood and ceramic steel." />
            <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
              {featured.map((p) => (
                <Box key={p.id} component={Link} href={`/products/${p.id}`} sx={{ display: "flex", flexDirection: "column", bgcolor: brand.ivory, color: brand.charcoal, "&:hover .t": { textDecoration: "underline", textUnderlineOffset: 3 } }}>
                  <Box sx={{ position: "relative", aspectRatio: "1", bgcolor: brand.white, m: 1 }}>
                    <Image src={p.images[0]} alt="" fill sizes="(max-width: 1200px) 50vw, 25vw" style={{ objectFit: "contain", padding: "8%" }} />
                  </Box>
                  <Box sx={{ p: { xs: 1.5, md: 2.25 }, pt: 1 }}>
                    <Typography sx={{ ...signType.code, fontSize: 11.5, color: brand.forest }}>{p.sku}</Typography>
                    <Typography className="t" sx={{ ...signType.plate, fontSize: { xs: 15, md: 18 }, mt: 0.5 }}>{p.shortName}</Typography>
                    <Typography sx={{ ...signType.plate, fontSize: { xs: 16, md: 19 }, mt: 1, fontVariantNumeric: "tabular-nums" }}>{p.price > 0 ? formatPrice(p.price) : "On quote"}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      ) : null}

      {/* 6. Spaces */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ ...pageMax, ...pagePad }}>
          <SectionHead label="Spaces" title="Built around the room." action={{ href: "/solutions", label: "See every space" }} />
          <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
            {spaces.map((s, i) => (
              <Box key={s.name} component={Link} href={s.href} sx={{ position: "relative", display: "block", aspectRatio: { xs: "4 / 3", md: "3 / 4" }, overflow: "hidden", color: brand.white, "&:hover img": { transform: "scale(1.04)" }, "&:hover .bar": { transform: "scaleX(1)" } }}>
                <Image src={s.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" style={{ objectFit: "cover", transition: "transform 700ms cubic-bezier(0.16,1,0.3,1)" }} />
                <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,46,34,0.92) 0%, rgba(11,46,34,0.05) 60%)" }} />
                <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, p: { xs: 2.5, md: 3 } }}>
                  <Typography sx={{ ...signType.code, fontSize: 12.5, color: peach }}>{String(i + 1).padStart(2, "0")}</Typography>
                  <Typography component="h3" sx={{ ...signType.plate, fontSize: { xs: 26, md: 30 }, color: brand.white, mt: 0.5 }}>{s.name}</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5 }}>{s.line}</Typography>
                  <Box className="bar" sx={{ mt: 2, height: 3, bgcolor: brand.signal, transform: "scaleX(0.18)", transformOrigin: "left", transition: "transform 420ms cubic-bezier(0.16,1,0.3,1)" }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 7. The company: verified facts only */}
      <Box component="section" id="company" aria-labelledby="company-title" sx={{ bgcolor: brand.white, py: { xs: 8, md: 12 }, scrollMarginTop: 100 }}>
        <Box sx={{ ...pageMax, ...pagePad }}>
          <Box sx={{ display: "grid", gap: { xs: 6, md: 8 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1.2fr)" } }}>
            <Box>
              <Label>The company</Label>
              <Typography id="company-title" component="h2" sx={{ ...signType.title, mt: 2, color: brand.charcoal, maxWidth: "14ch" }}>
                {company.legalName}
              </Typography>
              <Typography sx={{ mt: 1.5, ...signType.plate, fontSize: 17, color: brand.body }}>{company.parent}</Typography>
              <Typography component="h3" sx={{ ...signType.code, fontSize: 13, color: brand.muted, mt: 5, pb: 1.25, borderBottom: `2px solid ${brand.charcoal}` }}>
                CERTIFICATIONS
              </Typography>
              <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {company.certifications.map((c) => (
                  <Box component="li" key={c} sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.5, py: 1, border: `1px solid ${brand.line}`, ...signType.plate, fontSize: 14.5 }}>
                    <SignTick size={14} color={brand.forest} />
                    {c}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box>
              <Typography component="h3" sx={{ ...signType.code, fontSize: 13, color: brand.muted, pb: 1.25, borderBottom: `2px solid ${brand.charcoal}` }}>
                WHERE TO FIND US
              </Typography>
              <Box component="dl" sx={{ m: 0 }}>
                {company.locations.map((l) => (
                  <Box key={l.label} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "180px 1fr" }, gap: { xs: 0.25, sm: 2 }, py: 2, borderBottom: `1px solid ${brand.line}` }}>
                    <Box component="dt" sx={{ ...signType.plate, fontSize: 16, color: brand.charcoal }}>{l.label}</Box>
                    <Box component="dd" sx={{ m: 0, color: brand.body }}>{l.address}</Box>
                  </Box>
                ))}
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "180px 1fr" }, gap: { xs: 0.25, sm: 2 }, py: 2, borderBottom: `1px solid ${brand.line}` }}>
                  <Box component="dt" sx={{ ...signType.plate, fontSize: 16, color: brand.charcoal }}>Contact</Box>
                  <Box component="dd" sx={{ m: 0, display: "flex", flexWrap: "wrap", gap: 2 }}>
                    <Box component="a" href={`tel:${company.phone}`} sx={{ color: brand.forest, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>{company.phoneDisplay}</Box>
                    <Box component="a" href={`mailto:${company.email}`} sx={{ color: brand.forest, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>{company.email}</Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 8. Programmes + closing */}
      <Box component="section" id="start-project" aria-labelledby="start-title" sx={{ bgcolor: brand.forestDeep, color: brand.white, scrollMarginTop: 100 }}>
        <StripeSpine height={6} />
        <Box sx={{ ...pageMax, ...pagePad, py: { xs: 8, md: 12 } }}>
          <Label light>Work with us</Label>
          <Typography id="start-title" component="h2" sx={{ ...signType.mega, mt: 2, color: brand.white, maxWidth: "14ch" }}>
            Let&apos;s plan your space.
          </Typography>
          <Box sx={{ mt: { xs: 5, md: 7 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, borderTop: "2px solid rgba(255,255,255,0.25)" }}>
            {company.programmes.map((p, i) => (
              <Box key={p.title} sx={{ py: 3.5, pr: { md: 4 }, pl: { md: i ? 4 : 0 }, borderLeft: { md: i ? "1px solid rgba(255,255,255,0.14)" : 0 }, borderBottom: { xs: "1px solid rgba(255,255,255,0.14)", md: 0 }, display: "flex", flexDirection: "column" }}>
                <Typography component="h3" sx={{ ...signType.plate, fontSize: 22, color: brand.white }}>{p.title}</Typography>
                <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.78)", flex: 1 }}>{p.body}</Typography>
                <Box
                  component={p.external ? "a" : Link}
                  href={p.href}
                  {...(p.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  sx={{ mt: 2.5, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 1, ...signType.plate, fontSize: 15.5, color: peach, borderBottom: `2px solid ${brand.signal}`, pb: 0.5, "&:hover": { color: brand.white } }}
                >
                  {p.cta}
                  <SignArrow size={15} color={brand.signal} />
                  {p.external ? <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}> (opens in a new tab)</Box> : null}
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: { xs: 5, md: 7 } }}>
            <Button component={Link} href="/quote" variant="contained" size="large" endIcon={<SignArrow size={18} />}>
              Start a project
            </Button>
            <Button component="a" href={`tel:${company.phone}`} variant="outlined" size="large" sx={ghostButtonSx}>
              Call {company.phoneDisplay}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

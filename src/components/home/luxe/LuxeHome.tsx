import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/components/Link";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { SignArrow, SignTick, pageMax, pagePad, signType } from "@/components/home/directory/sign";
import { colours, frames, getFeaturedProducts, getProductById } from "@/data/catalogue";
import { company } from "@/data/company";
import { images } from "@/data/images";
import { formatPrice } from "@/lib/format";
import { brandTokens as brand } from "@/theme/brandTokens";

const stage = brand.stage;

const categories = [
  { title: "Magnetic whiteboards", image: images.magneticWhiteboard, href: "/products?category=magnetic-whiteboard" },
  { title: "Non-magnetic", image: images.nonMagneticWhiteboard, href: "/products?category=non-magnetic-whiteboard" },
  { title: "Ceramic steel", image: images.magneticWhiteboardAlt, href: "/products/scuv90120" },
  { title: "Notice boards", image: images.noticeBoard, href: "/products?category=notice-board" },
  { title: "Combination", image: images.combinationBoard, href: "/products?category=combination-board" },
  { title: "Stands", image: images.whiteboardStand, href: "/products?category=stand" },
];

const spaces = [
  { name: "Office", line: "Planning and daily operations", image: images.wallModernOffice, href: "/solutions/office" },
  { name: "Meeting room", line: "Presentations and decisions", image: images.wallMeetingRoom, href: "/solutions/meeting-room" },
  { name: "Classroom", line: "Teaching and learning", image: images.wallClassroom, href: "/solutions/classroom" },
];

function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: { href: string; label: string } }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: { xs: 4, md: 6 } }}>
      <Box>
        {eyebrow ? <Typography sx={{ fontSize: 14, fontWeight: 500, color: brand.forest, mb: 1.25 }}>{eyebrow}</Typography> : null}
        <Typography component="h2" sx={{ ...signType.title, color: brand.charcoal, maxWidth: "18ch", textWrap: "balance" }}>
          {title}
        </Typography>
      </Box>
      {action ? <TextLink href={action.href}>{action.label}</TextLink> : null}
    </Box>
  );
}

function TextLink({ href, children, light }: { href: string; children: React.ReactNode; light?: boolean }) {
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        fontSize: 15.5,
        fontWeight: 500,
        color: light ? brand.white : brand.forest,
        "& svg": { transition: "transform 240ms cubic-bezier(0.16,1,0.3,1)" },
        "&:hover svg": { transform: "translateX(3px)" },
        "&:hover": { textDecoration: "underline", textUnderlineOffset: 4 },
      }}
    >
      {children}
      <SignArrow size={16} />
    </Box>
  );
}

/* ───────────────────────────── Hero ───────────────────────────── */
function Hero() {
  const product = getProductById("smwbpcb90120");
  return (
    <Box component="section" aria-labelledby="home-title" sx={{ bgcolor: brand.white, overflow: "hidden" }}>
      <Box sx={{ ...pageMax, ...pagePad, pt: { xs: 6, md: 10 }, textAlign: "center" }}>
        <Reveal variant="fade">
          <Typography sx={{ fontSize: { xs: 14, md: 15 }, fontWeight: 500, color: brand.forest }}>
            Made in our factory in Delhi
          </Typography>
          <Typography id="home-title" component="h1" sx={{ ...signType.mega, mt: 2, color: brand.charcoal, mx: "auto", maxWidth: "14ch", textWrap: "balance" }}>
            Boards, beautifully made.
          </Typography>
          <Typography sx={{ mt: { xs: 2.5, md: 3 }, mx: "auto", maxWidth: 560, color: brand.body, fontSize: { xs: 17, md: 20 }, lineHeight: 1.55 }}>
            Whiteboards, notice boards and stands for the places where people work, learn and decide.
          </Typography>
          <Box sx={{ mt: { xs: 3.5, md: 4.5 }, display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center" }}>
            <Button component={Link} href="/products" variant="contained" size="large">
              Shop the collection
            </Button>
            <Button component={Link} href="/customize" variant="outlined" size="large">
              Design your own
            </Button>
          </Box>
        </Reveal>
      </Box>

      <Box sx={{ ...pageMax, px: { xs: 1.5, sm: 3, md: 4 }, mt: { xs: 6, md: 9 }, pb: { xs: 2, md: 4 } }}>
        <Reveal variant="scale">
          <Box sx={{ position: "relative", borderRadius: { xs: "24px", md: "36px" }, overflow: "hidden", aspectRatio: { xs: "4 / 5", sm: "16 / 10", md: "21 / 9" }, bgcolor: stage }}>
            <Image src={images.heroWorkspace} alt="A whiteboard in a bright meeting space" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
            {product ? (
              <Box
                component={Link}
                href={`/products/${product.id}`}
                sx={{
                  position: "absolute",
                  left: { xs: 12, md: 32 },
                  right: { xs: 12, md: "auto" },
                  bottom: { xs: 12, md: 32 },
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 1.25,
                  pr: 2.5,
                  borderRadius: "20px",
                  bgcolor: "rgba(255,255,255,0.86)",
                  backdropFilter: "saturate(180%) blur(20px)",
                  WebkitBackdropFilter: "saturate(180%) blur(20px)",
                  color: brand.charcoal,
                  boxShadow: "0 20px 50px -20px rgba(20,25,23,0.35)",
                  transition: "transform 300ms cubic-bezier(0.16,1,0.3,1)",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <Box sx={{ position: "relative", width: 64, height: 64, flexShrink: 0, borderRadius: "14px", bgcolor: brand.white, overflow: "hidden" }}>
                  <Image src={product.images[0]} alt="" fill sizes="64px" style={{ objectFit: "contain", padding: 6 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-0.01em" }}>{product.shortName}</Typography>
                  <Typography sx={{ fontSize: 14, color: brand.body }}>
                    {product.price > 0 ? `From ${formatPrice(product.price)}` : "On quote"} · View
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </Box>
        </Reveal>
      </Box>
    </Box>
  );
}

/* ─────────────────────────── Categories ─────────────────────────── */
function Categories() {
  return (
    <Box component="section" aria-labelledby="cat-title" sx={{ bgcolor: brand.white, py: { xs: 8, md: 12 } }}>
      <Box sx={{ ...pageMax, ...pagePad }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: { xs: 4, md: 5 } }}>
          <Typography id="cat-title" component="h2" sx={{ ...signType.title, color: brand.charcoal }}>
            Shop by category
          </Typography>
          <TextLink href="/products">View all products</TextLink>
        </Box>
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
            display: "grid",
            gap: { xs: 1.5, md: 2 },
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(6, minmax(0, 1fr))" },
          }}
        >
          {categories.map((c, i) => (
            <Box component="li" key={c.title}>
              <Reveal delay={i * 50}>
                <Box component={Link} href={c.href} sx={{ display: "block", color: brand.charcoal, "&:hover img": { transform: "scale(1.05)" }, "&:hover .t": { color: brand.forest } }}>
                  <Box sx={{ position: "relative", aspectRatio: "1", borderRadius: "20px", overflow: "hidden", bgcolor: stage, border: `1px solid ${brand.line}`, transition: "box-shadow 300ms cubic-bezier(0.16,1,0.3,1)", "a:hover &": { boxShadow: "0 24px 48px -28px rgba(20,25,23,0.3)" } }}>
                    <Image src={c.image} alt="" fill sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 16vw" style={{ objectFit: "contain", padding: "14%", transition: "transform 600ms cubic-bezier(0.16,1,0.3,1)" }} />
                  </Box>
                  <Typography className="t" sx={{ mt: 1.5, fontSize: 15.5, fontWeight: 500, textAlign: "center", transition: "color 160ms" }}>
                    {c.title}
                  </Typography>
                </Box>
              </Reveal>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ─────────────────────────── Featured ─────────────────────────── */
function Featured() {
  const featured = getFeaturedProducts().slice(0, 4);
  if (!featured.length) return null;
  return (
    <Box component="section" sx={{ bgcolor: brand.ivory, py: { xs: 8, md: 12 } }}>
      <Box sx={{ ...pageMax, ...pagePad }}>
        <SectionHeader eyebrow="Featured" title="Popular boards for offices and schools." action={{ href: "/products", label: "Shop all" }} />
        <Box sx={{ display: "grid", columnGap: { xs: 1.5, md: 3 }, rowGap: { xs: 4, md: 3 }, gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" } }}>
          {featured.map((product, i) => (
            <Reveal key={product.id} delay={i * 60} sx={{ height: "100%" }}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ─────────────────────────── Spaces ─────────────────────────── */
function Spaces() {
  const [lead, ...rest] = spaces;
  const tile = (s: (typeof spaces)[number], large?: boolean) => (
    <Box
      component={Link}
      href={s.href}
      sx={{
        position: "relative",
        display: "block",
        height: "100%",
        minHeight: large ? { xs: 360, md: 560 } : { xs: 260, md: 0 },
        borderRadius: "28px",
        overflow: "hidden",
        color: brand.white,
        "&:hover img": { transform: "scale(1.04)" },
        "&:hover .cta": { gap: 1.25 },
      }}
    >
      <Image src={s.image} alt="" fill sizes={large ? "(max-width: 900px) 100vw, 60vw" : "(max-width: 900px) 100vw, 40vw"} style={{ objectFit: "cover", transition: "transform 900ms cubic-bezier(0.16,1,0.3,1)" }} />
      <Box aria-hidden sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,14,12,0.62) 0%, rgba(10,14,12,0) 55%)" }} />
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, p: { xs: 3, md: 4 } }}>
        <Typography component="h3" sx={{ ...signType.plate, fontSize: large ? { xs: 30, md: 40 } : { xs: 26, md: 28 }, letterSpacing: "-0.03em", color: brand.white }}>
          {s.name}
        </Typography>
        <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,0.85)", fontSize: 15.5 }}>{s.line}</Typography>
        <Box className="cta" sx={{ color: "#FFFFFF", mt: 2, display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 15, fontWeight: 500, transition: "gap 240ms cubic-bezier(0.16,1,0.3,1)" }}>
          Explore <SignArrow size={16} />
        </Box>
      </Box>
    </Box>
  );
  return (
    <Box component="section" sx={{ bgcolor: brand.white, py: { xs: 8, md: 12 } }}>
      <Box sx={{ ...pageMax, ...pagePad }}>
        <SectionHeader eyebrow="Spaces" title="Made for the room it lives in." action={{ href: "/solutions", label: "All spaces" }} />
        <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr" }, gridTemplateRows: { md: "1fr 1fr" } }}>
          <Box sx={{ gridRow: { md: "1 / 3" } }}>{tile(lead, true)}</Box>
          {rest.map((s) => (
            <Box key={s.name}>{tile(s)}</Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

/* ─────────────────────────── Studio ─────────────────────────── */
function Studio() {
  const steps = [
    { title: "Design your board", body: `Size, ${frames.length} frame finishes, ${colours.length} board colours, logo and features.`, href: "/customize", cta: "Start designing" },
    { title: "See it on your wall", body: "Upload a photo of your room and place the board to scale.", href: "/visualize", cta: "Open the visualiser" },
    { title: "Order or get a quote", body: "Listed sizes go to cart. Custom and bulk orders are quoted.", href: "/quote", cta: "Request a quote" },
  ];
  return (
    <Box component="section" aria-labelledby="studio-title" sx={{ bgcolor: brand.ivory, py: { xs: 8, md: 12 } }}>
      <Box sx={{ ...pageMax, ...pagePad, display: "grid", gap: { xs: 5, md: 8 }, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1.1fr)" }, alignItems: "center" }}>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: brand.forest, mb: 1.25 }}>The studio</Typography>
          <Typography id="studio-title" component="h2" sx={{ ...signType.title, color: brand.charcoal, maxWidth: "14ch" }}>
            Design it. See it. Order it.
          </Typography>
          <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, mt: { xs: 4, md: 5 } }}>
            {steps.map((s, i) => (
              <Box component="li" key={s.title} sx={{ py: 3, borderTop: `1px solid ${brand.line}`, display: "grid", gridTemplateColumns: "40px 1fr", gap: 1 }}>
                <Typography sx={{ fontSize: 15, color: brand.muted, fontVariantNumeric: "tabular-nums", pt: 0.25 }}>{`0${i + 1}`}</Typography>
                <Box>
                  <Typography component="h3" sx={{ ...signType.plate, fontSize: 21, color: brand.charcoal }}>{s.title}</Typography>
                  <Typography sx={{ mt: 0.5, color: brand.body }}>{s.body}</Typography>
                  <Box sx={{ mt: 1.25 }}>
                    <TextLink href={s.href}>{s.cta}</TextLink>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Reveal variant="scale">
          <Box sx={{ position: "relative", aspectRatio: { xs: "4 / 3", md: "4 / 5" }, borderRadius: "32px", overflow: "hidden", bgcolor: brand.white }}>
            <Image src={images.heroWhiteboard} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "contain", padding: "12%" }} />
            <Box sx={{ position: "absolute", top: 24, left: 24, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {["3 × 4 ft", "Aluminium frame", "Magnetic"].map((chip) => (
                <Box key={chip} sx={{ px: 1.75, py: 0.75, borderRadius: 99, bgcolor: brand.ivory, fontSize: 13.5, fontWeight: 500, color: brand.charcoal }}>
                  {chip}
                </Box>
              ))}
            </Box>
          </Box>
        </Reveal>
      </Box>
    </Box>
  );
}

/* ─────────────────────────── Trust ─────────────────────────── */
function Trust() {
  const facts = [
    { k: "Made in Delhi", v: "At our factory in Bawana" },
    { k: "ISO 9001:2015", v: "Certified quality management" },
    { k: "GeM registered", v: "OEM on the Government e-Marketplace" },
    { k: "Bulk and custom", v: "Quoted for offices and institutions" },
  ];
  return (
    <Box component="section" aria-label="About OBASIX" sx={{ bgcolor: brand.white, py: { xs: 7, md: 10 } }}>
      <Box sx={{ ...pageMax, ...pagePad, display: "grid", gap: { xs: 2.5, md: 2 }, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
        {facts.map((f) => (
          <Box key={f.k} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Box sx={{ mt: 0.25, width: 28, height: 28, borderRadius: "50%", bgcolor: brand.paleGreen, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <SignTick size={16} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: brand.charcoal }}>{f.k}</Typography>
              <Typography sx={{ fontSize: 14.5, color: brand.body, mt: 0.25 }}>{f.v}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ─────────────────────────── Closing ─────────────────────────── */
function Closing() {
  return (
    <Box component="section" aria-labelledby="close-title" sx={{ bgcolor: brand.white, pb: { xs: 6, md: 10 } }}>
      <Box sx={{ ...pageMax, px: { xs: 1.5, sm: 3, md: 4 } }}>
        <Box sx={{ borderRadius: { xs: "28px", md: "40px" }, bgcolor: brand.forestDeep, color: brand.white, px: { xs: 3, md: 10 }, py: { xs: 7, md: 11 }, textAlign: "center" }}>
          <Typography id="close-title" component="h2" sx={{ ...signType.title, color: brand.white, mx: "auto", maxWidth: "16ch" }}>
            Planning a larger space?
          </Typography>
          <Typography sx={{ mt: 2, mx: "auto", maxWidth: 520, color: "rgba(255,255,255,0.78)", fontSize: { md: 18 } }}>
            Tell us the rooms, sizes and quantities. Our team will send a quotation for your project.
          </Typography>
          <Box sx={{ mt: 4, display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center" }}>
            <Button component={Link} href="/quote" variant="contained" size="large" sx={{ backgroundColor: "#FFFFFF !important", borderColor: "#FFFFFF !important", color: "#1B1D1C !important", WebkitTextFillColor: "#1B1D1C !important", "&:hover": { backgroundColor: "#ECECE8 !important" } }}>
              Request a quote
            </Button>
            <Box component="a" href={`tel:${company.phone}`} sx={{ display: "inline-flex", alignItems: "center", px: 3, minHeight: 52, borderRadius: 99, border: "1px solid rgba(255,255,255,0.35)", color: brand.white, fontWeight: 600, "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}>
              Call {company.phoneDisplay}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function LuxeHome() {
  return (
    <>
      <Hero />
      <Categories />
      <Featured />
      <Spaces />
      <Studio />
      <Trust />
      <Closing />
    </>
  );
}

"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import NextLink from "@/components/Link";
import { brandTokens as brand } from "@/theme/brandTokens";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { AccountMenu } from "./AccountMenu";
import { MegaMenu } from "./MegaMenu";

const nav = [
  { href: "/products", label: "Collections", mega: true },
  { href: "/solutions", label: "Spaces" },
  { href: "/customize", label: "Customise" },
  { href: "/visualize", label: "Visualise" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const megaId = useId();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const leaveTimer = useRef<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reset transient nav UI when the route changes (React: adjust state during render).
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    setMobileOpen(false);
    setMegaOpen(false);
    setProductsOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMegaOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const navEl = document.querySelector('[aria-label="Primary"]');
      if (navEl && target && !navEl.contains(target)) setMegaOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [megaOpen]);

  const clearLeave = () => {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = null;
  };

  const openMega = () => {
    clearLeave();
    setMegaOpen(true);
  };

  const scheduleCloseMega = () => {
    clearLeave();
    leaveTimer.current = window.setTimeout(() => setMegaOpen(false), 160);
  };

  const activateMega = () => {
    clearLeave();
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setMegaOpen(true);
      return;
    }
    setMegaOpen((open) => !open);
  };

  const search = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/products${params.toString() ? `?${params}` : ""}`);
    setSearchOpen(false);
  };

  const navButtonSx = {
    color: brand.charcoal,
    fontSize: { lg: 10.5, xl: 11 },
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    px: { xs: 1.1, lg: 1.4, xl: 1.7 },
    py: 1,
    minWidth: 0,
    minHeight: 44,
    borderRadius: 0,
    borderBottom: "1px solid transparent",
    bgcolor: "transparent",
    transition: "color 0.18s ease, border-color 0.18s ease",
    "&:hover": {
      bgcolor: "transparent",
      color: brand.forest,
    },
    "&:focus-visible": {
      outline: `2px solid ${brand.forest}`,
      outlineOffset: 2,
    },
  } as const;

  const iconBtnSx = {
    color: "text.primary",
    transition: "color 0.18s ease, background-color 0.18s ease",
    width: 40,
    height: 40,
    borderRadius: 1,
    "&:hover": { color: "primary.main", bgcolor: "primary.light" },
    "&:focus-visible": {
      outline: "2px solid",
      outlineColor: "primary.main",
      outlineOffset: 2,
    },
  } as const;

  return (
    <AppBar
      position="sticky"
      sx={{
        zIndex: (t) => t.zIndex.appBar,
        bgcolor: brand.white,
        borderBottom: `1px solid ${brand.line}`,
        backdropFilter: scrolled ? "blur(10px)" : "none",
        transition: "box-shadow 0.22s ease",
        boxShadow: scrolled ? "0 6px 24px rgba(37,42,38,0.055)" : "none",
      }}
    >
      <Box sx={{ bgcolor: brand.forestDeep, color: brand.ivory }}>
        <Container
          maxWidth={false}
          sx={{ maxWidth: 1440, px: { xs: 2.5, sm: 4, md: 6, lg: 8 } }}
        >
          <Stack
            direction="row"
            sx={{
              minHeight: 30,
              alignItems: "center",
              justifyContent: { xs: "center", sm: "space-between" },
              gap: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: 9.5, sm: 10 },
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(247,245,240,0.78)",
                textAlign: "center",
              }}
            >
              Made-to-measure boards, planned around your space
            </Typography>
            <Box
              component={NextLink}
              href="/quote"
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                alignItems: "center",
                minHeight: 32,
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: brand.oak,
                transition: "color 0.2s ease",
                "&:hover": { color: brand.ivory },
                "&:focus-visible": { outline: `1px solid ${brand.oak}`, outlineOffset: 2 },
              }}
            >
              Talk to us
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2.5, sm: 4, md: 6, lg: 8 } }}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 58, sm: 64, md: 72 },
            gap: { xs: 1, md: 2 },
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
          }}
        >
          <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", minWidth: 0 }}>
            <IconButton
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              size="small"
              sx={{ display: { lg: "none" }, color: "text.primary", mr: 0.25 }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
            <Box
              component={NextLink}
              href="/"
              aria-label="OBASIX home"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifySelf: "start",
                flexShrink: 0,
                textDecoration: "none",
                "&:focus-visible": {
                  outline: `2px solid ${brand.forest}`,
                  outlineOffset: 4,
                },
              }}
            >
              <Image
                src="/assets/obasix-logo-official.png"
                alt="OBASIX"
                width={550}
                height={182}
                priority
                sizes="(max-width: 900px) 108px, 146px"
                style={{ display: "block", width: "clamp(108px, 11vw, 146px)", height: "auto" }}
              />
            </Box>
          </Stack>

          <Box
            component="nav"
            aria-label="Primary"
            onMouseLeave={scheduleCloseMega}
            sx={{
              display: { xs: "none", lg: "flex" },
              justifyContent: "center",
              position: "relative",
            }}
          >
            <Stack direction="row" spacing={0.15} sx={{ alignItems: "center" }}>
              {nav.map((item) => {
                const active =
                  !item.mega &&
                  (pathname === item.href || pathname.startsWith(`${item.href}/`));
                return item.mega ? (
                  <Button
                    key={item.label}
                    type="button"
                    aria-expanded={megaOpen}
                    aria-controls={megaId}
                    onClick={activateMega}
                    onMouseEnter={openMega}
                    onFocus={openMega}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          fontSize: 15,
                          transition: "transform 0.2s",
                          transform: megaOpen ? "rotate(180deg)" : "none",
                        }}
                      />
                    }
                    sx={{
                      ...navButtonSx,
                      color: megaOpen || pathname.startsWith("/products") ? "primary.main" : "text.primary",
                      borderBottomColor:
                        megaOpen || pathname.startsWith("/products") ? "primary.main" : "transparent",
                    }}
                  >
                    {item.label}
                  </Button>
                ) : (
                  <Button
                    key={item.label}
                    component={NextLink}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onMouseEnter={() => {
                      if (megaOpen) scheduleCloseMega();
                    }}
                    onFocus={() => setMegaOpen(false)}
                    sx={{
                      ...navButtonSx,
                      color: active ? "primary.main" : "text.primary",
                      borderBottomColor: active ? "primary.main" : "transparent",
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Stack>

            <Box
              id={megaId}
              hidden={!megaOpen}
              onMouseEnter={openMega}
              sx={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 12px)",
                zIndex: 50,
                width: "min(1080px, calc(100vw - 48px))",
              }}
            >
              {megaOpen ? <MegaMenu onNavigate={() => setMegaOpen(false)} /> : null}
            </Box>
          </Box>

          <Stack
            direction="row"
            spacing={0.15}
            sx={{ alignItems: "center", justifyContent: "flex-end", color: "text.primary" }}
          >
            <Collapse in={searchOpen} orientation="horizontal" sx={{ display: { xs: "none", md: "block" } }}>
              <Box
                component="form"
                onSubmit={search}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: 200,
                  borderBottom: 1,
                  borderColor: "divider",
                  mr: 0.5,
                }}
              >
                <InputBase
                  inputRef={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search catalogue"
                  inputProps={{ "aria-label": "Search products" }}
                  sx={{ flex: 1, fontSize: 13, py: 0.5 }}
                />
              </Box>
            </Collapse>
            <IconButton
              aria-label="Search"
              size="small"
              onClick={() => setSearchOpen((open) => !open)}
              sx={{ ...iconBtnSx, display: { xs: "none", md: "inline-flex" } }}
            >
              {searchOpen ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
            </IconButton>
            <IconButton
              component={NextLink}
              href="/account/wishlist"
              aria-label="Wishlist"
              size="small"
              sx={iconBtnSx}
            >
              <Badge color="primary" variant="dot" invisible={wishCount <= 0}>
                <FavoriteBorderIcon fontSize="small" />
              </Badge>
            </IconButton>
            <IconButton
              component={NextLink}
              href="/cart"
              aria-label="Cart"
              size="small"
              sx={iconBtnSx}
            >
              <Badge badgeContent={itemCount > 0 ? itemCount : 0} color="primary" max={99}>
                <ShoppingBagOutlinedIcon fontSize="small" />
              </Badge>
            </IconButton>
            <Box
              aria-hidden
              sx={{
                display: { xs: "none", sm: "block" },
                width: "1px",
                height: 22,
                bgcolor: brand.line,
                mx: 0.75,
              }}
            />
            <Box sx={{ display: { xs: "none", sm: "block" } }} aria-label="Profile">
              <AccountMenu />
            </Box>
          </Stack>
        </Toolbar>
      </Container>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        slotProps={{
          paper: { sx: { width: "min(100%, 360px)", bgcolor: "background.paper" } },
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Box
              component={NextLink}
              href="/"
              aria-label="OBASIX home"
              onClick={() => setMobileOpen(false)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
                "&:focus-visible": { outline: `2px solid ${brand.forest}`, outlineOffset: 3 },
              }}
            >
              <Image
                src="/assets/obasix-logo-official.png"
                alt="OBASIX"
                width={550}
                height={182}
                sizes="116px"
                style={{ display: "block", width: 116, height: "auto" }}
              />
            </Box>
            <IconButton aria-label="Close menu" onClick={() => setMobileOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Box component="form" onSubmit={search} sx={{ display: "flex", mt: 2, borderBottom: 1, borderColor: "divider" }}>
            <InputBase
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search boards and accessories"
              inputProps={{ "aria-label": "Search products" }}
              sx={{ flex: 1, fontSize: 14, py: 1 }}
            />
            <IconButton type="submit" aria-label="Search" size="small">
              <SearchIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Stack component="nav" aria-label="Mobile" spacing={0} sx={{ px: 1.5, py: 1.5 }}>
          {nav.map((item) =>
            item.mega ? (
              <Box key={item.label}>
                <Button
                  fullWidth
                  onClick={() => setProductsOpen((open) => !open)}
                  aria-expanded={productsOpen}
                  endIcon={
                    <ExpandMoreIcon
                      sx={{ transition: "transform 0.2s", transform: productsOpen ? "rotate(180deg)" : "none" }}
                    />
                  }
                  sx={{ justifyContent: "space-between", py: 1.5, color: brand.charcoal, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}
                >
                  Collections
                </Button>
                <Collapse in={productsOpen}>
                  <Box sx={{ pb: 1.5, pl: 0.5 }}>
                    <MegaMenu compact onNavigate={() => setMobileOpen(false)} />
                  </Box>
                </Collapse>
              </Box>
            ) : (
              <Button
                key={item.label}
                component={NextLink}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                sx={{ justifyContent: "flex-start", py: 1.5, color: brand.charcoal, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                {item.label}
              </Button>
            ),
          )}
          <Box sx={{ borderTop: 1, borderColor: "divider", mt: 1, pt: 1 }}>
            <AccountMenu mobile />
          </Box>
        </Stack>
      </Drawer>
    </AppBar>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Badge from "@mui/material/Badge";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import NextLink from "@/components/Link";
import { useAIChat } from "@/context/AIChatContext";
import { useCart } from "@/context/CartContext";

export function MobileNav() {
  const pathname = usePathname();
  const { openChat } = useAIChat();
  const { itemCount } = useCart();

  const value =
    pathname === "/"
      ? "/"
      : pathname.startsWith("/products")
        ? "/products"
        : pathname.startsWith("/customize")
          ? "/customize"
          : pathname.startsWith("/cart")
            ? "/cart"
            : false;

  return (
    <Paper
      elevation={0}
      sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        insetInline: 0,
        bottom: 0,
        zIndex: (t) => t.zIndex.appBar,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(8px)",
      }}
    >
      <BottomNavigation
        showLabels
        value={value}
        sx={{
          height: "var(--mobile-nav-h, 64px)",
          maxWidth: 512,
          mx: "auto",
          bgcolor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            fontSize: 10,
            fontWeight: 600,
            color: "text.secondary",
            "&.Mui-selected": { color: "primary.main" },
          },
          "& .MuiBottomNavigationAction-label": { fontSize: 10, fontWeight: 600 },
        }}
      >
        <BottomNavigationAction label="Home" value="/" component={NextLink} href="/" icon={<HomeOutlinedIcon />} />
        <BottomNavigationAction
          label="Collections"
          value="/products"
          component={NextLink}
          href="/products"
          icon={<GridViewOutlinedIcon />}
        />
        <BottomNavigationAction
          label="Customise"
          value="/customize"
          component={NextLink}
          href="/customize"
          icon={<TuneOutlinedIcon />}
        />
        <BottomNavigationAction label="AI" value="ai" onClick={openChat} icon={<ChatBubbleOutlinedIcon />} />
        <BottomNavigationAction
          label="Cart"
          value="/cart"
          component={NextLink}
          href="/cart"
          icon={
            <Badge badgeContent={itemCount > 0 ? itemCount : 0} color="secondary" max={99}>
              <ShoppingBagOutlinedIcon />
            </Badge>
          }
        />
      </BottomNavigation>
    </Paper>
  );
}

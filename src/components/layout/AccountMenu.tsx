"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import NextLink from "@/components/Link";
import { useAuth } from "@/context/AuthContext";

export function AccountMenu({ overHero, mobile = false }: { overHero?: boolean; mobile?: boolean }) {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!user) {
    if (mobile) {
      return (
        <Link
          component={NextLink}
          href="/login"
          sx={{
            display: "block",
            borderBottom: 1,
            borderColor: "divider",
            py: 1.75,
            fontSize: 14,
            fontWeight: 600,
            color: "text.primary",
          }}
        >
          Sign In
        </Link>
      );
    }
    return (
      <Button
        component={NextLink}
        href="/login"
        startIcon={<PersonOutlinedIcon fontSize="small" />}
        sx={{
          color: overHero ? "#fff" : "text.primary",
          fontWeight: 600,
          fontSize: 13.5,
          minWidth: 0,
          px: 1,
          borderRadius: 0,
          transition: "color 0.18s ease",
          "&:hover": { bgcolor: "transparent", color: "primary.main" },
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
          "& .MuiButton-startIcon": { mr: { xs: 0, md: 0.75 } },
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
          Sign In
        </Box>
      </Button>
    );
  }

  if (mobile) {
    return (
      <Stack spacing={0.5} sx={{ borderBottom: 1, borderColor: "divider", py: 1.5 }}>
        <Link component={NextLink} href="/account" sx={{ fontSize: 14, fontWeight: 600, color: "text.primary" }}>
          My Account
        </Link>
        <Button
          onClick={() => void signOut()}
          sx={{ justifyContent: "flex-start", px: 0, color: "primary.main", fontWeight: 600 }}
        >
          Sign Out
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <IconButton
        aria-label="Profile"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          color: overHero ? "#fff" : "text.primary",
          borderRadius: 1,
          px: 0.75,
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
        }}
      >
        <PersonOutlinedIcon fontSize="small" />
        <Typography
          variant="caption"
          sx={{
            display: { xs: "none", lg: "inline" },
            ml: 0.5,
            maxWidth: 96,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {user.name.split(" ")[0]}
        </Typography>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <MenuItem component={NextLink} href="/account" onClick={() => setAnchorEl(null)} sx={{ fontWeight: 600 }}>
          My Account
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            void signOut();
          }}
          sx={{ fontWeight: 600 }}
        >
          Sign Out
        </MenuItem>
      </Menu>
    </>
  );
}

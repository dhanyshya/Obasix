"use client";

import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Link from "@/components/Link";
import { MAX_COMPARE, useCompare } from "@/context/CompareContext";
import { getProductById } from "@/data/catalogue";

/** Floating bar listing products picked for comparison. Hidden on the compare page and checkout flows. */
export function CompareTray() {
  const { ids, remove, clear } = useCompare();
  const pathname = usePathname();
  if (ids.length === 0 || pathname.startsWith("/compare") || pathname.startsWith("/checkout")) return null;

  return (
    <Paper
      role="region"
      aria-label="Products to compare"
      elevation={8}
      sx={{
        position: "fixed",
        zIndex: 1200,
        left: { xs: 12, md: "50%" },
        right: { xs: 12, md: "auto" },
        transform: { md: "translateX(-50%)" },
        bottom: { xs: "calc(var(--mobile-nav-h, 64px) + 12px)", md: 24 },
        px: { xs: 1.5, sm: 2 },
        py: 1.25,
        borderRadius: 0,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        maxWidth: { md: 760 },
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
        Compare {ids.length}/{MAX_COMPARE}
      </Typography>
      <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 0.75, overflow: "hidden", flex: 1, minWidth: 0 }}>
        {ids.map((id) => {
          const product = getProductById(id);
          if (!product) return null;
          return (
            <Box
              key={id}
              sx={{ display: "flex", alignItems: "center", gap: 0.25, pl: 1.25, pr: 0.25, py: 0.25, borderRadius: 99, bgcolor: "primary.light", minWidth: 0 }}
            >
              <Typography variant="caption" noWrap sx={{ maxWidth: 140 }}>
                {product.shortName}
              </Typography>
              <IconButton size="small" aria-label={`Remove ${product.shortName} from comparison`} onClick={() => remove(id)}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ flex: { xs: 1, sm: "none" } }} />
      <Button size="small" color="inherit" onClick={clear}>
        Clear
      </Button>
      <Button size="small" variant="contained" component={Link} href="/compare" disabled={ids.length < 2}>
        Compare
      </Button>
    </Paper>
  );
}

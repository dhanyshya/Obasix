import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { NavLink, Outlet } from "react-router";
import type { Permission } from "../api";
import { useAuth } from "../auth";

const sections: { to: string; label: string; needs: Permission }[] = [
  { to: "/", label: "Overview", needs: "stock:read" },
  { to: "/stock", label: "Stock", needs: "stock:read" },
  { to: "/quotes", label: "Quotes", needs: "quotes:read" },
  { to: "/audit", label: "Audit log", needs: "audit:read" },
  { to: "/staff", label: "Staff", needs: "staff:manage" },
];

export function Layout() {
  const { state, can, signOut } = useAuth();
  if (state.status !== "signed-in") return null;
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 1 }}>
          <Typography component="p" sx={{ fontWeight: 800, letterSpacing: "0.06em" }}>
            OBASIX ADMIN
          </Typography>
          <Box component="nav" aria-label="Admin sections" sx={{ flex: 1 }}>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
              {sections
                .filter((s) => can(s.needs))
                .map((s) => (
                  <Button
                    key={s.to}
                    component={NavLink}
                    to={s.to}
                    end={s.to === "/"}
                    color="inherit"
                    sx={{ "&.active": { bgcolor: "rgba(255,255,255,0.18)" }, minHeight: 44 }}
                  >
                    {s.label}
                  </Button>
                ))}
            </Stack>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {state.me.email} · {state.me.role}
          </Typography>
          <Button color="inherit" variant="outlined" onClick={() => void signOut()} sx={{ minHeight: 44 }}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      <Container component="main" id="main" tabIndex={-1} maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, outline: "none" }}>
        <Outlet />
      </Container>
    </Box>
  );
}

/** Shown when a signed-in staff member opens a section their role doesn't include. */
export function NoPermission() {
  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        No access
      </Typography>
      <Typography color="text.secondary">Your role doesn't include this section. Ask an OBASIX admin if you need it.</Typography>
    </Box>
  );
}

export function RequirePermission({ needs, children }: { needs: Permission; children: React.ReactNode }) {
  const { can } = useAuth();
  return can(needs) ? <>{children}</> : <NoPermission />;
}

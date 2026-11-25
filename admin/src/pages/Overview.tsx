import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Link } from "react-router";
import { api, type AuditEntry, type Page, type StockRow, type StockState } from "../api";
import { useAuth } from "../auth";
import { describeError } from "../components/Notifications";
import { useLoad } from "../useLoad";
import { actionLabel } from "./Audit";

const tiles: { state: StockState | "tracked"; label: string; hint: string }[] = [
  { state: "tracked", label: "Tracked products", hint: "Have an on-hand count" },
  { state: "low", label: "Low stock", hint: "5 or fewer left" },
  { state: "made-to-order", label: "Out of stock", hint: "Shown as made to order" },
  { state: "untracked", label: "Not tracked", hint: "No availability shown" },
];

export function Overview() {
  const { can, state } = useAuth();
  const counts = useLoad(
    () => Promise.all(tiles.map((t) => api<Page<StockRow>>("/api/admin/stock", { query: { state: t.state, pageSize: 1 } }).then((p) => p.total))),
    "counts",
  );
  const recent = useLoad(
    () => (can("audit:read") ? api<Page<AuditEntry>>("/api/admin/audit", { query: { pageSize: 8 } }) : Promise.resolve(null)),
    "recent",
  );
  const name = state.status === "signed-in" ? state.me.name : "";

  return (
    <Box>
      <Typography component="h1" variant="h4">
        Overview
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        Welcome back{name ? `, ${name}` : ""}.
      </Typography>
      {counts.error ? <Alert severity="error">{describeError(counts.error)}</Alert> : null}
      <Box component="ul" aria-label="Stock summary" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
        {tiles.map((tile, index) => (
          <Paper component="li" key={tile.state} variant="outlined" sx={{ p: 2.5 }}>
            <Link to={`/stock?state=${tile.state}`} style={{ color: "inherit", textDecoration: "none" }}>
              <Typography variant="body2" color="text.secondary">
                {tile.label}
              </Typography>
              <Typography component="p" variant="h4" sx={{ fontWeight: 700, my: 0.5 }} data-testid={`count-${tile.state}`}>
                {counts.loading && !counts.data ? "…" : (counts.data?.[index] ?? "–")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tile.hint}
              </Typography>
            </Link>
          </Paper>
        ))}
      </Box>
      {can("audit:read") ? (
        <Paper variant="outlined" sx={{ p: 2.5, mt: 3 }}>
          <Typography component="h2" variant="h6" gutterBottom>
            Recent activity
          </Typography>
          {recent.error ? <Alert severity="error">{describeError(recent.error)}</Alert> : null}
          {recent.data?.items.length === 0 ? <Typography color="text.secondary">Nothing yet.</Typography> : null}
          <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
            {recent.data?.items.map((entry) => (
              <li key={entry.id}>
                <Typography variant="body2">
                  {new Date(entry.at).toLocaleString()} · {entry.actorEmail} · {actionLabel(entry)}
                </Typography>
              </li>
            ))}
          </Box>
          <Typography variant="body2" sx={{ mt: 1.5 }}>
            <Link to="/audit">Full audit log</Link>
          </Typography>
        </Paper>
      ) : null}
    </Box>
  );
}

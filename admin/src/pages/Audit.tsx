import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { api, type AuditEntry, type Page } from "../api";
import { describeError } from "../components/Notifications";
import { useLoad } from "../useLoad";

const show = (value: unknown) => (value === null || value === undefined ? "none" : String(value));

/** A readable sentence for a log entry. */
export function actionLabel(entry: Pick<AuditEntry, "action" | "targetType" | "targetId" | "detail">) {
  const { before, after } = entry.detail as { before?: unknown; after?: unknown };
  switch (entry.action) {
    case "stock.set":
      return `set stock for ${entry.targetId}: ${show(before)} → ${show(after)}`;
    case "stock.untrack":
      return `stopped tracking ${entry.targetId} (was ${show(before)})`;
    case "staff.grant":
      return before ? `changed ${entry.targetId} from ${show(before)} to ${show(after)}` : `gave ${entry.targetId} the ${show(after)} role`;
    case "staff.revoke":
      return `removed ${entry.targetId}'s ${show(before)} role`;
    default:
      return `${entry.action} ${entry.targetType} ${entry.targetId}`;
  }
}

const filterKeys = ["actor", "action", "targetId", "since", "until"] as const;

export function Audit() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = [25, 50, 100].includes(Number(params.get("pageSize"))) ? Number(params.get("pageSize")) : 25;
  const [form, setForm] = useState(() => Object.fromEntries(filterKeys.map((k) => [k, params.get(k) ?? ""])) as Record<(typeof filterKeys)[number], string>);
  const [formError, setFormError] = useState("");

  const query = Object.fromEntries(filterKeys.map((k) => [k, params.get(k) ?? undefined]));
  // Dates from the form are local days; the API takes instants.
  if (query.since) query.since = new Date(`${query.since}T00:00:00`).toISOString();
  if (query.until) query.until = new Date(new Date(`${query.until}T00:00:00`).getTime() + 86400000).toISOString();
  const list = useLoad(() => api<Page<AuditEntry>>("/api/admin/audit", { query: { ...query, page, pageSize } }), params.toString());

  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (form.since && form.until && form.since > form.until) return setFormError("“From” must be on or before “To”.");
    setFormError("");
    const next = new URLSearchParams();
    for (const key of filterKeys) if (form[key].trim()) next.set(key, form[key].trim());
    setParams(next, { replace: true });
  };

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Audit log
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Every change made by staff, newest first. Entries can't be edited or deleted.
      </Typography>
      <Paper component="form" onSubmit={apply} variant="outlined" sx={{ p: 2, mb: 2 }} aria-label="Filter the audit log">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
          <TextField size="small" label="Staff email" value={form.actor} onChange={(e) => setForm({ ...form, actor: e.target.value })} />
          <TextField select size="small" label="Action" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} sx={{ minWidth: 180 }}>
            <MenuItem value="">All actions</MenuItem>
            <MenuItem value="stock.">Stock changes</MenuItem>
            <MenuItem value="staff.">Staff changes</MenuItem>
          </TextField>
          <TextField size="small" label="Product or email changed" value={form.targetId} onChange={(e) => setForm({ ...form, targetId: e.target.value })} />
          <TextField size="small" type="date" label="From" value={form.since} onChange={(e) => setForm({ ...form, since: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="To" value={form.until} onChange={(e) => setForm({ ...form, until: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <Button type="submit" variant="contained">
            Apply
          </Button>
          <Button
            onClick={() => {
              setForm({ actor: "", action: "", targetId: "", since: "", until: "" });
              setParams(new URLSearchParams(), { replace: true });
            }}
          >
            Clear
          </Button>
        </Stack>
        {formError ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formError}
          </Alert>
        ) : null}
      </Paper>
      {list.error ? <Alert severity="error" sx={{ mb: 2 }}>{describeError(list.error)}</Alert> : null}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label="Audit log entries" aria-busy={list.loading}>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Who</TableCell>
                <TableCell>What</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data?.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.at).toLocaleString()}</TableCell>
                  <TableCell>
                    {entry.actorEmail}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {entry.actorRole} · {entry.ip}
                    </Typography>
                  </TableCell>
                  <TableCell>{actionLabel(entry)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {entry.requestId.slice(0, 12)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {list.data && list.data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">No entries match.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={list.data?.total ?? 0}
          page={page - 1}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[25, 50, 100]}
          onPageChange={(_, next) => {
            const p = new URLSearchParams(params);
            p.set("page", String(next + 1));
            setParams(p, { replace: true });
          }}
          onRowsPerPageChange={(e) => {
            const p = new URLSearchParams(params);
            p.set("pageSize", e.target.value);
            p.delete("page");
            setParams(p, { replace: true });
          }}
        />
      </Paper>
    </Box>
  );
}

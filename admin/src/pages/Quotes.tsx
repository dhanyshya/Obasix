import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
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
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { api, type Page, type QuoteSummary } from "../api";
import { describeError } from "../components/Notifications";
import { useLoad } from "../useLoad";

// Same list as the site's quote form (src/lib/quotes/schema.ts).
export const boardTypes = [
  "Magnetic Whiteboard",
  "Non-Magnetic Whiteboard",
  "Notice Board",
  "Pin-up Board",
  "Combination Board",
  "Chalk Board",
  "Glass Board",
  "Felt Pin-up Board",
  "Fabric Pin-up Board",
  "Cork Pin-up Board",
  "Planning Board",
  "OEM / Private Label",
  "Acoustic Panel",
  "Illuminated Sign",
  "Modular Display System",
  "Interactive Display",
  "Custom Board",
  "Nameplate / Signage",
];

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Local calendar day → the instant it starts (and, for "to", the instant the next day starts). */
export function dayRange(from: string, to: string) {
  const start = from ? new Date(`${from}T00:00:00`).toISOString() : undefined;
  const end = to ? new Date(new Date(`${to}T00:00:00`).getTime() + 86_400_000).toISOString() : undefined;
  return { since: start, until: end };
}

const filterKeys = ["q", "boardType", "attachment", "from", "to"] as const;
type Filters = Record<(typeof filterKeys)[number], string>;

export function Quotes() {
  const [params, setParams] = useSearchParams();
  const order = params.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = [10, 25, 50, 100].includes(Number(params.get("pageSize"))) ? Number(params.get("pageSize")) : 25;
  const [form, setForm] = useState<Filters>(() => Object.fromEntries(filterKeys.map((k) => [k, params.get(k) ?? ""])) as Filters);
  const [formError, setFormError] = useState("");
  const [open, setOpen] = useState<QuoteSummary | null>(null);

  useEffect(() => setForm(Object.fromEntries(filterKeys.map((k) => [k, params.get(k) ?? ""])) as Filters), [params]);

  const { since, until } = dayRange(params.get("from") ?? "", params.get("to") ?? "");
  const list = useLoad(
    () =>
      api<Page<QuoteSummary>>("/api/admin/quotes", {
        query: {
          q: params.get("q") ?? undefined,
          boardType: params.get("boardType") ?? undefined,
          attachment: params.get("attachment") ?? undefined,
          since,
          until,
          order,
          page,
          pageSize,
        },
      }),
    params.toString(),
  );

  const set = (changes: Record<string, string | number | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage) next.delete("page");
    setParams(next, { replace: true });
  };

  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (form.from && form.to && form.from > form.to) return setFormError("“From” must be on or before “To”.");
    setFormError("");
    set({ ...form, q: form.q.trim() });
  };

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Quotes
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Quote requests from the site, newest first. Prices shown are catalogue list prices, not a quoted price.
      </Typography>

      <Paper component="form" onSubmit={apply} noValidate variant="outlined" sx={{ p: 2, mb: 2 }} aria-label="Filter quotes">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, flexWrap: "wrap", rowGap: 2 }}>
          <TextField size="small" label="Search" placeholder="Reference, name, company, email, phone" value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} sx={{ minWidth: 260 }} />
          <TextField select size="small" label="Board type" value={form.boardType} onChange={(e) => setForm({ ...form, boardType: e.target.value })} sx={{ minWidth: 200 }}>
            <MenuItem value="">All types</MenuItem>
            {boardTypes.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="File" value={form.attachment} onChange={(e) => setForm({ ...form, attachment: e.target.value })} sx={{ minWidth: 150 }}>
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="true">With a file</MenuItem>
            <MenuItem value="false">No file</MenuItem>
          </TextField>
          <TextField size="small" type="date" label="From" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="To" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          <Button type="submit" variant="contained">
            Apply
          </Button>
          <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear</Button>
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
          <Table size="small" aria-label="Quote requests" aria-busy={list.loading}>
            <TableHead>
              <TableRow>
                <TableCell sortDirection={order}>
                  <TableSortLabel active direction={order} onClick={() => set({ order: order === "desc" ? "asc" : "desc" })}>
                    Received
                  </TableSortLabel>
                </TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Request</TableCell>
                <TableCell align="right">List value</TableCell>
                <TableCell>
                  <span className="visually-hidden">Details</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data?.items.map((q) => (
                <TableRow key={q.reference} hover>
                  <TableCell>{new Date(q.createdAt).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>{q.reference}</TableCell>
                  <TableCell>
                    {q.name}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {[q.company, q.location].filter(Boolean).join(" · ")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {[q.boardType, q.dimensions, `qty ${q.quantity}`].filter(Boolean).join(" · ")}
                    {q.attachment ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        File: {q.attachment.name}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell align="right">{q.catalogueListSubtotal ? rupees(q.catalogueListSubtotal) : "—"}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setOpen(q)} aria-label={`Details for ${q.reference}`}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.data && list.data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">No quotes match.</Typography>
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
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, next) => set({ page: next + 1 }, false)}
          onRowsPerPageChange={(e) => set({ pageSize: e.target.value })}
        />
      </Paper>

      <Dialog open={open !== null} onClose={() => setOpen(null)} maxWidth="sm" fullWidth aria-labelledby="quote-title">
        {open ? (
          <>
            <DialogTitle id="quote-title">Quote {open.reference}</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={1.5}>
                <Detail label="Received" value={new Date(open.createdAt).toLocaleString()} />
                <Detail label="Customer" value={[open.name, open.company].filter(Boolean).join(", ")} />
                <Detail label="Email" value={open.email} />
                <Detail label="Phone" value={open.phone} />
                <Detail label="Location" value={open.location} />
                <Detail label="Board" value={[open.boardType, open.product, open.dimensions, `qty ${open.quantity}`].filter(Boolean).join(" · ")} />
                <Detail label="Configuration" value={open.configurationSummary} />
                <Detail label="Notes" value={open.notes} />
                {open.lines.length ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Products
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                      {open.lines.map((l) => (
                        <li key={l.productId}>
                          {l.quantity} × {l.name} ({l.sku}) at {rupees(l.catalogueUnitPrice)}
                          {l.detail ? ` — ${l.detail}` : ""}
                        </li>
                      ))}
                    </Box>
                  </Box>
                ) : null}
                {open.attachment ? (
                  <Alert severity="info">
                    File: {open.attachment.name} ({kb(open.attachment.size)}). Download it from the staff portal on the site for now; files move to this app in a
                    later step.
                  </Alert>
                ) : null}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(null)} autoFocus>
                Close
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ whiteSpace: "pre-wrap" }}>{value}</Typography>
    </Box>
  );
}

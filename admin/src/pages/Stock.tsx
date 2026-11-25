import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { api, type Page, type StockRow, type StockState } from "../api";
import { useAuth } from "../auth";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { describeError, useNotify } from "../components/Notifications";
import { useLoad } from "../useLoad";

type Sort = "name" | "sku" | "onHand" | "updatedAt";
const stateLabel: Record<StockState, string> = { "in-stock": "In stock", low: "Low", "made-to-order": "Made to order", untracked: "Not tracked" };
const stateColour: Record<StockState, "success" | "warning" | "default" | "error"> = { "in-stock": "success", low: "warning", "made-to-order": "error", untracked: "default" };

/** Same rule FastAPI enforces; checked here first so staff get the message at once. */
export function onHandError(value: string) {
  if (value.trim() === "") return "Enter a number.";
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 100000 ? "" : "Enter a whole number from 0 to 100,000.";
}

export function Stock() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const state = params.get("state") ?? "";
  const sort = (params.get("sort") as Sort) || "name";
  const order = params.get("order") === "desc" ? "desc" : "asc";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = [10, 25, 50, 100].includes(Number(params.get("pageSize"))) ? Number(params.get("pageSize")) : 25;
  const [search, setSearch] = useState(q);

  const update = (changes: Record<string, string | number | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage) next.delete("page");
    setParams(next, { replace: true });
  };

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => update({ q: search.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const list = useLoad(
    () => api<Page<StockRow>>("/api/admin/stock", { query: { q, state: state || undefined, sort, order, page, pageSize } }),
    params.toString(),
  );

  const sortBy = (column: Sort) => update({ sort: column, order: sort === column && order === "asc" ? "desc" : "asc" });

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Stock
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 680 }}>
        Customers see availability for tracked products only: “Only N left” at 5 or fewer, “Made to order” at 0. Live paid orders reduce the count.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Search name or SKU" value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ minWidth: 260 }} type="search" />
        <TextField select label="Availability" value={state} onChange={(e) => update({ state: e.target.value })} size="small" sx={{ minWidth: 200 }}>
          <MenuItem value="">All products</MenuItem>
          <MenuItem value="tracked">Tracked</MenuItem>
          <MenuItem value="in-stock">In stock</MenuItem>
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="made-to-order">Made to order</MenuItem>
          <MenuItem value="untracked">Not tracked</MenuItem>
        </TextField>
      </Stack>
      {list.error ? <Alert severity="error" sx={{ mb: 2 }}>{describeError(list.error)}</Alert> : null}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label="Stock levels" aria-busy={list.loading}>
            <TableHead>
              <TableRow>
                {(
                  [
                    ["name", "Product"],
                    ["sku", "SKU"],
                    ["onHand", "On hand"],
                  ] as [Sort, string][]
                ).map(([column, label]) => (
                  <TableCell key={column} sortDirection={sort === column ? order : false}>
                    <TableSortLabel active={sort === column} direction={sort === column ? order : "asc"} onClick={() => sortBy(column)}>
                      {label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell>Shown to customers</TableCell>
                <TableCell sortDirection={sort === "updatedAt" ? order : false}>
                  <TableSortLabel active={sort === "updatedAt"} direction={sort === "updatedAt" ? order : "asc"} onClick={() => sortBy("updatedAt")}>
                    Last change
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data?.items.map((row) => <StockLine key={row.productId} row={row} onSaved={list.reload} />)}
              {list.data && list.data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">No products match.</Typography>
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
          onPageChange={(_, next) => update({ page: next + 1 }, false)}
          onRowsPerPageChange={(e) => update({ pageSize: e.target.value })}
        />
      </Paper>
    </Box>
  );
}

function StockLine({ row, onSaved }: { row: StockRow; onSaved: () => void }) {
  const { can } = useAuth();
  const notify = useNotify();
  const [value, setValue] = useState(row.onHand === null ? "" : String(row.onHand));
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const writable = can("stock:write");
  const error = touched ? onHandError(value) : "";
  const changed = value !== (row.onHand === null ? "" : String(row.onHand));

  useEffect(() => setValue(row.onHand === null ? "" : String(row.onHand)), [row.onHand]);

  // A second click (or Enter) before the first save returns is ignored: state updates too late to stop it.
  const inFlight = useRef(false);
  const save = async (onHand: number | null) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await api("/api/admin/stock", { method: "POST", body: { productId: row.productId, onHand } });
      notify.success(onHand === null ? `Stopped tracking ${row.name}.` : `${row.name}: on hand set to ${onHand}.`);
      setTouched(false);
      setConfirming(false);
      onSaved();
    } catch (caught) {
      notify.error(caught);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.name}
        </Typography>
      </TableCell>
      <TableCell>{row.sku}</TableCell>
      <TableCell>
        {writable ? (
          <Box
            component="form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setTouched(true);
              if (!onHandError(value)) void save(Number(value));
            }}
            sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}
          >
            <TextField
              size="small"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setTouched(true);
              }}
              placeholder="Not tracked"
              error={Boolean(error)}
              helperText={error || " "}
              slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": `On hand for ${row.name}` } }}
              sx={{ width: 140 }}
            />
            <Button type="submit" size="small" variant="contained" disabled={busy || !changed || Boolean(error)} sx={{ mt: 0.5 }}>
              Save
            </Button>
            {row.onHand !== null ? (
              <Button size="small" color="error" disabled={busy} onClick={() => setConfirming(true)} sx={{ mt: 0.5 }}>
                Stop tracking
              </Button>
            ) : null}
          </Box>
        ) : (
          (row.onHand ?? "—")
        )}
      </TableCell>
      <TableCell>
        <Chip size="small" label={stateLabel[row.state]} color={stateColour[row.state]} variant={row.state === "untracked" ? "outlined" : "filled"} />
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {row.updatedBy ? `${row.updatedBy}${row.updatedAt ? ` · ${new Date(row.updatedAt).toLocaleString()}` : ""}` : "—"}
        </Typography>
      </TableCell>
      <ConfirmDialog
        open={confirming}
        title={`Stop tracking ${row.name}?`}
        body="Customers will no longer see any availability for this product. The current count is removed; you can set a new one at any time."
        confirmLabel="Stop tracking"
        danger
        busy={busy}
        onConfirm={() => void save(null)}
        onCancel={() => setConfirming(false)}
      />
    </TableRow>
  );
}

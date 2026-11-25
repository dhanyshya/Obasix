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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { api, apiForm, apiUrl, type Page, type Proof, type ProofStatus } from "../api";
import { useAuth } from "../auth";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { describeError, useNotify } from "../components/Notifications";
import { useLoad } from "../useLoad";

const statusLabel: Record<ProofStatus, string> = { pending: "Waiting for the customer", approved: "Approved", changes: "Changes requested", superseded: "Replaced" };
const statusColour: Record<ProofStatus, "warning" | "success" | "error" | "default"> = { pending: "warning", approved: "success", changes: "error", superseded: "default" };
const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
export const PROOF_MAX_BYTES = 5 * 1024 * 1024;

/** The same checks the API makes, so staff hear about a wrong file before it uploads. */
export function proofFileError(file: File | null) {
  if (!file) return "Choose the proof file.";
  if (file.size > PROOF_MAX_BYTES) return "The proof must be 5 MB or smaller.";
  if (!allowed.includes(file.type)) return "Upload the proof as a PNG, JPEG, WebP or PDF.";
  return "";
}

export function Proofs() {
  const { can } = useAuth();
  const notify = useNotify();
  const [params, setParams] = useSearchParams();
  const reference = params.get("quoteReference") ?? "";
  const status = params.get("status") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = [10, 25, 50, 100].includes(Number(params.get("pageSize"))) ? Number(params.get("pageSize")) : 25;
  const [filterRef, setFilterRef] = useState(reference);
  useEffect(() => setFilterRef(reference), [reference]);

  const list = useLoad(
    () => api<Page<Proof>>("/api/admin/proofs", { query: { quoteReference: reference || undefined, status: status || undefined, page, pageSize } }),
    params.toString(),
  );

  const set = (changes: Record<string, string | number | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    }
    if (resetPage) next.delete("page");
    setParams(next, { replace: true });
  };

  // ---------- Upload ----------
  const [uploadRef, setUploadRef] = useState(reference);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ ref?: string; file?: string }>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => setUploadRef((r) => r || reference), [reference]);

  const check = (event: FormEvent) => {
    event.preventDefault();
    const next = { ref: uploadRef.trim() ? "" : "Enter the quote reference.", file: proofFileError(file) };
    setErrors(next);
    if (!next.ref && !next.file) setConfirming(true);
  };

  const send = async () => {
    if (inFlight.current || !file) return;
    inFlight.current = true;
    setBusy(true);
    const form = new FormData();
    form.set("quoteReference", uploadRef.trim().toUpperCase());
    form.set("note", note);
    form.set("file", file);
    try {
      const result = await apiForm<{ version: number }>("/api/admin/proofs", form);
      notify.success(`Version ${result.version} sent to the customer for ${uploadRef.trim().toUpperCase()}.`);
      setNote("");
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      set({ quoteReference: uploadRef.trim().toUpperCase() });
      list.reload();
    } catch (caught) {
      notify.error(caught);
    } finally {
      inFlight.current = false;
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Proofs
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Design proofs for custom work. The customer approves one version or asks for changes; production uses the approved version, and no new version can be
        sent after an approval.
      </Typography>

      {can("proofs:write") ? (
        <Paper component="form" onSubmit={check} noValidate variant="outlined" sx={{ p: 2, mb: 3 }} aria-label="Send a proof">
          <Typography component="h2" variant="h6" gutterBottom>
            Send a proof
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "flex-start" } }}>
            <TextField size="small" label="Quote reference" value={uploadRef} onChange={(e) => setUploadRef(e.target.value)} error={Boolean(errors.ref)} helperText={errors.ref || " "} sx={{ minWidth: 260 }} />
            <TextField size="small" label="Note to the customer" value={note} onChange={(e) => setNote(e.target.value.slice(0, 600))} helperText={`${note.length}/600`} sx={{ flex: 1 }} />
            <Box>
              <Button component="label" variant="outlined">
                {file ? file.name : "Choose file"}
                <input ref={fileInput} hidden type="file" accept={allowed.join(",")} aria-label="Proof file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </Button>
              <Typography variant="caption" color={errors.file ? "error" : "text.secondary"} sx={{ display: "block", mt: 0.5 }} role={errors.file ? "alert" : undefined}>
                {errors.file || "PNG, JPEG, WebP or PDF, up to 5 MB"}
              </Typography>
            </Box>
            <Button type="submit" variant="contained" disabled={busy}>
              Send proof
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }} component="form" onSubmit={(e) => { e.preventDefault(); set({ quoteReference: filterRef.trim().toUpperCase() }); }}>
        <TextField size="small" label="Filter by quote" value={filterRef} onChange={(e) => setFilterRef(e.target.value)} sx={{ minWidth: 260 }} />
        <TextField select size="small" label="Status" value={status} onChange={(e) => set({ status: e.target.value })} sx={{ minWidth: 220 }}>
          <MenuItem value="">All</MenuItem>
          {(Object.keys(statusLabel) as ProofStatus[]).map((s) => (
            <MenuItem key={s} value={s}>
              {statusLabel[s]}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit">Filter</Button>
        {reference || status ? <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear</Button> : null}
      </Stack>

      {list.error ? <Alert severity="error" sx={{ mb: 2 }}>{describeError(list.error)}</Alert> : null}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label="Proofs" aria-busy={list.loading}>
            <TableHead>
              <TableRow>
                <TableCell>Quote</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Customer's reply</TableCell>
                <TableCell>File</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data?.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell sx={{ fontFamily: "monospace" }}>{p.quoteReference}</TableCell>
                  <TableCell>v{p.version}</TableCell>
                  <TableCell>
                    <Chip size="small" label={statusLabel[p.status]} color={statusColour[p.status]} variant={p.status === "superseded" ? "outlined" : "filled"} />
                  </TableCell>
                  <TableCell>
                    {new Date(p.createdAt).toLocaleString()}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {p.uploadedBy}
                      {p.staffNote ? ` · “${p.staffNote}”` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {p.decidedAt ? `${p.decidedBy ?? ""} · ${new Date(p.decidedAt).toLocaleString()}` : "—"}
                    {p.customerComment ? (
                      <Typography variant="caption" sx={{ display: "block" }}>
                        “{p.customerComment}”
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <a href={apiUrl(`/api/proofs/${encodeURIComponent(p.id)}/file`)} target="_blank" rel="noreferrer">
                      {p.fileName}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {list.data && list.data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">No proofs match.</Typography>
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

      <ConfirmDialog
        open={confirming}
        title={`Send this proof for ${uploadRef.trim().toUpperCase()}?`}
        body="The customer is emailed straight away. A version still waiting for their reply is replaced by this one."
        confirmLabel="Send proof"
        busy={busy}
        onConfirm={() => void send()}
        onCancel={() => setConfirming(false)}
      />
    </Box>
  );
}

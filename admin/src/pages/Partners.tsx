import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { ActionDialog } from "../components/ActionDialog";
import { describeError } from "../components/Notifications";
import { useLoad } from "../useLoad";

type Partner = { userId: string; companyName: string; partnerType: string; gstin: string; city: string; status: string; email: string; projects: number; wonValue: number; earned: number };
type Project = { id: string; clientName: string; city: string; sector: string; partnerCompany: string; expectedValue: number; status: string; quotedValue: number; marginRate: number; earning: number; conflictWith: string; linkedOrderId: string | null; payoutRef: string };
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const next: Record<string, string> = { Quoted: "Won", Won: "In production", "In production": "Delivered" };
type Pending = { kind: "decide"; p: Partner } | { kind: "project"; project: Project; action: "quote" | "advance" | "lose" | "pay" } | null;

export function Partners() {
  const { can } = useAuth();
  const partners = useLoad(() => api<{ items: Partner[] }>("/api/admin/partners"), "partners");
  const projects = useLoad(() => api<{ items: Project[] }>("/api/admin/projects"), "projects");
  const reload = () => {
    partners.reload();
    projects.reload();
  };
  const [pending, setPending] = useState<Pending>(null);
  const approve = can("partners:approve");
  const write = can("partners:write");

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Partners
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 760 }}>
        Project partners register institutional clients (protected for 90 days). Quote a negotiated margin, move projects to delivery, then pay the margin. One
        order earns one payout.
      </Typography>
      {partners.error ? <Alert severity="error">{describeError(partners.error)}</Alert> : null}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small" aria-label="Partners">
            <TableHead>
              <TableRow>
                <TableCell>Partner</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Projects</TableCell>
                <TableCell align="right">Won</TableCell>
                <TableCell>
                  <span className="visually-hidden">Actions</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {partners.data?.items.map((p) => (
                <TableRow key={p.userId}>
                  <TableCell>
                    {p.companyName}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {p.email} · {p.partnerType} · {p.city}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={p.status} color={p.status === "approved" ? "success" : p.status === "pending" ? "warning" : "default"} />
                  </TableCell>
                  <TableCell align="right">{p.projects}</TableCell>
                  <TableCell align="right">{rupees(p.wonValue)}</TableCell>
                  <TableCell>
                    {approve ? (
                      <Button size="small" onClick={() => setPending({ kind: "decide", p })} aria-label={`Decide ${p.companyName}`}>
                        Decide
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {partners.data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No applications yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Typography component="h2" variant="h6" gutterBottom>
        Projects
      </Typography>
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label="Projects">
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Quoted</TableCell>
                <TableCell align="right">Partner margin</TableCell>
                <TableCell>
                  <span className="visually-hidden">Actions</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.data?.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Box component="span" sx={{ fontFamily: "monospace" }}>
                      {p.id}
                    </Box>{" "}
                    · {p.clientName}, {p.city}
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {p.partnerCompany} · {p.sector} · expected {rupees(p.expectedValue)}
                      {p.conflictWith ? ` · held: ${p.conflictWith} registered this client first` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell align="right">{p.quotedValue ? rupees(p.quotedValue) : "—"}</TableCell>
                  <TableCell align="right">{p.quotedValue ? `${(p.marginRate * 100).toFixed(1)}% · ${rupees(p.earning)}` : "—"}</TableCell>
                  <TableCell>
                    {approve && (p.status === "Submitted" || p.status === "Quoted") ? (
                      <Button size="small" onClick={() => setPending({ kind: "project", project: p, action: "quote" })}>
                        Quote
                      </Button>
                    ) : null}
                    {write && next[p.status] ? (
                      <Button size="small" onClick={() => setPending({ kind: "project", project: p, action: "advance" })}>
                        Mark {next[p.status]}
                      </Button>
                    ) : null}
                    {approve && p.status === "Delivered" ? (
                      <Button size="small" onClick={() => setPending({ kind: "project", project: p, action: "pay" })}>
                        Pay margin
                      </Button>
                    ) : null}
                    {write && !["Delivered", "Paid", "Lost"].includes(p.status) ? (
                      <Button size="small" color="error" onClick={() => setPending({ kind: "project", project: p, action: "lose" })}>
                        Lost
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {pending?.kind === "decide" ? (
        <ActionDialog
          title={`Decide ${pending.p.companyName}`}
          fields={[
            { name: "status", label: "Decision", options: ["approved", "rejected", "suspended"], initial: "approved" },
            { name: "note", label: "Note (required unless approving)" },
          ]}
          confirmLabel="Save decision"
          endpoint="/api/admin/partners"
          build={(v) => ({ action: "decide", userId: pending.p.userId, status: v.status, note: v.note })}
          success={`Saved the decision for ${pending.p.companyName}.`}
          onDone={reload}
          onClose={() => setPending(null)}
        />
      ) : null}
      {pending?.kind === "project" ? (
        <ActionDialog
          title={`${{ quote: "Quote", advance: `Mark ${next[pending.project.status]}`, lose: "Mark lost", pay: "Pay margin for" }[pending.action]} ${pending.project.id}`}
          fields={
            pending.action === "quote"
              ? [
                  { name: "quotedValue", label: "Quoted project value (₹)", type: "number", initial: String(pending.project.quotedValue || pending.project.expectedValue) },
                  { name: "marginPercent", label: "Partner margin (%)", type: "number", initial: pending.project.marginRate ? String(pending.project.marginRate * 100) : "", helper: "Up to 30%" },
                  { name: "note", label: "Note" },
                ]
              : pending.action === "advance"
                ? [
                    ...(next[pending.project.status] === "Won" ? [{ name: "linkedOrderId", label: "Website order number (optional)" }] : []),
                    { name: "note", label: "Note" },
                  ]
                : pending.action === "lose"
                  ? [{ name: "note", label: "Why was it lost?" }]
                  : [{ name: "payoutRef", label: "Payment or UTR reference" }]
          }
          confirmLabel="Confirm"
          danger={pending.action === "lose"}
          endpoint="/api/admin/partners"
          build={(v) => ({ action: pending.action, projectId: pending.project.id, ...v, ...(pending.action === "quote" ? { quotedValue: Number(v.quotedValue), marginPercent: Number(v.marginPercent) } : {}) })}
          success={`${pending.project.id} updated.`}
          onDone={reload}
          onClose={() => setPending(null)}
        />
      ) : null}
    </Box>
  );
}

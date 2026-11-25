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
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRef, useState, type FormEvent } from "react";
import { api, type StaffMember } from "../api";
import { useAuth } from "../auth";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { describeError, useNotify } from "../components/Notifications";
import { useLoad } from "../useLoad";

type Role = StaffMember["role"];
const roleHelp: Record<Role, string> = {
  admin: "Everything, including the audit log and staff roles",
  staff: "Stock: view and change",
};

type Pending = { kind: "revoke"; email: string; role: Role } | { kind: "change"; email: string; from: Role; to: Role } | null;

export function Staff() {
  const { state } = useAuth();
  const notify = useNotify();
  const list = useLoad(() => api<{ items: StaffMember[] }>("/api/admin/staff"), "staff");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [emailError, setEmailError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const myEmail = state.status === "signed-in" ? state.me.email : "";

  const inFlight = useRef(false);
  const once = async <T,>(work: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    try {
      return await work();
    } finally {
      inFlight.current = false;
    }
  };

  const grant = (target: string, newRole: Role, success: string) => once(() => grantNow(target, newRole, success));
  const grantNow = async (target: string, newRole: Role, success: string) => {
    setBusy(true);
    try {
      await api("/api/admin/staff", { method: "POST", body: { email: target, role: newRole } });
      notify.success(success);
      list.reload();
      return true;
    } catch (caught) {
      notify.error(caught);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const target = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) return setEmailError("Enter an email address.");
    if (list.data?.items.some((m) => m.email === target)) return setEmailError("That email already has a role. Change it in the table.");
    setEmailError("");
    if (await grant(target, role, `${target} is now ${role}.`)) setEmail("");
  };

  const confirm = () => once(confirmNow);
  const confirmNow = async () => {
    if (!pending) return;
    if (pending.kind === "change") {
      await grantNow(pending.email, pending.to, `${pending.email} is now ${pending.to}.`);
      setPending(null);
      return;
    }
    setBusy(true);
    try {
      await api("/api/admin/staff", { method: "DELETE", query: { email: pending.email } });
      notify.success(`Removed ${pending.email}'s role.`);
      list.reload();
    } catch (caught) {
      notify.error(caught);
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Staff
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Staff sign in with their ordinary OBASIX account. Admins listed in the server setting OBASIX_ADMIN_EMAILS can't be changed here.
      </Typography>
      <Paper component="form" onSubmit={add} noValidate variant="outlined" sx={{ p: 2, mb: 3 }} aria-label="Give someone a role">
        <Typography component="h2" variant="h6" gutterBottom>
          Give someone a role
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "flex-start" } }}>
          <TextField size="small" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={Boolean(emailError)} helperText={emailError || " "} sx={{ minWidth: 280 }} />
          <TextField select size="small" label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)} helperText={roleHelp[role]} sx={{ minWidth: 200 }}>
            <MenuItem value="staff">staff</MenuItem>
            <MenuItem value="admin">admin</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" disabled={busy}>
            Give role
          </Button>
        </Stack>
      </Paper>
      {list.error ? <Alert severity="error" sx={{ mb: 2 }}>{describeError(list.error)}</Alert> : null}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small" aria-label="Staff roles">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Granted</TableCell>
                <TableCell>
                  <span className="visually-hidden">Actions</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.data?.items.map((member) => {
                const fixed = member.source === "config";
                const other: Role = member.role === "admin" ? "staff" : "admin";
                return (
                  <TableRow key={member.email}>
                    <TableCell>
                      {member.email}
                      {member.email === myEmail ? " (you)" : ""}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={member.role} color={member.role === "admin" ? "primary" : "default"} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {fixed ? "Server setting" : `${member.grantedBy ?? ""}${member.grantedAt ? ` · ${new Date(member.grantedAt).toLocaleDateString()}` : ""}`}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {fixed ? null : (
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                          <Button size="small" disabled={busy} onClick={() => setPending({ kind: "change", email: member.email, from: member.role, to: other })}>
                            Make {other}
                          </Button>
                          <Button size="small" color="error" disabled={busy} onClick={() => setPending({ kind: "revoke", email: member.email, role: member.role })}>
                            Remove
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === "revoke" ? `Remove ${pending.email}'s role?` : `Make ${pending?.email} ${pending?.kind === "change" ? pending.to : ""}?`}
        body={
          pending?.kind === "revoke"
            ? "They keep their customer account but lose staff access straight away."
            : pending?.kind === "change"
              ? `New access: ${roleHelp[pending.to]}.`
              : ""
        }
        confirmLabel={pending?.kind === "revoke" ? "Remove role" : "Change role"}
        danger={pending?.kind === "revoke" || (pending?.kind === "change" && pending.to === "staff")}
        busy={busy}
        onConfirm={() => void confirm()}
        onCancel={() => setPending(null)}
      />
    </Box>
  );
}

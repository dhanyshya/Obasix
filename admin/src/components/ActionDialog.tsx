import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useId, useRef, useState } from "react";
import { api } from "../api";
import { describeError, useNotify } from "./Notifications";

export type Field = { name: string; label: string; type?: "text" | "number" | "date"; options?: string[]; initial?: string; helper?: string };

type Props = {
  title: string;
  intro?: string;
  fields: Field[];
  confirmLabel: string;
  danger?: boolean;
  /** Builds the request body from the field values; return a string to show as an error instead. */
  build: (values: Record<string, string>) => Record<string, unknown> | string;
  endpoint: string;
  success: string;
  onDone: () => void;
  onClose: () => void;
};

/**
 * One staff action: a few fields, a confirm button, the API's own message on refusal.
 * Used by the trade channel pages, where every action is a POST with an "action" field.
 */
export function ActionDialog({ title, intro, fields, confirmLabel, danger, build, endpoint, success, onDone, onClose }: Props) {
  const id = useId();
  const notify = useNotify();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, f.initial ?? ""])));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const send = async () => {
    if (inFlight.current) return;
    const body = build(values);
    if (typeof body === "string") return setError(body);
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await api(endpoint, { method: "POST", body });
      notify.success(success);
      onDone();
      onClose();
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth aria-labelledby={`${id}-title`}>
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {intro ? <Typography>{intro}</Typography> : null}
          {fields.map((f) =>
            f.options ? (
              <TextField key={f.name} select size="small" label={f.label} value={values[f.name]} helperText={f.helper} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
                {f.options.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                key={f.name}
                size="small"
                label={f.label}
                type={f.type ?? "text"}
                value={values[f.name]}
                helperText={f.helper}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                slotProps={f.type === "date" ? { inputLabel: { shrink: true } } : undefined}
              />
            ),
          )}
          {error ? (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" color={danger ? "error" : "primary"} disabled={busy} onClick={() => void send()}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useId } from "react";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Asks before anything that removes or downgrades. Cancel has focus, so Enter doesn't confirm by accident. */
export function ConfirmDialog({ open, title, body, confirmLabel, danger, busy, onConfirm, onCancel }: Props) {
  const id = useId();
  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`}>
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${id}-body`}>{body}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => open && onCancel()} disabled={busy} autoFocus>
          Cancel
        </Button>
        {/* While the dialog animates closed its buttons are still on screen: a second click then must do nothing. */}
        <Button onClick={() => open && !busy && onConfirm()} disabled={busy || !open} variant="contained" color={danger ? "error" : "primary"}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ApiError } from "../api";

type Note = { id: number; severity: "success" | "error" | "info"; text: string };
type NotifyValue = { success: (text: string) => void; error: (error: unknown) => void };

const NotifyContext = createContext<NotifyValue | null>(null);

/** Turns any thrown value into a message staff can act on, with the request id for support. */
export function describeError(error: unknown) {
  if (error instanceof ApiError) return error.requestId ? `${error.message} (ref ${error.requestId.slice(0, 12)})` : error.message;
  return "Something went wrong. Try again.";
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [note, setNote] = useState<Note | null>(null);
  const show = useCallback((severity: Note["severity"], text: string) => setNote({ id: Date.now(), severity, text }), []);
  const value: NotifyValue = {
    success: useCallback((text: string) => show("success", text), [show]),
    error: useCallback((error: unknown) => show("error", describeError(error)), [show]),
  };
  return (
    <NotifyContext.Provider value={value}>
      {children}
      <Snackbar
        key={note?.id}
        open={note !== null}
        autoHideDuration={note?.severity === "error" ? 10000 : 4000}
        onClose={(_, reason) => reason !== "clickaway" && setNote(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {note ? (
          <Alert severity={note.severity} variant="filled" onClose={() => setNote(null)} role={note.severity === "error" ? "alert" : "status"}>
            {note.text}
          </Alert>
        ) : undefined}
      </Snackbar>
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const value = useContext(NotifyContext);
  if (!value) throw new Error("useNotify must be used inside NotificationsProvider");
  return value;
}

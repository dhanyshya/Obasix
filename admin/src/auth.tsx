import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError, type Me, type Permission } from "./api";

type AuthState =
  | { status: "loading" }
  | { status: "signed-out"; notice?: string }
  | { status: "signed-in"; me: Me };

type AuthValue = {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: Permission) => boolean;
  /** Call when the API says the session ended (404 from /me, 401). */
  expire: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

const NO_STAFF_ACCESS = "This account doesn't have staff access. Ask an OBASIX admin to give you a role.";

async function loadMe(): Promise<Me | null> {
  try {
    return await api<Me>("/api/admin/me");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401)) return null;
    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let live = true;
    loadMe()
      .then((me) => live && setState(me ? { status: "signed-in", me } : { status: "signed-out" }))
      .catch(() => live && setState({ status: "signed-out", notice: "We couldn't reach the server. Try again." }));
    return () => {
      live = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await api("/api/auth", { method: "POST", query: { action: "login" }, body: { email, password } });
    const me = await loadMe();
    if (!me) {
      // A customer account: sign it out again here, so it isn't left half signed in.
      await api("/api/auth", { method: "POST", query: { action: "logout" } }).catch(() => undefined);
      throw new ApiError(403, NO_STAFF_ACCESS, "");
    }
    setState({ status: "signed-in", me });
  }, []);

  const signOut = useCallback(async () => {
    await api("/api/auth", { method: "POST", query: { action: "logout" } }).catch(() => undefined);
    setState({ status: "signed-out", notice: "You're signed out." });
  }, []);

  const expire = useCallback(() => setState({ status: "signed-out", notice: "Your session ended or your role changed. Sign in again." }), []);

  const can = useCallback((permission: Permission) => state.status === "signed-in" && state.me.permissions.includes(permission), [state]);

  return <AuthContext.Provider value={{ state, signIn, signOut, can, expire }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

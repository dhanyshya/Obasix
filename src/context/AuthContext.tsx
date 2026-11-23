"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { replayCartEdits, useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { CartItem } from "@/lib/types";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  company: string;
  role: "customer";
};

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

type AuthResult = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * A signed-in cart change not yet confirmed by the server. Written synchronously on every change,
 * so it survives a reload even where the browser drops the unload-time save (WebKit does).
 */
const unsavedKey = "obasix_unsaved_account";
type Unsaved = { userId: string; items: CartItem[]; ids: string[] };
function readUnsaved(userId: string): Unsaved | null {
  try {
    const value = JSON.parse(localStorage.getItem(unsavedKey) ?? "null") as Unsaved | null;
    return value?.userId === userId ? value : null;
  } catch {
    return null;
  }
}
function rawUnsaved() {
  try {
    return localStorage.getItem(unsavedKey);
  } catch {
    return null;
  }
}
function writeUnsaved(value: Unsaved | null) {
  try {
    if (value) localStorage.setItem(unsavedKey, JSON.stringify(value));
    else localStorage.removeItem(unsavedKey);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const cart = useCart();
  const wishlist = useWishlist();
  const generation = useRef(0);
  const canSave = useRef(false);

  /**
   * Loads the saved cart. Changes the customer made while it was loading (from `editMark`)
   * are replayed on top, so an item added during page load isn't wiped by the server copy.
   */
  const applyAccount = (cartItems: CartItem[], ids: string[], editMark?: number) => {
    canSave.current = false;
    const pending = editMark === undefined ? [] : cart.editsSince(editMark);
    cart.replaceItems(pending.length ? replayCartEdits(cartItems, pending) : cartItems);
    wishlist.setIds(ids);
    canSave.current = true;
  };

  const refresh = async () => {
    const current = ++generation.current;
    const editMark = cart.editCount();
    const session = (await fetch("/api/auth").then((response) => response.json())) as { user: SessionUser | null };
    if (generation.current !== current) return;
    setUser(session.user);
    if (!session.user) {
      canSave.current = false;
      setReady(true);
      return;
    }
    const account = (await fetch("/api/account").then((response) => response.json())) as { cart?: CartItem[]; wishlist?: string[] };
    if (generation.current !== current) return;
    // Changes from the last visit that never reached the server win over the saved copy (and are resent).
    const unsaved = readUnsaved(session.user.id);
    applyAccount(unsaved?.items ?? account.cart ?? [], unsaved?.ids ?? account.wishlist ?? [], editMark);
    setReady(true);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh() only sets state after awaiting the session fetch
    void refresh();
    // The saved account is loaded once. Later cart edits are saved separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signed-in carts save shortly after a change. A save still waiting when the page is hidden or
  // unloaded (a reload or typed URL within the delay) is sent at once with keepalive so it isn't lost.
  const pendingSave = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ready || !user || !canSave.current) return;
    const lines = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      configuration: item.configuration,
    }));
    const ids = wishlist.ids;
    const userId = user.id;
    writeUnsaved({ userId, items: cart.items, ids });
    const written = rawUnsaved();
    const send = (keepalive: boolean) => {
      pendingSave.current = null;
      const cartSaved = fetch("/api/account?action=cart", {
        method: "POST",
        keepalive,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const wishlistSaved = fetch("/api/account?action=wishlist-sync", {
        method: "POST",
        keepalive,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      // Forget the local copy once both saves land, unless a newer change has replaced it meanwhile.
      void Promise.all([cartSaved, wishlistSaved])
        .then((responses) => {
          if (responses.every((r) => r.ok) && written !== null && rawUnsaved() === written) writeUnsaved(null);
        })
        .catch(() => {});
    };
    pendingSave.current = () => send(true);
    const timer = window.setTimeout(() => send(false), 400);
    return () => window.clearTimeout(timer);
  }, [cart.items, ready, user, wishlist.ids]);

  useEffect(() => {
    const flush = () => pendingSave.current?.();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const submit = async (action: "login" | "register", payload: Record<string, unknown>): Promise<AuthResult> => {
    generation.current += 1;
    const response = await fetch(`/api/auth?action=${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        cart: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          configuration: item.configuration,
        })),
        wishlist: wishlist.ids,
      }),
    });
    const result = (await response.json()) as AuthResult & { user?: SessionUser; cart?: CartItem[]; wishlist?: string[] };
    if (!response.ok || !result.user) return result;
    setUser(result.user);
    applyAccount(result.cart ?? [], result.wishlist ?? []);
    setReady(true);
    return { ok: true };
  };

  const signOut = async () => {
    generation.current += 1;
    canSave.current = false;
    writeUnsaved(null);
    await fetch("/api/auth?action=logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        refresh,
        signIn: (email, password) => submit("login", { email, password }),
        register: (name, email, password) => submit("register", { name, email, password }),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

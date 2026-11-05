"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useCart } from "@/context/CartContext";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const cart = useCart();
  const wishlist = useWishlist();
  const generation = useRef(0);
  const canSave = useRef(false);

  const applyAccount = (cartItems: CartItem[], ids: string[]) => {
    canSave.current = false;
    cart.replaceItems(cartItems);
    wishlist.setIds(ids);
    canSave.current = true;
  };

  const refresh = async () => {
    const current = ++generation.current;
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
    applyAccount(account.cart ?? [], account.wishlist ?? []);
    setReady(true);
  };

  useEffect(() => {
    void refresh();
    // The saved account is loaded once. Later cart edits are saved separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !user || !canSave.current) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/account?action=cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            configuration: item.configuration,
          })),
        }),
      });
      void fetch("/api/account?action=wishlist-sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: wishlist.ids }),
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [cart.items, ready, user, wishlist.ids]);

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

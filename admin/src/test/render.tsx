import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { createMemoryRouter } from "react-router";
import { vi } from "vitest";
import { App, routes } from "../App";
import { AuthProvider } from "../auth";
import { NotificationsProvider } from "../components/Notifications";
import { theme } from "../theme";

type Handler = (url: URL, init: RequestInit) => { status?: number; body: unknown } | undefined;

/** Stubs fetch with a table of handlers; anything unmatched fails the test loudly. */
export function stubApi(handler: Handler) {
  const calls: { url: URL; init: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init: RequestInit = {}) => {
      const url = new URL(String(input));
      calls.push({ url, init });
      const result = handler(url, init);
      if (!result) throw new Error(`Unexpected request: ${init.method ?? "GET"} ${url.pathname}${url.search}`);
      return new Response(JSON.stringify(result.body), {
        status: result.status ?? 200,
        headers: { "content-type": "application/json", "x-request-id": "srv0123456789abcdef" },
      });
    }),
  );
  return calls;
}

export const admin = { email: "boss@example.com", name: "Boss", role: "admin", source: "config", permissions: ["audit:read", "orders:read", "orders:write", "proofs:read", "proofs:write", "quotes:read", "staff:manage", "stock:read", "stock:write"] };
export const clerk = { email: "clerk@example.com", name: "Clerk", role: "staff", source: "granted", permissions: ["orders:read", "orders:write", "proofs:read", "proofs:write", "quotes:read", "stock:read", "stock:write"] };

function Providers({ children }: { children: ReactElement }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationsProvider>
        <AuthProvider>{children}</AuthProvider>
      </NotificationsProvider>
    </ThemeProvider>
  );
}

/** The whole app at a path, with an in-memory router. */
export function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <Providers>
      <AppWithRouter router={router} />
    </Providers>,
  );
}

function AppWithRouter({ router }: { router: ReturnType<typeof createMemoryRouter> }) {
  return <App router={router} />;
}

export function renderApp() {
  return render(
    <Providers>
      <App />
    </Providers>,
  );
}

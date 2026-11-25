import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { createBrowserRouter, Link, RouterProvider, type RouteObject } from "react-router";
import { useAuth } from "./auth";
import { Layout, RequirePermission } from "./components/Layout";
import { lazy, Suspense, type ReactNode } from "react";
import { SignIn } from "./pages/SignIn";

// Each section loads when first opened, so sign-in stays small.
const Overview = lazy(() => import("./pages/Overview").then((m) => ({ default: m.Overview })));
const Stock = lazy(() => import("./pages/Stock").then((m) => ({ default: m.Stock })));
const Orders = lazy(() => import("./pages/Orders").then((m) => ({ default: m.Orders })));
const Quotes = lazy(() => import("./pages/Quotes").then((m) => ({ default: m.Quotes })));
const Proofs = lazy(() => import("./pages/Proofs").then((m) => ({ default: m.Proofs })));
const Audit = lazy(() => import("./pages/Audit").then((m) => ({ default: m.Audit })));
const Staff = lazy(() => import("./pages/Staff").then((m) => ({ default: m.Staff })));

function Loading({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <Box role="status" aria-label="Loading" sx={{ py: 6, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      }
    >
      {children}
    </Suspense>
  );
}

function NotFound() {
  return (
    <Box>
      <Typography component="h1" variant="h4" gutterBottom>
        Page not found
      </Typography>
      <Link to="/">Back to the overview</Link>
    </Box>
  );
}

function RouteError() {
  return (
    <Box sx={{ p: 4 }} role="alert">
      <Typography component="h1" variant="h5" gutterBottom>
        Something went wrong on this page
      </Typography>
      <Typography sx={{ mb: 2 }}>Reload to try again. If it keeps happening, tell the team what you were doing.</Typography>
      <a href="/">Go to the overview</a>
    </Box>
  );
}

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Loading><Overview /></Loading> },
      { path: "orders", element: <RequirePermission needs="orders:read"><Loading><Orders /></Loading></RequirePermission> },
      { path: "stock", element: <RequirePermission needs="stock:read"><Loading><Stock /></Loading></RequirePermission> },
      { path: "quotes", element: <RequirePermission needs="quotes:read"><Loading><Quotes /></Loading></RequirePermission> },
      { path: "proofs", element: <RequirePermission needs="proofs:read"><Loading><Proofs /></Loading></RequirePermission> },
      { path: "audit", element: <RequirePermission needs="audit:read"><Loading><Audit /></Loading></RequirePermission> },
      { path: "staff", element: <RequirePermission needs="staff:manage"><Loading><Staff /></Loading></RequirePermission> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

let browserRouter: ReturnType<typeof createBrowserRouter> | null = null;

/** `router` is for tests; the app makes its browser router on first use. */
export function App({ router }: { router?: ReturnType<typeof createBrowserRouter> } = {}) {
  const { state } = useAuth();
  if (state.status === "loading") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }} role="status" aria-label="Loading">
        <CircularProgress />
      </Box>
    );
  }
  if (state.status === "signed-out") return <SignIn notice={state.notice} />;
  browserRouter ??= router ? null : createBrowserRouter(routes);
  return <RouterProvider router={router ?? browserRouter!} />;
}

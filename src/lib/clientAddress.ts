/**
 * The visitor's IP address, from a header the client can't forge.
 * - On Vercel: x-vercel-forwarded-for / x-real-ip, which Vercel sets itself.
 * - Behind another proxy you control: set TRUST_PROXY_HEADERS=1 to use X-Forwarded-For.
 * - Otherwise (local development): every request counts as "local".
 */
export function clientAddress(request: Request) {
  const first = (value: string | null) => value?.split(",")[0]?.trim() || "";
  if (process.env.VERCEL) {
    return first(request.headers.get("x-vercel-forwarded-for")) || first(request.headers.get("x-real-ip")) || "unknown";
  }
  if (process.env.TRUST_PROXY_HEADERS === "1") return first(request.headers.get("x-forwarded-for")) || "unknown";
  return "local";
}

import { NextResponse, type NextRequest } from "next/server";
import { clientAddress } from "@/lib/clientAddress";
import { fastApiConfig } from "@/lib/fastApi";

const fastApi = fastApiConfig();

/**
 * Forwards migrated API areas to the FastAPI service. The visitor's IP goes with
 * the request, together with a secret only this site and the API know, so the
 * API can rate-limit per visitor without trusting headers a client could set.
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!fastApi?.paths.has(path)) return NextResponse.next();
  const headers = new Headers(request.headers);
  headers.set("x-obasix-client-ip", clientAddress(request));
  headers.set("x-obasix-proxy-secret", fastApi.secret);
  return NextResponse.rewrite(new URL(`${fastApi.target}${path}${request.nextUrl.search}`), { request: { headers } });
}

export const config = { matcher: "/api/:path*" };

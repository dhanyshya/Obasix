import "server-only";
import { headers } from "next/headers";
import { fastApiConfig, servedByFastApi } from "@/lib/fastApi";

const fastApi = fastApiConfig();

/**
 * Reads a migrated API area from FastAPI inside a server component, as the
 * signed-in visitor. Returns `undefined` when the area is still served by this
 * site, so the caller keeps its direct database read and the switch stays reversible.
 */
export async function readFromFastApi<T>(path: string): Promise<T | null | undefined> {
  if (!fastApi || !servedByFastApi(fastApi, path)) return undefined;
  const incoming = await headers();
  const forwarded: Record<string, string> = { "x-obasix-proxy-secret": fastApi.secret, accept: "application/json" };
  const cookie = incoming.get("cookie");
  if (cookie) forwarded.cookie = cookie;
  const ip = incoming.get("x-forwarded-for")?.split(",")[0]?.trim() || incoming.get("x-real-ip");
  if (ip) forwarded["x-obasix-client-ip"] = ip;
  const response = await fetch(`${fastApi.target}${path}`, { headers: forwarded, cache: "no-store" });
  if (response.status === 401 || response.status === 404) return null;
  if (!response.ok) throw new Error(`FastAPI ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

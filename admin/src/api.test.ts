import { describe, expect, it } from "vitest";
import { api, ApiError } from "./api";
import { stubApi } from "./test/render";

describe("api()", () => {
  it("sends cookies, JSON, query values and a fresh request id", async () => {
    const calls = stubApi(() => ({ body: { ok: true, value: 1 } }));
    const result = await api<{ value: number }>("/api/admin/stock", { method: "POST", body: { a: 1 }, query: { q: "x", empty: "", none: undefined, page: 2 } });
    expect(result.value).toBe(1);
    const [{ url, init }] = calls;
    expect(url.pathname + url.search).toBe("/api/admin/stock?q=x&page=2");
    expect(init.credentials).toBe("include");
    expect(init.body).toBe('{"a":1}');
    const headers = init.headers as Record<string, string>;
    expect(headers["x-request-id"]).toMatch(/^[0-9a-f]{32}$/);
    await api("/api/admin/me");
    expect((calls[1].init.headers as Record<string, string>)["x-request-id"]).not.toBe(headers["x-request-id"]);
  });

  it("turns refusals into ApiError with the server's message and request id", async () => {
    stubApi(() => ({ status: 400, body: { ok: false, message: "Enter a whole number from 0 to 100,000." } }));
    const error = await api("/api/admin/stock").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: "Enter a whole number from 0 to 100,000.", requestId: "srv0123456789abcdef" });
  });

  it("joins field errors and has plain messages for server and network failures", async () => {
    stubApi(() => ({ status: 400, body: { ok: false, errors: { email: "Bad email." } } }));
    await expect(api("/x")).rejects.toMatchObject({ message: "Bad email.", errors: { email: "Bad email." } });
    stubApi(() => ({ status: 503, body: {} }));
    await expect(api("/x")).rejects.toMatchObject({ message: "Something went wrong on the server. Try again." });
    stubApi(() => {
      throw new TypeError("network down");
    });
    await expect(api("/x")).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/couldn't reach the server/) });
  });
});

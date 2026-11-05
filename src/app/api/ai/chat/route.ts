import { catalogueAssist } from "@/lib/ai/catalogueAssist";
import {
  OBASIX_AI_SYSTEM_PROMPT,
  buildCatalogueContext,
  buildCustomizerCta,
  filterKnownProductIds,
} from "@/lib/ai/catalogueContext";
import { AiProviderError, completeJsonChat, getAiProviderConfig } from "@/lib/ai/provider";
import { allowAiAttempt } from "@/lib/ai/rateLimit";

export const runtime = "nodejs";

const MAX_MESSAGE_LEN = 1200;
const MAX_HISTORY = 12;

type IncomingMessage = { role?: unknown; content?: unknown };

type ParsedAssistant = {
  message?: unknown;
  productIds?: unknown;
  customizerProductId?: unknown;
  customizerLabel?: unknown;
};

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function cleanText(value: unknown, max = MAX_MESSAGE_LEN): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeHistory(raw: unknown): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const item of raw as IncomingMessage[]) {
    const role = item?.role === "assistant" ? "assistant" : item?.role === "user" ? "user" : null;
    const content = cleanText(item?.content, MAX_MESSAGE_LEN);
    if (!role || !content) continue;
    out.push({ role, content });
    if (out.length >= MAX_HISTORY) break;
  }
  return out;
}

function parseModelJson(raw: string): ParsedAssistant {
  try {
    return JSON.parse(raw) as ParsedAssistant;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("invalid_json");
    return JSON.parse(match[0]) as ParsedAssistant;
  }
}

function fallbackPayload(message: string, code: string) {
  const assist = catalogueAssist(message);
  return {
    ok: false,
    code,
    message: assist.message,
    retryable: true,
    mode: "catalogue-fallback",
    recommendations: assist.recommendations,
    customizerCta: assist.customizerCta ?? null,
    links: assist.links,
  };
}

export async function GET() {
  const config = getAiProviderConfig();
  return Response.json({
    ok: true,
    configured: config.configured,
    missing: config.configured ? [] : config.missing,
    provider: config.configured ? "openai-compatible" : null,
    model: config.configured ? config.model : null,
  });
}

export async function POST(request: Request) {
  const config = getAiProviderConfig();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, code: "validation", message: "Could not read the chat request.", retryable: false },
      { status: 400 },
    );
  }

  const payload = (body ?? {}) as { message?: unknown; history?: unknown };
  const message = cleanText(payload.message);
  if (message.length < 2) {
    return Response.json(
      {
        ok: false,
        code: "validation",
        message: "Please enter a short question for OBASIX Assistant.",
        retryable: false,
      },
      { status: 400 },
    );
  }

  if (!config.configured) {
    return Response.json(fallbackPayload(message, "unconfigured"), { status: 503 });
  }

  if (!allowAiAttempt(clientKey(request))) {
    return Response.json(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many chat requests. Please wait a minute and try again.",
        retryable: true,
        links: [
          { label: "Browse Products", href: "/products" },
          { label: "Design Your Board", href: "/customize" },
        ],
      },
      { status: 429 },
    );
  }

  const history = normalizeHistory(payload.history);
  const turns = [...history, { role: "user" as const, content: message }];
  const system = `${OBASIX_AI_SYSTEM_PROMPT}\n\n${buildCatalogueContext(48)}`;

  try {
    const { content, model } = await completeJsonChat({ system, messages: turns });
    const parsed = parseModelJson(content);
    const reply = cleanText(parsed.message, 4000);
    if (!reply) {
      return Response.json(fallbackPayload(message, "upstream"), { status: 502 });
    }

    const productIds = filterKnownProductIds(parsed.productIds);
    const customizerProductId =
      typeof parsed.customizerProductId === "string"
        ? filterKnownProductIds([parsed.customizerProductId])[0]
        : productIds.find((id) => Boolean(buildCustomizerCta(id)));

    const customizerCta = buildCustomizerCta(
      customizerProductId,
      typeof parsed.customizerLabel === "string" ? parsed.customizerLabel : undefined,
    );

    return Response.json({
      ok: true,
      mode: "ai",
      message: reply,
      productIds,
      recommendations: productIds.map((productId) => ({
        productId,
        reason: "Suggested from the live OBASIX catalogue",
      })),
      customizerCta: customizerCta ?? null,
      model,
    });
  } catch (error) {
    if (error instanceof AiProviderError) {
      console.error("[obasix-ai] request failed", { code: error.code, status: error.status });
      return Response.json(fallbackPayload(message, error.code), {
        status: error.code === "unconfigured" ? 503 : 502,
      });
    }

    if (error instanceof Error && error.message === "invalid_json") {
      console.error("[obasix-ai] invalid model JSON");
      return Response.json(fallbackPayload(message, "upstream"), { status: 502 });
    }

    console.error("[obasix-ai] unexpected failure");
    return Response.json(fallbackPayload(message, "upstream"), { status: 502 });
  }
}

export type AiProviderConfig =
  | { configured: false; missing: string[] }
  | {
      configured: true;
      apiKey: string;
      baseUrl: string;
      model: string;
    };

export type AiFailureCode =
  | "unconfigured"
  | "upstream"
  | "quota"
  | "auth"
  | "timeout"
  | "rate_limited";

export function getAiProviderConfig(): AiProviderConfig {
  const apiKey =
    process.env.OBASIX_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  const baseUrl = (
    process.env.OBASIX_AI_BASE_URL?.trim() || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.OBASIX_AI_MODEL?.trim() || "gpt-4o-mini";

  if (!apiKey) {
    return { configured: false, missing: ["OBASIX_AI_API_KEY"] };
  }

  return { configured: true, apiKey, baseUrl, model };
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

const REQUEST_TIMEOUT_MS = 28_000;

function sanitizeDetail(raw: string) {
  return raw
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .slice(0, 400);
}

function classifyUpstream(status: number, body: string): {
  code: AiFailureCode;
  message: string;
} {
  const lower = body.toLowerCase();
  if (status === 401 || status === 403 || lower.includes("invalid_api_key")) {
    return {
      code: "auth",
      message:
        "I'm having trouble responding right now. You can still browse our products or explore board customization.",
    };
  }
  if (
    status === 429 ||
    lower.includes("insufficient_quota") ||
    lower.includes("credit_balance_exhausted") ||
    lower.includes("billing")
  ) {
    return {
      code: "quota",
      message:
        "I'm having trouble responding right now. You can still browse our products or explore board customization.",
    };
  }
  if (status === 429) {
    return {
      code: "rate_limited",
      message:
        "I'm having trouble responding right now. You can still browse our products or explore board customization.",
    };
  }
  return {
    code: "upstream",
    message:
      "I'm having trouble responding right now. You can still browse our products or explore board customization.",
  };
}

async function postChatCompletion(options: {
  config: Extract<AiProviderConfig, { configured: true }>;
  system: string;
  messages: ChatTurn[];
  useJsonObject: boolean;
  signal: AbortSignal;
}) {
  return fetch(`${options.config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.config.apiKey}`,
      "Content-Type": "application/json",
    },
    signal: options.signal,
    body: JSON.stringify({
      model: options.config.model,
      temperature: 0.4,
      ...(options.useJsonObject ? { response_format: { type: "json_object" } } : {}),
      messages: [
        { role: "system", content: options.system },
        ...options.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    }),
  });
}

export async function completeJsonChat(options: {
  system: string;
  messages: ChatTurn[];
}): Promise<{ content: string; model: string }> {
  const config = getAiProviderConfig();
  if (!config.configured) {
    throw new AiProviderError(
      "OBASIX AI is not connected on this server yet.",
      "unconfigured",
      503,
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response = await postChatCompletion({
      config,
      system: options.system,
      messages: options.messages,
      useJsonObject: true,
      signal: controller.signal,
    });

    // Some compatible providers reject response_format — retry without it.
    if (!response.ok && (response.status === 400 || response.status === 404)) {
      const firstBody = await response.text().catch(() => "");
      if (/response_format|json_object|unknown parameter/i.test(firstBody)) {
        console.warn("[obasix-ai] retrying without response_format", {
          status: response.status,
          detail: sanitizeDetail(firstBody),
        });
        response = await postChatCompletion({
          config,
          system: options.system,
          messages: options.messages,
          useJsonObject: false,
          signal: controller.signal,
        });
      } else {
        const classified = classifyUpstream(response.status, firstBody);
        console.error("[obasix-ai] upstream error", {
          status: response.status,
          code: classified.code,
          detail: sanitizeDetail(firstBody),
        });
        throw new AiProviderError(classified.message, classified.code, 502, sanitizeDetail(firstBody));
      }
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const classified = classifyUpstream(response.status, detail);
      console.error("[obasix-ai] upstream error", {
        status: response.status,
        code: classified.code,
        detail: sanitizeDetail(detail),
      });
      throw new AiProviderError(classified.message, classified.code, 502, sanitizeDetail(detail));
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new AiProviderError(
        "I'm having trouble responding right now. You can still browse our products or explore board customization.",
        "upstream",
        502,
      );
    }

    return { content, model: config.model };
  } catch (error) {
    if (error instanceof AiProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[obasix-ai] request timeout");
      throw new AiProviderError(
        "I'm having trouble responding right now. You can still browse our products or explore board customization.",
        "timeout",
        504,
      );
    }
    console.error("[obasix-ai] network error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    throw new AiProviderError(
      "I'm having trouble responding right now. You can still browse our products or explore board customization.",
      "upstream",
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}

export class AiProviderError extends Error {
  code: AiFailureCode;
  status: number;
  detail?: string;

  constructor(message: string, code: AiFailureCode, status: number, detail?: string) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

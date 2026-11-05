/**
 * Diagnose OBASIX AI provider configuration (no secrets printed).
 * Run: node scripts/diagnose-ai.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(name) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const apiKey =
  process.env.OBASIX_AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
const baseUrl = (process.env.OBASIX_AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
  /\/$/,
  "",
);
const model = process.env.OBASIX_AI_MODEL?.trim() || "gpt-4o-mini";

console.log(
  JSON.stringify(
    {
      hasKey: Boolean(apiKey),
      keyLength: apiKey.length,
      keyPrefix: apiKey ? `${apiKey.slice(0, 8)}…` : null,
      baseUrl,
      model,
    },
    null,
    2,
  ),
);

if (!apiKey) {
  console.log("No API key found. Set OBASIX_AI_API_KEY in .env.local");
  process.exit(1);
}

const body = {
  model,
  temperature: 0,
  messages: [
    { role: "system", content: "Return JSON only." },
    { role: "user", content: 'Return {"ok":true,"message":"pong"}' },
  ],
  response_format: { type: "json_object" },
};

const response = await fetch(`${baseUrl}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const text = await response.text();
console.log("status", response.status);
console.log(text.slice(0, 800));
process.exit(response.ok ? 0 : 2);

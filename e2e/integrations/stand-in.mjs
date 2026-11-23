// A local stand-in for Razorpay, Resend and the Claude API, used by the integration tests.
// The app is pointed here with RAZORPAY_API_BASE, RESEND_API_BASE and ANTHROPIC_BASE_URL, so the
// live payment, email and AI code runs for real without keys or network access.
//
// Test controls:
//   GET  /__calls        every call received, oldest first
//   POST /__fail         {"service": "razorpay" | "claude", "status": 500, "times": 1}: the next calls to it fail
import { createServer } from "node:http";

const port = Number(process.env.STAND_IN_PORT ?? 3219);
const calls = [];
const failNext = {};
// Ids are unique across restarts, like Razorpay's: the app's test database outlives the stand-in.
const runId = Date.now().toString(36);
let sequence = 0;
const nextId = (prefix) => `${prefix}_${runId}${++sequence}`;

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

function claudeMessage() {
  const output = {
    room: "A bright meeting room with white walls and light wooden flooring.",
    suggestions: [
      { frameId: "aluminium-light", colourId: "white", reason: "The light frame keeps the bright room feeling open." },
    ],
  };
  return {
    id: nextId("msg"),
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content: [{ type: "text", text: JSON.stringify(output) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 10 },
  };
}

createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  let body = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {}

  if (url.pathname === "/__calls") return json(res, 200, calls);
  if (url.pathname === "/__fail") {
    failNext[body.service] = { status: body.status, remaining: body.times ?? 1 };
    return json(res, 200, { ok: true });
  }

  const service = url.pathname === "/v1/orders" ? "razorpay" : url.pathname === "/emails" ? "resend" : url.pathname === "/v1/messages" ? "claude" : null;
  if (!service) return json(res, 404, { error: "not a stand-in route" });
  calls.push({ service, path: url.pathname, authorization: req.headers.authorization ?? "", apiKey: req.headers["x-api-key"] ?? "", body });

  if (failNext[service]) {
    const { status } = failNext[service];
    if (--failNext[service].remaining <= 0) delete failNext[service];
    return json(res, status, { error: { type: "api_error", message: "stand-in failure" } });
  }
  if (service === "razorpay") {
    return json(res, 200, { id: nextId("order"), entity: "order", amount: body.amount, currency: body.currency, receipt: body.receipt, status: "created" });
  }
  if (service === "resend") return json(res, 200, { id: nextId("email") });
  return json(res, 200, claudeMessage());
}).listen(port, () => console.log(`Integration stand-in on http://localhost:${port}`));

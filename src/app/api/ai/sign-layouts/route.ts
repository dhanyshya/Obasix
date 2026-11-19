import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { checkDesign, decodeDesign, encodeDesign, getSignType, signFonts } from "@/data/signage";
import { allowAiAttempt } from "@/lib/ai/rateLimit";
import { claude, claudeConfigured, claudeErrorMessage, designModel, fallbackOptions } from "@/lib/ai/claude";
import { clientAddress, sameOrigin } from "@/lib/auth/session";

export const runtime = "nodejs";

const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

const Layouts = z.object({
  alternatives: z
    .array(
      z.object({
        name: z.string().describe("Two to four words naming the idea, e.g. 'Name first, number small'"),
        lines: z.array(z.string()).describe("The sign's text, one entry per line, top to bottom"),
        fontId: z.enum(signFonts.map((f) => f.id) as [string, ...string[]]),
        reason: z.string().describe("One sentence on why this layout reads well"),
      }),
    )
    .describe("Three alternatives that differ from the current design and from each other"),
});

/** Suggests alternative layouts for the customer's current sign, checked against the manufacturing rules. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  if (!claudeConfigured()) return fail("Layout suggestions aren't switched on yet.", 503);
  if (!allowAiAttempt(`${clientAddress(request)}:sign-layouts`)) return fail("Too many requests. Wait a minute and try again.", 429);

  const body = (await request.json().catch(() => null)) as { design?: unknown } | null;
  const design = typeof body?.design === "string" ? decodeDesign(new URLSearchParams(body.design.slice(0, 4000))) : null;
  const type = design ? getSignType(design.typeId) : undefined;
  if (!design || !type) return fail("Open a sign design first.");
  const text = design.lines.map((l) => l.trim()).filter(Boolean);
  if (text.length === 0) return fail("Add the text for your sign first.");

  try {
    const response = await claude().beta.messages.parse({
      model: designModel,
      max_tokens: 4000,
      ...fallbackOptions(),
      output_config: { effort: "low", format: betaZodOutputFormat(Layouts) },
      system:
        "You are a sign typographer at OBASIX, an Indian maker of nameplates and signs. Propose clearer or more elegant arrangements of the customer's text. " +
        "Use only the words, names and numbers the customer gave: you may reorder, split or join lines, drop repeated words, and change emphasis or typeface, " +
        "but never invent, translate, or correct names, and never add a language the customer didn't use. Fewer, shorter lines read better at a distance.",
      messages: [
        {
          role: "user",
          content: [
            `Sign: ${type.name} (${type.description}), ${design.widthCm} × ${design.heightCm} cm, at most ${type.maxLines} lines.`,
            `The first line is set largest${type.layout === "directory" ? "; later lines are equal-size rows" : "; later lines are about half its size"}.`,
            `Typefaces: ${signFonts.map((f) => `${f.id} (${f.name})`).join(", ")}. Current typeface: ${design.fontId}.`,
            "Current text, one line each:",
            ...text.map((l) => `- ${l}`),
          ].join("\n"),
        },
      ],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return fail("We couldn't suggest layouts for this sign. Try changing the text.", 422);

    // Keep only alternatives that the manufacturing rules accept and that actually differ.
    const current = JSON.stringify([text, design.fontId]);
    const alternatives = response.parsed_output.alternatives
      .map((alt) => {
        const lines = alt.lines.map((l) => l.trim().slice(0, 60)).filter(Boolean).slice(0, type.maxLines);
        const next = { ...design, lines, fontId: alt.fontId as typeof design.fontId };
        return { alt, next, lines };
      })
      .filter(({ next, lines }) => lines.length > 0 && JSON.stringify([lines, next.fontId]) !== current && checkDesign(type, next).ok)
      .slice(0, 3)
      .map(({ alt, next }) => ({ name: alt.name, reason: alt.reason, design: encodeDesign(next) }));
    if (alternatives.length === 0) return fail("We couldn't find a better layout that fits this sign. Your current design is a good one.", 422);
    return Response.json({ ok: true, alternatives });
  } catch (error) {
    return fail(claudeErrorMessage(error), 502);
  }
}

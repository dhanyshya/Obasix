import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { colours, frames, getProductById } from "@/data/catalogue";
import { allowAiAttempt } from "@/lib/ai/rateLimit";
import { claude, claudeConfigured, claudeErrorMessage, designModel, fallbackOptions } from "@/lib/ai/claude";
import { clientAddress, sameOrigin } from "@/lib/auth/session";
import { sniffType } from "@/lib/files";

export const runtime = "nodejs";

const maxBytes = 5 * 1024 * 1024;
const fail = (message: string, status = 400) => Response.json({ ok: false, message }, { status });

const Suggestions = z.object({
  room: z.string().describe("One short sentence describing the wall and room as seen in the photo"),
  suggestions: z
    .array(
      z.object({
        frameId: z.enum(frames.map((f) => f.id) as [string, ...string[]]),
        colourId: z.enum(colours.map((c) => c.id) as [string, ...string[]]),
        reason: z.string().describe("One sentence on why this suits the room"),
      }),
    )
    .describe("Two or three suggestions, best first"),
});

/** Suggests frame and surface colours for a board, from a photo of the customer's wall. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("The request was rejected.", 403);
  if (!claudeConfigured()) return fail("Design suggestions aren't switched on yet.", 503);
  if (!allowAiAttempt(`${clientAddress(request)}:frame-colours`)) return fail("Too many requests. Wait a minute and try again.", 429);

  const form = await request.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return fail("Add a photo of the wall.");
  if (photo.size > maxBytes) return fail("The photo must be 5 MB or smaller.");
  const bytes = new Uint8Array(await photo.arrayBuffer());
  const mediaType = sniffType(bytes);
  if (mediaType !== "image/jpeg" && mediaType !== "image/png" && mediaType !== "image/webp") {
    return fail("Use a JPEG, PNG or WebP photo.");
  }
  const product = getProductById(String(form?.get("productId") ?? ""));

  const options = [
    "Frames we make:",
    ...frames.map((f) => `- ${f.id}: ${f.name}. ${f.description}`),
    "Surface colours we make:",
    ...colours.map((c) => `- ${c.id}: ${c.name} (${c.hex})`),
  ].join("\n");

  try {
    const response = await claude().beta.messages.parse({
      model: designModel,
      max_tokens: 4000,
      ...fallbackOptions(),
      output_config: { effort: "low", format: betaZodOutputFormat(Suggestions) },
      system:
        "You help customers of OBASIX, an Indian maker of whiteboards and notice boards, choose a frame and surface colour that suit their room. " +
        "Look at the wall colour, flooring, furniture and light in the photo. Only suggest frames and colours from the lists given, by id. " +
        "Keep reasons short and concrete (e.g. 'the black frame echoes the dark window frames'). If the photo doesn't show a room or wall, say so in 'room' and still suggest neutral options.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: Buffer.from(bytes).toString("base64") } },
            {
              type: "text",
              text: `${options}\n\n${product ? `The customer is looking at: ${product.name}.` : ""} Suggest the best frame and colour combinations for this wall.`,
            },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return fail("We couldn't get suggestions for this photo. Try another one.", 422);
    const out = response.parsed_output;
    return Response.json({
      ok: true,
      room: out.room,
      suggestions: out.suggestions.slice(0, 3).map((s) => ({
        frameId: s.frameId,
        frameName: frames.find((f) => f.id === s.frameId)?.name ?? s.frameId,
        colourId: s.colourId,
        colourName: colours.find((c) => c.id === s.colourId)?.name ?? s.colourId,
        colourHex: colours.find((c) => c.id === s.colourId)?.hex ?? "#ccc",
        reason: s.reason,
      })),
    });
  } catch (error) {
    return fail(claudeErrorMessage(error), 502);
  }
}

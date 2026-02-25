import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { runDeckPipeline } from "../services/deckPipeline.js";
import { env } from "../config.js";

type JsonBody = {
  transcript?: string;
};

async function readTranscriptFromMultipart(request: FastifyRequest): Promise<string | null> {
  if (!request.isMultipart()) {
    return null;
  }

  let transcriptFromTextField: string | null = null;
  let transcriptFromFile: string | null = null;

  const parts = request.parts({ limits: { files: 1, fileSize: 2 * 1024 * 1024 } });
  for await (const part of parts) {
    if (part.type === "file") {
      if (part.fieldname !== "transcript_file") {
        continue;
      }
      const fileBuffer = await part.toBuffer();
      transcriptFromFile = fileBuffer.toString("utf8").trim();
    } else if (part.type === "field") {
      if (part.fieldname === "transcript") {
        transcriptFromTextField = String(part.value ?? "").trim();
      }
    }
  }

  return transcriptFromTextField || transcriptFromFile;
}

function normalizeTranscript(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new Error("Transcript is empty");
  }
  if (trimmed.length > env.MAX_TRANSCRIPT_CHARS) {
    throw new Error(`Transcript exceeds max length (${env.MAX_TRANSCRIPT_CHARS} chars)`);
  }
  return trimmed;
}

export async function registerGenerateDeckRoute(app: FastifyInstance): Promise<void> {
  app.post(
    "/generate_deck",
    async (request: FastifyRequest<{ Body: JsonBody }>, reply: FastifyReply) => {
      try {
        const multipartTranscript = await readTranscriptFromMultipart(request);
        const bodyTranscript = request.body?.transcript;

        const transcriptRaw = multipartTranscript ?? bodyTranscript;
        if (!transcriptRaw) {
          return reply.status(400).send({
            error: "Missing transcript",
            details: "Provide transcript in JSON body as `transcript` or multipart field/file `transcript`/`transcript_file`."
          });
        }

        const transcript = normalizeTranscript(transcriptRaw);
        request.log.info({ transcriptChars: transcript.length }, "Starting deck generation pipeline");

        const result = await runDeckPipeline(transcript);

        return reply.status(200).send(result);
      } catch (error) {
        request.log.error({ err: error }, "Deck generation failed");

        const message = error instanceof Error ? error.message : "Unknown error";
        const statusCode = message.startsWith("Transcript") || message.startsWith("Missing transcript") ? 400 : 500;

        return reply.status(statusCode).send({
          error: "deck_generation_failed",
          details: message
        });
      }
    }
  );
}

import { NextResponse } from "next/server";
import { TRANSCRIPT_CHAR_MAX } from "@/lib/constants";
import type { ApiError, GenerateSectionsRequest } from "@/lib/types";
import { isValidModelForProvider, isValidProvider } from "@/lib/validation/providerSelection";
import { streamExecutiveSections } from "@/server/services/generateSections";

function errorResponse(status: number, error: ApiError) {
  return NextResponse.json(error, { status });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const body = (await request.json()) as Partial<GenerateSectionsRequest>;
    const transcript = body.transcript?.trim() || "";

    if (!transcript) {
      return errorResponse(400, {
        error: "invalid_transcript",
        details: "Transcript is required."
      });
    }

    if (transcript.length > TRANSCRIPT_CHAR_MAX) {
      return errorResponse(400, {
        error: "invalid_transcript",
        details: `Transcript exceeds ${TRANSCRIPT_CHAR_MAX} characters.`
      });
    }

    if (!isValidProvider(body.provider)) {
      return errorResponse(400, {
        error: "invalid_provider",
        details: "Provider is required."
      });
    }

    if (!body.model) {
      return errorResponse(400, {
        error: "invalid_model",
        details: "Model is required."
      });
    }

    if (!isValidModelForProvider(body.provider, body.model)) {
      return errorResponse(400, {
        error: "invalid_model",
        details: "Invalid model selection for provider."
      });
    }

    const startedAt = Date.now();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of streamExecutiveSections(transcript, body.provider!, body.model!)) {
            controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          }
          console.info(JSON.stringify({ requestId, endpoint: "/api/generate-sections", provider: body.provider, model: body.model, transcriptLength: transcript.length, durationMs: Date.now() - startedAt }));
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to generate sections.";
          console.error(JSON.stringify({ requestId, endpoint: "/api/generate-sections", error: message }));
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: "generation_failed", error: message })}\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate sections.";
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode: number }).statusCode) : message.includes("validation") ? 502 : 500;
    console.error(JSON.stringify({ requestId, endpoint: "/api/generate-sections", error: message }));

    return errorResponse(statusCode, {
      error: "generate_sections_failed",
      details: message
    });
  }
}

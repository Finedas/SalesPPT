import { NextResponse } from "next/server";
import { TRANSCRIPT_CHAR_MAX } from "@/lib/constants";
import type { ApiError, GenerateSectionsRequest } from "@/lib/types";
import { generateExecutiveSections } from "@/server/services/generateSections";

function errorResponse(status: number, error: ApiError) {
  return NextResponse.json(error, { status });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const body = (await request.json()) as GenerateSectionsRequest;
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

    const startedAt = Date.now();
    const sections = await generateExecutiveSections(transcript);
    console.info(JSON.stringify({ requestId, endpoint: "/api/generate-sections", transcriptLength: transcript.length, durationMs: Date.now() - startedAt }));

    return NextResponse.json(sections, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate sections.";
    console.error(JSON.stringify({ requestId, endpoint: "/api/generate-sections", error: message }));

    return errorResponse(message.includes("validation") ? 502 : 500, {
      error: "generate_sections_failed",
      details: message
    });
  }
}

import { NextResponse } from "next/server";
import type { ApiError, GenerateSlidesRequest } from "@/lib/types";
import { validateSections } from "@/lib/validation/sections";
import { generateExecutiveSlides } from "@/server/services/generateSlides";

function errorResponse(status: number, error: ApiError) {
  return NextResponse.json(error, { status });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const body = (await request.json()) as GenerateSlidesRequest;
    if (!body || typeof body !== "object" || !("sections" in body)) {
      return errorResponse(400, {
        error: "invalid_sections",
        details: "Sections payload is required."
      });
    }

    const validation = validateSections(body.sections);

    if (!validation.valid) {
      return errorResponse(400, {
        error: "invalid_sections",
        details: "Sections payload failed validation.",
        issues: validation.issues
      });
    }

    const startedAt = Date.now();
    const slides = await generateExecutiveSlides(body.sections);
    console.info(JSON.stringify({ requestId, endpoint: "/api/generate-slides", durationMs: Date.now() - startedAt }));

    return NextResponse.json(slides, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate slides.";
    console.error(JSON.stringify({ requestId, endpoint: "/api/generate-slides", error: message }));

    return errorResponse(message.includes("validation") ? 502 : 500, {
      error: "generate_slides_failed",
      details: message
    });
  }
}

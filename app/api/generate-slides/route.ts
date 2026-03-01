import { NextResponse } from "next/server";
import type { ApiError, GenerateSlidesRequest } from "@/lib/types";
import { isValidModelForProvider, isValidProvider } from "@/lib/validation/providerSelection";
import { validateSections } from "@/lib/validation/sections";
import { generateExecutiveSlides } from "@/server/services/generateSlides";

function errorResponse(status: number, error: ApiError) {
  return NextResponse.json(error, { status });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const body = (await request.json()) as Partial<GenerateSlidesRequest>;
    if (!body || typeof body !== "object" || !("sections" in body)) {
      return errorResponse(400, {
        error: "invalid_sections",
        details: "Sections payload is required."
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

    const sections = body.sections;
    if (!sections) {
      return errorResponse(400, {
        error: "invalid_sections",
        details: "Sections payload is required."
      });
    }

    const validation = validateSections(sections);
    if (!validation.valid) {
      return errorResponse(400, {
        error: "invalid_sections",
        details: "Sections payload failed validation.",
        issues: validation.issues
      });
    }

    const startedAt = Date.now();
    const slides = await generateExecutiveSlides(sections, body.provider, body.model);
    console.info(JSON.stringify({ requestId, endpoint: "/api/generate-slides", provider: body.provider, model: body.model, durationMs: Date.now() - startedAt }));

    return NextResponse.json(slides, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate slides.";
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode: number }).statusCode) : message.includes("validation") ? 502 : 500;
    console.error(JSON.stringify({ requestId, endpoint: "/api/generate-slides", error: message }));

    return errorResponse(statusCode, {
      error: "generate_slides_failed",
      details: message
    });
  }
}

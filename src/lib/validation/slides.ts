import { ATTRIBUTION_LINE } from "@/lib/constants";
import { executiveSlidesSchema } from "@/lib/schemas/slides.schema";
import type { ExecutiveSections, ExecutiveSlidesResponse, ValidationResult } from "@/lib/types";

function normalizeText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);
}

function isDerivedFromSummary(quote: string, summary: string): boolean {
  const quoteTokens = normalizeText(quote);
  const summaryTokens = new Set(normalizeText(summary));

  if (quoteTokens.length === 0) {
    return false;
  }

  const overlappingTokens = quoteTokens.filter((token) => summaryTokens.has(token));
  return overlappingTokens.length / quoteTokens.length >= 0.5;
}

export function validateSlides(payload: unknown): ValidationResult {
  const parsed = executiveSlidesSchema.safeParse(payload);
  const issues: string[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push(`${issue.path.join(".") || "slides"}: ${issue.message}`);
    }
  }

  const candidate = (typeof payload === "object" && payload !== null ? payload : {}) as Partial<ExecutiveSlidesResponse>;
  const slidePayload: Partial<ExecutiveSlidesResponse> = parsed.success ? parsed.data : candidate;

  if (slidePayload.slideCount === 2) {
    if (!slidePayload.slide2) {
      issues.push("slide2 is required when slideCount is 2.");
    }
    if (slidePayload.slide1?.variant !== "two-column-summary") {
      issues.push("slide1 must be two-column-summary when slideCount is 2.");
    }
    if (slidePayload.slide2 && slidePayload.slide2.variant !== "results-banner") {
      issues.push("slide2 must be results-banner when slideCount is 2.");
    }
  }

  if (slidePayload.slideCount === 1) {
    if (slidePayload.slide2) {
      issues.push("slide2 must be omitted when slideCount is 1.");
    }
    if (slidePayload.slide1?.variant !== "single-slide-brief") {
      issues.push("slide1 must be single-slide-brief when slideCount is 1.");
    }
  }

  if (slidePayload.slide1?.variant === "single-slide-brief") {
    if (!slidePayload.slide1.executiveQuote?.trim()) {
      issues.push("slide1 executiveQuote cannot be empty.");
    }
    if (slidePayload.slide1.attribution !== ATTRIBUTION_LINE) {
      issues.push("slide1 attribution is invalid.");
    }
  }

  if (slidePayload.slide2) {
    if (!slidePayload.slide2.executiveQuote?.trim()) {
      issues.push("slide2 executiveQuote cannot be empty.");
    }
    if (slidePayload.slide2.attribution !== ATTRIBUTION_LINE) {
      issues.push("slide2 attribution is invalid.");
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

export function validateSlidesAgainstSections(
  payload: ExecutiveSlidesResponse,
  sections: ExecutiveSections
): ValidationResult {
  const validation = validateSlides(payload);
  const issues = [...validation.issues];

  const quote =
    payload.slideCount === 2
      ? payload.slide2?.executiveQuote ?? ""
      : payload.slide1.variant === "single-slide-brief"
        ? payload.slide1.executiveQuote
        : "";

  if (!isDerivedFromSummary(quote, sections.summary)) {
    issues.push("Executive quote must be derived from the summary section.");
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

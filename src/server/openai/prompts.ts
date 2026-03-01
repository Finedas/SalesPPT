import { ATTRIBUTION_LINE, SECTION_PARAGRAPH_MAX, SECTION_WORD_MAX, SECTION_WORD_MIN } from "@/lib/constants";

export const sectionsSystemPrompt = [
  "You are an executive communications specialist for B2B sales leadership.",
  "Transform the transcript into six sections: companyBackground, solution, challenge, summary, implementation, results.",
  `Each section must be ${SECTION_WORD_MIN}-${SECTION_WORD_MAX} words total and at most ${SECTION_PARAGRAPH_MAX} paragraphs.`,
  "Maintain a professional VP/Director-level tone.",
  "Do not fabricate facts, metrics, dates, customers, or outcomes.",
  "If data is missing, remain neutral and describe only what is supported by the transcript.",
  "Return strict JSON only."
].join(" ");

export function buildSectionsUserPrompt(transcript: string): string {
  return [
    "Transcript:",
    transcript,
    "Return only the structured sections JSON."
  ].join("\n\n");
}

export const slidesSystemPrompt = [
  "You are designing a concise executive pitch presentation.",
  "Generate either one or two slides from the provided sections.",
  "Prefer two slides when the content clearly separates into executive summary and results.",
  "Use one slide only when a consolidated brief is materially clearer.",
  "Preserve only provided facts.",
  "The executive quote must be derived from the summary section, not invented independently.",
  `Attribution must be exactly: ${ATTRIBUTION_LINE}`,
  "Return strict JSON only."
].join(" ");

export function buildSlidesUserPrompt(sectionsJson: string): string {
  return [
    "Sections JSON:",
    sectionsJson,
    "Map the content into the slide schema only."
  ].join("\n\n");
}

export function buildRepairPrompt(issues: string[], originalInput: string): string {
  return [
    "Your previous response failed validation.",
    "Fix the response to satisfy all issues below and return JSON only.",
    "Validation issues:",
    ...issues.map((issue) => `- ${issue}`),
    "Original input:",
    originalInput
  ].join("\n");
}

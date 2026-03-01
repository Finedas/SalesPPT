import { SECTION_PARAGRAPH_MAX, SECTION_WORD_MAX, SECTION_WORD_MIN } from "@/lib/constants";
import { executiveSectionsSchema } from "@/lib/schemas/sections.schema";
import type { ExecutiveSections, ValidationResult } from "@/lib/types";

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countParagraphs(text: string): number {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean).length;
}

export function validateSectionField(name: string, text: string): string[] {
  const issues: string[] = [];
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    issues.push(`${name} cannot be empty.`);
    return issues;
  }

  const wordCount = countWords(trimmed);
  if (wordCount < SECTION_WORD_MIN || wordCount > SECTION_WORD_MAX) {
    issues.push(`${name} must be ${SECTION_WORD_MIN}-${SECTION_WORD_MAX} words.`);
  }

  const paragraphCount = countParagraphs(trimmed);
  if (paragraphCount > SECTION_PARAGRAPH_MAX) {
    issues.push(`${name} must be no more than ${SECTION_PARAGRAPH_MAX} paragraphs.`);
  }

  return issues;
}

export function validateSingleSection(key: keyof ExecutiveSections, text: string): ValidationResult {
  const issues = validateSectionField(key, text);
  return {
    valid: issues.length === 0,
    issues
  };
}

export function summarizeSectionValidationIssues(issues: string[]) {
  return {
    underWordMinimum: issues.some((issue) => issue.includes(`must be ${SECTION_WORD_MIN}-${SECTION_WORD_MAX} words`)),
    tooManyParagraphs: issues.some((issue) => issue.includes(`no more than ${SECTION_PARAGRAPH_MAX} paragraphs`))
  };
}

export function validateSections(sections: unknown): ValidationResult {
  const parsed = executiveSectionsSchema.safeParse(sections);
  const issues: string[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push(`${issue.path.join(".") || "sections"}: ${issue.message}`);
    }
  }

  if (parsed.success) {
    for (const [key, value] of Object.entries(parsed.data) as [keyof ExecutiveSections, string][]) {
      issues.push(...validateSectionField(key, value));
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

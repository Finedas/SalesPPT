import { describe, expect, it } from "vitest";
import { validateSectionField, validateSections } from "@/lib/validation/sections";
import type { ExecutiveSections } from "@/lib/types";

const validText = Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ");

const validSections: ExecutiveSections = {
  companyBackground: validText,
  solution: validText,
  challenge: validText,
  summary: validText,
  implementation: validText,
  results: validText
};

describe("sections validation", () => {
  it("accepts a valid 120-200 word section", () => {
    expect(validateSectionField("Summary", validText)).toEqual([]);
  });

  it("rejects empty strings", () => {
    expect(validateSectionField("Summary", "   ")).toContain("Summary cannot be empty.");
  });

  it("rejects more than 2 paragraphs", () => {
    const text = `${validText}\n\n${validText}\n\n${validText}`;
    expect(validateSectionField("Summary", text)).toContain("Summary must be no more than 2 paragraphs.");
  });

  it("rejects under 120 words", () => {
    const text = Array.from({ length: 40 }, (_, index) => `word${index + 1}`).join(" ");
    expect(validateSectionField("Summary", text)).toContain("Summary must be 120-200 words.");
  });

  it("rejects over 200 words", () => {
    const text = Array.from({ length: 210 }, (_, index) => `word${index + 1}`).join(" ");
    expect(validateSectionField("Summary", text)).toContain("Summary must be 120-200 words.");
  });

  it("accepts a valid sections payload", () => {
    expect(validateSections(validSections).valid).toBe(true);
  });
});

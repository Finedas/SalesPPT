import { describe, expect, it } from "vitest";
import validSlides from "./fixtures/slideContent.valid.json";
import { enforceTemplateConstraints } from "../src/validation/constraints.js";

describe("template constraint enforcement", () => {
  it("accepts content that satisfies hard limits", () => {
    const sample = structuredClone(validSlides);
    expect(() => enforceTemplateConstraints(sample)).not.toThrow();
  });

  it("rejects title longer than 42 characters", () => {
    const sample = structuredClone(validSlides);
    sample.slides[0].title = "This title is intentionally longer than forty-two chars";
    expect(() => enforceTemplateConstraints(sample)).toThrow(/title exceeds 42 chars/);
  });

  it("rejects bullet longer than 90 characters", () => {
    const sample = structuredClone(validSlides);
    sample.slides[1].bullets[0] =
      "This bullet is deliberately made too long so validation fails because it exceeds the ninety character ceiling.";
    expect(() => enforceTemplateConstraints(sample)).toThrow(/bullet exceeds 90 chars/);
  });

  it("rejects speaker notes outside 60-120 words", () => {
    const sample = structuredClone(validSlides);
    sample.slides[2].speaker_notes = "Too short notes.";
    expect(() => enforceTemplateConstraints(sample)).toThrow(/speaker_notes word count must be 60-120/);
  });
});

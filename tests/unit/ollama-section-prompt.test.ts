import { describe, expect, it } from "vitest";
import { buildOllamaSectionExpansionPrompt, buildOllamaSingleSectionPrompt } from "@/server/prompts";

describe("buildOllamaSingleSectionPrompt", () => {
  const sectionPlan = {
    focus: "Explain the operating context.",
    constraints: ["Stay neutral."],
    supportedFacts: ["Mid-market software company"],
    missingDataNotes: ["Budget not stated"]
  };

  it("includes one section key and section-specific constraints", () => {
    const prompt = buildOllamaSingleSectionPrompt({
      sectionKey: "companyBackground",
      transcript: "Sample transcript.",
      sectionPlan
    });

    expect(prompt).toContain("Generate only the companyBackground section.");
    expect(prompt).toContain("120-200 words");
    expect(prompt).toContain("no more than 2 paragraphs");
  });

  it("includes exact validation issues during repair", () => {
    const prompt = buildOllamaSingleSectionPrompt({
      sectionKey: "companyBackground",
      transcript: "Sample transcript.",
      sectionPlan,
      repair: true,
      validationIssues: ["companyBackground must be 120-200 words."]
    });

    expect(prompt).toContain("Your previous section draft failed validation.");
    expect(prompt).toContain("companyBackground must be 120-200 words.");
  });

  it("includes current draft and supported-facts guidance during expansion", () => {
    const prompt = buildOllamaSectionExpansionPrompt({
      sectionKey: "companyBackground",
      transcript: "Sample transcript.",
      sectionPlan,
      currentDraft: "Short current draft.",
      validationIssues: ["companyBackground must be 120-200 words."]
    });

    expect(prompt).toContain("Expand only the existing companyBackground draft.");
    expect(prompt).toContain("Short current draft.");
    expect(prompt).toContain("companyBackground must be 120-200 words.");
    expect(prompt).toContain("Expand the existing draft so it reaches 120-200 words.");
    expect(prompt).toContain("Do not introduce unsupported facts");
  });
});

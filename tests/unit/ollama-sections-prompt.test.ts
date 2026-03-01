import { describe, expect, it } from "vitest";
import { buildOllamaSectionPlanPrompt, OLLAMA_SECTION_PLAN_EXAMPLE_OUTPUT, OLLAMA_SECTION_PLAN_EXAMPLE_TRANSCRIPT } from "@/server/prompts";

describe("buildOllamaSectionPlanPrompt", () => {
  it("includes the exact section keys and constraints", () => {
    const prompt = buildOllamaSectionPlanPrompt("Sample transcript.");

    expect(prompt).toContain("companyBackground");
    expect(prompt).toContain("solution");
    expect(prompt).toContain("challenge");
    expect(prompt).toContain("summary");
    expect(prompt).toContain("implementation");
    expect(prompt).toContain("results");
    expect(prompt).toContain("focus");
    expect(prompt).toContain("supportedFacts");
  });

  it("includes the example transcript and example json response", () => {
    const prompt = buildOllamaSectionPlanPrompt("Sample transcript.");

    expect(prompt).toContain(OLLAMA_SECTION_PLAN_EXAMPLE_TRANSCRIPT);
    expect(prompt).toContain("Example planning JSON:");
    expect(prompt).toContain(OLLAMA_SECTION_PLAN_EXAMPLE_OUTPUT);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderResponseError } from "@/lib/llmProviders/errors";

const provider = {
  generateSections: vi.fn(),
  generateSectionsStream: vi.fn(),
  generateSlides: vi.fn()
};

vi.mock("@/lib/llmProviders", async () => {
  const actual = await vi.importActual<typeof import("@/lib/llmProviders")>("@/lib/llmProviders");
  return {
    ...actual,
    createLLMProvider: vi.fn(() => provider)
  };
});

describe("generateExecutiveSections", () => {
  beforeEach(() => {
    provider.generateSections.mockReset();
    provider.generateSectionsStream.mockReset();
    vi.resetModules();
  });

  it("passes selected provider/model through the factory path and returns valid sections", async () => {
    const validText = Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ");
    const valid = {
      companyBackground: validText,
      solution: validText,
      challenge: validText,
      summary: validText,
      implementation: validText,
      results: validText
    };

    provider.generateSections.mockResolvedValueOnce(valid);

    const { createLLMProvider } = await import("@/lib/llmProviders");
    const { generateExecutiveSections } = await import("@/server/services/generateSections");
    const result = await generateExecutiveSections("transcript text", "openai", "gpt-4.1-mini");

    expect(createLLMProvider).toHaveBeenCalledWith({ provider: "openai", model: "gpt-4.1-mini" });
    expect(provider.generateSections).toHaveBeenCalledTimes(1);
    expect(provider.generateSections).toHaveBeenNthCalledWith(1, "transcript text", { repair: false, validationIssues: undefined });
    expect(result.summary).toBe(valid.summary);
  });

  it("surfaces provider failure from the Ollama path without a service retry", async () => {
    provider.generateSections.mockRejectedValueOnce(
      new ProviderResponseError("Sections validation failed after section-level retries: summary must be 120-200 words.")
    );

    const { generateExecutiveSections } = await import("@/server/services/generateSections");
    await expect(generateExecutiveSections("transcript text", "ollama", "llama3")).rejects.toThrow(
      /section-level retries/i
    );

    expect(provider.generateSections).toHaveBeenCalledTimes(1);
    expect(provider.generateSections).toHaveBeenNthCalledWith(1, "transcript text", {
      repair: false,
      validationIssues: undefined
    });
  });

  it("throws when the provider returns a final invalid sections object", async () => {
    const invalid = {
      companyBackground: "short",
      solution: "short",
      challenge: "short",
      summary: "short",
      implementation: "short",
      results: "short"
    };

    provider.generateSections.mockResolvedValueOnce(invalid);

    const { generateExecutiveSections } = await import("@/server/services/generateSections");
    await expect(generateExecutiveSections("transcript text", "ollama", "llama3")).rejects.toThrow(
      /companyBackground must be 120-200 words/i
    );

    expect(provider.generateSections).toHaveBeenCalledTimes(1);
  });

  it("keeps OpenAI behavior unchanged", async () => {
    const validText = Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ");
    const valid = {
      companyBackground: validText,
      solution: validText,
      challenge: validText,
      summary: validText,
      implementation: validText,
      results: validText
    };

    provider.generateSections.mockResolvedValueOnce(valid);

    const { generateExecutiveSections } = await import("@/server/services/generateSections");
    const result = await generateExecutiveSections("transcript text", "openai", "gpt-4.1-mini");

    expect(provider.generateSections).toHaveBeenNthCalledWith(1, "transcript text", { repair: false, validationIssues: undefined });
    expect(result.companyBackground).toBe(valid.companyBackground);
  });

  it("streams section events in order and emits a final completion event", async () => {
    const validText = Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ");
    provider.generateSectionsStream.mockImplementation(async function* () {
      yield { type: "generation_started", sectionOrder: ["companyBackground", "solution", "challenge", "summary", "implementation", "results"] };
      yield { type: "section_started", sectionKey: "companyBackground" };
      yield { type: "section_completed", sectionKey: "companyBackground", content: validText };
      yield {
        type: "generation_completed",
        sections: {
          companyBackground: validText,
          solution: validText,
          challenge: validText,
          summary: validText,
          implementation: validText,
          results: validText
        }
      };
    });

    const { streamExecutiveSections } = await import("@/server/services/generateSections");
    const events = [];
    for await (const event of streamExecutiveSections("transcript text", "ollama", "llama3")) {
      events.push(event);
    }

    expect(events[0]).toEqual({ type: "generation_started", sectionOrder: ["companyBackground", "solution", "challenge", "summary", "implementation", "results"] });
    expect(events[1]).toEqual({ type: "section_started", sectionKey: "companyBackground" });
    expect(events[2]).toEqual({ type: "section_completed", sectionKey: "companyBackground", content: validText });
    expect(events[3]).toEqual(expect.objectContaining({ type: "generation_completed" }));
  });
});

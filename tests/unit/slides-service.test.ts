import { beforeEach, describe, expect, it, vi } from "vitest";
import { ATTRIBUTION_LINE } from "@/lib/constants";

const provider = {
  generateSections: vi.fn(),
  generateSlides: vi.fn()
};

vi.mock("@/lib/llmProviders", async () => {
  const actual = await vi.importActual<typeof import("@/lib/llmProviders")>("@/lib/llmProviders");
  return {
    ...actual,
    createLLMProvider: vi.fn(() => provider)
  };
});

describe("generateExecutiveSlides", () => {
  beforeEach(() => {
    provider.generateSlides.mockReset();
    vi.resetModules();
  });

  it("passes selected provider/model through the factory path and retries once on invalid output", async () => {
    const invalid = {
      slideCount: 2,
      slide1: {
        variant: "single-slide-brief",
        title: "Executive Summary",
        leftColumn: [{ heading: "A", body: "B" }, { heading: "C", body: "D" }, { heading: "E", body: "F" }],
        rightColumn: [{ heading: "G", body: "H" }, { heading: "I", body: "J" }, { heading: "K", body: "L" }],
        executiveQuote: "summary signal",
        attribution: ATTRIBUTION_LINE
      }
    };

    const valid = {
      slideCount: 2,
      slide1: {
        variant: "two-column-summary",
        title: "Executive Summary",
        leftColumn: [{ heading: "Company Background", body: "Body" }, { heading: "The Challenge", body: "Body" }],
        rightColumn: [{ heading: "The Solution", body: "Body" }, { heading: "The Implementation", body: "Body" }]
      },
      slide2: {
        variant: "results-banner",
        title: "Results",
        results: { heading: "The Results", body: "Body" },
        executiveQuote: "summary signal alignment",
        attribution: ATTRIBUTION_LINE
      }
    };

    provider.generateSlides.mockResolvedValueOnce(invalid).mockResolvedValueOnce(valid);

    const sections = {
      companyBackground: "a ".repeat(130).trim(),
      solution: "b ".repeat(130).trim(),
      challenge: "c ".repeat(130).trim(),
      summary: "summary signal alignment ".repeat(130).trim(),
      implementation: "e ".repeat(130).trim(),
      results: "f ".repeat(130).trim()
    };

    const { createLLMProvider } = await import("@/lib/llmProviders");
    const { generateExecutiveSlides } = await import("@/server/services/generateSlides");
    const result = await generateExecutiveSlides(sections, "ollama", "llama3");

    expect(createLLMProvider).toHaveBeenCalledWith({ provider: "ollama", model: "llama3" });
    expect(provider.generateSlides).toHaveBeenCalledTimes(2);
    expect(result.slideCount).toBe(2);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ATTRIBUTION_LINE } from "@/lib/constants";

const responsesCreate = vi.fn();

vi.mock("@/server/openai/client", () => ({
  getOpenAIClient: () => ({ responses: { create: responsesCreate } }),
  getOpenAIModel: () => "gpt-4.1-mini"
}));

describe("generateExecutiveSlides", () => {
  beforeEach(() => {
    responsesCreate.mockReset();
    vi.resetModules();
  });

  it("retries when slide schema is inconsistent and succeeds on second response", async () => {
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
        executiveQuote: "summary summary signal",
        attribution: ATTRIBUTION_LINE
      }
    };

    responsesCreate
      .mockResolvedValueOnce({ output_text: JSON.stringify(invalid) })
      .mockResolvedValueOnce({ output_text: JSON.stringify(valid) });

    const { generateExecutiveSlides } = await import("@/server/services/generateSlides");
    const result = await generateExecutiveSlides({
      companyBackground: "a ".repeat(130).trim(),
      solution: "b ".repeat(130).trim(),
      challenge: "c ".repeat(130).trim(),
      summary: "summary signal alignment ".repeat(130).trim(),
      implementation: "e ".repeat(130).trim(),
      results: "f ".repeat(130).trim()
    });
    const firstCall = responsesCreate.mock.calls[0][0];

    expect(responsesCreate).toHaveBeenCalledTimes(2);
    expect(firstCall.text.format.type).toBe("json_schema");
    expect(firstCall.text.format.strict).toBe(true);
    expect(firstCall.text.format.schema.type).toBe("object");
    expect(result.slideCount).toBe(2);
  });

  it("preserves edited sections in the prompt payload", async () => {
    const valid = {
      slideCount: 1,
      slide1: {
        variant: "single-slide-brief",
        title: "Executive Summary",
        leftColumn: [{ heading: "Company Background", body: "Body" }, { heading: "The Challenge", body: "Body" }, { heading: "Summary", body: "Body" }],
        rightColumn: [{ heading: "The Solution", body: "Body" }, { heading: "The Implementation", body: "Body" }, { heading: "The Results", body: "Body" }],
        executiveQuote: "summary summary summary",
        attribution: ATTRIBUTION_LINE
      }
    };

    responsesCreate.mockResolvedValueOnce({ output_text: JSON.stringify(valid) });

    const { generateExecutiveSlides } = await import("@/server/services/generateSlides");
    const sections = {
      companyBackground: "company ".repeat(130).trim(),
      solution: "solution ".repeat(130).trim(),
      challenge: "challenge ".repeat(130).trim(),
      summary: "summary executive priority ".repeat(130).trim(),
      implementation: "implementation ".repeat(130).trim(),
      results: "results ".repeat(130).trim()
    };

    await generateExecutiveSlides(sections);

    const call = responsesCreate.mock.calls[0][0];
    const userMessage = call.input[1].content[0].text as string;
    expect(userMessage).toContain("summary");
    expect(userMessage).toContain("implementation");
  });
});

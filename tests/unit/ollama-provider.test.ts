import { beforeEach, describe, expect, it, vi } from "vitest";
import { executiveSectionsJsonSchema, ollamaSectionPlanJsonSchema } from "@/lib/schemas/sections.schema";
import { executiveSlidesJsonSchema } from "@/lib/schemas/slides.schema";

const fetchMock = vi.fn();

describe("OllamaProvider", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    process.env.OLLAMA_TIMEOUT_MS = "1000";
    delete process.env.OLLAMA_SECTIONS_TIMEOUT_MS;
    delete process.env.OLLAMA_SLIDES_TIMEOUT_MS;
  });

  it("calls the configured Ollama endpoint", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: JSON.stringify({
            companyBackground: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            solution: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            challenge: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            summary: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            implementation: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            results: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] }
          })
        })
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ response: JSON.stringify({ content: Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ") }) })
      });

    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    await new OllamaProvider("llama3").generateSections("transcript");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:11434/api/generate",
      expect.objectContaining({ method: "POST" })
    );

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(requestInit.body));
    expect(body.format).toEqual(ollamaSectionPlanJsonSchema);
    expect(body.prompt).toContain("Example transcript:");
    expect(body.prompt).toContain("Example planning JSON:");
    expect(body.prompt).toContain("companyBackground");
    expect(body.prompt).toContain("focus");
  });

  it("retries only the invalid section with section-specific validation issues", async () => {
    const shortText = "short";
    const validText = Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: JSON.stringify({
            companyBackground: { focus: "Focus company", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            solution: { focus: "Focus solution", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            challenge: { focus: "Focus challenge", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            summary: { focus: "Focus summary", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            implementation: { focus: "Focus implementation", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            results: { focus: "Focus results", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] }
          })
        })
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: JSON.stringify({ content: shortText }) }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: JSON.stringify({ content: validText }) }) })
      .mockResolvedValue({ ok: true, json: async () => ({ response: JSON.stringify({ content: validText }) }) });

    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    const result = await new OllamaProvider("llama3").generateSections("transcript");

    expect(result.companyBackground).toBe(validText);
    expect(fetchMock).toHaveBeenCalledTimes(8);

    const retryRequestInit = fetchMock.mock.calls[2][1] as RequestInit;
    const retryBody = JSON.parse(String(retryRequestInit.body));
    expect(retryBody.prompt).toContain("Generate only the companyBackground section.");
    expect(retryBody.prompt).toContain("Your previous section draft failed validation.");
    expect(retryBody.prompt).toContain("companyBackground must be 120-200 words.");
  });

  it("runs an expansion pass after an underlength retry and returns the expanded section", async () => {
    const shortText = "short";
    const validText = Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: JSON.stringify({
            companyBackground: { focus: "Focus company", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            solution: { focus: "Focus solution", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            challenge: { focus: "Focus challenge", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            summary: { focus: "Focus summary", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            implementation: { focus: "Focus implementation", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            results: { focus: "Focus results", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] }
          })
        })
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: JSON.stringify({ content: shortText }) }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: JSON.stringify({ content: shortText }) }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: JSON.stringify({ content: validText }) }) })
      .mockResolvedValue({ ok: true, json: async () => ({ response: JSON.stringify({ content: validText }) }) });

    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    const result = await new OllamaProvider("llama3").generateSections("transcript");

    expect(result.companyBackground).toBe(validText);
    expect(fetchMock).toHaveBeenCalledTimes(9);

    const expansionRequestInit = fetchMock.mock.calls[3][1] as RequestInit;
    const expansionBody = JSON.parse(String(expansionRequestInit.body));
    expect(expansionBody.prompt).toContain("Expand only the existing companyBackground draft.");
    expect(expansionBody.prompt).toContain("Current draft:");
    expect(expansionBody.prompt).toContain("companyBackground must be 120-200 words.");
  });

  it("does not run expansion for paragraph-overflow-only failures", async () => {
    const validText = Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ");
    const tooManyParagraphs = `${validText}\n\n${validText}\n\n${validText}`;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: JSON.stringify({
            companyBackground: { focus: "Focus company", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            solution: { focus: "Focus solution", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            challenge: { focus: "Focus challenge", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            summary: { focus: "Focus summary", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            implementation: { focus: "Focus implementation", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            results: { focus: "Focus results", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] }
          })
        })
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: JSON.stringify({ content: tooManyParagraphs }) }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: JSON.stringify({ content: tooManyParagraphs }) }) });

    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    await expect(new OllamaProvider("llama3").generateSections("transcript")).rejects.toThrow(
      /no more than 2 paragraphs/i
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("sends the slide schema in the format payload", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          slideCount: 1,
          slide1: {
            variant: "single-slide-brief",
            title: "Executive Summary",
            leftColumn: [
              { heading: "Company Background", body: "Body" },
              { heading: "The Challenge", body: "Body" },
              { heading: "Summary", body: "Body" }
            ],
            rightColumn: [
              { heading: "The Solution", body: "Body" },
              { heading: "The Implementation", body: "Body" },
              { heading: "The Results", body: "Body" }
            ],
            executiveQuote: "Summary quote",
            attribution: "– Generated Executive Brief"
          }
        })
      })
    });

    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    await new OllamaProvider("llama3").generateSlides({
      companyBackground: "a",
      solution: "b",
      challenge: "c",
      summary: "d",
      implementation: "e",
      results: "f"
    });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(requestInit.body));
    expect(body.format).toEqual(executiveSlidesJsonSchema);
  });

  it("handles malformed JSON", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ response: "not-json" }) });
    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    await expect(new OllamaProvider("llama3").generateSections("transcript")).rejects.toThrow(/invalid structured output/i);
  });

  it("handles unreachable Ollama", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"));
    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    await expect(new OllamaProvider("llama3").generateSections("transcript")).rejects.toThrow(/Ollama is not reachable/);
  });

  it("handles timeout separately", async () => {
    const timeoutError = Object.assign(new Error("aborted"), { name: "AbortError" });
    fetchMock.mockRejectedValue(timeoutError);
    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    await expect(new OllamaProvider("llama3").generateSections("transcript")).rejects.toThrow(/timed out/);
  });

  it("handles missing local model separately", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "model 'llama3' not found, try pulling it first" })
    });
    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    await expect(new OllamaProvider("llama3").generateSections("transcript")).rejects.toThrow(/not installed locally/);
  });

  it("handles generic provider errors separately", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "internal server error" })
    });
    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    await expect(new OllamaProvider("llama3").generateSections("transcript")).rejects.toThrow(/Ollama request failed/);
  });

  it("prefers task-specific timeouts over the shared timeout", async () => {
    process.env.OLLAMA_TIMEOUT_MS = "1000";
    process.env.OLLAMA_SECTIONS_TIMEOUT_MS = "2500";

    const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: JSON.stringify({
            companyBackground: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            solution: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            challenge: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            summary: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            implementation: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] },
            results: { focus: "Focus", constraints: ["Constraint"], supportedFacts: ["Fact"], missingDataNotes: [] }
          })
        })
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ response: JSON.stringify({ content: Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ") }) })
      });

    const { OllamaProvider } = await import("@/lib/llmProviders/ollamaProvider");
    await new OllamaProvider("llama3").generateSections("transcript");

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2500);
    timeoutSpy.mockRestore();
  });
});

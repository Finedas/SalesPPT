import { beforeEach, describe, expect, it, vi } from "vitest";

const responsesCreate = vi.fn();

vi.mock("@/server/openai/client", () => ({
  getOpenAIClient: () => ({ responses: { create: responsesCreate } })
}));

describe("OpenAIProvider", () => {
  beforeEach(() => {
    responsesCreate.mockReset();
  });

  it("sends selected model and strict json schema for sections", async () => {
    responsesCreate.mockResolvedValue({ output_text: JSON.stringify({
      companyBackground: "a",
      solution: "b",
      challenge: "c",
      summary: "d",
      implementation: "e",
      results: "f"
    }) });

    const { OpenAIProvider } = await import("@/lib/llmProviders/openaiProvider");
    await new OpenAIProvider("gpt-4o").generateSections("transcript");

    const call = responsesCreate.mock.calls[0][0];
    expect(call.model).toBe("gpt-4o");
    expect(call.text.format.type).toBe("json_schema");
    expect(call.text.format.strict).toBe(true);
    expect(call.text.format.schema.type).toBe("object");
  });
});

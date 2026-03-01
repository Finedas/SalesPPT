import { beforeEach, describe, expect, it, vi } from "vitest";

const responsesCreate = vi.fn();

vi.mock("@/server/openai/client", () => ({
  getOpenAIClient: () => ({ responses: { create: responsesCreate } }),
  getOpenAIModel: () => "gpt-4.1-mini"
}));

describe("generateExecutiveSections", () => {
  beforeEach(() => {
    responsesCreate.mockReset();
    vi.resetModules();
  });

  it("retries when the first response violates section rules and succeeds on second response", async () => {
    const invalid = { companyBackground: "short", solution: "short", challenge: "short", summary: "short", implementation: "short", results: "short" };
    const validText = Array.from({ length: 130 }, (_, index) => `word${index + 1}`).join(" ");
    const valid = {
      companyBackground: validText,
      solution: validText,
      challenge: validText,
      summary: validText,
      implementation: validText,
      results: validText
    };

    responsesCreate
      .mockResolvedValueOnce({ output_text: JSON.stringify(invalid) })
      .mockResolvedValueOnce({ output_text: JSON.stringify(valid) });

    const { generateExecutiveSections } = await import("@/server/services/generateSections");
    const result = await generateExecutiveSections("transcript text");
    const firstCall = responsesCreate.mock.calls[0][0];

    expect(responsesCreate).toHaveBeenCalledTimes(2);
    expect(firstCall.text.format.type).toBe("json_schema");
    expect(firstCall.text.format.strict).toBe(true);
    expect(firstCall.text.format.schema.type).toBe("object");
    expect(result.summary).toBe(valid.summary);
  });

  it("surfaces final failure after max retries", async () => {
    process.env.OPENAI_MAX_RETRIES = "1";
    const invalid = { companyBackground: "short", solution: "short", challenge: "short", summary: "short", implementation: "short", results: "short" };
    responsesCreate.mockResolvedValue({ output_text: JSON.stringify(invalid) });

    const { generateExecutiveSections } = await import("@/server/services/generateSections");

    await expect(generateExecutiveSections("transcript text")).rejects.toThrow(/Sections validation failed/);
  });
});

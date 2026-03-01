import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/generateSections", () => ({
  generateExecutiveSections: vi.fn()
}));

describe("POST /api/generate-sections", () => {
  it("returns 400 for empty transcript", async () => {
    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "   " })
    }));

    expect(response.status).toBe(400);
  });

  it("returns 200 for valid OpenAI response", async () => {
    const { generateExecutiveSections } = await import("@/server/services/generateSections");
    vi.mocked(generateExecutiveSections).mockResolvedValue({
      companyBackground: "a ".repeat(130).trim(),
      solution: "b ".repeat(130).trim(),
      challenge: "c ".repeat(130).trim(),
      summary: "d ".repeat(130).trim(),
      implementation: "e ".repeat(130).trim(),
      results: "f ".repeat(130).trim()
    });

    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "valid transcript" })
    }));

    expect(response.status).toBe(200);
  });

  it("returns 500 for provider failure with safe error body", async () => {
    const { generateExecutiveSections } = await import("@/server/services/generateSections");
    vi.mocked(generateExecutiveSections).mockRejectedValue(new Error("provider failure"));

    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "valid transcript" })
    }));

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: "generate_sections_failed" });
  });
});

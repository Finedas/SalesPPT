import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/services/generateSections", () => ({
  streamExecutiveSections: vi.fn()
}));

describe("POST /api/generate-sections", () => {
  it("returns 400 for empty transcript", async () => {
    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "   ", provider: "openai", model: "gpt-4.1-mini" })
    }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when provider is missing", async () => {
    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "valid transcript", model: "gpt-4.1-mini" })
    }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when model does not belong to provider", async () => {
    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "valid transcript", provider: "openai", model: "llama3" })
    }));

    expect(response.status).toBe(400);
  });

  it("returns 200 for valid provider and model", async () => {
    const { streamExecutiveSections } = await import("@/server/services/generateSections");
    vi.mocked(streamExecutiveSections).mockImplementation(async function* () {
      yield { type: "generation_started", sectionOrder: ["companyBackground", "solution", "challenge", "summary", "implementation", "results"] };
      yield { type: "section_started", sectionKey: "companyBackground" };
      yield { type: "section_completed", sectionKey: "companyBackground", content: "a ".repeat(130).trim() };
      yield {
        type: "generation_completed",
        sections: {
          companyBackground: "a ".repeat(130).trim(),
          solution: "b ".repeat(130).trim(),
          challenge: "c ".repeat(130).trim(),
          summary: "d ".repeat(130).trim(),
          implementation: "e ".repeat(130).trim(),
          results: "f ".repeat(130).trim()
        }
      };
    });

    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "valid transcript", provider: "openai", model: "gpt-4o" })
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/x-ndjson");
    const text = await response.text();
    expect(text).toContain("\"type\":\"generation_started\"");
    expect(text).toContain("\"type\":\"section_completed\"");
    expect(text).toContain("\"type\":\"generation_completed\"");
  });

  it("returns 503 for provider unavailable", async () => {
    const { streamExecutiveSections } = await import("@/server/services/generateSections");
    vi.mocked(streamExecutiveSections).mockImplementation(async function* () {
      throw Object.assign(new Error("Ollama is not reachable"), { statusCode: 503 });
    });

    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "valid transcript", provider: "ollama", model: "llama3" })
    }));

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("\"type\":\"generation_failed\"");
  });

  it("returns 400 for missing local model", async () => {
    const { streamExecutiveSections } = await import("@/server/services/generateSections");
    vi.mocked(streamExecutiveSections).mockImplementation(async function* () {
      throw Object.assign(new Error("Ollama model 'llama3' is not installed locally. Run 'ollama run llama3' first."), { statusCode: 400 });
    });

    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "valid transcript", provider: "ollama", model: "llama3" })
    }));

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("not installed locally");
  });

  it("returns 502 for malformed Ollama provider response", async () => {
    const { streamExecutiveSections } = await import("@/server/services/generateSections");
    vi.mocked(streamExecutiveSections).mockImplementation(async function* () {
      throw Object.assign(new Error("Ollama request failed: malformed provider response"), { statusCode: 502 });
    });

    const { POST } = await import("@app/api/generate-sections/route");
    const response = await POST(new Request("http://localhost/api/generate-sections", {
      method: "POST",
      body: JSON.stringify({ transcript: "valid transcript", provider: "ollama", model: "llama3" })
    }));

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("malformed provider response");
  });
});

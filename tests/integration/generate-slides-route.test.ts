import { describe, expect, it, vi } from "vitest";
import { ATTRIBUTION_LINE } from "@/lib/constants";

vi.mock("@/server/services/generateSlides", () => ({
  generateExecutiveSlides: vi.fn()
}));

describe("POST /api/generate-slides", () => {
  const validSections = {
    companyBackground: "a ".repeat(130).trim(),
    solution: "b ".repeat(130).trim(),
    challenge: "c ".repeat(130).trim(),
    summary: "summary signal ".repeat(65).trim(),
    implementation: "e ".repeat(130).trim(),
    results: "f ".repeat(130).trim()
  };

  it("returns 400 for invalid edited sections", async () => {
    const { POST } = await import("@app/api/generate-slides/route");
    const response = await POST(new Request("http://localhost/api/generate-slides", {
      method: "POST",
      body: JSON.stringify({ provider: "openai", model: "gpt-4.1-mini", sections: { companyBackground: "", solution: "", challenge: "", summary: "", implementation: "", results: "" } })
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it("returns 400 when model is missing", async () => {
    const { POST } = await import("@app/api/generate-slides/route");
    const response = await POST(new Request("http://localhost/api/generate-slides", {
      method: "POST",
      body: JSON.stringify({ provider: "openai", sections: validSections })
    }));

    expect(response.status).toBe(400);
  });

  it("returns 400 when model does not belong to provider", async () => {
    const { POST } = await import("@app/api/generate-slides/route");
    const response = await POST(new Request("http://localhost/api/generate-slides", {
      method: "POST",
      body: JSON.stringify({ provider: "openai", model: "llama3", sections: validSections })
    }));

    expect(response.status).toBe(400);
  });

  it("returns 200 for valid slide payload", async () => {
    const { generateExecutiveSlides } = await import("@/server/services/generateSlides");
    vi.mocked(generateExecutiveSlides).mockResolvedValue({
      slideCount: 1,
      slide1: {
        variant: "single-slide-brief",
        title: "Executive Summary",
        leftColumn: [{ heading: "Company Background", body: "Body" }, { heading: "The Challenge", body: "Body" }, { heading: "Summary", body: "Body" }],
        rightColumn: [{ heading: "The Solution", body: "Body" }, { heading: "The Implementation", body: "Body" }, { heading: "The Results", body: "Body" }],
        executiveQuote: "summary signal",
        attribution: ATTRIBUTION_LINE
      }
    });

    const { POST } = await import("@app/api/generate-slides/route");
    const response = await POST(new Request("http://localhost/api/generate-slides", {
      method: "POST",
      body: JSON.stringify({ provider: "ollama", model: "llama3", sections: validSections })
    }));

    expect(response.status).toBe(200);
  });

  it("returns 503 when Ollama provider is unavailable", async () => {
    const { generateExecutiveSlides } = await import("@/server/services/generateSlides");
    vi.mocked(generateExecutiveSlides).mockRejectedValue(Object.assign(new Error("Ollama is not reachable"), { statusCode: 503 }));

    const { POST } = await import("@app/api/generate-slides/route");
    const response = await POST(new Request("http://localhost/api/generate-slides", {
      method: "POST",
      body: JSON.stringify({ provider: "ollama", model: "llama3", sections: validSections })
    }));

    expect(response.status).toBe(503);
  });

  it("returns 400 when Ollama model is not installed locally", async () => {
    const { generateExecutiveSlides } = await import("@/server/services/generateSlides");
    vi.mocked(generateExecutiveSlides).mockRejectedValue(Object.assign(new Error("Ollama model 'llama3' is not installed locally. Run 'ollama run llama3' first."), { statusCode: 400 }));

    const { POST } = await import("@app/api/generate-slides/route");
    const response = await POST(new Request("http://localhost/api/generate-slides", {
      method: "POST",
      body: JSON.stringify({ provider: "ollama", model: "llama3", sections: validSections })
    }));

    expect(response.status).toBe(400);
  });

  it("returns 502 for malformed provider response", async () => {
    const { generateExecutiveSlides } = await import("@/server/services/generateSlides");
    vi.mocked(generateExecutiveSlides).mockRejectedValue(Object.assign(new Error("Ollama request failed: malformed provider response"), { statusCode: 502 }));

    const { POST } = await import("@app/api/generate-slides/route");
    const response = await POST(new Request("http://localhost/api/generate-slides", {
      method: "POST",
      body: JSON.stringify({ provider: "ollama", model: "llama3", sections: validSections })
    }));

    expect(response.status).toBe(502);
  });
});

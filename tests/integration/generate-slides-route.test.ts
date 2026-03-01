import { describe, expect, it, vi } from "vitest";
import { ATTRIBUTION_LINE } from "@/lib/constants";

vi.mock("@/server/services/generateSlides", () => ({
  generateExecutiveSlides: vi.fn()
}));

describe("POST /api/generate-slides", () => {
  it("returns 400 for invalid edited sections", async () => {
    const { POST } = await import("@app/api/generate-slides/route");
    const response = await POST(new Request("http://localhost/api/generate-slides", {
      method: "POST",
      body: JSON.stringify({ sections: { companyBackground: "", solution: "", challenge: "", summary: "", implementation: "", results: "" } })
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.issues.length).toBeGreaterThan(0);
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
        executiveQuote: "Quote",
        attribution: ATTRIBUTION_LINE
      }
    });

    const validSections = {
      companyBackground: "a ".repeat(130).trim(),
      solution: "b ".repeat(130).trim(),
      challenge: "c ".repeat(130).trim(),
      summary: "d ".repeat(130).trim(),
      implementation: "e ".repeat(130).trim(),
      results: "f ".repeat(130).trim()
    };

    const { POST } = await import("@app/api/generate-slides/route");
    const response = await POST(new Request("http://localhost/api/generate-slides", {
      method: "POST",
      body: JSON.stringify({ sections: validSections })
    }));

    expect(response.status).toBe(200);
  });
});

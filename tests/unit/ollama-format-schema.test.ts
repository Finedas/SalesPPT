import { describe, expect, it } from "vitest";
import { executiveSectionsJsonSchema } from "@/lib/schemas/sections.schema";
import { executiveSlidesJsonSchema } from "@/lib/schemas/slides.schema";

describe("Ollama format schema payloads", () => {
  it("exports the sections schema as a root object without top-level refs", () => {
    expect(executiveSectionsJsonSchema.type).toBe("object");
    expect(executiveSectionsJsonSchema).not.toHaveProperty("$ref");
    expect(executiveSectionsJsonSchema.required).toEqual([
      "companyBackground",
      "solution",
      "challenge",
      "summary",
      "implementation",
      "results"
    ]);
  });

  it("exports the slides schema as a root object without top-level refs", () => {
    expect(executiveSlidesJsonSchema.type).toBe("object");
    expect(executiveSlidesJsonSchema).not.toHaveProperty("$ref");
    expect(executiveSlidesJsonSchema.required).toEqual(["slideCount", "slide1"]);
    expect(executiveSlidesJsonSchema.properties).toHaveProperty("slide1");
  });
});

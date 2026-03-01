import { describe, expect, it } from "vitest";
import { executiveSectionsJsonSchema } from "@/lib/schemas/sections.schema";
import { executiveSlidesJsonSchema } from "@/lib/schemas/slides.schema";

describe("OpenAI schema shape", () => {
  it("exports ExecutiveSections as a root object schema", () => {
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
    expect(executiveSectionsJsonSchema.properties).toHaveProperty("companyBackground");
    expect(executiveSectionsJsonSchema.properties).toHaveProperty("results");
  });

  it("exports ExecutiveSlidesResponse as a root object schema", () => {
    expect(executiveSlidesJsonSchema.type).toBe("object");
    expect(executiveSlidesJsonSchema).not.toHaveProperty("$ref");
    expect(executiveSlidesJsonSchema.required).toEqual(["slideCount", "slide1"]);
    expect(executiveSlidesJsonSchema.properties).toHaveProperty("slideCount");
    expect(executiveSlidesJsonSchema.properties).toHaveProperty("slide1");
  });
});
